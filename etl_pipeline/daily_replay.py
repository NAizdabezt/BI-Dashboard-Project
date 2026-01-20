import pandas as pd
import os
from datetime import datetime
from process_utils import load_and_merge_data

# Cấu hình đường dẫn
RAW_DATA_DIR = 'data/raw'
LIVE_DATA_DIR = 'data/live'
OUTPUT_FILE = os.path.join(LIVE_DATA_DIR, 'sales_dashboard.csv')

def main():
    # 1. Xác định ngày giả lập (Hôm nay)
    today = datetime.now()
    print(f"🚀 Bắt đầu chạy ETL Pipeline...")
    print(f"📅 Ngày hệ thống: {today.strftime('%Y-%m-%d')}")

    # 2. Lấy dữ liệu sạch từ Raw (Đã qua xử lý process_utils)
    # Lưu ý: Hàm này đang trả về toàn bộ dữ liệu có trong file Raw
    full_clean_data = load_and_merge_data(RAW_DATA_DIR)
    
    if full_clean_data is None:
        print("❌ Không đọc được dữ liệu nguồn. Dừng chương trình.")
        return

    # Đảm bảo cột thời gian là datetime để so sánh
    full_clean_data['order_purchase_timestamp'] = pd.to_datetime(full_clean_data['order_purchase_timestamp'])

    # 3. KIỂM TRA: File kết quả đã tồn tại chưa?
    is_first_run = not os.path.exists(OUTPUT_FILE)

    final_df = None

    if is_first_run:
        # --- TRƯỜNG HỢP 1: CHẠY LẦN ĐẦU (Hoặc file bị xóa) ---
        print("✨ Chưa thấy file dữ liệu cũ. Chế độ: FULL LOAD (Chạy lại toàn bộ lịch sử).")
        
        # Lấy tất cả dữ liệu từ quá khứ <= Hôm nay
        final_df = full_clean_data[full_clean_data['order_purchase_timestamp'] <= today]
        
    else:
        # --- TRƯỜNG HỢP 2: ĐÃ CÓ DỮ LIỆU (Chạy hàng ngày) ---
        print("📂 Đã thấy file dữ liệu cũ. Chế độ: INCREMENTAL LOAD (Cập nhật ngày hôm nay).")
        
        # B1: Đọc file cũ lên
        current_df = pd.read_csv(OUTPUT_FILE)
        current_df['order_purchase_timestamp'] = pd.to_datetime(current_df['order_purchase_timestamp'])
        
        print(f"   - Dữ liệu cũ đang có: {len(current_df)} dòng.")

        # B2: Lấy dữ liệu CỦA RIÊNG HÔM NAY (hoặc dữ liệu mới chưa có)
        # Để an toàn, ta lấy dữ liệu <= hôm nay, sau đó dùng kỹ thuật "Upsert" (Ghi đè cái mới)
        new_data = full_clean_data[full_clean_data['order_purchase_timestamp'] <= today]

        # B3: Gộp cũ và mới
        combined_df = pd.concat([current_df, new_data])

        # B4: XỬ LÝ TRÙNG LẶP (Quan trọng!)
        # Nếu 1 đơn hàng xuất hiện cả ở file cũ và file mới -> Giữ cái mới nhất (keep='last')
        # Key để xác định trùng là: order_id và product_id
        final_df = combined_df.drop_duplicates(subset=['order_id', 'product_id'], keep='last')
        
        new_rows_count = len(final_df) - len(current_df)
        print(f"   - Tìm thấy {new_rows_count} dòng dữ liệu mới/cập nhật.")

    # 4. Lưu kết quả
    if final_df is not None and not final_df.empty:
        # Sắp xếp lại theo thời gian cho đẹp
        final_df = final_df.sort_values(by='order_purchase_timestamp')
        
        # Tạo thư mục nếu chưa có
        os.makedirs(LIVE_DATA_DIR, exist_ok=True)
        
        final_df.to_csv(OUTPUT_FILE, index=False)
        print(f"✅ Đã lưu thành công {len(final_df)} dòng vào {OUTPUT_FILE}")
    else:
        print("⚠️ Không có dữ liệu nào để lưu.")

if __name__ == "__main__":
    main()
