from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import os
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="BI Dashboard API (Olist)")

# 1. Cấu hình CORS (Cho phép Next.js localhost:3000 gọi API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KHAI BÁO SCHEMAS (Pydantic) ---
class RevenueItem(BaseModel):
    date: str
    revenue: float

class SummaryData(BaseModel):
    total_revenue: float
    total_orders: int
    growth_rate: float

class PredictionItem(BaseModel):
    date: str
    predicted_revenue: float

# --- CẤU HÌNH ĐƯỜNG DẪN & GLOBAL CACHE ---
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
csv_path = os.path.join(project_root, 'data', 'live', 'sales_dashboard.csv')
model_path = os.path.join(project_root, 'models', 'sales_forecast_model.pkl')

# CACHE: Lưu trữ dataframe để không phải đọc lại CSV mỗi lần user refresh trang
CACHED_DF = None
LAST_MODIFIED_TIME = 0

def get_data():
    """Hàm lấy dữ liệu thông minh, có sử dụng Cache"""
    global CACHED_DF, LAST_MODIFIED_TIME
    
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found: {csv_path}")
        return pd.DataFrame()

    # Kiểm tra xem file CSV có bị thay đổi (bởi luồng ETL) không
    current_modified_time = os.path.getmtime(csv_path)
    
    if CACHED_DF is None or current_modified_time > LAST_MODIFIED_TIME:
        logger.info("🔄 Đang Load/Reload dữ liệu CSV mới vào Cache...")
        try:
            df = pd.read_csv(csv_path)
            df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
            CACHED_DF = df
            LAST_MODIFIED_TIME = current_modified_time
        except Exception as e:
            logger.error(f"Error loading CSV: {e}")
            return pd.DataFrame()
            
    return CACHED_DF

@app.on_event("startup")
async def startup_event():
    logger.info("=== Bắt đầu khởi động Server Backend ===")
    get_data() # Gọi mồi 1 lần để nhét data vào Cache

# -----------------------------

@app.get("/")
def read_root():
    return {"message": "Olist BI Dashboard API is running mượt mà!"}

@app.get("/api/revenue/daily", response_model=List[RevenueItem])
def get_daily_revenue():
    df = get_data()
    if df.empty:
        return []
    
    # Đã sửa: Tính tổng theo payment_value thay vì price
    daily_data = df.groupby(df['order_purchase_timestamp'].dt.date)['payment_value'].sum().reset_index()
    daily_data.columns = ['date', 'revenue']
    daily_data['date'] = daily_data['date'].astype(str)
    daily_data['revenue'] = daily_data['revenue'].round(2)
    
    return daily_data.to_dict(orient='records')

@app.get("/api/summary", response_model=SummaryData)
def get_summary():
    df = get_data()
    if df.empty:
        return {"total_revenue": 0, "total_orders": 0, "growth_rate": 0}

    # Đã sửa: Tính tổng theo payment_value
    total_revenue = df['payment_value'].sum().round(2)
    total_orders = int(df['order_id'].nunique())

    # Tính Growth Rate
    df['month'] = df['order_purchase_timestamp'].dt.to_period('M')
    monthly_rev = df.groupby('month')['payment_value'].sum()
    
    growth_rate = 0.0
    if len(monthly_rev) >= 2:
        last_month = monthly_rev.iloc[-1]
        prev_month = monthly_rev.iloc[-2]
        if prev_month > 0:
            growth_rate = float(((last_month - prev_month) / prev_month * 100).round(2))

    return {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "growth_rate": growth_rate
    }

@app.get("/api/predict", response_model=List[PredictionItem])
def predict_revenue(days: int = 30):
    # ĐỔI THÀNH PHƯƠNG THỨC GET (Vì người dùng chỉ Yêu cầu xem, không Gửi data lên)
    if days not in [7, 14, 30]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ dự báo 7, 14, hoặc 30 ngày")
    
    if not os.path.exists(model_path):
        raise HTTPException(status_code=500, detail="Chưa train mô hình AI. Thiếu file pkl.")
    
    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi load model: {e}")
    
    df = get_data()
    if df.empty:
        raise HTTPException(status_code=500, detail="Chưa có dữ liệu CSV")
    
    last_date = df['order_purchase_timestamp'].max()
    
    predictions = []
    for i in range(1, days + 1):
        future_date = last_date + pd.Timedelta(days=i)
        date_ordinal = future_date.toordinal()
        
        pred_value = model.predict([[date_ordinal]])[0]
        
        predictions.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "predicted_revenue": max(0, round(float(pred_value), 2)) # Chặn doanh thu âm
        })
    
    return predictions

# Lệnh chạy: uvicorn backend.main:app --reload