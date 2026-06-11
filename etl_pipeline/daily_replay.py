import pandas as pd
import os
from datetime import datetime, timedelta
from process_utils import load_and_merge_data
from rfm_utils import calculate_rfm 
from train_prophet import retrain_prophet_model
import clickhouse_connect

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

    # 2. KIỂM TRA ĐIỀU KIỆN DỪNG (Sửa lại cho thông minh)
    max_date_in_raw = full_clean_data['order_purchase_timestamp'].max()
    
    # CHỈ DỪNG nếu: File CSV đã tồn tại RỒI VÀ ngày mô phỏng đã vượt mức.
    # Nếu file CSV chưa tồn tại (do mình mới xóa), nó sẽ KHÔNG dừng mà chạy tiếp xuống dưới để tạo file.
    if os.path.exists(OUTPUT_DASHBOARD) and current_sim_date > max_date_in_raw:
        print("✅ Dữ liệu đã đầy đủ. Không cần chạy thêm.")
        return

    # 3. LỌC DỮ LIỆU ĐÚNG 1 NGÀY HIỆN TẠI (True Incremental)
    start_of_day = current_sim_date
    end_of_day = current_sim_date + timedelta(days=1) - timedelta(seconds=1)
    
    mask = (full_clean_data['order_purchase_timestamp'] >= start_of_day) & \
           (full_clean_data['order_purchase_timestamp'] <= end_of_day)
    new_daily_data = full_clean_data[mask]

    os.makedirs(LIVE_DATA_DIR, exist_ok=True)

    # 4. GHI DỮ LIỆU VÀO FILE (Tránh phình to Git) VÀ BẮN VÀO CLICKHOUSE
    if not os.path.exists(OUTPUT_DASHBOARD):
        print("✨ Khởi tạo file lần đầu...")
        initial_data = full_clean_data[full_clean_data['order_purchase_timestamp'] <= end_of_day]
        initial_data.to_csv(OUTPUT_DASHBOARD, index=False)
        current_cumulative_data = initial_data 
        data_to_push = initial_data # ---> Dữ liệu cần đẩy cho lần đầu
    else:
        if not new_daily_data.empty:
            print(f"📂 Nối thêm {len(new_daily_data)} dòng giao dịch mới vào CSV.")
            new_daily_data.to_csv(OUTPUT_DASHBOARD, mode='a', header=False, index=False)
            data_to_push = new_daily_data # ---> Dữ liệu cần đẩy cho các ngày sau
        else:
            print("⚠️ Hôm nay không có giao dịch mới nào.")
            data_to_push = pd.DataFrame()
        
        current_cumulative_data = pd.read_csv(OUTPUT_DASHBOARD)

    # ---------------------------------------------------------
    # BƯỚC 4.5: MÔ-TƠ BẮN DỮ LIỆU VÀO CLICKHOUSE LOCAL
    # ---------------------------------------------------------
    if not data_to_push.empty:
        try:
            print("🚀 Đang dội bom dữ liệu mới vào ClickHouse...")
            # Kết nối tới ClickHouse ngầm trên WSL
            client = clickhouse_connect.get_client(host='localhost', port=8123, username='default', password='')
            
            # Đảm bảo cột timestamp không bị lỗi định dạng khi đẩy
            data_to_push = data_to_push.copy()
            data_to_push['order_purchase_timestamp'] = pd.to_datetime(data_to_push['order_purchase_timestamp'])
            
            # Thực thi đẩy Dataframe vào bảng
            client.insert_df('olist_db.olist_flat_analytics', data_to_push)
            print(f"✅ Đã chèn thành công {len(data_to_push)} dòng vào ClickHouse!")
        except Exception as e:
            print(f"❌ Lỗi khi đẩy vào ClickHouse: {e}")
    # ---------------------------------------------------------

    # 5. CẬP NHẬT RFM CHO MÔ HÌNH AI (ĐỪNG QUÊN BƯỚC NÀY)
    df_rfm = calculate_rfm(current_cumulative_data, end_of_day)
    df_rfm.to_csv(OUTPUT_RFM, index=False)
    print("🤖 Đã sẵn sàng cập nhật file RFM cho AI (Chờ ghép hàm).")

    # 6. RETRAIN LẠI MÔ HÌNH DỰ BÁO DOANH THU 
    print("⏳ Đang gọi AI Prophet đi học lại dữ liệu ngày hôm nay...")
    retrain_prophet_model()

    # 7. CẬP NHẬT NGÀY CHO LẦN CHẠY TIẾP THEO
    next_day = current_sim_date + timedelta(days=1)
    with open(STATE_FILE, 'w') as f:
        f.write(next_day.strftime('%Y-%m-%d'))
        
    print(f"🔄 Hoàn tất. Next day: {next_day.strftime('%Y-%m-%d')}")

if __name__ == "__main__":
    main()