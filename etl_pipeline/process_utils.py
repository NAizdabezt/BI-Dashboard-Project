import pandas as pd
import os

def load_and_merge_data(raw_data_dir):
    """
    Hàm này đọc và gộp 4 bảng dữ liệu quan trọng nhất:
    1. Orders (Thời gian, Trạng thái)
    2. Items (Giá tiền, Mã sản phẩm, MÃ NGƯỜI BÁN) <--- Quan trọng cho KPI nhân viên
    3. Products (Danh mục sản phẩm)
    4. Customers (Địa điểm, ID duy nhất của khách) <--- Quan trọng cho phân tích khách hàng
    """
    try:
        print("⏳ Đang đọc dữ liệu từ các file CSV...")
        # 1. Định nghĩa đường dẫn file
        orders_path = os.path.join(raw_data_dir, 'olist_orders_dataset.csv')
        items_path = os.path.join(raw_data_dir, 'olist_order_items_dataset.csv')
        products_path = os.path.join(raw_data_dir, 'olist_products_dataset.csv')
        customers_path = os.path.join(raw_data_dir, 'olist_customers_dataset.csv') # Mới thêm
        
        # Kiểm tra file tồn tại
        if not all(os.path.exists(p) for p in [orders_path, items_path, products_path, customers_path]):
            print("❌ Thiếu một trong các file dữ liệu đầu vào!")
            return None

        # 2. Đọc file
        df_orders = pd.read_csv(orders_path)
        df_items = pd.read_csv(items_path)
        df_products = pd.read_csv(products_path)
        df_customers = pd.read_csv(customers_path)

        print("🧹 Đang tiến hành làm sạch và gộp dữ liệu...")

        # --- GIAI ĐOẠN 1: LÀM SẠCH SƠ BỘ ---
        # Chỉ lấy đơn hàng thành công
        valid_statuses = ['delivered', 'shipped', 'invoiced']
        df_orders = df_orders[df_orders['order_status'].isin(valid_statuses)]
        df_orders = df_orders.dropna(subset=['order_purchase_timestamp'])
        df_orders['order_purchase_timestamp'] = pd.to_datetime(df_orders['order_purchase_timestamp'])

        # --- GIAI ĐOẠN 2: GỘP BẢNG (MERGE) ---
        
        # Bước A: Orders + Items (Để lấy thông tin Sản phẩm & Seller)
        # Lưu ý: Một đơn có thể có nhiều sản phẩm -> nhiều dòng
        merged_1 = pd.merge(df_orders, df_items, on='order_id', how='inner')

        # Bước B: + Products (Để lấy tên Danh mục)
        merged_2 = pd.merge(merged_1, df_products, on='product_id', how='left')

        # Bước C: + Customers (Để lấy Customer Unique ID và Địa chỉ)
        # Olist nối Orders với Customers qua 'customer_id'
        final_df = pd.merge(merged_2, df_customers, on='customer_id', how='left')

        # --- GIAI ĐOẠN 3: XỬ LÝ SAU GỘP ---
        
        # Điền "Unknown" cho danh mục thiếu
        final_df['product_category_name'] = final_df['product_category_name'].fillna('Other')
        
        # Loại bỏ giá trị nhiễu (Ví dụ giá > 50tr)
        final_df = final_df[final_df['price'] < 50000]

        # --- GIAI ĐOẠN 4: CHỌN CỘT CẦN THIẾT ---
        # Đây là lúc quyết định giữ lại gì để dùng cho Dashboard
        columns_to_keep = [
            'order_id', 
            'order_purchase_timestamp', # Thời gian
            'price',                    # Doanh thu
            'freight_value',            # Phí ship
            'order_status',             # Trạng thái
            
            # --- MỚI THÊM CHO ĐẦY ĐỦ ---
            'seller_id',                # Mã nhân viên (Để tính KPI nhân viên)
            'customer_unique_id',       # Mã khách hàng chuẩn (Để phân tích khách thân thiết)
            'customer_city',            # Thành phố khách
            'customer_state',           # Tỉnh/Bang khách (Vẽ bản đồ)
            
            'product_category_name',    # Danh mục SP
            'product_id'
        ]
        
        # Chỉ giữ lại các cột đã chọn
        final_df_clean = final_df[columns_to_keep]

        print(f"✅ Đã xử lý xong! Tổng cộng: {len(final_df_clean)} dòng.")
        return final_df_clean

    except Exception as e:
        print(f"⚠️ Lỗi nghiêm trọng khi xử lý dữ liệu: {e}")
        return None
