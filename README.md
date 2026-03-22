# 🛒 Olist E-commerce: Business Intelligence & AI Forecasting System

> **Hệ thống phân tích kinh doanh và dự báo doanh số bán hàng tự động dựa trên dữ liệu Olist.**

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automation-2088FF?logo=github-actions&logoColor=white)
![Deployment](https://img.shields.io/badge/Deployed_on-Vercel_%26_Render-success)

## 📖 Giới thiệu (Overview)

Dự án này được xây dựng nhằm mục đích **mô phỏng quy trình Data Science thực tế** tại một công ty Thương mại điện tử. Hệ thống thực hiện thu thập dữ liệu tự động, xử lý làm sạch (ETL), phân tích trực quan hóa (BI Dashboard) và ứng dụng các mô hình AI để dự báo nhu cầu hàng hóa trong tương lai.

Điểm đặc biệt của dự án là cơ chế **"Time Travel Simulation"** (Giả lập thời gian), cho phép hệ thống tự động cập nhật dữ liệu theo từng ngày trong quá khứ để kiểm thử (Backtest) độ chính xác của mô hình dự báo.

## 🚀 Tính năng nổi bật (Key Features)

* **🔄 Automated ETL Pipeline:** Tự động tải, làm sạch và tích hợp dữ liệu từ nhiều nguồn (Orders, Items, Customers, Payments) thông qua GitHub Actions.
* **⏳ Time Travel Data Replay:** Cơ chế giả lập dòng thời gian thực, tự động cập nhật dữ liệu mới mỗi ngày (Incremental Loading).
* **🧠 Smart AI Insights:** Tích hợp mô hình phân tích hành vi mua hàng. Trí tuệ nhân tạo tự động đọc dữ liệu và đưa ra lời khuyên chiến lược (Upsell, Marketing) dựa trên **Ngưỡng AOV Mục tiêu** do người dùng thiết lập theo thời gian thực.
* **🌐 Đa tiền tệ & Localization:** Hỗ trợ quy đổi tỷ giá trực tiếp trên giao diện (Real Brazil `R$`, Đô la Mỹ `$`, Việt Nam Đồng `₫`). Danh mục sản phẩm được chuẩn hóa từ tiếng Bồ Đào Nha sang tiếng Việt.
* **📱 Responsive Modern Dashboard:** Giao diện người dùng (UI/UX) cực kỳ hiện đại, hỗ trợ Dark/Light mode, Sidebar thông minh trượt mở trên Mobile, tối ưu hóa trải nghiệm đa nền tảng.

## 📂 Cấu trúc dự án (Project Structure)

```text
BI-Dashboard-Project/
├── .github/workflows/      # Cấu hình GitHub Actions (CI/CD & Cron jobs)
│   └── daily_update.yml    # Workflow chạy ETL hàng ngày
├── backend/                # ⚙️ API Server (FastAPI)
│   ├── main.py             # Entry point chứa các API endpoints (/api/insights, /api/system/clear-cache...)
│   └── data/live/          # Nơi chứa file CSV đã được làm sạch bởi ETL
├── frontend/               # 💻 Giao diện người dùng (Next.js 15 + React)
│   ├── app/                # App Router (Pages: Dashboard, Chi tiết, Cài đặt...)
│   ├── components/         # Các UI components (Charts, Sidebar, FilterBar...)
│   └── contexts/           # Global State Management (Currency, Filters)
├── etl_pipeline/           # 🔄 Mã nguồn xử lý dữ liệu (Data Engineering)
│   └── daily_replay.py     # Script chính điều khiển "Cỗ máy thời gian"
├── notebooks/              # 📊 Nơi nghiên cứu mô hình AI (Data Science)
│   └── ...                 # EDA, Feature Engineering, Training Models
├── simulation_state.txt    # Lưu trạng thái ngày hiện tại của hệ thống giả lập
└── README.md               # Tài liệu dự án
```
## 🛠️ Cài đặt & Sử dụng (Installation & Usage)

**1. Yêu cầu tiên quyết**
* Python 3.9+ (Dành cho Backend & ETL)
* Node.js v18+ (Dành cho Frontend)

**2. Cài đặt môi trường**

Clone dự án:
```bash
git clone [https://github.com/NAizdabezt/BI-Dashboard-Project.git](https://github.com/NAizdabezt/BI-Dashboard-Project.git)
cd BI-Dashboard-Project

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy server uvicorn
uvicorn backend.main:app --reload --port 8000
```
Khởi chạy giao diện Frontend (Next.js):
```bash
# Cài đặt thư viện Node
npm install

# Chạy server phát triển
npm run dev
```
_Dashboard sẽ hiển thị tại: http://localhost:3000_

**3. Cấu hình "Cỗ máy thời gian"**

Để bắt đầu giả lập từ một ngày trong quá khứ, hãy chỉnh sửa file **simulation_state.txt**:

```plaintext
2018-06-01
```
**4. Chạy Pipeline thủ công**
```bash
python etl_pipeline/daily_replay.py
```
_Hệ thống sẽ tải dữ liệu, xử lý và lưu kết quả vào data/live/sales_dashboard.csv tương ứng với ngày trong file cấu hình._

## 🗺️ Lộ trình phát triển (Roadmap)

* [x] Phase 1: Data Engineering 
  * [x] Xây dựng ETL Pipeline.
  * [x] Tích hợp GitHub Actions tự động hóa.
  * [x] Xử lý tiếng Việt và làm sạch dữ liệu.
* [x] Phase 2: Data Science & AI
  * [x] Feature Engineering (Tạo biến Lag, Holiday...).
  * [x] EDA (Phân tích khám phá).
  * [x] Train các model: Linear Regression, Prophet, XGBoost.
  * [x] Đánh giá model (Evaluation).
* [x] Phase 3: Backend & Deployment
  * [x] Xây dựng API với FastAPI.
  * [x] Xây dựng Dashboard (Streamlit/PowerBI).
  
## 👥 Thành viên nhóm (Team Members)
| Họ và Tên | Vai Trò |
|------------|----------|
| **Nguyễn Thị Hồng Thắm** | Trưởng nhóm | 
| **Hồ Thị Thanh Thảo** | Thành viên | 
| **Từ Nhật Anh** | Thành viên |
| **Nguyễn Trương Hiệp** | Thành viên |
| **Trần Thanh Thảo** | Thành viên |


## 🙏 Lời cảm ơn (Acknowledgments)
* Dữ liệu được cung cấp bởi Olist (Brazilian E-Commerce Public Dataset by Olist).
* Nền tảng Kaggle và GitHub Actions.
---
_Dự án môn học [Đồ án chuyên ngành] - GVHD: [Trần Đình Nghĩa]_
