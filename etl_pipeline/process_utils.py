import pandas as pd
import os

def load_and_merge_data(raw_data_dir):
    """
    Phiên bản V2: Fix lỗi tách dòng (Ghost Rows) và dữ liệu trùng lặp.
    """
    try:
        print("⏳ Đang đọc dữ liệu từ các file CSV...")
        orders_path = os.path.join(raw_data_dir, 'olist_orders_dataset.csv')
        items_path = os.path.join(raw_data_dir, 'olist_order_items_dataset.csv')
        products_path = os.path.join(raw_data_dir, 'olist_products_dataset.csv')
        customers_path = os.path.join(raw_data_dir, 'olist_customers_dataset.csv')
        
        if not all(os.path.exists(p) for p in [orders_path, items_path, products_path, customers_path]):
            print("❌ Thiếu file dữ liệu đầu vào!")
            return None

        # Đọc file
        df_orders = pd.read_csv(orders_path)
        df_items = pd.read_csv(items_path)
        df_products = pd.read_csv(products_path)
        df_customers = pd.read_csv(customers_path)

        print("🧹 Đang tiến hành làm sạch và gộp dữ liệu...")

        # 1. Lọc đơn hàng hợp lệ
        valid_statuses = ['delivered', 'shipped', 'invoiced']
        df_orders = df_orders[df_orders['order_status'].isin(valid_statuses)]
        df_orders = df_orders.dropna(subset=['order_purchase_timestamp'])
        df_orders['order_purchase_timestamp'] = pd.to_datetime(df_orders['order_purchase_timestamp'])

        # 2. Gộp bảng (QUAN TRỌNG: Thứ tự gộp để không bị tách dòng)
        # B1: Orders + Items (Inner Join: Bắt buộc phải có hàng mới tính)
        merged_df = pd.merge(df_orders, df_items, on='order_id', how='inner')

        # B2: + Customers (Left Join: Gắn thông tin khách vào đơn)
        # Lưu ý: Merge vào bảng đã có items để đảm bảo không mất dòng
        merged_df = pd.merge(merged_df, df_customers, on='customer_id', how='left')

        # B3: + Products (Left Join: Gắn thông tin sp)
        final_df = pd.merge(merged_df, df_products, on='product_id', how='left')

        # 1. Điền dữ liệu thiếu
        final_df['product_category_name'] = final_df['product_category_name'].fillna('unknown')
        
        # 2. Lấy từ điển dịch
        translate_dict = get_category_translation()
        
        # 3. Tạo cột mới 'Category_VN' (Dùng map để dịch, nếu không có trong từ điển thì giữ nguyên tiếng gốc)
        final_df['Category_VN'] = final_df['product_category_name'].map(translate_dict).fillna(final_df['product_category_name'])
        
        # 4. Gom các nhóm nhỏ lẻ ít quan trọng vào nhóm 'Khác' để biểu đồ đẹp hơn (Tùy chọn)
        top_categories = list(translate_dict.values())
        final_df.loc[~final_df['Category_VN'].isin(top_categories), 'Category_VN'] = 'Khác'
        final_df = final_df[final_df['price'] < 50000] # Lọc nhiễu giá

        # --- GIAI ĐOẠN 5 (MỚI): CHỐT CHẶN CUỐI CÙNG ---
        # Đây là bước sửa lỗi của bạn:
        # Xóa các dòng bị lỗi khuyết thông tin quan trọng (nguyên nhân gây lặp dòng ảo)
        before_drop = len(final_df)
        final_df = final_df.dropna(subset=['seller_id', 'customer_unique_id'])
        print(f"✂️ Đã loại bỏ {before_drop - len(final_df)} dòng lỗi (thiếu seller hoặc customer).")

        # 4. Chọn cột
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
            'product_category_name',    
            'product_id'
        ]
        
        return final_df[columns_to_keep]
        
def get_category_translation():
    return {
        'cama_mesa_banho': 'Giường - Bàn - Phòng tắm',
        'beleza_saude': 'Sức khỏe & Làm đẹp',
        'esporte_lazer': 'Thể thao & Giải trí',
        'moveis_decoracao': 'Nội thất & Trang trí',
        'informatica_acessorios': 'Máy tính & Phụ kiện',
        'utilidades_domesticas': 'Đồ gia dụng',
        'relogios_presentes': 'Đồng hồ & Quà tặng',
        'telefonia': 'Điện thoại & Viễn thông',
        'automotivo': 'Phụ tùng ô tô',
        'brinquedos': 'Đồ chơi',
        'cool_stuff': 'Đồ độc lạ (Cool Stuff)',
        'ferramentas_jardim': 'Dụng cụ làm vườn',
        'perfumaria': 'Nước hoa',
        'bebes': 'Mẹ & Bé',
        'eletronicos': 'Điện tử',
        'papelaria': 'Văn phòng phẩm',
        'fashion_bolsas_e_acessorios': 'Thời trang & Túi xách',
        'pet_shop': 'Thú cưng',
        'moveis_escritorio': 'Nội thất văn phòng',
        'malas_acessorios': 'Vali & Hành lý',
        'consoles_games': 'Game & Console',
        'musica': 'Nhạc cụ',
        'moveis_quarto': 'Nội thất phòng ngủ'
        # Các danh mục khác sẽ mặc định giữ nguyên hoặc để 'Khác'
    }

        
    except Exception as e:
        print(f"⚠️ Lỗi xử lý: {e}")
        return None
