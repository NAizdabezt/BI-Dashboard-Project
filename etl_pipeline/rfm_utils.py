import pandas as pd
import datetime as dt

def calculate_rfm(df, current_date=None):
    """
    Hàm tính toán chỉ số RFM từ dữ liệu giao dịch.
    :param df: DataFrame chứa dữ liệu đã làm sạch (phải có payment_value, order_purchase_timestamp, customer_unique_id, order_id)
    :param current_date: Ngày hiện tại giả lập (để tính Recency). Nếu None, lấy ngày lớn nhất trong data + 1.
    :return: DataFrame chứa các cột customer_unique_id, Recency, Frequency, Monetary
    """
    print("⏳ Đang tính toán ma trận RFM cho AI...")
    
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

    print(f"✅ Đã tạo xong bảng RFM cho {len(rfm)} khách hàng duy nhất.")
    
    return rfm