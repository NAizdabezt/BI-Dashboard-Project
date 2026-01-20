import pandas as pd
import os
from datetime import datetime, timedelta
from process_utils import load_and_merge_data

# Cấu hình
RAW_DATA_DIR = 'data/raw'
LIVE_DATA_DIR = 'data/live'
SIMULATION_START_DATE = datetime(2017, 1, 1) # Ngày bắt đầu dữ liệu Olist

def main():
    # 1. Tính toán ngày giả lập (Hôm nay)
    # Vì bài toán là Time Travel, ta giả sử hôm nay là ngày chạy code
    # Nếu bạn muốn chạy thực tế theo ngày hiện tại của server:
    today = datetime.now()
    
    print(f"🚀 Bắt đầu chạy ETL Pipeline...")
    print(f"📅 Cập nhật dữ liệu tính đến ngày: {today.strftime('%Y-%m-%d')}")

    # 2. Gọi hàm xử lý dữ liệu (Lấy toàn bộ dữ liệu sạch trước)
    full_df = load_and_merge_data(RAW_DATA_DIR)
    
    if full_df is not None:
        # 3. LỌC DỮ LIỆU LỊCH SỬ (QUAN TRỌNG)
        # Lấy tất cả các đơn hàng có ngày mua <= Ngày hôm nay
        # (Thay vì chỉ lấy '==', ta lấy '<=' để tích lũy dữ liệu)
        
        # Đảm bảo cột thời gian là datetime
        full_df['order_purchase_timestamp'] = pd.to_datetime(full_df['order_purchase_timestamp'])
        
        # Lọc: Lấy dữ liệu từ quá khứ đến hiện tại
        current_data = full_df[full_df['order_purchase_timestamp'] <= today]
        
        # Sắp xếp theo ngày tăng dần
        current_data = current_data.sort_values(by='order_purchase_timestamp')

        # 4. Lưu file
        os.makedirs(LIVE_DATA_DIR, exist_ok=True)
        output_path = os.path.join(LIVE_DATA_DIR, 'sales_dashboard.csv')
        
        current_data.to_csv(output_path, index=False)
        print(f"✅ Đã lưu {len(current_data)} dòng dữ liệu vào {output_path}")
    else:
        print("❌ Không có dữ liệu để lưu.")

if __name__ == "__main__":
    main()
