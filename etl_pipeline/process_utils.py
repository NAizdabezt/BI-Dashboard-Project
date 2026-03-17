import pandas as pd
import os
from translation_map import category_dict # Import từ điển

def load_and_merge_data(raw_data_dir):
    try:
        print("⏳ Đang đọc dữ liệu từ các file CSV...")
        
        # 1. Khai báo thêm đường dẫn bảng Payments
        orders_path = os.path.join(raw_data_dir, 'olist_orders_dataset.csv')
        items_path = os.path.join(raw_data_dir, 'olist_order_items_dataset.csv')
        products_path = os.path.join(raw_data_dir, 'olist_products_dataset.csv')
        customers_path = os.path.join(raw_data_dir, 'olist_customers_dataset.csv')
        payments_path = os.path.join(raw_data_dir, 'olist_order_payments_dataset.csv') # <--- THÊM MỚI

        # Kiểm tra file
        if not all(os.path.exists(p) for p in [orders_path, items_path, products_path, customers_path, payments_path]):
            print("❌ Thiếu file dữ liệu đầu vào!")
            return None

        # 2. Đọc dữ liệu (Tối ưu RAM bằng usecols)
        df_orders = pd.read_csv(orders_path, usecols=['order_id', 'customer_id', 'order_status', 'order_purchase_timestamp'])
        df_items = pd.read_csv(items_path, usecols=['order_id', 'product_id', 'seller_id', 'price', 'freight_value'])
        df_products = pd.read_csv(products_path, usecols=['product_id', 'product_category_name'])
        df_customers = pd.read_csv(customers_path, usecols=['customer_id', 'customer_unique_id', 'customer_city', 'customer_state'])
        df_payments = pd.read_csv(payments_path, usecols=['order_id', 'payment_value']) # <--- ĐỌC PAYMENTS

        # 3. Làm sạch Orders (Chỉ lấy đơn hàng giao thành công)
        df_orders = df_orders[df_orders['order_status'] == 'delivered']
        df_orders = df_orders.dropna(subset=['order_purchase_timestamp'])
        df_orders['order_purchase_timestamp'] = pd.to_datetime(df_orders['order_purchase_timestamp'])

        # 4. XỬ LÝ BẢNG PAYMENTS (CỰC KỲ QUAN TRỌNG)
        # Một đơn hàng có thể quẹt 2 thẻ, hoặc 1 voucher + 1 tiền mặt -> Phải gom nhóm (groupby) lại
        df_payments_grouped = df_payments.groupby('order_id', as_index=False)['payment_value'].sum()

        # 5. Merge dữ liệu (Nối các bảng lại với nhau)
        merged_df = pd.merge(df_orders, df_items, on='order_id', how='inner')
        merged_df = pd.merge(merged_df, df_customers, on='customer_id', how='left')
        merged_df = pd.merge(merged_df, df_products, on='product_id', how='left')
        
        # Merge thêm cục Doanh thu thực tế (Payment) vừa tính xong
        final_df = pd.merge(merged_df, df_payments_grouped, on='order_id', how='left')

        # 6. Xử lý Category (Tiếng Việt)
        final_df['product_category_name'] = final_df['product_category_name'].fillna('unknown')
        if 'category_dict' in globals():
            final_df['Category_VN'] = final_df['product_category_name'].map(category_dict).fillna(final_df['product_category_name'])
            top_categories = list(category_dict.values())
            final_df.loc[~final_df['Category_VN'].isin(top_categories), 'Category_VN'] = 'Khác'
        else:
            final_df['Category_VN'] = final_df['product_category_name']

        # 7. Lọc nhiễu
        final_df = final_df[final_df['price'] < 50000]
        final_df = final_df.dropna(subset=['seller_id', 'customer_unique_id', 'payment_value']) # Rớt những dòng không có doanh thu

        # 8. Chốt cột hiển thị (Có thêm cột payment_value)
        columns_to_keep = [
            'order_id', 
            'order_purchase_timestamp', 
            'price',                    # Giá niêm yết
            'freight_value',            # Phí ship
            'payment_value',            # <--- ĐÂY LÀ DOANH THU THỰC TẾ
            'order_status',             
            'seller_id',                
            'customer_unique_id',       
            'customer_city',            
            'customer_state',           
            'product_category_name',    
            'Category_VN',              
            'product_id'
        ]
        
        print(f"✅ Hợp nhất thành công. Tổng số dòng hợp lệ: {len(final_df)}")
        return final_df[columns_to_keep]

    except Exception as e:
        print(f"⚠️ Lỗi xử lý: {e}")
        return None