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
import urllib.request
import clickhouse_connect

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="BI Dashboard API (Olist) - Lakehouse Version")

def get_ch_client():
    return clickhouse_connect.get_client(
        host=os.getenv('CH_HOST', 'g6u2lns963.asia-southeast1.gcp.clickhouse.cloud'),
        port=int(os.getenv('CH_PORT', '8443')),
        username=os.getenv('CH_USER', 'default'),
        password=os.getenv('CH_PASSWORD', 're0p~~Ii1mVXS'),
        secure=True
    )

def build_where(start_date: str, end_date: str, category: str) -> str:
    conds = []
    if start_date: conds.append(f"toDate(order_purchase_timestamp) >= '{start_date[:10]}'")
    if end_date: conds.append(f"toDate(order_purchase_timestamp) <= '{end_date[:10]}'")
    if category and category != "all": conds.append(f"Category_VN = '{category}'")
    return "WHERE " + " AND ".join(conds) if conds else ""

# 1. Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KHAI BÁO SCHEMAS CHUẨN CỦA SẾP ---
class RevenueItem(BaseModel):
    date: str; revenue: float; orders: Optional[int] = 0
class SummaryData(BaseModel):
    total_revenue: float; total_orders: int; growth_rate: float; aov: float = 0.0
class PredictionItem(BaseModel):
    date: str; actual_revenue: Optional[float] = None; predicted_revenue: float
class TopProductItem(BaseModel):
    product_name: str; revenue: float; orders: int
class StateItem(BaseModel):
    state: str; revenue: float; orders: int
class PriceCorrelationItem(BaseModel):
    price_range: str; orders: int; revenue: float
class HeatmapItem(BaseModel):
    weekday: str; hour: int; orders: int
class TopSellerItem(BaseModel):
    seller_id: str; revenue: float; orders: int
class RFMSegmentItem(BaseModel):
    segment: str; customer_count: int; total_revenue: float; avg_recency: float
class ChatMessage(BaseModel):
    message: str; api_key: Optional[str] = None; currency: Optional[str] = "BRL"
    start_date: Optional[str] = None; end_date: Optional[str] = None; category: Optional[str] = None

# --- ĐƯỜNG DẪN PROJECT ---
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)

@app.on_event("startup")
async def startup_event():
    logger.info("=== Bắt đầu khởi động Server Backend (Bản siêu tốc ClickHouse) ===")
    try:
        client = get_ch_client()
        client.command("SELECT 1")
        logger.info("✅ Kết nối tới ClickHouse Local thành công mĩ mãn!")
    except Exception as e:
        logger.error(f"❌ Không thể kết nối tới ClickHouse: {e}")

# =========================================================
# PHẦN 1: CÁC API PHÂN TÍCH SIÊU TỐC BẰNG CLICKHOUSE
# =========================================================

@app.get("/api/summary", response_model=SummaryData)
def get_summary(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    where_clause = build_where(start_date, end_date, category)
    
    query_total = f"SELECT sum(payment_value), count(DISTINCT order_id) FROM olist_flat_analytics {where_clause}"
    res_total = client.query(query_total).result_rows[0]
    total_rev = float(res_total[0] or 0)
    total_ord = int(res_total[1] or 0)
    aov = total_rev / total_ord if total_ord > 0 else 0

    query_growth = f"SELECT toYYYYMM(order_purchase_timestamp) as m, sum(payment_value) FROM olist_flat_analytics {where_clause} GROUP BY m ORDER BY m"
    res_growth = client.query(query_growth).result_rows
    growth_rate = 0.0
    if len(res_growth) >= 2:
        growth_rate = ((float(res_growth[-1][1]) - float(res_growth[-2][1])) / float(res_growth[-2][1])) * 100

    return {"total_revenue": round(total_rev, 2), "total_orders": total_ord, "growth_rate": round(growth_rate, 2), "aov": round(aov, 2)}

@app.get("/api/revenue/daily", response_model=List[RevenueItem])
def get_daily_revenue(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    where = build_where(start_date, end_date, category)
    query = f"SELECT toString(toDate(order_purchase_timestamp)) as d, sum(payment_value), count(DISTINCT order_id) FROM olist_flat_analytics {where} GROUP BY d ORDER BY d"
    return [{"date": r[0], "revenue": round(float(r[1]), 2), "orders": int(r[2])} for r in client.query(query).result_rows]

@app.get("/api/metadata/date-range")
def get_date_range():
    client = get_ch_client()
    query = "SELECT toString(min(toDate(order_purchase_timestamp))), toString(max(toDate(order_purchase_timestamp))) FROM olist_flat_analytics"
    res = client.query(query).result_rows[0]
    return {"min_date": res[0] or "2017-01-01", "max_date": res[1] or "2018-12-31"}

@app.get("/api/products/top", response_model=List[TopProductItem])
def get_top_products(limit: int = 7, start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    where = build_where(start_date, end_date, category)
    query = f"SELECT concat(Category_VN, ' (#', substring(product_id, 1, 6), ')'), sum(price), count(DISTINCT order_id) FROM olist_flat_analytics {where} GROUP BY product_id, Category_VN ORDER BY sum(price) DESC LIMIT {limit}"
    return [{"product_name": r[0], "revenue": round(float(r[1]), 2), "orders": int(r[2])} for r in client.query(query).result_rows]

@app.get("/api/charts/top-states", response_model=List[StateItem])
def get_sales_by_state(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    query = f"SELECT customer_state, sum(payment_value), count(DISTINCT order_id) FROM olist_flat_analytics {build_where(start_date, end_date, category)} GROUP BY customer_state ORDER BY sum(payment_value) DESC"
    return [{"state": r[0], "revenue": round(float(r[1]), 2), "orders": int(r[2])} for r in client.query(query).result_rows]

@app.get("/api/charts/shopping-behavior", response_model=List[HeatmapItem])
def get_shopping_behavior(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    query = f"""
        SELECT 
            multiIf(toDayOfWeek(order_purchase_timestamp)==1,'Thứ 2', toDayOfWeek(order_purchase_timestamp)==2,'Thứ 3', toDayOfWeek(order_purchase_timestamp)==3,'Thứ 4', toDayOfWeek(order_purchase_timestamp)==4,'Thứ 5', toDayOfWeek(order_purchase_timestamp)==5,'Thứ 6', toDayOfWeek(order_purchase_timestamp)==6,'Thứ 7', 'Chủ Nhật'),
            toHour(order_purchase_timestamp), count(DISTINCT order_id)
        FROM olist_flat_analytics {build_where(start_date, end_date, category)}
        GROUP BY toDayOfWeek(order_purchase_timestamp), toHour(order_purchase_timestamp)
    """
    return [{"weekday": r[0], "hour": int(r[1]), "orders": int(r[2])} for r in client.query(query).result_rows]

@app.get("/api/charts/payment-methods")
def get_payment_methods(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    query = f"SELECT payment_type, sum(payment_value) FROM olist_flat_analytics {build_where(start_date, end_date, category)} GROUP BY payment_type ORDER BY sum(payment_value) DESC"
    translate = {"credit_card": "Thẻ tín dụng", "boleto": "Boleto", "voucher": "Voucher", "debit_card": "Thẻ ghi nợ"}
    return [{"name": translate.get(r[0], str(r[0]).capitalize()), "value": round(float(r[1]), 2)} for r in client.query(query).result_rows if float(r[1]) > 0]

@app.get("/api/charts/price-tiers")
def get_price_tiers(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    query = f"""
        SELECT multiIf(price < 50, 'Giá rẻ (< 50 R$)', price <= 200, 'Tầm trung (50 - 200 R$)', 'Cao cấp (> 200 R$)') as tier, sum(payment_value)
        FROM olist_flat_analytics {build_where(start_date, end_date, category)} GROUP BY tier
    """
    return [{"tier": r[0], "revenue": round(float(r[1]), 2)} for r in client.query(query).result_rows if float(r[1]) > 0]

@app.get("/api/metadata/filters")
def get_filters_metadata():
    client = get_ch_client()
    query = "SELECT DISTINCT Category_VN FROM olist_flat_analytics WHERE Category_VN != '' ORDER BY Category_VN"
    return {"categories": [r[0] for r in client.query(query).result_rows]}

@app.get("/api/sellers/top", response_model=List[TopSellerItem])
def get_top_sellers(limit: int = 10, start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    where = build_where(start_date, end_date, category)
    
    query = f"""
        SELECT 
            seller_id, 
            sum(payment_value) as revenue, 
            count(DISTINCT order_id) as orders
        FROM olist_flat_analytics 
        {where} 
        GROUP BY seller_id 
        ORDER BY revenue DESC 
        LIMIT {limit}
    """
    rows = client.query(query).result_rows
    return [{"seller_id": r[0], "revenue": round(float(r[1]), 2), "orders": int(r[2])} for r in rows]

@app.get("/api/charts/price-correlation", response_model=List[PriceCorrelationItem])
def get_price_correlation(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    client = get_ch_client()
    where = build_where(start_date, end_date, category)
    
    # Gom nhóm theo phân khúc giá siêu nhanh bằng lệnh multiIf
    query = f"""
        SELECT 
            multiIf(price < 50, '1. Rất rẻ (< 50)', price <= 100, '2. Rẻ (50-100)', price <= 200, '3. Trung bình (100-200)', '4. Cao cấp (> 200)') as price_range,
            count(DISTINCT order_id) as orders,
            sum(payment_value) as revenue
        FROM olist_flat_analytics 
        {where} 
        GROUP BY price_range 
        ORDER BY price_range
    """
    rows = client.query(query).result_rows
    return [{"price_range": r[0], "orders": int(r[1]), "revenue": round(float(r[2]), 2)} for r in rows]

# =========================================================
# PHẦN 2: CÁC API ĐỌC FILE LẠI TỪ MÔ HÌNH AI & ETL
# =========================================================

@app.get("/api/charts/order-status")
def get_order_status(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    # Trả lại cơ chế đọc file tổng hợp thô để đếm chính xác đơn Hủy (chưa qua ETL)
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

@app.get("/api/customers/rfm", response_model=List[RFMSegmentItem])
def get_rfm_segments():
    # Giữ nguyên đọc CSV cho RFM vì đây là kết quả của model chạy độc lập
    rfm_path = os.path.join(project_root, 'data', 'live', 'customer_rfm.csv')
    if not os.path.exists(rfm_path): return []
    segments = {}
    with open(rfm_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [col.lower() for col in reader.fieldnames]
        for row in reader:
            seg = row.get('segment', 'Khác')
            if seg not in segments: segments[seg] = {'count': 0, 'rev': 0, 'recency': []}
            segments[seg]['count'] += 1
            segments[seg]['rev'] += float(row.get('monetary', 0) or 0)
            segments[seg]['recency'].append(float(row.get('recency', 0) or 0))
            
    result = []
    for k, v in segments.items():
        result.append({"segment": k, "customer_count": v['count'], "total_revenue": round(v['rev'], 2), "avg_recency": round(sum(v['recency']) / len(v['recency']), 0) if v['recency'] else 0})
    return sorted(result, key=lambda x: x['segment'])

@app.get("/api/charts/top-categories")
def get_top_categories(start_date: Optional[str] = None, end_date: Optional[str] = None, category: str = "all"):
    try:
        client = get_ch_client()
        where = build_where(start_date, end_date, category)
        
        query = f"""
            SELECT 
                Category_VN, 
                sum(payment_value) as val
            FROM olist_flat_analytics 
            {where} 
            GROUP BY Category_VN 
            ORDER BY val DESC 
            LIMIT 7
        """
        rows = client.query(query).result_rows
        # Trả về đúng key 'name' và 'value' như code gốc của sếp
        return [{"name": str(r[0]) if r[0] else "Khác", "value": round(float(r[1]), 2)} for r in rows]
    except Exception as e:
        logger.error(f"Lỗi API Top Categories: {e}")
        return []

@app.get("/api/predict", response_model=List[PredictionItem])
def predict_revenue(days: int = 30, history_days: int = 30):
    predict_path = os.path.join(project_root, 'data', 'live', 'predictions.csv')
    if not os.path.exists(predict_path): return []
    history, future = [], []
    with open(predict_path, mode='r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            item = {"date": row['date'], "actual_revenue": float(row['actual_revenue']) if row.get('actual_revenue') else None, "predicted_revenue": float(row['predicted_revenue'])}
            if item['actual_revenue'] is not None: history.append(item)
            else: future.append(item)
    return history[-history_days:] + future[:days]

@app.get("/api/predict/metrics")
def get_model_metrics():
    metrics_path = os.path.join(project_root, 'models', 'metrics.json')
    if not os.path.exists(metrics_path): return {"mae": 0, "mape": 0, "rmse": 0, "status": "File chưa tồn tại"}
    with open(metrics_path, 'r') as f: return json.load(f)

@app.get("/api/insights")
def get_business_insights(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    category: str = "all",
    aov_target: float = Query(120.0)
):
    try:
        client = get_ch_client()
        where = build_where(start_date, end_date, category)
        insights = []

        # 1. Sản phẩm chủ lực
        query_prod = f"SELECT product_id, sum(payment_value) as rev FROM olist_flat_analytics {where} GROUP BY product_id ORDER BY rev DESC LIMIT 1"
        res_prod = client.query(query_prod).result_rows
        if res_prod:
            insights.append({
                "title": "Sản phẩm chủ lực",
                "description": f"Sản phẩm top 1 mang lại R$ {res_prod[0][1]:,.0f} doanh thu trong kỳ. Hãy đảm bảo luôn sẵn hàng trong kho.",
                "type": "success"
            })

        # 2. Khu vực sôi động nhất
        query_state = f"SELECT customer_state, count(DISTINCT order_id) as orders FROM olist_flat_analytics {where} GROUP BY customer_state ORDER BY orders DESC LIMIT 1"
        res_state = client.query(query_state).result_rows
        if res_state:
            insights.append({
                "title": "Khu vực sôi động nhất",
                "description": f"Bang {res_state[0][0]} đang dẫn đầu với {res_state[0][1]} đơn hàng. Cân nhắc đẩy mạnh quảng cáo tại đây.",
                "type": "info"
            })

        # 3. Kênh thanh toán ưu chuộng
        query_pay = f"SELECT payment_type, sum(payment_value) as rev FROM olist_flat_analytics {where} GROUP BY payment_type ORDER BY rev DESC LIMIT 1"
        res_pay = client.query(query_pay).result_rows
        if res_pay:
            ptype = res_pay[0][0]
            translate = {"credit_card": "Thẻ tín dụng", "boleto": "Boleto", "voucher": "Voucher", "debit_card": "Thẻ ghi nợ"}
            pay_name = translate.get(ptype, str(ptype).capitalize())
            insights.append({
                "title": "Kênh thanh toán ưu chuộng",
                "description": f"Khách hàng dùng {pay_name} nhiều nhất (R$ {res_pay[0][1]:,.0f}). Có thể kết hợp ngân hàng làm chương trình hoàn tiền.",
                "type": "info"
            })

        # 4. AOV & Cảnh báo Upsell
        query_total = f"SELECT sum(payment_value), count(DISTINCT order_id) FROM olist_flat_analytics {where}"
        res_total = client.query(query_total).result_rows
        if res_total and int(res_total[0][1]) > 0:
            aov = float(res_total[0][0]) / int(res_total[0][1])
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
    except Exception as e:
        logger.error(f"Lỗi API Insights: {e}")
        return []

# =========================================================
# PHẦN 3: "BỘ NÃO" GROQ AI COPILOT ĐƯỢC GIỮ NGUYÊN VẸN
# =========================================================

@app.post("/api/chat")
async def chat_with_ai(req: ChatMessage):
    try:
        raw_key = req.api_key or os.getenv("GROQ_API_KEY")
        if not raw_key: return {"reply": "Lỗi: Sếp chưa cấu hình API Key ở trang Cài đặt!", "action": "NONE"}
        key_to_use = raw_key.strip()

        user_currency = req.currency or "BRL"
        rate = 0.2 if user_currency == "USD" else (5000 if user_currency == "VND" else 1.0)
        symbol = "$" if user_currency == "USD" else ("VNĐ" if user_currency == "VND" else "R$")

        # Lấy số liệu chớp nhoáng từ ClickHouse để mớm cho AI
        summary = get_summary(start_date=req.start_date, end_date=req.end_date, category=req.category)
        top_products = get_top_products(limit=3, start_date=req.start_date, end_date=req.end_date, category=req.category)
        prod_text = ", ".join([f"{p['product_name']}" for p in top_products]) if top_products else "Không có dữ liệu"

        ai_total_rev = summary.get('total_revenue', 0) * rate
        ai_aov = summary.get('aov', 0) * rate
        current_time_range = f"Từ {req.start_date} đến {req.end_date}" if req.start_date else "Toàn thời gian"
        
        rfm_text = "Chưa có dữ liệu"
        try:
            rfm_data = get_rfm_segments() 
            if rfm_data:
                rfm_text = " | ".join([f"Nhóm '{item['segment']}': {item['customer_count']:,} người (Doanh thu: {item['total_revenue']*rate:,.0f} {symbol})" for item in rfm_data])
        except Exception: pass

        if req.message == "[INIT_ALERT]":
            return {"reply": f"🚨 **Báo cáo nhanh hệ thống:**\nDoanh thu hiện tại đang đạt **{ai_total_rev:,.0f} {symbol}**. Danh mục **{top_products[0]['product_name'] if top_products else 'N/A'}** đang dẫn đầu mảng Sales. Sếp cần tôi phân tích, vẽ biểu đồ hay so sánh gì hôm nay không?", "action": "NONE"}

        system_prompt = f"""
        Bạn là Trợ lý AI Phân tích Dữ liệu (Senior BI Copilot) cấp cao của hệ thống Olist E-commerce.
        
        [DỮ LIỆU ĐANG HIỂN THỊ TRÊN MÀN HÌNH ({current_time_range}) - Đơn vị: {user_currency}]
        - Tổng doanh thu: {ai_total_rev:,.0f} {symbol}
        - Tổng đơn hàng: {summary.get('total_orders', 0):,.0f} đơn
        - AOV (Giá trị trung bình đơn): {ai_aov:,.0f} {symbol}
        - Top sản phẩm bán chạy: {prod_text}
        - Dữ liệu khách hàng (RFM): {rfm_text}
        
        [THIẾT LUẬT GIAO TIẾP TỐI THƯỢNG - PHẢI TUÂN THỦ 100%]
        1. NẾU sếp ra lệnh LỌC/TÌM KIẾM/ĐỔI THỜI GIAN: BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỌC SỐ LIỆU BÊN TRÊN CHO SẾP. CHỈ ĐƯỢC trả lời: "Tôi đã cập nhật bảng điều khiển theo yêu cầu...".
        2. NẾU sếp CHỈ HỎI số liệu hiện tại: Bạn mới được phép dùng [DỮ LIỆU ĐANG HIỂN THỊ...] để phân tích.
        3. Xưng "tôi", gọi người dùng là "sếp". 
        
        NHIỆM VỤ: Phân tích câu hỏi và TRẢ VỀ DUY NHẤT 1 CHUỖI JSON CHUẨN:
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
            
            intent, reply_text = ai_json.get("intent", "chat"), ai_json.get("reply", "Đã rõ thưa sếp.")
            start_d, end_d, metric = ai_json.get("start_date"), ai_json.get("end_date"), ai_json.get("metric", "revenue")

            if intent == "export_pdf":
                return {"reply": "Sếp muốn xuất file PDF cho biểu đồ vừa vẽ, hay xuất toàn bộ màn hình Dashboard ạ?", "action": "ASK_PDF_OPTIONS"}
            elif intent == "update_filter":
                return {"reply": reply_text, "action": "UPDATE_FILTER", "filters": {"startDate": start_d, "endDate": end_d, "category": ai_json.get("category")}}
            elif intent == "compare":
                comp_start, comp_end = ai_json.get("compare_start"), ai_json.get("compare_end")
                p1_data = get_summary(start_date=start_d, end_date=end_d, category=ai_json.get("category"))
                p2_data = get_summary(start_date=comp_start, end_date=comp_end, category=ai_json.get("category"))
                v1 = (p1_data.get('total_revenue', 0) * rate) if metric == "revenue" else p1_data.get('total_orders', 0)
                v2 = (p2_data.get('total_revenue', 0) * rate) if metric == "revenue" else p2_data.get('total_orders', 0)
                l1, l2 = f"{start_d} đến {end_d}" if start_d else "Giai đoạn 1", f"{comp_start} đến {comp_end}" if comp_start else "Giai đoạn 2"
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
                    <script>new Chart(document.getElementById('myChart'), {{ type: 'bar', data: {{ labels: ['{l1}', '{l2}'], datasets: [{{ label: '{lbl_metric}', data: [{v1}, {v2}], backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'], borderRadius: 6 }}] }}, options: {{ responsive: true, maintainAspectRatio: false, plugins: {{ legend: {{ display: false }} }} }} }});</script>
                </body></html>
                """
                return {"reply": "Tôi đã tạo xong bảng so sánh. Sếp xem trên màn hình nhé!", "action": "OPEN_CHART", "html": chart_html}
            elif intent == "draw_chart":
                daily_data = get_daily_revenue(start_date=start_d, end_date=end_d)
                if not daily_data or len(daily_data) < 2: daily_data = get_daily_revenue()[-30:]
                labels = [d['date'] for d in daily_data]
                if metric == "orders":
                    values, label_text, color, bg_color = [d['orders'] for d in daily_data], "Số lượng đơn hàng", "rgba(16, 185, 129, 1)", "rgba(16, 185, 129, 0.2)"
                else:
                    values, label_text, color, bg_color = [round(d['revenue'] * rate, 2) for d in daily_data], f"Doanh thu ({symbol})", "rgba(147, 51, 234, 1)", "rgba(147, 51, 234, 0.2)"
                
                chart_html = f"""
                <!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head>
                <body style="background:transparent; margin:0; padding:15px; font-family:sans-serif; display:flex; flex-direction:column; height:100vh; box-sizing:border-box;">
                    <h3 style="color:#334155; margin:0 0 15px 0; font-size:15px;">Biểu đồ {label_text}</h3>
                    <div style="flex:1; min-height:0; position:relative; background: white; border-radius: 8px; padding: 5px;"><canvas id="myChart"></canvas></div>
                    <div style="margin-top:15px; padding:12px; background:#f8fafc; border-left:4px solid {color}; border-radius:4px;">
                        <strong style="color:{color}; font-size:13px;">🤖 AI Phân tích:</strong>
                        <p style="margin:5px 0 0 0; color:#334155; font-size:13px; line-height:1.4;">{reply_text}</p>
                    </div>
                    <script>new Chart(document.getElementById('myChart'), {{ type: 'line', data: {{ labels: {labels}, datasets: [{{ label: '{label_text}', data: {values}, borderColor: '{color}', backgroundColor: '{bg_color}', fill: true, tension: 0.4 }}] }}, options: {{ responsive: true, maintainAspectRatio: false }} }});</script>
                </body></html>
                """
                return {"reply": "Tôi đã vẽ xong biểu đồ theo yêu cầu của sếp!", "action": "OPEN_CHART", "html": chart_html}
            else:
                return {"reply": reply_text.replace("**", ""), "action": "NONE"}
    except Exception as e:
        return {"reply": f"Lỗi xử lý ngôn ngữ tự nhiên: {str(e)}", "action": "NONE"}

wsgi_app = ASGIMiddleware(app)