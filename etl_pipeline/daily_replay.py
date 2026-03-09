import pandas as pd
import os
from datetime import datetime, timedelta
from process_utils import load_and_merge_data
# from rfm_utils import calculate_rfm  <-- Nhắc team Data viết file này nhé!

RAW_DATA_DIR = 'data/raw'
LIVE_DATA_DIR = 'data/live'
OUTPUT_DASHBOARD = os.path.join(LIVE_DATA_DIR, 'sales_dashboard.csv')
OUTPUT_RFM = os.path.join(LIVE_DATA_DIR, 'customer_rfm.csv')
STATE_FILE = 'simulation_state.txt'

def main():
    if not os.path.exists(STATE_FILE):
        print("❌ Thiếu file STATE_FILE.")
        return

    with open(STATE_FILE, 'r') as f:
        current_sim_date = datetime.strptime(f.read().strip(), '%Y-%m-%d')

    print(f"🚀 Xử lý dữ liệu cho ngày: {current_sim_date.strftime('%Y-%m-%d')}")

    # 1. Load TOÀN BỘ dữ liệu sạch từ hàm của bạn
    full_clean_data = load_and_merge_data(RAW_DATA_DIR)
    if full_clean_data is None or full_clean_data.empty:
        return

    # Đảm bảo cột ngày đúng định dạng Datetime
    full_clean_data['order_purchase_timestamp'] = pd.to_datetime(full_clean_data['order_purchase_timestamp'])

    # 2. KIỂM TRA ĐIỀU KIỆN DỪNG (Rất quan trọng)
    max_date_in_raw = full_clean_data['order_purchase_timestamp'].max()
    if current_sim_date > max_date_in_raw:
        print("✅ Đã chạy hết dữ liệu lịch sử Olist. Dừng Pipeline để không tạo rác.")
        return

    # 3. LỌC DỮ LIỆU ĐÚNG 1 NGÀY HIỆN TẠI (True Incremental)
    start_of_day = current_sim_date
    end_of_day = current_sim_date + timedelta(days=1) - timedelta(seconds=1)
    
    mask = (full_clean_data['order_purchase_timestamp'] >= start_of_day) & \
           (full_clean_data['order_purchase_timestamp'] <= end_of_day)
    new_daily_data = full_clean_data[mask]

    os.makedirs(LIVE_DATA_DIR, exist_ok=True)

    # 4. GHI DỮ LIỆU VÀO FILE (Tránh phình to Git)
    if not os.path.exists(OUTPUT_DASHBOARD):
        # Chạy lần đầu: Lấy tất cả data từ đầu đến hết ngày hiện tại
        print("✨ Khởi tạo file lần đầu...")
        initial_data = full_clean_data[full_clean_data['order_purchase_timestamp'] <= end_of_day]
        initial_data.to_csv(OUTPUT_DASHBOARD, index=False)
        current_cumulative_data = initial_data # Lưu tạm để lát tính RFM
    else:
        # Chạy các ngày sau: CHỈ NỐI (Append) các dòng mới sinh ra trong hôm nay
        if not new_daily_data.empty:
            print(f"📂 Nối thêm {len(new_daily_data)} dòng giao dịch mới.")
            # mode='a' là Append, header=False để không in lại tiêu đề cột
            new_daily_data.to_csv(OUTPUT_DASHBOARD, mode='a', header=False, index=False)
        else:
            print("⚠️ Hôm nay không có giao dịch mới nào.")
        
        # Load lại file CSV hiện tại để tính RFM cho AI
        current_cumulative_data = pd.read_csv(OUTPUT_DASHBOARD)

    # 5. CẬP NHẬT RFM CHO MÔ HÌNH AI (ĐỪNG QUÊN BƯỚC NÀY)
    # df_rfm = calculate_rfm(current_cumulative_data, end_of_day)
    # df_rfm.to_csv(OUTPUT_RFM, index=False)
    print("🤖 Đã sẵn sàng cập nhật file RFM cho AI (Chờ ghép hàm).")

    # 6. CẬP NHẬT NGÀY CHO LẦN CHẠY TIẾP THEO
    next_day = current_sim_date + timedelta(days=1)
    with open(STATE_FILE, 'w') as f:
        f.write(next_day.strftime('%Y-%m-%d'))
        
    print(f"🔄 Hoàn tất. Next day: {next_day.strftime('%Y-%m-%d')}")

if __name__ == "__main__":
    main()