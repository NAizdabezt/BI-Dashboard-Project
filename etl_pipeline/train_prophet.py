import pandas as pd
import os
import joblib
from prophet import Prophet
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

LIVE_DATA_DIR = 'data/live'
CSV_PATH = os.path.join(LIVE_DATA_DIR, 'sales_dashboard.csv')
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'prophet_model.pkl')

def retrain_prophet_model():
    """Hàm đọc dữ liệu mới nhất và huấn luyện lại AI Prophet"""
    logging.info("🧠 Khởi động quá trình Retrain AI Prophet...")
    
    if not os.path.exists(CSV_PATH):
        logging.error("❌ Không tìm thấy file CSV để train.")
        return False

    try:
        # 1. Đọc dữ liệu mới nhất
        df = pd.read_csv(CSV_PATH)
        df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
        
        # 2. Gom nhóm tính tổng doanh thu theo ngày
        daily_revenue = df.groupby(df['order_purchase_timestamp'].dt.date)['payment_value'].sum().reset_index()
        daily_revenue.columns = ['ds', 'y'] # Đổi tên cột chuẩn theo yêu cầu của Prophet
        
        # Prophet yêu cầu ít nhất 2 điểm dữ liệu để có thể học
        if len(daily_revenue) < 2:
            logging.warning("⚠️ Dữ liệu chưa đủ 2 ngày, tạm thời bỏ qua bước train AI.")
            return False

        # 3. Khởi tạo và Train lại mô hình
        # Có thể thêm các tham số tối ưu (như seasonality) vào đây nếu cần
        model = Prophet(daily_seasonality=False, yearly_seasonality=True, weekly_seasonality=True)
        model.fit(daily_revenue)
        
        # 4. Lưu đè file .pkl mới
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        
        logging.info("✅ Đã xuất xưởng file prophet_model.pkl MỚI NHẤT thành công!")
        return True

    except Exception as e:
        logging.error(f"❌ Lỗi trong quá trình train AI: {e}")
        return False

# Cho phép chạy độc lập file này để test
if __name__ == "__main__":
    retrain_prophet_model()