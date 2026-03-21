from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import csv
import logging
from datetime import datetime
from a2wsgi import ASGIMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="BI Dashboard API (Olist) - Ultra Light Version")

# 1. Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KHAI BÁO SCHEMAS (Giữ nguyên 100% của Kỹ sư trưởng) ---
class RevenueItem(BaseModel):
    date: str
    revenue: float
    orders: Optional[int] = 0

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

CACHED_DATA = []
LAST_MODIFIED_TIME = 0

def get_data() -> list:
    """Load dữ liệu bằng Python thuần (DictReader) cực nhẹ, không dùng Pandas"""
    global CACHED_DATA, LAST_MODIFIED_TIME
    
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found: {csv_path}")
        return []

    current_modified_time = os.path.getmtime(csv_path)
    
    if not CACHED_DATA or current_modified_time > LAST_MODIFIED_TIME:
        logger.info("🔄 Đang Load/Reload dữ liệu CSV bằng Python thuần...")
        try:
            temp_data = []
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Rút gọn và chuẩn hóa dữ liệu ngay lúc đọc để tối ưu RAM
                    temp_data.append({
                        'order_id': row.get('order_id', ''),
                        'date': row.get('order_purchase_timestamp', '')[:10], # Lấy YYYY-MM-DD
                        'timestamp': row.get('order_purchase_timestamp', ''),
                        'payment_value': float(row.get('payment_value', 0) or 0),
                        'price': float(row.get('price', 0) or 0),
                        'product_id': row.get('product_id', ''),
                        'Category_VN': row.get('Category_VN', 'Khác'),
                        'customer_state': row.get('customer_state', ''),
                        'seller_id': row.get('seller_id', ''),
                        'payment_type': row.get('payment_type', 'unknown'),
                        'order_status': row.get('order_status', 'unknown')
                    })
            CACHED_DATA = temp_data
            LAST_MODIFIED_TIME = current_modified_time
            logger.info(f"✅ Đã tải xong {len(CACHED_DATA)} dòng dữ liệu vào RAM.")
        except Exception as e:
            logger.error(f"Error loading CSV: {e}")
            return []
            
    return CACHED_DATA

def filter_by_date(data: list, start_date: str = None, end_date: str = None) -> list:
    """Bộ lọc tốc độ ánh sáng bằng Python thuần"""
    if not start_date and not end_date:
        return data
        
    filtered = []
    # So sánh chuỗi ngày (YYYY-MM-DD) cực kỳ chuẩn xác và nhanh
    for row in data:
        if start_date and row['date'] < start_date[:10]:
            continue
        if end_date and row['date'] > end_date[:10]:
            continue
        filtered.append(row)
    return filtered

@app.on_event("startup")
async def startup_event():
    logger.info("=== Bắt đầu khởi động Server Backend (Bản siêu nhẹ) ===")
    get_data() 

# -----------------------------
# CÁC ENDPOINT API CHÍNH
# -----------------------------

@app.get("/")
def read_root():
    return {"message": "Olist BI Dashboard API is running siêu mượt (Zero Pandas)!"}

@app.get("/api/summary", response_model=SummaryData)
def get_summary(start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    if not data:
        return {"total_revenue": 0, "total_orders": 0, "growth_rate": 0, "aov": 0}

    total_revenue = sum(row['payment_value'] for row in data)
    unique_orders = set(row['order_id'] for row in data)
    total_orders = len(unique_orders)
    aov = total_revenue / total_orders if total_orders > 0 else 0

    # Tính Growth Rate theo tháng
    monthly_rev = {}
    for row in data:
        month = row['date'][:7] # Lấy YYYY-MM
        monthly_rev[month] = monthly_rev.get(month, 0) + row['payment_value']
    
    sorted_months = sorted(monthly_rev.keys())
    growth_rate = 0.0
    if len(sorted_months) >= 2:
        last_month = monthly_rev[sorted_months[-1]]
        prev_month = monthly_rev[sorted_months[-2]]
        if prev_month > 0:
            growth_rate = ((last_month - prev_month) / prev_month) * 100

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "growth_rate": round(growth_rate, 2),
        "aov": round(aov, 2)
    }

@app.get("/api/revenue/daily")
def get_daily_revenue(start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    daily_stats = {}
    for row in data:
        d = row['date']
        if d not in daily_stats:
            daily_stats[d] = {'revenue': 0, 'orders': set()}
        daily_stats[d]['revenue'] += row['payment_value']
        daily_stats[d]['orders'].add(row['order_id'])
        
    result = []
    for d in sorted(daily_stats.keys()):
        result.append({
            "date": d,
            "revenue": round(daily_stats[d]['revenue'], 2),
            "orders": len(daily_stats[d]['orders'])
        })
    return result

@app.get("/api/metadata/date-range")
def get_date_range():
    data = get_data()
    if not data:
        return {"min_date": "2017-01-01", "max_date": "2018-12-31"}
    
    dates = [row['date'] for row in data if row['date']]
    return {
        "min_date": min(dates),
        "max_date": max(dates)
    }

@app.get("/api/products/top", response_model=List[TopProductItem])
def get_top_products(limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    products = {}
    for row in data:
        pid = row['product_id']
        if pid not in products:
            products[pid] = {'cat': row['Category_VN'], 'rev': 0, 'orders': set()}
        products[pid]['rev'] += row['price']
        products[pid]['orders'].add(row['order_id'])
        
    # Format thành List
    result = []
    for pid, stats in products.items():
        result.append({
            "product_name": f"{stats['cat']} (#{pid[:6]})",
            "revenue": stats['rev'],
            "orders": len(stats['orders'])
        })
        
    # Sort và lấy top
    result = sorted(result, key=lambda x: x['revenue'], reverse=True)[:limit]
    for r in result: r['revenue'] = round(r['revenue'], 2)
    return result

@app.get("/api/price-correlation", response_model=List[PriceCorrelationItem])
def get_price_correlation(start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    tiers = {
        'Dưới 50 R$': {'rev': 0, 'orders': set()},
        '50 - 100 R$': {'rev': 0, 'orders': set()},
        '100 - 200 R$': {'rev': 0, 'orders': set()},
        '200 - 500 R$': {'rev': 0, 'orders': set()},
        'Trên 500 R$': {'rev': 0, 'orders': set()}
    }
    
    for row in data:
        p = row['price']
        oid = row['order_id']
        if p < 50: t = 'Dưới 50 R$'
        elif p < 100: t = '50 - 100 R$'
        elif p < 200: t = '100 - 200 R$'
        elif p < 500: t = '200 - 500 R$'
        else: t = 'Trên 500 R$'
        
        tiers[t]['rev'] += p
        tiers[t]['orders'].add(oid)
        
    result = []
    for k, v in tiers.items():
        if v['rev'] > 0:
            result.append({
                "price_range": k,
                "orders": len(v['orders']),
                "revenue": round(v['rev'], 2)
            })
    return result

@app.get("/api/charts/top-states", response_model=List[StateItem])
def get_sales_by_state(start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    states = {}
    for row in data:
        s = row['customer_state']
        if s not in states: states[s] = {'rev': 0, 'orders': set()}
        states[s]['rev'] += row['payment_value']
        states[s]['orders'].add(row['order_id'])
        
    result = [{"state": k, "revenue": round(v['rev'], 2), "orders": len(v['orders'])} 
              for k, v in states.items()]
    return sorted(result, key=lambda x: x['revenue'], reverse=True)

@app.get("/api/charts/shopping-behavior", response_model=List[HeatmapItem])
def get_shopping_behavior(start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    day_map = {0: 'Thứ 2', 1: 'Thứ 3', 2: 'Thứ 4', 3: 'Thứ 5', 4: 'Thứ 6', 5: 'Thứ 7', 6: 'Chủ Nhật'}
    heatmap = {}
    
    for row in data:
        try:
            # Parse datetime: '2018-08-08 10:00:00'
            dt = datetime.strptime(row['timestamp'][:19], '%Y-%m-%d %H:%M:%S')
            key = (day_map[dt.weekday()], dt.hour)
            if key not in heatmap: heatmap[key] = set()
            heatmap[key].add(row['order_id'])
        except:
            continue
            
    result = [{"weekday": k[0], "hour": k[1], "orders": len(v)} for k, v in heatmap.items()]
    return result

@app.get("/api/sellers/top", response_model=List[TopSellerItem])
def get_top_sellers(limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    sellers = {}
    for row in data:
        sid = row['seller_id']
        if not sid: continue
        if sid not in sellers: sellers[sid] = {'rev': 0, 'orders': set()}
        sellers[sid]['rev'] += row['price']
        sellers[sid]['orders'].add(row['order_id'])
        
    result = [{"seller_id": f"Seller #{k[:6]}", "revenue": round(v['rev'], 2), "orders": len(v['orders'])} 
              for k, v in sellers.items()]
    return sorted(result, key=lambda x: x['revenue'], reverse=True)[:limit]

@app.get("/api/charts/payment-methods")
def get_payment_methods(start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    pay_dict = {}
    for row in data:
        ptype = row['payment_type']
        pay_dict[ptype] = pay_dict.get(ptype, 0) + row['payment_value']
        
    translate = {"credit_card": "Thẻ tín dụng", "boleto": "Boleto (Hóa đơn)", 
                 "voucher": "Voucher", "debit_card": "Thẻ ghi nợ"}
                 
    result = [{"name": translate.get(k, str(k).capitalize()), "value": round(v, 2)} 
              for k, v in pay_dict.items() if v > 0]
    return sorted(result, key=lambda x: x['value'], reverse=True)

@app.get("/api/charts/order-status")
def get_order_status(start_date: Optional[str] = None, end_date: Optional[str] = None):
    # Đọc file mini siêu nhẹ do process_utils sinh ra
    status_path = os.path.join(project_root, 'data', 'live', 'order_status_summary.csv')
    
    if not os.path.exists(status_path):
        return [] # Nếu chưa có file thì trả về rỗng để Frontend không sập
        
    status_dict = {'Giao thành công': 0, 'Đang xử lý/Giao': 0, 'Hủy/Không hợp lệ': 0, 'Khác': 0}
    
    try:
        with open(status_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                d = row['date']
                # Chạy bộ lọc ngày tháng siêu tốc
                if start_date and d < start_date[:10]: continue
                if end_date and d > end_date[:10]: continue
                
                s = row['order_status']
                count = int(row['count'])
                
                if s == 'delivered': status_dict['Giao thành công'] += count
                elif s in ['shipped', 'processing', 'invoiced', 'approved']: status_dict['Đang xử lý/Giao'] += count
                elif s in ['canceled', 'unavailable']: status_dict['Hủy/Không hợp lệ'] += count
                else: status_dict['Khác'] += count
                
        return [{"name": k, "value": v} for k, v in status_dict.items() if v > 0]
    except Exception as e:
        logger.error(f"Lỗi đọc file trạng thái: {e}")
        return []

@app.get("/api/charts/price-tiers")
def get_price_tiers(start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = filter_by_date(get_data(), start_date, end_date)
    
    tiers = {'Giá rẻ (< 50 R$)': 0, 'Tầm trung (50 - 200 R$)': 0, 'Cao cấp (> 200 R$)': 0}
    for row in data:
        p = row['price']
        if p < 50: tiers['Giá rẻ (< 50 R$)'] += row['payment_value']
        elif p <= 200: tiers['Tầm trung (50 - 200 R$)'] += row['payment_value']
        else: tiers['Cao cấp (> 200 R$)'] += row['payment_value']
        
    return [{"tier": k, "revenue": round(v, 2)} for k, v in tiers.items() if v > 0]

@app.get("/api/customers/rfm", response_model=List[RFMSegmentItem])
def get_rfm_segments():
    rfm_path = os.path.join(project_root, 'data', 'live', 'customer_rfm.csv')
    if not os.path.exists(rfm_path): return []
    
    segments = {}
    try:
        with open(rfm_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            # Chuẩn hóa tên cột
            reader.fieldnames = [col.lower() for col in reader.fieldnames]
            for row in reader:
                seg = row.get('segment', 'Khác')
                if seg not in segments:
                    segments[seg] = {'count': 0, 'rev': 0, 'recency': []}
                segments[seg]['count'] += 1
                segments[seg]['rev'] += float(row.get('monetary', 0) or 0)
                segments[seg]['recency'].append(float(row.get('recency', 0) or 0))
                
        result = []
        for k, v in segments.items():
            avg_rec = sum(v['recency']) / len(v['recency']) if v['recency'] else 0
            result.append({
                "segment": k,
                "customer_count": v['count'],
                "total_revenue": round(v['rev'], 2),
                "avg_recency": round(avg_rec, 0)
            })
        return sorted(result, key=lambda x: x['segment'])
    except Exception as e:
        logger.error(f"Lỗi đọc RFM: {e}")
        return []

@app.get("/api/predict", response_model=List[PredictionItem])
def predict_revenue(days: int = 30, history_days: int = 30):
    if days not in [7, 14, 30]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ dự báo 7, 14, hoặc 30 ngày")
        
    predict_path = os.path.join(project_root, 'data', 'live', 'predictions.csv')
    if not os.path.exists(predict_path): return []
    
    history, future = [], []
    try:
        with open(predict_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                item = {
                    "date": row['date'],
                    "actual_revenue": float(row['actual_revenue']) if row.get('actual_revenue') else None,
                    "predicted_revenue": float(row['predicted_revenue'])
                }
                if item['actual_revenue'] is not None:
                    history.append(item)
                else:
                    future.append(item)
                    
        history = history[-history_days:]
        future = future[:days]
        return history + future
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.get("/api/predict/metrics")
def get_model_metrics():
    metrics_path = os.path.join(project_root, 'models', 'metrics.json')
    if not os.path.exists(metrics_path):
        return {"mae": 0, "mape": 0, "rmse": 0, "status": "File chưa tồn tại"}
    try:
        with open(metrics_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        return {"mae": 0, "mape": 0, "rmse": 0, "status": f"Lỗi: {e}"}

@app.get("/api/insights")
def get_business_insights(start_date: str = None, end_date: str = None):
    data = filter_by_date(get_data(), start_date, end_date)
    if not data: return []
    
    insights = []
    
    # 1. Sản phẩm chủ lực
    prods = {}
    states = {}
    for row in data:
        prods[row['product_id']] = prods.get(row['product_id'], 0) + row['payment_value']
        s = row['customer_state']
        if s not in states: states[s] = set()
        states[s].add(row['order_id'])
        
    if prods:
        top_p = max(prods.items(), key=lambda x: x[1])
        insights.append({
            "title": "Sản phẩm chủ lực",
            "description": f"Sản phẩm top 1 mang lại R$ {top_p[1]:,.2f} doanh thu trong kỳ này.",
            "type": "success"
        })
        
    if states:
        top_s = max(states.items(), key=lambda x: len(x[1]))
        insights.append({
            "title": "Khu vực sôi động nhất",
            "description": f"Bang {top_s[0]} đang dẫn đầu với {len(top_s[1])} đơn hàng.",
            "type": "info"
        })
        
    return insights

# Biến ứng dụng FastAPI thành chuẩn WSGI để PythonAnywhere có thể đọc được
wsgi_app = ASGIMiddleware(app)