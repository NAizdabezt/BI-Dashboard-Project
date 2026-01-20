import pandas as pd
import os
from translation_map import category_dict # Import từ điển

def load_and_merge_data(raw_data_dir):
    try:
        print("⏳ Đang đọc dữ liệu từ các file CSV...")
        # Định nghĩa đường dẫn
        orders_path = os.path.join(raw_data_dir, 'olist_orders_dataset.csv')
        items_path = os.path.join(raw_data_dir, 'olist_order_items_dataset.csv')
        products_path = os.path.join(raw_data_dir, 'olist_products_dataset.csv')
        customers_path = os.path.join(raw_data_dir, 'olist_customers_dataset.csv')
        
        # Kiểm tra file
        if not all(os.path.exists(p) for p in [orders_path, items_path, products_path, customers_path]):
            print("❌ Thiếu file dữ liệu đầu vào!")
            return None

        # Đọc dữ liệu
        df_orders = pd.read_csv(orders_path)
        df_items = pd.read_csv(items_path)
        df_products = pd.read_csv(products_path)
        df_customers = pd.read_csv(customers_path)

        # 1. Làm sạch Orders
        valid_statuses = ['delivered', 'shipped', 'invoiced']
        df_orders = df_orders[df_orders['order_status'].isin(valid_statuses)]
        df_orders = df_orders.dropna(subset=['order_purchase_timestamp'])
        df_orders['order_purchase_timestamp'] = pd.to_datetime(df_orders['order_purchase_timestamp'])

        # 2. Merge dữ liệu
        merged_df = pd.merge(df_orders, df_items, on='order_id', how='inner')
        merged_df = pd.merge(merged_df, df_customers, on='customer_id', how='left')
        final_df = pd.merge(merged_df, df_products, on='product_id', how='left')

        # 3. Xử lý Category (GIỮ CỘT GỐC + THÊM CỘT VIỆT)
        final_df['product_category_name'] = final_df['product_category_name'].fillna('unknown')
        
        # Map tiếng Việt
        final_df['Category_VN'] = final_df['product_category_name'].map(category_dict).fillna(final_df['product_category_name'])
        
        # Gom nhóm 'Khác'
        top_categories = list(category_dict.values())
        final_df.loc[~final_df['Category_VN'].isin(top_categories), 'Category_VN'] = 'Khác'

        # 4. Lọc nhiễu & Ghost rows
        final_df = final_df[final_df['price'] < 50000]
        final_df = final_df.dropna(subset=['seller_id', 'customer_unique_id'])

        # 5. Chọn cột (LẤY CẢ 2 CỘT CATEGORY)
        columns_to_keep = [
            'order_id', 
            'order_purchase_timestamp', 
            'price',                    
            'freight_value',            
            'order_status',             
            'seller_id',                
            'customer_unique_id',       
            'customer_city',            
            'customer_state',           
            'product_category_name',    # <--- Giữ lại cột gốc (Tiếng Bồ)
            'Category_VN',              # <--- Cột mới (Tiếng Việt)
            'product_id'
        ]
        
        return final_df[columns_to_keep]

    except Exception as e:
        print(f"⚠️ Lỗi xử lý: {e}")
        return None
