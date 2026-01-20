import pandas as pd
import os
from datetime import datetime
from process_utils import load_and_merge_data

# Cấu hình đường dẫn
RAW_DATA_DIR = 'data/raw'
LIVE_DATA_DIR = 'data/live'
OUTPUT_FILE = os.path.join(LIVE_DATA_DIR, 'sales_dashboard.csv')

# --- CẤU HÌNH CỖ MÁY THỜI GIAN ---
# Bạn muốn giả lập hôm nay là ngày nào?
# Ví dụ: Ngày 1 tháng 6 năm 2018 (Để dành 6 tháng cuối năm để test AI)
CURRENT_SIMULATION_DATE = datetime(2018, 6, 1) 

def main():
    # 1. Sử dụng ngày giả lập thay vì ngày thực tế
    today = CURRENT_SIMULATION_DATE
    
    print(f"🚀 Bắt đầu chạy ETL Pipeline...")
    print(f"⏳ Đang du hành thời gian về ngày: {today.strftime('%Y-%m-%d')}")

    # 2. Lấy dữ liệu sạch từ Raw
    full_clean_data = load_and_merge_data(RAW_DATA_DIR)
    
    if full_clean_data is None:
        print("❌ Không đọc được dữ liệu nguồn. Dừng chương trình.")
        return

    # Đảm bảo cột thời gian là datetime
    full_clean_data['order_purchase_timestamp'] = pd.to_datetime(full_clean_data['order_purchase_timestamp'])

    # 3. KIỂM TRA: File kết quả đã tồn tại chưa?
    # Lưu ý: Nếu ngày giả lập < ngày trong file cũ, ta bắt buộc phải chạy lại từ đầu (Reset)
    # để tránh dữ liệu tương lai bị lẫn vào quá khứ.
    
    is_first_run = not os.path.exists(OUTPUT_FILE)
    
    # Kiểm tra thêm logic: Nếu file cũ đang chứa dữ liệu năm 2026 mà giờ set về 2018
    # thì phải xóa làm lại, nếu không sẽ bị loạn thời gian.
    if not is_first_run:
        existing_df = pd.read_csv(OUTPUT_FILE)
        max_date_in_file = pd.to_datetime(existing_df['OrderDate']).max() # Lưu ý tên cột đã đổi trong process_utils
        
        if max_date_in_file > today:
            print("⚠️ Phát hiện dữ liệu tương lai trong file cũ! Đang tiến hành Reset về quá khứ...")
            is_first_run = True # Ép chạy lại mode Full Load

    final_df = None

    if is_first_run:
        # --- MODE 1: TIME TRAVEL RESET (Chạy lại từ đầu đến mốc 6/2018) ---
        print(f"✨ Tạo mới dữ liệu lịch sử từ đầu đến {today.strftime('%Y-%m-%d')}.")
        
        final_df = full_clean_data[full_clean_data['order_purchase_timestamp'] <= today]
        
    else:
        # --- MODE 2: INCREMENTAL (Dành cho việc chạy tiếp các ngày sau 1/6/2018) ---
        print("📂 Cập nhật dữ liệu mới (Incremental Load).")
        
        current_df = pd.read_csv(OUTPUT_FILE)
        current_df['order_purchase_timestamp'] = pd.to_datetime(current_df['order_purchase_timestamp']) # Lưu ý tên cột gốc
        
        # Lấy dữ liệu <= ngày giả lập
        new_data = full_clean_data[full_clean_data['order_purchase_timestamp'] <= today]

        combined_df = pd.concat([current_df, new_data])
        
        # Lọc trùng
        final_df = combined_df.drop_duplicates(subset=['order_id', 'product_id'], keep='last')

    # 4. Lưu kết quả
    if final_df is not None and not final_df.empty:
        final_df = final_df.sort_values(by='order_purchase_timestamp')
        os.makedirs(LIVE_DATA_DIR, exist_ok=True)
        final_df.to_csv(OUTPUT_FILE, index=False)
        print(f"✅ Đã chốt sổ dữ liệu tính đến {today.strftime('%Y-%m-%d')}")
        print(f"📊 Tổng số dòng: {len(final_df)}")
    else:
        print("⚠️ Không có dữ liệu nào trong khoảng thời gian này.")

if __name__ == "__main__":
    main()
