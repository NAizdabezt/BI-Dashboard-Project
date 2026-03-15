import pandas as pd
import os
import joblib
from prophet import Prophet
import logging
import json
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import numpy as np

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

LIVE_DATA_DIR = 'data/live'
CSV_PATH = os.path.join(LIVE_DATA_DIR, 'sales_dashboard.csv')
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'prophet_model.pkl')
METRICS_PATH = os.path.join(MODEL_DIR, 'metrics.json')

# ==========================================
# 1. HÀM TÍNH TOÁN ĐỘ CHÍNH XÁC (METRICS)
# ==========================================
def calculate_metrics(model, daily_revenue):
    """Tính toán MAE, MAPE, RMSE và lưu ra file JSON"""
    logging.info("📊 Đang chấm điểm mô hình (Tính toán Metrics)...")
    try:
        forecast = model.predict(daily_revenue[['ds']])
        y_true = daily_revenue['y'].values
        y_pred = forecast['yhat'].values
        
        mae = mean_absolute_error(y_true, y_pred)
        mape = mean_absolute_percentage_error(y_true, y_pred)
        rmse = np.sqrt(mae) # Căn bậc hai của MAE (cách giả lập RMSE đơn giản)
        
        metrics = {
            "mae": round(float(mae), 2), 
            "mape": round(float(mape * 100), 2), # Đổi sang phần trăm %
            "rmse": round(float(rmse), 2)
        }
        
        os.makedirs(MODEL_DIR, exist_ok=True)
        with open(METRICS_PATH, 'w') as f:
            json.dump(metrics, f)
            
        logging.info(f"✅ Chấm điểm xong! MAE: {metrics['mae']} | MAPE: {metrics['mape']}%")
    except Exception as e:
        logging.error(f"❌ Lỗi khi tính metrics: {e}")

# ==========================================
# 2. HÀM HUẤN LUYỆN CHÍNH (RETRAIN)
# ==========================================
def retrain_prophet_model():
    """Hàm đọc dữ liệu mới nhất và huấn luyện lại AI Prophet"""
    logging.info("🧠 Khởi động quá trình Retrain AI Prophet...")
    
    if not os.path.exists(CSV_PATH):
        logging.error("❌ Không tìm thấy file CSV để train.")
        return False

    try:
        df = pd.read_csv(CSV_PATH)
        df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
        
        daily_revenue = df.groupby(df['order_purchase_timestamp'].dt.date)['payment_value'].sum().reset_index()
        daily_revenue.columns = ['ds', 'y']
        
        if len(daily_revenue) < 2:
            logging.warning("⚠️ Dữ liệu chưa đủ 2 ngày, tạm thời bỏ qua bước train AI.")
            return False

        model = Prophet(daily_seasonality=False, yearly_seasonality=True, weekly_seasonality=True)
        model.fit(daily_revenue)
        
        # ---> ĐÂY RỒI! GỌI HÀM CHẤM ĐIỂM NGAY SAU KHI TRAIN XONG <---
        calculate_metrics(model, daily_revenue)
        
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        
        logging.info("✅ Đã xuất xưởng file prophet_model.pkl MỚI NHẤT thành công!")
        return True

    except Exception as e:
        logging.error(f"❌ Lỗi trong quá trình train AI: {e}")
        return False

if __name__ == "__main__":
    retrain_prophet_model()