import pandas as pd
import clickhouse_connect

def migrate_to_cloud():
    csv_path = "data/live/sales_dashboard.csv"
    print(f"⏳ Đọc toàn bộ lịch sử từ {csv_path}...")
    df = pd.read_csv(csv_path)
    df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
    
    print("🔌 Đang kết nối lên ClickHouse Cloud...")
    # Điền thông tin Cloud của anh vào đây
    client = clickhouse_connect.get_client(
        host='g6u2lns963.asia-southeast1.gcp.clickhouse.cloud',
        port=8443,
        username='default',
        password='re0p~~Ii1mVXS',
        secure=True # Bắt buộc phải có dòng này khi dùng Cloud
    )
    
    print("🏗️ Tạo bảng trên Cloud (nếu chưa có)...")
    client.command("""
        CREATE TABLE IF NOT EXISTS olist_flat_analytics (
            order_id String,
            order_purchase_timestamp DateTime,
            payment_value Float32,
            Category_VN String,
            customer_city String,
            customer_state String,
            product_id String,
            seller_id String,
            price Float32,
            payment_type String,
            order_status String
        ) ENGINE = MergeTree()
        ORDER BY order_purchase_timestamp
    """)
    
    print("🧹 Dọn dẹp dữ liệu cũ (nếu có)...")
    client.command("TRUNCATE TABLE olist_flat_analytics")
    
    print(f"🚀 Đang bơm {len(df)} dòng dữ liệu lên Cloud. Chờ một xíu nhé...")
    client.insert_df('olist_flat_analytics', df)
    
    print("✅ THÀNH CÔNG! Dữ liệu đã an tọa trên ClickHouse Cloud!")

if __name__ == "__main__":
    migrate_to_cloud()