import pandas as pd
import os
from datetime import datetime
try:
    from translation_map import category_dict
except ImportError:
    category_dict = {}

def load_and_merge_data(raw_data_dir):
    try:
        print(f"{datetime.now().strftime('%H:%M:%S')} - ⏳ Đang đọc dữ liệu từ các file CSV...")
        
        # 1. Khai báo đường dẫn các file
        orders_path = os.path.join(raw_data_dir, 'olist_orders_dataset.csv')
        items_path = os.path.join(raw_data_dir, 'olist_order_items_dataset.csv')
        products_path = os.path.join(raw_data_dir, 'olist_products_dataset.csv')
        customers_path = os.path.join(raw_data_dir, 'olist_customers_dataset.csv')
        payments_path = os.path.join(raw_data_dir, 'olist_order_payments_dataset.csv')

        # Kiểm tra file tồn tại
        required_paths = [orders_path, items_path, products_path, customers_path, payments_path]
        for p in required_paths:
            if not os.path.exists(p):
                print(f"❌ Thiếu file dữ liệu đầu vào: {p}")
                return None

        # 2. Đọc dữ liệu (Đã bổ sung payment_type)
        df_orders = pd.read_csv(orders_path, usecols=['order_id', 'customer_id', 'order_status', 'order_purchase_timestamp'])
        df_items = pd.read_csv(items_path, usecols=['order_id', 'product_id', 'seller_id', 'price', 'freight_value'])
        df_products = pd.read_csv(products_path, usecols=['product_id', 'product_category_name'])
        df_customers = pd.read_csv(customers_path, usecols=['customer_id', 'customer_unique_id', 'customer_city', 'customer_state'])
        
        # Lấy thêm payment_type để vẽ biểu đồ tròn
        df_payments = pd.read_csv(payments_path, usecols=['order_id', 'payment_value', 'payment_type']) 
        
        try:
            status_df = df_orders.copy()
            status_df['date'] = pd.to_datetime(status_df['order_purchase_timestamp']).dt.date.astype(str)
            status_summary = status_df.groupby(['date', 'order_status']).size().reset_index(name='count')
            # Lưu ra một file CSV siêu nhẹ (chỉ khoảng 50KB)
            status_summary.to_csv(os.path.join('data', 'live', 'order_status_summary.csv'), index=False)
        except Exception as e:
            print(f"Lỗi tạo file trạng thái: {e}")
        # ------------------------------------------------------------------

        # df_items = pd.read_csv(paths['items'], usecols=['order_id', 'product_id', 'seller_id', 'price', 'freight_value'])
        # 3. Làm sạch Orders
        df_orders = df_orders[df_orders['order_status'] == 'delivered'].copy()
        df_orders = df_orders.dropna(subset=['order_purchase_timestamp'])
        df_orders['order_purchase_timestamp'] = pd.to_datetime(df_orders['order_purchase_timestamp'])

        # 4. XỬ LÝ BẢNG PAYMENTS (Cập nhật Groupby để không mất loại thanh toán)
        # Gom nhóm theo cả ID đơn hàng và Loại thanh toán
        df_payments_grouped = df_payments.groupby(['order_id', 'payment_type'], as_index=False)['payment_value'].sum()

        # 5. Merge dữ liệu
        merged_df = pd.merge(df_orders, df_items, on='order_id', how='inner')
        merged_df = pd.merge(merged_df, df_customers, on='customer_id', how='left')
        merged_df = pd.merge(merged_df, df_products, on='product_id', how='left')
        
        # Hợp nhất với bảng payments (bây giờ đã có payment_type)
        final_df = pd.merge(merged_df, df_payments_grouped, on='order_id', how='left')

        # 6. Xử lý Category (Tiếng Việt)
        final_df['product_category_name'] = final_df['product_category_name'].fillna('unknown')
        if category_dict:
            final_df['Category_VN'] = final_df['product_category_name'].map(category_dict).fillna(final_df['product_category_name'])
            top_categories = list(category_dict.values())
            final_df.loc[~final_df['Category_VN'].isin(top_categories), 'Category_VN'] = 'Khác'
        else:
            final_df['Category_VN'] = final_df['product_category_name']

        # 7. Lọc nhiễu
        final_df = final_df[final_df['price'] < 50000]
        final_df = final_df.dropna(subset=['seller_id', 'customer_unique_id', 'payment_value'])

        # 8. Chốt cột hiển thị (Đã bổ sung payment_type)
        columns_to_keep = [
            'order_id', 
            'order_purchase_timestamp', 
            'price', 
            'freight_value', 
            'payment_value', 
            'payment_type', # Cột mới thêm
            'order_status', 
            'seller_id', 
            'customer_unique_id', 
            'customer_city', 
            'customer_state', 
            'Category_VN', 
            'product_id'
        ]
        
        print(f"✅ Hợp nhất thành công. Tổng số dòng: {len(final_df)}")
        return final_df[columns_to_keep]

    except Exception as e:
        print(f"⚠️ Lỗi xử lý trong process_utils: {e}")
        return None