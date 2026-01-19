import pandas as pd
from datetime import datetime, timedelta
import os
from process_utils import load_and_merge_data

# --- CẤU HÌNH ---
# Ngày bắt đầu dự án (Hệ thống sẽ tính ngày thứ N từ mốc này)
PROJECT_START_DATE = datetime(2026, 1, 15) 

# Ngày bắt đầu của dữ liệu gốc Olist (Dữ liệu thật bắt đầu khoảng 2017)
# Chúng ta chọn mốc này để bắt đầu lấy dữ liệu
ORIGIN_START_DATE = datetime(2017, 1, 1)

# Đường dẫn thư mục
RAW_DATA_DIR = 'data/raw'
LIVE_DATA_FILE = 'data/live/sales_dashboard.csv'

def main():
    print("🚀 Bắt đầu chạy ETL Pipeline...")
    
    # 1. Tính toán Time Offset (Độ lệch ngày)
    today = datetime.now()
    days_passed = (today - PROJECT_START_DATE).days
    
    # Nếu chưa tới ngày chạy thì lấy ngày đầu tiên
    if days_passed < 0: days_passed = 0
    
    # Ngày mục tiêu trong quá khứ cần lấy dữ liệu
    target_past_date = ORIGIN_START_DATE + timedelta(days=days_passed)
    
    print(f"📅 Hôm nay là ngày thứ {days_passed} của dự án.")
    print(f"⏳ Đang lấy dữ liệu gốc của ngày: {target_past_date.strftime('%Y-%m-%d')}")

    # 2. Load và Gộp dữ liệu (Dùng hàm bên process_utils)
    full_df = load_and_merge_data(RAW_DATA_DIR)
    
    if full_df is None:
        print("❌ Không đọc được dữ liệu gốc. Dừng chương trình.")
        return

    # 3. Lọc dữ liệu của ngày mục tiêu
    # Chỉ lấy đơn hàng trong đúng ngày target_past_date
    daily_data = full_df[
        full_df['order_purchase_timestamp'].dt.date == target_past_date.date()
    ].copy()

    if daily_data.empty:
        print("⚠️ Không có đơn hàng nào trong ngày này ở quá khứ.")
        # Vẫn tạo file csv rỗng nếu chưa có để không lỗi frontend
        if not os.path.exists(LIVE_DATA_FILE):
             daily_data.to_csv(LIVE_DATA_FILE, index=False)
        return

    # 4. TIME TRAVEL: Dời thời gian về HÔM NAY
    # Logic: Thay thế ngày/tháng/năm cũ bằng ngày/tháng/năm hiện tại
    # Giữ nguyên giờ/phút/giây để biểu đồ nhìn tự nhiên
    daily_data['order_purchase_timestamp'] = daily_data['order_purchase_timestamp'].apply(
        lambda x: x.replace(year=today.year, month=today.month, day=today.day)
    )
    
    # Đổi tên cột cho đẹp (Chuẩn bị cho Frontend)
    daily_data = daily_data.rename(columns={
        'order_id': 'OrderID',
        'price': 'Revenue',
        'product_category_name': 'Category',
        'order_purchase_timestamp': 'OrderDate',
        'order_status': 'Status'
    })

    print(f"✅ Đã trích xuất được {len(daily_data)} dòng dữ liệu.")

    # 5. Lưu vào file Live Data (Chế độ Append - Nối đuôi)
    # Tạo thư mục nếu chưa có
    os.makedirs(os.path.dirname(LIVE_DATA_FILE), exist_ok=True)

    if os.path.exists(LIVE_DATA_FILE):
        # Nếu file đã có, đọc file cũ và nối thêm file mới
        # (Làm cách này an toàn hơn mode='a' vì tránh lỗi header)
        existing_df = pd.read_csv(LIVE_DATA_FILE)
        updated_df = pd.concat([existing_df, daily_data], ignore_index=True)
        updated_df.to_csv(LIVE_DATA_FILE, index=False)
        print("🔗 Đã nối dữ liệu mới vào file hiện tại.")
    else:
        # Nếu chưa có file, tạo mới
        daily_data.to_csv(LIVE_DATA_FILE, index=False)
        print("✨ Đã tạo file dữ liệu mới.")

if __name__ == "__main__":
    main()
