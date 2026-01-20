import pandas as pd
import os
from datetime import datetime, timedelta
from process_utils import load_and_merge_data

# Cấu hình đường dẫn
RAW_DATA_DIR = 'data/raw'
LIVE_DATA_DIR = 'data/live'
OUTPUT_FILE = os.path.join(LIVE_DATA_DIR, 'sales_dashboard.csv')
STATE_FILE = 'simulation_state.txt' # File lưu ngày hiện tại

def main():
    # 1. ĐỌC NGÀY GIẢ LẬP TỪ FILE
    if not os.path.exists(STATE_FILE):
        print(f"❌ Không tìm thấy file {STATE_FILE}. Hãy tạo file này và điền ngày bắt đầu (VD: 2018-06-01).")
        return

    with open(STATE_FILE, 'r') as f:
        date_str = f.read().strip()
        
    try:
        current_sim_date = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        print("❌ Định dạng ngày trong file text bị sai. Hãy dùng YYYY-MM-DD.")
        return

    print(f"🚀 Bắt đầu chạy ETL Pipeline...")
    print(f"⏳ Hệ thống đang xử lý dữ liệu ngày: {current_sim_date.strftime('%Y-%m-%d')}")

    # 2. Lấy dữ liệu sạch
    full_clean_data = load_and_merge_data(RAW_DATA_DIR)
    
    if full_clean_data is None:
        return

    full_clean_data['order_purchase_timestamp'] = pd.to_datetime(full_clean_data['order_purchase_timestamp'])

    # 3. LOGIC CẬP NHẬT DỮ LIỆU
    is_first_run = not os.path.exists(OUTPUT_FILE)
    
    # Kiểm tra nếu file cũ chứa dữ liệu tương lai (do reset ngày) -> Xóa làm lại
    if not is_first_run:
        existing_df = pd.read_csv(OUTPUT_FILE)
        # Kiểm tra cột ngày (Lưu ý tên cột trong process_utils của bạn là 'OrderDate' hay 'order_purchase_timestamp'?)
        # Ở đây tôi dùng tên cột gốc như bạn đã chốt ở bước trước:
        if 'order_purchase_timestamp' in existing_df.columns:
            max_date = pd.to_datetime(existing_df['order_purchase_timestamp']).max()
            if max_date > current_sim_date:
                print("⚠️ Phát hiện dữ liệu tương lai. Reset lại từ đầu.")
                is_first_run = True

    final_df = None

    if is_first_run:
        print(f"✨ [FULL LOAD] Tạo dữ liệu từ đầu đến {current_sim_date.strftime('%Y-%m-%d')}")
        final_df = full_clean_data[full_clean_data['order_purchase_timestamp'] <= current_sim_date]
    else:
        print("📂 [INCREMENTAL] Cập nhật thêm dữ liệu mới.")
        current_df = pd.read_csv(OUTPUT_FILE)
        current_df['order_purchase_timestamp'] = pd.to_datetime(current_df['order_purchase_timestamp'])
        
        # Lấy dữ liệu <= ngày giả lập hiện tại
        new_data = full_clean_data[full_clean_data['order_purchase_timestamp'] <= current_sim_date]
        
        combined_df = pd.concat([current_df, new_data])
        final_df = combined_df.drop_duplicates(subset=['order_id', 'product_id'], keep='last')

    # 4. LƯU DỮ LIỆU CSV
    if final_df is not None and not final_df.empty:
        final_df = final_df.sort_values(by='order_purchase_timestamp')
        os.makedirs(LIVE_DATA_DIR, exist_ok=True)
        final_df.to_csv(OUTPUT_FILE, index=False)
        print(f"✅ Đã lưu dữ liệu. Tổng dòng: {len(final_df)}")
        
        # --- QUAN TRỌNG: CẬP NHẬT NGÀY CHO LẦN SAU ---
        # Cộng thêm 1 ngày
        next_day = current_sim_date + timedelta(days=1)
        
        # Ghi lại vào file text
        with open(STATE_FILE, 'w') as f:
            f.write(next_day.strftime('%Y-%m-%d'))
            
        print(f"🔄 Đã cập nhật trạng thái mới: {next_day.strftime('%Y-%m-%d')}")
        print("👉 Lần chạy tới của GitHub Action sẽ xử lý ngày này.")
        
    else:
        print("⚠️ Không có dữ liệu.")

if __name__ == "__main__":
    main()
