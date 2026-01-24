# backend/main.py
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

app = FastAPI(title="BI Dashboard API")

# 1. Cấu hình CORS
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
    growth_rate: float # % so với tháng trước

class PredictionItem(BaseModel):
    date: str
    predicted_revenue: float

# --- LOAD DỮ LIỆU ---
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
csv_path = os.path.join(project_root, 'data', 'live', 'sales_dashboard.csv')
model_path = os.path.join(project_root, 'models', 'sales_forecast_model.pkl')

def load_data():
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found: {csv_path}")
        return pd.DataFrame()
    try:
        df = pd.read_csv(csv_path)
        df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
        logger.info(f"Loaded {len(df)} rows from CSV")
        return df
    except Exception as e:
        logger.error(f"Error loading CSV: {e}")
        return pd.DataFrame()

@app.on_event("startup")
async def startup_event():
    logger.info("=== BI Dashboard API Starting ===")
    if os.path.exists(csv_path):
        logger.info(f"✅ CSV found: {csv_path}")
    else:
        logger.warning(f"⚠️ CSV not found: {csv_path}")
    if os.path.exists(model_path):
        logger.info(f"✅ Model found: {model_path}")
    else:
        logger.warning(f"⚠️ Model not found: {model_path}")

# -----------------------------

@app.get("/")
def read_root():
    return {"message": "Olist BI Dashboard API is running"}

@app.get("/api/revenue/daily", response_model=List[RevenueItem])
def get_daily_revenue():
    df = load_data()
    if df.empty:
        return []
    
    # Gom nhóm theo ngày và làm tròn
    daily_data = df.groupby(df['order_purchase_timestamp'].dt.date)['price'].sum().reset_index()
    daily_data.columns = ['date', 'revenue']
    daily_data['date'] = daily_data['date'].astype(str)
    daily_data['revenue'] = daily_data['revenue'].round(2)
    
    return daily_data.to_dict(orient='records')

@app.get("/api/summary", response_model=SummaryData)
def get_summary():
    df = load_data()
    if df.empty:
        return {"total_revenue": 0, "total_orders": 0, "growth_rate": 0}

    total_revenue = df['price'].sum().round(2)
    total_orders = int(df['order_id'].nunique())

    # Tính Growth Rate (tháng hiện tại vs tháng trước)
    df['month'] = df['order_purchase_timestamp'].dt.to_period('M')
    monthly_rev = df.groupby('month')['price'].sum()
    
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

@app.post("/api/predict", response_model=List[PredictionItem])
def predict_revenue(days: int = 30):
    # Validate input: chỉ cho phép 7, 14, 30
    if days not in [7, 14, 30]:
        logger.warning(f"Invalid days parameter: {days}")
        raise HTTPException(status_code=400, detail="days must be 7, 14, or 30")
    
    # Check model file exists
    if not os.path.exists(model_path):
        logger.error(f"Model file not found: {model_path}")
        raise HTTPException(status_code=500, detail="Model file not found")
    
    # Load model
    try:
        model = joblib.load(model_path)
        logger.info(f"Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail=f"Could not load model: {e}")
    
    # Lấy ngày cuối cùng từ dữ liệu
    df = load_data()
    if df.empty:
        logger.error("No data available for prediction")
        raise HTTPException(status_code=500, detail="No data available")
    
    last_date = df['order_purchase_timestamp'].max()
    logger.info(f"Predicting {days} days from {last_date.strftime('%Y-%m-%d')}")
    
    # Tạo các ngày tương lai và date_ordinal tương ứng
    predictions = []
    for i in range(1, days + 1):
        future_date = last_date + pd.Timedelta(days=i)
        date_ordinal = future_date.toordinal()
        
        # Predict
        pred_value = model.predict([[date_ordinal]])[0]
        
        predictions.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "predicted_revenue": round(float(pred_value), 2)
        })
    
    return predictions

# Chạy server: uvicorn main.main:app --reload (từ thư mục gốc)
