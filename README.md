# 🛒 Olist E-commerce: Business Intelligence & AI Forecasting System

> **Hệ thống phân tích kinh doanh và dự báo doanh số bán hàng tự động dựa trên dữ liệu Olist.**

![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Analysis-orange)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automation-2088FF)
![Status](https://img.shields.io/badge/Status-In%20Progress-yellow)

## 📖 Giới thiệu (Overview)

Dự án này được xây dựng nhằm mục đích **mô phỏng quy trình Data Science thực tế** tại một công ty Thương mại điện tử. Hệ thống thực hiện thu thập dữ liệu tự động, xử lý làm sạch (ETL), phân tích trực quan hóa (BI Dashboard) và ứng dụng các mô hình AI để dự báo nhu cầu hàng hóa trong tương lai.

Điểm đặc biệt của dự án là cơ chế **"Time Travel Simulation"** (Giả lập thời gian), cho phép hệ thống tự động cập nhật dữ liệu theo từng ngày trong quá khứ để kiểm thử (Backtest) độ chính xác của mô hình dự báo.

## 🚀 Tính năng nổi bật (Key Features)

* **🔄 Automated ETL Pipeline:** Tự động tải, làm sạch và tích hợp dữ liệu từ 4 nguồn khác nhau (Orders, Items, Customers, Products).
* **🇻🇳 Localization:** Tự động dịch và chuẩn hóa danh mục sản phẩm từ tiếng Bồ Đào Nha sang tiếng Việt.
* **⏳ Time Travel Data Replay:** Cơ chế giả lập dòng thời gian thực, tự động cập nhật dữ liệu mới mỗi ngày (Incremental Loading) thông qua GitHub Actions.
* **🧠 Feature Engineering for AI:** Tự động tạo các biến đặc trưng nâng cao (Lag features, Rolling window, Holiday events) để huấn luyện mô hình.
* **📊 Future Dashboard:** (Đang phát triển) Hệ thống báo cáo trực quan và API dự báo thời gian thực.

## 📂 Cấu trúc dự án (Project Structure)

```text
BI-Dashboard-Project/
├── .github/workflows/      # Cấu hình GitHub Actions (Tự động hóa)
│   └── daily_update.yml    # Workflow chạy ETL hàng ngày lúc 7:00 AM
├── data/
│   ├── raw/                # Dữ liệu thô tải từ Kaggle (Không push lên Git)
│   └── live/               # Dữ liệu sạch đã qua xử lý (sales_dashboard.csv)
├── etl_pipeline/           # Mã nguồn xử lý dữ liệu (Data Engineering)
│   ├── process_utils.py    # Các hàm làm sạch, merge và dịch thuật
│   ├── translation_map.py  # Từ điển dịch danh mục sản phẩm
│   └── daily_replay.py     # Script chính điều khiển "Cỗ máy thời gian"
├── notebooks/              # Nơi nghiên cứu và phân tích (Data Science)
│   ├── 01_EDA_Overview.ipynb                # Khám phá dữ liệu & Biểu đồ cơ bản
│   ├── 02_Feature_Engineering_Dataset.ipynb # Tạo biến Lag & Chuẩn bị data train AI
│   └── ...
├── simulation_state.txt    # Lưu trạng thái ngày hiện tại của hệ thống giả lập
├── requirements.txt        # Danh sách các thư viện cần thiết
└── README.md               # Tài liệu hướng dẫn
```
## 🛠️ Cài đặt & Sử dụng (Installation & Usage)

**1. Yêu cầu tiên quyết**
* Python 3.9 trở lên
* Tài khoản Kaggle (để tải dữ liệu gốc)

**2. Cài đặt môi trường**

Clone dự án:
```bash
git clone [https://github.com/NAizdabezt/BI-Dashboard-Project.git](https://github.com/NAizdabezt/BI-Dashboard-Project.git)
cd BI-Dashboard-Project

# Cài đặt thư viện
pip install -r requirements.txt
```
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
* [ ] Phase 2: Data Science & AI
  * [x] Feature Engineering (Tạo biến Lag, Holiday...).
  * [x] EDA (Phân tích khám phá).
  * [x] Train các model: Linear Regression, Prophet, XGBoost.
  * [ ] Đánh giá model (Evaluation).
* [ ] Phase 3: Backend & Deployment
  * [ ] Xây dựng API với FastAPI.
  * [ ] Xây dựng Dashboard (Streamlit/PowerBI).
  
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
