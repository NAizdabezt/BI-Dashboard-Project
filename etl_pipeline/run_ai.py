import os
import pandas as pd
import joblib
import logging

# Cấu hình log để dễ theo dõi khi chạy trên GitHub Actions
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_prediction():
    # 1. Khởi tạo đường dẫn (Tương tự main.py)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    csv_path = os.path.join(project_root, 'data', 'live', 'sales_dashboard.csv')
    model_path = os.path.join(project_root, 'models', 'prophet_model.pkl')
    output_path = os.path.join(project_root, 'data', 'live', 'predictions.csv')

    # Ta sẽ luôn dự báo sẵn mức tối đa là 30 ngày tương lai và lấy 30 ngày quá khứ
    days_to_predict = 30
    history_days = 30

    try:
        logger.info("Bắt đầu quy trình chạy AI Prophet...")
        
        # 2. Đọc dữ liệu gốc
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Không tìm thấy file data: {csv_path}")
        df = pd.read_csv(csv_path)
        
        # 3. Tính toán doanh thu thực tế theo ngày
        df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
        daily_actual = df.groupby(df['order_purchase_timestamp'].dt.date)['payment_value'].sum().reset_index()
        daily_actual.columns = ['ds', 'actual_revenue']
        daily_actual['ds'] = pd.to_datetime(daily_actual['ds'])

        # 4. Load mô hình và Dự báo
        logger.info("Đang Load mô hình và chạy dự báo...")
        model = joblib.load(model_path)
        future_dates = model.make_future_dataframe(periods=days_to_predict)
        forecast = model.predict(future_dates)
        
        forecast_clean = forecast[['ds', 'yhat']].copy()
        forecast_clean.rename(columns={'yhat': 'predicted_revenue'}, inplace=True)

        # 5. Gộp dữ liệu (Thực tế + Dự báo)
        merged_df = pd.merge(forecast_clean, daily_actual, on='ds', how='left')
        
        # Chỉ lấy khúc đuôi (30 ngày lịch sử + 30 ngày tương lai = 60 dòng)
        final_df = merged_df.tail(min(len(merged_df), history_days + days_to_predict)).copy()

        # 6. Chuẩn hóa dữ liệu cho đẹp để API đọc cho lẹ
        final_df['date'] = final_df['ds'].dt.strftime("%Y-%m-%d")
        final_df['actual_revenue'] = final_df['actual_revenue'].round(2)
        final_df['predicted_revenue'] = final_df['predicted_revenue'].apply(lambda x: max(0, round(x, 2)))

        # Giữ lại đúng 3 cột cần thiết
        output_df = final_df[['date', 'actual_revenue', 'predicted_revenue']]

        # 7. Lưu ra file CSV
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        output_df.to_csv(output_path, index=False)
        
        logger.info(f"✅ Đã lưu thành công file dự báo tại: {output_path}")

    except Exception as e:
        logger.error(f"❌ Lỗi trong quá trình AI chạy: {str(e)}")

if __name__ == "__main__":
    run_prediction()