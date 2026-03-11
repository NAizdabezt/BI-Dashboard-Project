# notebooks/train_pipeline.py
# --- ĐÂY LÀ FILE KHUNG (SKELETON) DO LEADER TẠO ---
# --- NHIỆM VỤ CỦA DATA SCIENTIST: HÃY SỬA FILE NÀY ĐỂ TRAIN MODEL TỐT HƠN ---

# notebooks/train_pipeline.py
import pandas as pd
import joblib
import os
from sklearn.linear_model import LinearRegression

# 1. Setup đường dẫn
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
data_path = os.path.join(project_root, 'data', 'live', 'sales_dashboard.csv')
model_path = os.path.join(project_root, 'models', 'sales_forecast_model.pkl')

print("🚀 [SYSTEM] Bắt đầu quy trình train model tự động...")

try:
    # 2. Đọc dữ liệu
    if not os.path.exists(data_path):
        print(f"❌ Lỗi: Không tìm thấy file tại {data_path}")
        exit(1)
        
    df = pd.read_csv(data_path)
    
    # --- QUAN TRỌNG: SỬA LỖI TÊN CỘT ---
    # Chuyển hết tên cột về chữ thường (revenue, date...) để tránh lỗi Revenue/revenue
    df.columns = df.columns.str.lower()
    print(f"ℹ️ Các cột hiện có: {list(df.columns)}") 

    # 3. Xử lý dữ liệu
    # Tìm cột ngày tháng (chấp nhận cả 'date' hoặc 'order_purchase_timestamp')
    date_col = 'date' if 'date' in df.columns else 'order_purchase_timestamp'
    if date_col not in df.columns:
        raise ValueError("Không tìm thấy cột ngày tháng!")
        
    df['date_clean'] = pd.to_datetime(df[date_col])
    df['date_ordinal'] = df['date_clean'].map(pd.Timestamp.toordinal)
    
    # Tìm cột doanh thu (chấp nhận cả 'revenue' hoặc 'price')
    target_col = 'revenue'
    if 'revenue' not in df.columns:
        if 'price' in df.columns:
            target_col = 'price'
        else:
            raise ValueError(f"❌ Không tìm thấy cột doanh thu 'revenue' trong file! Cột hiện có: {df.columns}")

    # 4. Train Model
    X = df[['date_ordinal']]
    y = df[target_col]
    
    model = LinearRegression()
    model.fit(X, y)
    
    # 5. Lưu Model
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    print(f"💾 Đã lưu model thành công tại: {model_path}")
    print(f"✅ Đã học từ {len(df)} dòng dữ liệu.")

except Exception as e:
    print(f"❌ LỖI NGHIÊM TRỌNG: {e}")
    exit(1)
