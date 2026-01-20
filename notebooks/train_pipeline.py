# notebooks/train_pipeline.py
# --- ĐÂY LÀ FILE KHUNG (SKELETON) DO LEADER TẠO ---
# --- NHIỆM VỤ CỦA DATA SCIENTIST: HÃY SỬA FILE NÀY ĐỂ TRAIN MODEL TỐT HƠN ---

import pandas as pd
import joblib
import os
from sklearn.linear_model import LinearRegression

# 1. Setup đường dẫn (Tuyệt đối không sửa phần này để tránh lỗi hệ thống)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
data_path = os.path.join(project_root, 'data', 'live', 'sales_dashboard.csv')
model_path = os.path.join(project_root, 'models', 'sales_forecast_model.pkl')

print("🚀 [SYSTEM] Bắt đầu quy trình train model tự động...")

# 2. Đọc dữ liệu (Giả định dữ liệu đã sạch do bước ETL làm rồi)
try:
    df = pd.read_csv(data_path)
    print(f"✅ Load được {len(df)} dòng dữ liệu.")
except Exception as e:
    print(f"❌ Lỗi đọc file: {e}")
    exit(1)

# 3. Code Model Đơn giản (Data Scientist sẽ thay thế đoạn này sau)
# ----------------------------------------------------------------
# Demo: Dự báo bằng Linear Regression cơ bản
try:
    # Xử lý ngày tháng
    if 'order_purchase_timestamp' in df.columns:
        df['Date'] = pd.to_datetime(df['order_purchase_timestamp'])
    elif 'Date' in df.columns: # Trường hợp file training_data.csv
        df['Date'] = pd.to_datetime(df['Date'])
    
    df['DateOrdinal'] = df['Date'].map(pd.Timestamp.toordinal)
    
    # Train
    X = df[['DateOrdinal']]
    y = df['revenue'] if 'revenue' in df.columns else df['Revenue']
    
    model = LinearRegression()
    model.fit(X, y)
    print("⚠️ [NOTE] Đây là Model Demo. Data Scientist cần cập nhật thuật toán tại đây.")
# ----------------------------------------------------------------

    # 4. Lưu Model (Quan trọng: Phải lưu đúng chỗ này thì API mới đọc được)
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    print(f"💾 Đã lưu model thành công tại: {model_path}")

except Exception as e:
    print(f"❌ Lỗi khi train model: {e}")