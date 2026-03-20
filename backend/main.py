from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import pandas as pd
import os
import joblib
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="BI Dashboard API (Olist)")

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
    growth_rate: float
    aov: float = 0.0

class PredictionItem(BaseModel):
    date: str
    actual_revenue: Optional[float] = None
    predicted_revenue: float

class TopProductItem(BaseModel):
    product_name: str
    revenue: float
    orders: int

class StateItem(BaseModel):
    state: str
    revenue: float
    orders: int

class PriceCorrelationItem(BaseModel):
    price_range: str
    orders: int
    revenue: float

class HeatmapItem(BaseModel):
    weekday: str
    hour: int
    orders: int

class TopSellerItem(BaseModel):
    seller_id: str
    revenue: float
    orders: int

class RFMSegmentItem(BaseModel):
    segment: str
    customer_count: int
    total_revenue: float
    avg_recency: float

# --- CẤU HÌNH ĐƯỜNG DẪN & GLOBAL CACHE ---
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
csv_path = os.path.join(project_root, 'data', 'live', 'sales_dashboard.csv')
model_path = os.path.join(project_root, 'models', 'prophet_model.pkl')

CACHED_DF = None
LAST_MODIFIED_TIME = 0

def get_data() -> pd.DataFrame:
    """Load dữ liệu và cache trên RAM"""
    global CACHED_DF, LAST_MODIFIED_TIME
    
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found: {csv_path}")
        return pd.DataFrame()

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

def filter_by_date(df: pd.DataFrame, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Hàm Helper: Cắt dữ liệu theo ngày để dùng chung cho mọi API"""
    filtered_df = df.copy()
    if start_date:
        filtered_df = filtered_df[filtered_df['order_purchase_timestamp'] >= pd.to_datetime(start_date)]
    if end_date:
        # Cộng thêm 1 ngày trừ đi 1 giây để bao trọn trọn vẹn ngày end_date (vd: 23:59:59)
        end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
        filtered_df = filtered_df[filtered_df['order_purchase_timestamp'] <= end_dt]
    return filtered_df

@app.on_event("startup")
async def startup_event():
    logger.info("=== Bắt đầu khởi động Server Backend ===")
    get_data() 

# -----------------------------
# CÁC ENDPOINT API CHÍNH
# -----------------------------

@app.get("/")
def read_root():
    return {"message": "Olist BI Dashboard API is running mượt mà!"}

@app.get("/api/summary", response_model=SummaryData)
def get_summary(start_date: Optional[str] = None, end_date: Optional[str] = None):
    df = get_data()
    if df.empty:
        return {"total_revenue": 0, "total_orders": 0, "growth_rate": 0, "aov": 0}

    df = filter_by_date(df, start_date, end_date)

    total_revenue = df['payment_value'].sum().round(2)
    total_orders = int(df['order_id'].nunique())
    aov = float((total_revenue / total_orders).round(2)) if total_orders > 0 else 0.0

    # Tính Growth Rate theo tháng
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
        "growth_rate": growth_rate,
        "aov": aov
    }

@app.get("/api/revenue/daily", response_model=List[RevenueItem])
def get_daily_revenue(start_date: Optional[str] = None, end_date: Optional[str] = None):
    df = get_data()
    if df.empty: 
        return []
    
    # 1. Đảm bảo cột thời gian là kiểu Datetime để lọc và group chính xác
    df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
    
    # 2. Xử lý bộ lọc ngày (nếu có truyền vào từ Frontend)
    if start_date:
        # Chuyển string 'YYYY-MM-DD' sang datetime để so sánh
        start_dt = pd.to_datetime(start_date)
        df = df[df['order_purchase_timestamp'] >= start_dt]
    if end_date:
        end_dt = pd.to_datetime(end_date)
        df = df[df['order_purchase_timestamp'] <= end_dt]

    # 3. Groupby theo ngày
    daily_data = df.groupby(df['order_purchase_timestamp'].dt.date)['payment_value'].sum().reset_index()
    daily_data.columns = ['date', 'revenue']
    
    # 4. QUAN TRỌNG: Sắp xếp theo ngày tăng dần để biểu đồ đường không bị rối
    daily_data = daily_data.sort_values('date')
    
    # 5. Định dạng lại dữ liệu trước khi trả về
    daily_data['date'] = daily_data['date'].astype(str)
    daily_data['revenue'] = daily_data['revenue'].round(2)
    
    return daily_data.to_dict(orient='records')

@app.get("/api/metadata/date-range")
def get_date_range():
    try:
        df = get_data() # Hàm lấy dữ liệu của bạn
        if df.empty:
            return {"min_date": "2017-01-01", "max_date": "2018-12-31"} # Fallback an toàn
            
        df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
        
        # Tìm ngày nhỏ nhất và lớn nhất
        min_date = df['order_purchase_timestamp'].min().strftime("%Y-%m-%d")
        max_date = df['order_purchase_timestamp'].max().strftime("%Y-%m-%d")
        
        return {
            "min_date": min_date,
            "max_date": max_date
        }
    except Exception as e:
        return {"min_date": "2017-01-01", "max_date": "2018-12-31"}

@app.get("/api/products/top", response_model=List[TopProductItem])
def get_top_products(limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
    df = get_data()
    if df.empty: return []
    
    df = filter_by_date(df, start_date, end_date)
    
    top_products = df.groupby(['product_id', 'Category_VN']).agg({
        'price': 'sum',           
        'order_id': 'nunique'     
    }).reset_index()
    
    top_products = top_products.sort_values(by='price', ascending=False).head(limit)
    top_products['product_name'] = top_products['Category_VN'] + " (#" + top_products['product_id'].astype(str).str[:6] + ")"
    
    top_products = top_products[['product_name', 'price', 'order_id']]
    top_products.columns = ['product_name', 'revenue', 'orders']
    top_products['revenue'] = top_products['revenue'].round(2)
    
    return top_products.to_dict(orient='records')

@app.get("/api/price-correlation", response_model=List[PriceCorrelationItem])
def get_price_correlation(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """API MỚI: Phân tích tương quan giữa Phân khúc giá sản phẩm và Doanh thu"""
    df = get_data()
    if df.empty: return []
    
    df = filter_by_date(df, start_date, end_date)
    
    # Tạo các mốc chia phân khúc giá (Bins)
    bins = [0, 50, 100, 200, 500, float('inf')]
    labels = ['Dưới 50 R$', '50 - 100 R$', '100 - 200 R$', '200 - 500 R$', 'Trên 500 R$']
    
    # Phân loại từng sản phẩm vào đúng Rổ giá
    df['price_range'] = pd.cut(df['price'], bins=bins, labels=labels)
    
    # Gom nhóm theo Rổ giá, đếm số đơn hàng độc lập và tính tổng giá trị sản phẩm
    correlation_data = df.groupby('price_range', observed=True).agg({
        'order_id': 'nunique',
        'price': 'sum'
    }).reset_index()
    
    # Đổi tên và làm tròn cho đẹp chuẩn Schema
    correlation_data.columns = ['price_range', 'orders', 'revenue']
    correlation_data['revenue'] = correlation_data['revenue'].round(2)
    
    return correlation_data.to_dict(orient='records')

@app.get("/api/charts/top-states", response_model=List[StateItem])
def get_sales_by_state(start_date: Optional[str] = None, end_date: Optional[str] = None):
    df = get_data()
    if df.empty: return []
    
    df = filter_by_date(df, start_date, end_date)
    
    # Gom nhóm theo khu vực (Bang)
    state_data = df.groupby('customer_state').agg({
        'payment_value': 'sum',
        'order_id': 'nunique'
    }).reset_index()
    
    # Sắp xếp giảm dần theo doanh thu để vẽ biểu đồ cho đẹp
    state_data = state_data.sort_values(by='payment_value', ascending=False)
    state_data.columns = ['state', 'revenue', 'orders']
    state_data['revenue'] = state_data['revenue'].round(2)
    
    return state_data.to_dict(orient='records')

@app.get("/api/charts/shopping-behavior", response_model=List[HeatmapItem])
def get_shopping_behavior(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """API MỚI: Phân tích hành vi mua sắm theo Giờ và Thứ trong tuần"""
    df = get_data()
    if df.empty: return []
    
    df = filter_by_date(df, start_date, end_date)
    
    # Lấy ra Giờ và Thứ từ cột thời gian
    df['hour'] = df['order_purchase_timestamp'].dt.hour
    
    # Map tên Thứ sang Tiếng Việt cho giao diện thân thiện
    day_map = {
        'Monday': 'Thứ 2', 'Tuesday': 'Thứ 3', 'Wednesday': 'Thứ 4',
        'Thursday': 'Thứ 5', 'Friday': 'Thứ 6', 'Saturday': 'Thứ 7', 'Sunday': 'Chủ Nhật'
    }
    df['weekday'] = df['order_purchase_timestamp'].dt.day_name().map(day_map)
    
    # Gom nhóm theo Thứ và Giờ, đếm số lượng đơn hàng
    heatmap_data = df.groupby(['weekday', 'hour']).agg({
        'order_id': 'nunique'
    }).reset_index()
    
    heatmap_data.columns = ['weekday', 'hour', 'orders']
    
    return heatmap_data.to_dict(orient='records')

@app.get("/api/sellers/top", response_model=List[TopSellerItem])
def get_top_sellers(limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """API MỚI: Vinh danh Top Nhà bán hàng (Sellers) xuất sắc nhất"""
    df = get_data()
    if df.empty: return []
    
    df = filter_by_date(df, start_date, end_date)
    
    # Gom nhóm theo mã Seller
    # LƯU Ý: Phải dùng cột 'price' (như bài học Top Sản phẩm) để tránh nhân bản tiền
    top_sellers = df.groupby('seller_id').agg({
        'price': 'sum',
        'order_id': 'nunique'
    }).reset_index()
    
    # Sắp xếp giảm dần theo doanh thu
    top_sellers = top_sellers.sort_values(by='price', ascending=False).head(limit)
    
    # Cắt ngắn mã Seller ID (32 ký tự) thành 6 ký tự cho dễ nhìn trên UI
    top_sellers['seller_id'] = "Seller #" + top_sellers['seller_id'].astype(str).str[:6]
    
    top_sellers.columns = ['seller_id', 'revenue', 'orders']
    top_sellers['revenue'] = top_sellers['revenue'].round(2)
    
    return top_sellers.to_dict(orient='records')

@app.get("/api/charts/payment-methods")
def get_payment_methods():
    try:
        # Lấy dữ liệu từ hàm get_data() có sẵn của bạn
        df = get_data() 
        
        # Nếu file CSV của bạn có cột payment_type, nếu không hãy điều chỉnh tên cột cho đúng
        if 'payment_type' not in df.columns:
            # Code dự phòng nếu thiếu cột (Mock data)
            return [
                {"name": "Thẻ tín dụng", "value": 75000},
                {"name": "Boleto", "value": 20000},
                {"name": "Voucher", "value": 15000},
                {"name": "Thẻ ghi nợ", "value": 5000}
            ]
            
        pay_df = df.groupby('payment_type')['payment_value'].sum().reset_index()
        pay_df = pay_df.sort_values('payment_value', ascending=False)
        
        # Dịch sang tiếng Việt cho đẹp
        translate = {
            "credit_card": "Thẻ tín dụng",
            "boleto": "Boleto (Hóa đơn)",
            "voucher": "Voucher",
            "debit_card": "Thẻ ghi nợ"
        }
        
        result = []
        for _, row in pay_df.iterrows():
            ptype = row['payment_type']
            result.append({
                "name": translate.get(ptype, str(ptype).capitalize()),
                "value": round(row['payment_value'], 2)
            })
        return result
    except Exception as e:
        return []

@app.get("/api/charts/order-status")
def get_order_status():
    try:
        df = pd.read_csv(DATA_PATH) # Đổi DATA_PATH thành đường dẫn file gốc chứa đủ status
        
        # Đếm số lượng theo trạng thái
        status_counts = df['order_status'].value_counts().reset_index()
        status_counts.columns = ['status', 'count']
        
        # Gom nhóm và việt hóa cho gọn
        def map_status(s):
            if s == 'delivered': return 'Giao thành công'
            elif s in ['shipped', 'processing', 'invoiced', 'approved']: return 'Đang xử lý/Giao'
            elif s in ['canceled', 'unavailable']: return 'Hủy/Không hợp lệ'
            else: return 'Khác'
            
        status_counts['status_vi'] = status_counts['status'].apply(map_status)
        final_status = status_counts.groupby('status_vi')['count'].sum().reset_index()
        
        result = [{"name": row['status_vi'], "value": int(row['count'])} for _, row in final_status.iterrows()]
        return result
    except Exception as e:
        return [
            {"name": "Giao thành công", "value": 96478},
            {"name": "Hủy/Không hợp lệ", "value": 1234},
            {"name": "Đang xử lý/Giao", "value": 2105}
        ]

@app.get("/api/charts/price-tiers")
def get_price_tiers():
    try:
        df = get_data()
        
        # Chia khoảng giá (bins)
        bins = [0, 50, 200, float('inf')]
        labels = ['Giá rẻ (< 50 R$)', 'Tầm trung (50 - 200 R$)', 'Cao cấp (> 200 R$)']
        
        df['price_tier'] = pd.cut(df['price'], bins=bins, labels=labels)
        tier_revenue = df.groupby('price_tier')['payment_value'].sum().reset_index()
        
        result = [{"tier": str(row['price_tier']), "revenue": round(row['payment_value'], 2)} 
                  for _, row in tier_revenue.iterrows()]
        return result
    except Exception as e:
        # Mock data dự phòng
        return [
            {"tier": "Giá rẻ (< 50 R$)", "revenue": 1500000},
            {"tier": "Tầm trung (50 - 200 R$)", "revenue": 6500000},
            {"tier": "Cao cấp (> 200 R$)", "revenue": 8000000}
        ]

@app.get("/api/customers/rfm", response_model=List[RFMSegmentItem])
def get_rfm_segments():
    """API: Đọc Phân khúc RFM đã được tính toán sẵn từ Pipeline"""
    rfm_path = os.path.join(project_root, 'data', 'live', 'customer_rfm.csv')
    
    if not os.path.exists(rfm_path):
        return []
    
    # Đọc file CSV
    df_rfm = pd.read_csv(rfm_path)
    
    # Chuẩn hóa tên cột thành chữ thường (Segment -> segment)
    df_rfm.columns = [col.lower() for col in df_rfm.columns]
    
    if 'segment' not in df_rfm.columns:
        return []

    # API siêu nhẹ: Chỉ Groupby và tính toán tổng hợp
    rfm_summary = df_rfm.groupby('segment').agg({
        'customer_unique_id': 'count',
        'monetary': 'sum',
        'recency': 'mean'
    }).reset_index()
    
    rfm_summary.columns = ['segment', 'customer_count', 'total_revenue', 'avg_recency']
    rfm_summary['total_revenue'] = rfm_summary['total_revenue'].round(2)
    rfm_summary['avg_recency'] = rfm_summary['avg_recency'].round(0)
    
    rfm_summary = rfm_summary.sort_values(by='segment')
    
    return rfm_summary.to_dict(orient='records')

@app.get("/api/predict", response_model=List[PredictionItem])
def predict_revenue(days: int = 30, history_days: int = 30):
    """Giữ nguyên logic của AI Prophet"""
    try:
        if days not in [7, 14, 30]:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ dự báo 7, 14, hoặc 30 ngày")
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=500, detail="Chưa train mô hình AI. Thiếu file pkl.")
        
        logger.info("Loading Prophet model...")
        model = joblib.load(model_path)
        
        df = get_data()
        if df.empty:
            raise HTTPException(status_code=500, detail="Chưa có dữ liệu CSV")
        
        logger.info("Calculating daily actual revenue...")
        daily_actual = df.groupby(df['order_purchase_timestamp'].dt.date)['payment_value'].sum().reset_index()
        daily_actual.columns = ['ds', 'actual_revenue']
        daily_actual['ds'] = pd.to_datetime(daily_actual['ds'])
        
        logger.info(f"Predicting {days} days...")
        future_dates = model.make_future_dataframe(periods=days)
        forecast = model.predict(future_dates)
        
        forecast_clean = forecast[['ds', 'yhat']].copy()
        forecast_clean.rename(columns={'yhat': 'predicted_revenue'}, inplace=True)
        
        logger.info("Merging forecast with actual data...")
        merged_df = pd.merge(forecast_clean, daily_actual, on='ds', how='left')
        final_df = merged_df.tail(min(len(merged_df), history_days + days))  # Tránh lỗi nếu ít data
        
        predictions = []
        for _, row in final_df.iterrows():
            actual_val = None if pd.isna(row['actual_revenue']) else round(float(row['actual_revenue']), 2)
            pred_val = max(0, round(float(row['predicted_revenue']), 2))
            predictions.append({
                "date": row['ds'].strftime("%Y-%m-%d"),
                "actual_revenue": actual_val,
                "predicted_revenue": pred_val
            })
        
        logger.info(f"Returning {len(predictions)} predictions")
        return predictions
    
    except Exception as e:
        logger.error(f"Error in predict_revenue: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi dự báo: {str(e)}")

@app.get("/api/predict/metrics")
def get_model_metrics():
    """API trả về độ chính xác mô hình"""
    # Dùng đường dẫn tuyệt đối cho chắc ăn 100%
    metrics_path = os.path.join(project_root, 'models', 'metrics.json')
    
    if not os.path.exists(metrics_path):
        return {"mae": 0, "mape": 0, "rmse": 0, "status": "File chưa tồn tại"}
        
    try:
        with open(metrics_path, 'r') as f:
            data = json.load(f)
            return data
    except Exception as e:
        # In lỗi thật ra Terminal để mình còn biết mà sửa
        print(f"❌ Lỗi khi đọc file metrics: {e}") 
        return {"mae": 0, "mape": 0, "rmse": 0, "status": f"Lỗi: {e}"}
        
@app.get("/api/insights")
def get_business_insights(start_date: str = None, end_date: str = None):
    try:
        df = get_data()
        if df.empty: return []

        df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
        
        # Lọc dữ liệu theo ngày
        if start_date: df = df[df['order_purchase_timestamp'] >= start_date]
        if end_date: df = df[df['order_purchase_timestamp'] <= end_date]
        
        insights = []
        
        # 1. Cảnh báo về Sản phẩm (Ví dụ: Sản phẩm nào mang lại doanh thu cao nhất)
        top_product = df.groupby('product_id')['payment_value'].sum().sort_values(ascending=False)
        if not top_product.empty:
            insights.append({
                "title": "Sản phẩm chủ lực",
                "description": f"Sản phẩm top 1 mang lại R$ {top_product.iloc[0]:,.2f} doanh thu trong kỳ này.",
                "type": "success"
            })

        # 2. Cảnh báo về xu hướng đơn hàng theo Bang
        state_orders = df.groupby('customer_state')['order_id'].nunique().sort_values(ascending=False)
        if len(state_orders) > 0:
            top_state = state_orders.index[0]
            insights.append({
                "title": "Khu vực sôi động nhất",
                "description": f"Bang {top_state} đang dẫn đầu với {state_orders.iloc[0]} đơn hàng. Nên tập trung marketing vào đây.",
                "type": "info"
            })

        # (Bạn có thể thêm các rule cảnh báo sụt giảm doanh thu nếu muốn)

        return insights
    except Exception as e:
        return []
        
from a2wsgi import ASGIMiddleware
# Biến ứng dụng FastAPI thành chuẩn WSGI để PythonAnywhere có thể đọc được
wsgi_app = ASGIMiddleware(app)