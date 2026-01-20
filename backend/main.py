# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os # <--- Nhớ import thư viện này

app = FastAPI()

# 1. Cấu hình CORS (Để Frontend gọi được API mà không bị chặn)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên để ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SỬA ĐOẠN LOAD DỮ LIỆU ---

# 1. Lấy vị trí chính xác của file main.py hiện tại
current_dir = os.path.dirname(os.path.abspath(__file__))
# current_dir sẽ là: .../BI-Dashboard-Project/backend

# 2. Đi lùi ra 1 cấp để về thư mục gốc (Project Root)
project_root = os.path.dirname(current_dir)
# project_root sẽ là: .../BI-Dashboard-Project

# 3. Nối vào đường dẫn file CSV
csv_path = os.path.join(project_root, 'data', 'live', 'sales_dashboard.csv')

# 4. Đọc file (Thêm try-catch để lỡ file chưa có thì không sập app)
try:
    df = pd.read_csv(csv_path)
    print(f"✅ Đã load dữ liệu thành công từ: {csv_path}")
except FileNotFoundError:
    print(f"⚠️ Không tìm thấy file data tại: {csv_path}")
    print("👉 Hệ thống sẽ dùng dữ liệu rỗng để chạy tạm.")
    df = pd.DataFrame(columns=["order_purchase_timestamp", "price", "revenue"]) # Tạo khung rỗng

# -----------------------------

@app.get("/")
def read_root():
    return {"message": "Welcome to Olist API"}

@app.get("/api/revenue/daily")
def get_daily_revenue():
    # Logic xử lý Pandas gom nhóm theo ngày
    # (Copy logic từ Notebook vào đây)
    df['date'] = pd.to_datetime(df['order_purchase_timestamp']).dt.date
    daily_data = df.groupby('date')['price'].sum().reset_index()
    daily_data.columns = ['date', 'revenue']
    
    # Chuyển về dạng JSON list
    result = daily_data.to_dict(orient='records')
    return result

@app.post("/api/predict")
def predict_revenue(days: int = 30):
    # Logic gọi Model AI ở đây
    # model = joblib.load('model.pkl')
    # prediction = model.predict(...)
    
    # Mockup kết quả giả để test trước
    return [
        {"date": "2018-09-01", "predicted_revenue": 5000},
        {"date": "2018-09-02", "predicted_revenue": 5200}
    ]

# Chạy server: uvicorn main:app --reload
