import pandas as pd
import os

def load_and_merge_data(raw_data_dir):
    """
    Hàm này đọc 3 file CSV rời rạc (Orders, Items, Products)
    và gộp chúng lại thành một DataFrame duy nhất có đủ thông tin:
    Ngày bán, Giá tiền, Tên danh mục sản phẩm.
    """
    try:
        # 1. Đọc các file dữ liệu gốc
        orders_path = os.path.join(raw_data_dir, 'olist_orders_dataset.csv')
        items_path = os.path.join(raw_data_dir, 'olist_order_items_dataset.csv')
        products_path = os.path.join(raw_data_dir, 'olist_products_dataset.csv')
        
        # Kiểm tra file tồn tại
        if not os.path.exists(orders_path):
            print(f"❌ Không tìm thấy file: {orders_path}")
            return None

        df_orders = pd.read_csv(orders_path)
        df_items = pd.read_csv(items_path)
        df_products = pd.read_csv(products_path)

        # 2. Xử lý thời gian
        df_orders['order_purchase_timestamp'] = pd.to_datetime(df_orders['order_purchase_timestamp'])

        # 3. Gộp bảng (Merge)
        # Bước A: Gộp Đơn hàng với Chi tiết đơn hàng (để lấy Giá tiền)
        # Dùng 'inner' để chỉ lấy đơn hàng nào có sản phẩm
        merged_df = pd.merge(df_orders, df_items, on='order_id', how='inner')

        # Bước B: Gộp tiếp với Sản phẩm (để lấy Tên danh mục)
        # (File gốc tên cột là product_category_name)
        final_df = pd.merge(merged_df, df_products, on='product_id', how='left')

        # 4. Chọn các cột cần thiết cho Dashboard
        columns_to_keep = [
            'order_id', 
            'customer_id', 
            'order_status', 
            'order_purchase_timestamp', # Thời gian đặt
            'price',                    # Doanh thu
            'freight_value',            # Phí ship
            'product_category_name',    # Danh mục
            'product_id'
        ]
        
        return final_df[columns_to_keep]

    except Exception as e:
        print(f"⚠️ Lỗi khi gộp dữ liệu: {e}")
        return None
