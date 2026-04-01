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
from functools import lru_cache
import urllib.request
import urllib.error

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

# --- KHAI BÁO SCHEMAS ---
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

class ChatMessage(BaseModel):
    message: str
    api_key: Optional[str] = None
    currency: Optional[str] = "BRL"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    category: Optional[str] = None

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
            with open(csv_path, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Rút gọn và chuẩn hóa dữ liệu ngay lúc đọc để tối ưu RAM
                    temp_data.append({
                        'order_id': row.get('order_id', ''),
                        'date': row.get('order_purchase_timestamp', '')[:10],
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

def filter_data(data: list, start_date: str = None, end_date: str = None, category: str = "all") -> list:
    """Bộ lọc tốc độ ánh sáng bằng Python thuần hỗ trợ lọc cả Ngày và Danh mục"""
    if not start_date and not end_date and (not category or category == "all"):
        return data
        
    filtered = []
    for row in data:
        # 1. Lọc theo ngày
        if start_date and row['date'] < start_date[:10]:
            continue
        if end_date and row['date'] > end_date[:10]:
            continue
        # 2. Lọc theo danh mục
        if category and category != "all":
            if row.get('Category_VN') != category:
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
def get_summary(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    if not data:
        return {"total_revenue": 0, "total_orders": 0, "growth_rate": 0, "aov": 0}

    total_revenue = sum(row['payment_value'] for row in data)
    unique_orders = set(row['order_id'] for row in data)
    total_orders = len(unique_orders)
    aov = total_revenue / total_orders if total_orders > 0 else 0

    monthly_rev = {}
    for row in data:
        month = row['date'][:7] 
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
def get_daily_revenue(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
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
def get_top_products(limit: int = 7, start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
    products = {}
    for row in data:
        pid = row['product_id']
        if pid not in products:
            products[pid] = {'cat': row['Category_VN'], 'rev': 0, 'orders': set()}
        products[pid]['rev'] += row['price']
        products[pid]['orders'].add(row['order_id'])
        
    result = []
    for pid, stats in products.items():
        result.append({
            "product_name": f"{stats['cat']} (#{pid[:6]})",
            "revenue": stats['rev'],
            "orders": len(stats['orders'])
        })
        
    result = sorted(result, key=lambda x: x['revenue'], reverse=True)[:limit]
    for r in result: r['revenue'] = round(r['revenue'], 2)
    return result

@app.get("/api/price-correlation", response_model=List[PriceCorrelationItem])
def get_price_correlation(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
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
def get_sales_by_state(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
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
def get_shopping_behavior(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
    day_map = {0: 'Thứ 2', 1: 'Thứ 3', 2: 'Thứ 4', 3: 'Thứ 5', 4: 'Thứ 6', 5: 'Thứ 7', 6: 'Chủ Nhật'}
    heatmap = {}
    
    for row in data:
        try:
            dt = datetime.strptime(row['timestamp'][:19], '%Y-%m-%d %H:%M:%S')
            key = (day_map[dt.weekday()], dt.hour)
            if key not in heatmap: heatmap[key] = set()
            heatmap[key].add(row['order_id'])
        except:
            continue
            
    result = [{"weekday": k[0], "hour": k[1], "orders": len(v)} for k, v in heatmap.items()]
    return result

@app.get("/api/sellers/top", response_model=List[TopSellerItem])
def get_top_sellers(limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
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
def get_payment_methods(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
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
    status_path = os.path.join(project_root, 'data', 'live', 'order_status_summary.csv')
    
    if not os.path.exists(status_path):
        return [] 
        
    status_dict = {'Giao thành công': 0, 'Đang xử lý/Giao': 0, 'Hủy/Không hợp lệ': 0, 'Khác': 0}
    
    try:
        with open(status_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                d = row['date']
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
def get_price_tiers(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    
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
def get_business_insights(
    start_date: str = None, 
    end_date: str = None, 
    category: str = "all",
    aov_target: float = Query(120.0) 
):
    data = filter_data(get_data(), start_date, end_date, category)
    if not data: return []
    
    insights = []
    
    prods = {}
    states = {}
    payments = {}
    total_rev = 0
    unique_orders = set()
    
    for row in data:
        prods[row['product_id']] = prods.get(row['product_id'], 0) + row['payment_value']
        
        s = row['customer_state']
        if s not in states: states[s] = set()
        states[s].add(row['order_id'])
        
        ptype = row.get('payment_type', 'unknown')
        payments[ptype] = payments.get(ptype, 0) + row['payment_value']
        
        total_rev += row['payment_value']
        unique_orders.add(row['order_id'])
        
    if prods:
        top_p = max(prods.items(), key=lambda x: x[1])
        insights.append({
            "title": "Sản phẩm chủ lực",
            "description": f"Sản phẩm top 1 mang lại R$ {top_p[1]:,.0f} doanh thu trong kỳ. Hãy đảm bảo luôn sẵn hàng trong kho.",
            "type": "success"
        })
        
    if states:
        top_s = max(states.items(), key=lambda x: len(x[1]))
        insights.append({
            "title": "Khu vực sôi động nhất",
            "description": f"Bang {top_s[0]} đang dẫn đầu với {len(top_s[1])} đơn hàng. Cân nhắc đẩy mạnh quảng cáo tại đây.",
            "type": "info"
        })
        
    if payments:
        top_pay = max(payments.items(), key=lambda x: x[1])
        translate = {"credit_card": "Thẻ tín dụng", "boleto": "Boleto", "voucher": "Voucher", "debit_card": "Thẻ ghi nợ"}
        pay_name = translate.get(top_pay[0], top_pay[0].capitalize())
        insights.append({
            "title": "Kênh thanh toán ưu chuộng",
            "description": f"Khách hàng dùng {pay_name} nhiều nhất (R$ {top_pay[1]:,.0f}). Có thể kết hợp ngân hàng làm chương trình hoàn tiền.",
            "type": "info"
        })
        
    if unique_orders:
        aov = total_rev / len(unique_orders)
        
        if aov < aov_target: 
            insights.append({
                "title": "Cần chiến lược Upsell (Bán chéo)",
                "description": f"Giá trị trung bình mỗi đơn (R$ {aov:,.0f}) đang thấp hơn mục tiêu đề ra (R$ {aov_target:,.0f}). Nên tạo combo Mua 2 tặng 1 để kích cầu.",
                "type": "warning" 
            })
        else:
            insights.append({
                "title": "Hiệu suất đơn hàng cực tốt",
                "description": f"Giá trị trung bình mỗi đơn đạt R$ {aov:,.0f}, vượt mức kỳ vọng (R$ {aov_target:,.0f}). Khách hàng đang có xu hướng chi tiêu mạnh tay.",
                "type": "success"
            })
            
    return insights

@app.get("/api/charts/seller-performance")
def get_seller_performance(start_date: str = None, end_date: str = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    if not data: return []
    
    sellers = {}
    for row in data:
        sid = row.get('seller_id', 'Unknown')
        short_id = f"Seller {sid[:7].upper()}"
        sellers[short_id] = sellers.get(short_id, 0) + row.get('payment_value', 0)
        
    top_sellers = sorted(sellers.items(), key=lambda x: x[1], reverse=True)[:7]
    return [{"name": k, "value": v} for k, v in top_sellers]

@app.get("/api/charts/top-categories")
def get_top_categories(start_date: str = None, end_date: str = None, category: str = "all"):
    data = filter_data(get_data(), start_date, end_date, category)
    if not data: return []
    
    categories = {}
    for row in data:
        cat = row.get('Category_VN') 
        if not cat or str(cat).lower() == 'nan':
            cat = "Khác"
            
        try:
            val = float(row.get('payment_value', 0) or 0)
        except ValueError:
            val = 0
            
        categories[cat] = categories.get(cat, 0) + val
        
    top_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:7]
    return [{"name": str(k), "value": v} for k, v in top_cats]

@lru_cache(maxsize=1)
def get_cached_filters():
    logger.info("🚀 Đang đọc file CSV để lấy metadata bộ lọc danh mục...")
    categories = set()
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    sales_file = os.path.normpath(os.path.join(BASE_DIR, "..", "data", "live", "sales_dashboard.csv"))
    
    if os.path.exists(sales_file):
        with open(sales_file, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cat = row.get('Category_VN') 
                if cat and str(cat).strip() and str(cat).lower() != 'nan':
                    categories.add(str(cat))
    else:
        logger.warning(f"⚠️ Không tìm thấy: {sales_file}")

    logger.info(f"✅ Đã load thành công {len(categories)} danh mục!")
        
    return {
        "categories": sorted(list(categories))
    }      
    
@app.get("/api/metadata/filters")
def get_filters_metadata():
    return get_cached_filters()

@app.post("/api/system/clear-cache")
def clear_system_cache():
    global CACHED_DATA
    CACHED_DATA = [] # Reset lại bộ nhớ đệm dữ liệu chính
    
    # 👇 Điểm nâng cấp: Xóa luôn cache của bộ lọc danh mục
    get_cached_filters.cache_clear() 
    
    return {"status": "success", "message": "Bộ nhớ đệm đã được dọn dẹp. Dữ liệu sẽ được đọc lại ở lần tải tiếp theo."}

@app.get("/api/metadata/last-update")
def get_last_update():
    file_path = "data/live/sales_dashboard.csv" 
    
    if os.path.exists(file_path):
        mtime = os.path.getmtime(file_path)
        dt = datetime.fromtimestamp(mtime)
        return {"last_updated": dt.strftime("%d/%m/%Y %I:%M %p")}
    
    return {"last_updated": "Chưa có dữ liệu"}

@app.post("/api/chat")
async def chat_with_ai(req: ChatMessage):
    try:
        raw_key = req.api_key or os.getenv("GROQ_API_KEY")
        if not raw_key:
            return {"reply": "Lỗi: Sếp chưa cấu hình API Key ở trang Cài đặt!", "action": "NONE"}
        key_to_use = raw_key.strip()

        import urllib.request
        import json

        # 1. QUY ĐỔI TIỀN TỆ
        user_currency = req.currency or "BRL"
        rate = 1.0
        symbol = "R$"
        if user_currency == "USD":
            rate = 0.2  
            symbol = "$"
        elif user_currency == "VND":
            rate = 5000 
            symbol = "VNĐ"

        summary = get_summary(start_date=req.start_date, end_date=req.end_date, category=req.category)
        top_products = get_top_products(limit=3, start_date=req.start_date, end_date=req.end_date, category=req.category)
        
        prod_text = ", ".join([f"{p['product_name']}" for p in top_products]) if top_products else "Không có dữ liệu"

        ai_total_rev = summary.get('total_revenue', 0) * rate
        ai_aov = summary.get('aov', 0) * rate
        current_time_range = f"Từ {req.start_date} đến {req.end_date}" if req.start_date else "Toàn thời gian"
        
        # 🔥 Ý TƯỞNG 2: BÁO CÁO NHANH TỰ ĐỘNG KHỞI TẠO (SILENT ALERT) 🔥
        if req.message == "[INIT_ALERT]":
            return {
                "reply": f"🚨 **Báo cáo nhanh hệ thống:**\nDoanh thu hiện tại đang đạt **{ai_total_rev:,.0f} {symbol}**. Danh mục **{top_products[0]['product_name'] if top_products else 'N/A'}** đang dẫn đầu mảng Sales. Sếp cần tôi phân tích, vẽ biểu đồ hay so sánh gì hôm nay không?",
                "action": "NONE"
            }

        # 2. NÃO BỘ AI (SYSTEM PROMPT)
        system_prompt = f"""
        Bạn là Trợ lý AI Phân tích Dữ liệu (Senior BI Copilot) cấp cao của hệ thống Olist E-commerce.
        
        [DỮ LIỆU ĐANG HIỂN THỊ TRÊN MÀN HÌNH ({current_time_range}) - Đơn vị: {user_currency}]
        - Tổng doanh thu: {ai_total_rev:,.0f} {symbol}
        - Tổng đơn hàng: {summary.get('total_orders', 0):,.0f} đơn
        - AOV (Giá trị trung bình đơn): {ai_aov:,.0f} {symbol}
        - Top sản phẩm bán chạy: {prod_text}
        
        [THIẾT LUẬT GIAO TIẾP TỐI THƯỢNG - PHẢI TUÂN THỦ 100%]
        1. NẾU sếp ra lệnh LỌC/TÌM KIẾM/ĐỔI THỜI GIAN (VD: "Lọc quý 2", "Cho xem dữ liệu năm 2018", "Vẽ lại toàn bộ dashboard"): BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỌC SỐ LIỆU BÊN TRÊN CHO SẾP. Vì lúc này dữ liệu chưa kịp cập nhật. Bạn CHỈ ĐƯỢC trả lời: "Tôi đã cập nhật bảng điều khiển theo yêu cầu, sếp xem số liệu mới nhất trực tiếp trên màn hình nhé!".
        2. NẾU sếp CHỈ HỎI số liệu hiện tại (VD: "Doanh thu đang là bao nhiêu?"): Bạn mới được phép dùng [DỮ LIỆU ĐANG HIỂN THỊ...] để phân tích. KHÔNG BAO GIỜ bịa đặt số liệu.
        3. Xưng "tôi", gọi người dùng là "sếp". Trong câu trả lời luôn cố gắng đưa ra 1 "Insight" (nhận xét).
        
        [HƯỚNG DẪN XỬ LÝ LỆNH TỪ SẾP]
        1. Lệnh LỌC/VẼ LẠI DASHBOARD -> intent = "update_filter".
        2. Lệnh SO SÁNH (VD: "So sánh Q1 và Q2 năm 2018") -> intent = "compare". Tự bóc tách 2 khoảng thời gian start/end và compare_start/compare_end.
        3. Lệnh VẼ BIỂU ĐỒ MỚI (Vào Widget) -> intent = "draw_chart".
        4. Thời gian: Dịch ra định dạng YYYY-MM-DD (VD: "Quý 1 năm 2017" -> start_date: "2017-01-01", end_date: "2017-03-31").
        
        NHIỆM VỤ: Phân tích câu hỏi và TRẢ VỀ DUY NHẤT 1 CHUỖI JSON CHUẨN (Tuyệt đối không bọc bằng markdown):
        {{
            "intent": "chat" | "draw_chart" | "export_pdf" | "update_filter" | "compare",
            "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD",
            "compare_start": "YYYY-MM-DD", "compare_end": "YYYY-MM-DD",
            "category": "Tên danh mục (nếu không có để null)",
            "metric": "revenue" | "orders",
            "reply": "Câu trả lời tuân thủ đúng THIẾT LUẬT TỐI THƯỢNG ở trên."
        }}
        """
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {"model": "llama-3.1-8b-instant", "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": req.message}], "response_format": {"type": "json_object"}, "temperature": 0.1}
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {key_to_use}", "User-Agent": "Mozilla/5.0"}
        req_obj = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
        
        with urllib.request.urlopen(req_obj) as response:
            result = json.loads(response.read().decode())
            ai_json = json.loads(result["choices"][0]["message"]["content"])
            
            intent = ai_json.get("intent", "chat")
            reply_text = ai_json.get("reply", "Đã rõ thưa sếp.")
            start_d = ai_json.get("start_date")
            end_d = ai_json.get("end_date")
            category = ai_json.get("category")
            metric = ai_json.get("metric", "revenue")

            # 3. PHÂN PHỐI HÀNH ĐỘNG
            if intent == "export_pdf":
                return {
                    "reply": "Sếp muốn xuất file PDF cho biểu đồ vừa vẽ, hay xuất toàn bộ màn hình Dashboard ạ?",
                    "action": "ASK_PDF_OPTIONS"
                }
                
            elif intent == "update_filter":
                return {"reply": reply_text, "action": "UPDATE_FILTER", "filters": {"startDate": start_d, "endDate": end_d, "category": ai_json.get("category")}}
                
            # 🔥 Ý TƯỞNG 1: LOGIC SO SÁNH 2 GIAI ĐOẠN (BAR CHART) 🔥
            elif intent == "compare":
                comp_start = ai_json.get("compare_start")
                comp_end = ai_json.get("compare_end")
                p1_data = get_summary(start_date=start_d, end_date=end_d, category=ai_json.get("category"))
                p2_data = get_summary(start_date=comp_start, end_date=comp_end, category=ai_json.get("category"))

                v1 = (p1_data.get('total_revenue', 0) * rate) if metric == "revenue" else p1_data.get('total_orders', 0)
                v2 = (p2_data.get('total_revenue', 0) * rate) if metric == "revenue" else p2_data.get('total_orders', 0)
                l1 = f"{start_d} đến {end_d}" if start_d else "Giai đoạn 1"
                l2 = f"{comp_start} đến {comp_end}" if comp_start else "Giai đoạn 2"
                lbl_metric = f"Doanh thu ({symbol})" if metric == "revenue" else "Số đơn hàng"

                chart_html = f"""
                <!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head>
                <body style="background:transparent; padding:15px; font-family:sans-serif; display:flex; flex-direction:column; height:100vh; box-sizing:border-box;">
                    <h3 style="color:#334155; margin-top:0;">📊 Phân tích So sánh: {lbl_metric}</h3>
                    <div style="flex:1; position:relative;"><canvas id="myChart"></canvas></div>
                    <div style="margin-top:15px; padding:12px; background:#f8fafc; border-left:4px solid #10b981; border-radius:4px;">
                        <strong style="color:#10b981; font-size:13px;">🤖 AI Phân tích:</strong>
                        <p style="margin:5px 0 0 0; font-size:13px; line-height:1.4;">{reply_text}</p>
                    </div>
                    <script>
                        new Chart(document.getElementById('myChart'), {{
                            type: 'bar',
                            data: {{ labels: ['{l1}', '{l2}'], datasets: [{{ label: '{lbl_metric}', data: [{v1}, {v2}], backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'], borderRadius: 6 }}] }},
                            options: {{ responsive: true, maintainAspectRatio: false, plugins: {{ legend: {{ display: false }} }} }}
                        }});
                    </script>
                </body></html>
                """
                return {"reply": "Tôi đã tạo xong bảng so sánh. Sếp xem trên màn hình nhé!", "action": "OPEN_CHART", "html": chart_html}
            
            elif intent == "draw_chart":
                daily_data = get_daily_revenue(start_date=start_d, end_date=end_d)
                if not daily_data or len(daily_data) < 2:
                    daily_data = get_daily_revenue()[-30:]
                    
                labels = [d['date'] for d in daily_data]

                if metric == "orders":
                    values = [d['orders'] for d in daily_data]
                    label_text = "Số lượng đơn hàng"
                    chart_title = f"Biểu đồ Đơn Hàng {f'({start_d} đến {end_d})' if start_d else ''}"
                    color = "rgba(16, 185, 129, 1)" 
                    bg_color = "rgba(16, 185, 129, 0.2)"
                else:
                    values = [round(d['revenue'] * rate, 2) for d in daily_data]
                    label_text = f"Doanh thu ({symbol})"
                    chart_title = f"Biểu đồ Doanh Thu {f'({start_d} đến {end_d})' if start_d else ''}"
                    color = "rgba(147, 51, 234, 1)" 
                    bg_color = "rgba(147, 51, 234, 0.2)"
                
                import urllib.parse
                csv_header = f"Ngày;{label_text}"
                csv_rows = [f"{l};{v}" for l, v in zip(labels, values)]
                csv_content = csv_header + "\n" + "\n".join(csv_rows)
                csv_data_uri = "data:text/csv;charset=utf-8,%EF%BB%BF" + urllib.parse.quote(csv_content)
                
                chart_html = f"""
                <!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    .export-btn {{ padding: 4px 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; color: white; margin-left: 5px; transition: opacity 0.2s; text-decoration: none; display: inline-block; }}
                    .export-btn:hover {{ opacity: 0.8; }}
                    .btn-png {{ background-color: #3b82f6; }}
                    .btn-csv {{ background-color: #10b981; }}
                </style>
                </head>
                <body style="background:transparent; margin:0; padding:15px; font-family:sans-serif; display:flex; flex-direction:column; height:100vh; box-sizing:border-box;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <h3 style="color:#334155; margin:0; font-size:15px;">{chart_title}</h3>
                        <div>
                            <button class="export-btn btn-png" onclick="downloadPNG()">📸 Tải Ảnh</button>
                            <a href="{csv_data_uri}" download="AI_Data_Export.csv" class="export-btn btn-csv">📊 Tải Excel</a>
                        </div>
                    </div>

                    <div style="flex:1; min-height:0; position:relative; background: white; border-radius: 8px; padding: 5px;"><canvas id="myChart"></canvas></div>
                    
                    <div style="margin-top:15px; padding:12px; background:#f8fafc; border-left:4px solid {color}; border-radius:4px;">
                        <strong style="color:{color}; font-size:13px;">🤖 AI Phân tích:</strong>
                        <p style="margin:5px 0 0 0; color:#334155; font-size:13px; line-height:1.4;">{reply_text}</p>
                    </div>
                    
                    <script>
                        const ctx = document.getElementById('myChart');
                        const chart = new Chart(ctx, {{
                            type: 'line',
                            data: {{ labels: {labels}, datasets: [{{ label: '{label_text}', data: {values}, borderColor: '{color}', backgroundColor: '{bg_color}', fill: true, tension: 0.4 }}] }},
                            options: {{ responsive: true, maintainAspectRatio: false }}
                        }});

                        function downloadPNG() {{
                            const link = document.createElement('a');
                            link.download = 'AI_Chart.png';
                            link.href = chart.toBase64Image();
                            link.click();
                        }}
                    </script>
                </body></html>
                """
                return {"reply": f"Tôi đã vẽ xong. Sếp có thể bấm nút Tải Ảnh hoặc Tải Excel (CSV) ngay trên góc phải của biểu đồ nhé!", "action": "OPEN_CHART", "html": chart_html}

            else:
                return {"reply": reply_text.replace("**", ""), "action": "NONE"}
                
    except Exception as e:
        return {"reply": f"Lỗi xử lý ngôn ngữ tự nhiên: {str(e)}", "action": "NONE"}

# Biến ứng dụng FastAPI thành chuẩn WSGI để deploy Cloud dễ dàng
wsgi_app = ASGIMiddleware(app)