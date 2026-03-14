import pandas as pd
import datetime as dt

def calculate_rfm(df, current_date=None):
    """
    Hàm tính toán chỉ số RFM từ dữ liệu giao dịch và Phân loại khách hàng.
    :param df: DataFrame chứa dữ liệu đã làm sạch (phải có payment_value, order_purchase_timestamp, customer_unique_id, order_id)
    :param current_date: Ngày hiện tại giả lập (để tính Recency). Nếu None, lấy ngày lớn nhất trong data + 1.
    :return: DataFrame chứa các cột customer_unique_id, Recency, Frequency, Monetary, Segment, R_Score, M_Score
    """
    print("⏳ Đang tính toán ma trận RFM và Phân khúc khách hàng...")
    
    # Đảm bảo cột thời gian đúng định dạng
    df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
    
    # Xác định mốc thời gian để tính Recency
    if current_date is None:
        # Nếu không truyền vào, tự động lấy ngày giao dịch cuối cùng + 1 ngày
        snapshot_date = df['order_purchase_timestamp'].max() + dt.timedelta(days=1)
    else:
        snapshot_date = pd.to_datetime(current_date) + dt.timedelta(days=1)

    # Tính toán RFM bằng groupby
    rfm = df.groupby('customer_unique_id').agg({
        'order_purchase_timestamp': lambda x: (snapshot_date - x.max()).days, # R: Số ngày từ lần mua cuối
        'order_id': 'nunique',                                                # F: Tổng số đơn hàng
        'payment_value': 'sum'                                                # M: Tổng tiền thực trả
    }).reset_index()

    # Đổi tên cột cho chuẩn mực
    rfm.rename(columns={
        'order_purchase_timestamp': 'Recency',
        'order_id': 'Frequency',
        'payment_value': 'Monetary'
    }, inplace=True)

    # =========================================================
    # PHẦN THÊM MỚI: PHÂN LỌAI KHÁCH HÀNG (SEGMENTATION & SCORING)
    # =========================================================
    def assign_segment(row):
        r = row['Recency']
        f = row['Frequency']
        
        # Nhóm 1: Khách hàng mua nhiều lần (Tần suất > 1)
        if f > 1:
            if r <= 90: return "1. Khách VIP"
            else: return "2. Khách Trung Thành"
            
        # Nhóm 2: Khách mua 1 lần (Đặc sản của E-commerce)
        else:
            if r <= 30: return "3. Khách Mới"
            elif r <= 90: return "4. Tiềm Năng"
            elif r <= 180: return "5. Nguy Cơ Rời Bỏ"
            else: return "6. Ngủ Đông"

    # 1. Tạo cột Segment
    rfm['Segment'] = rfm.apply(assign_segment, axis=1)

    # 2. Tạo cột Điểm (Scores) dùng cho báo cáo học thuật
    # Dùng rank(method='first') để tránh lỗi khi chia nhóm bị trùng lặp giá trị
    rfm['R_Score'] = pd.qcut(rfm['Recency'].rank(method='first'), 5, labels=[5, 4, 3, 2, 1])
    rfm['M_Score'] = pd.qcut(rfm['Monetary'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5])

    print(f"✅ Đã tạo xong bảng RFM và Phân khúc cho {len(rfm)} khách hàng duy nhất.")
    
    return rfm