"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// 👇 1. ĐÃ SỬA: Import thêm icon Key cho phần Cấu hình AI 👇
import { Settings, Moon, Sun, Monitor, DollarSign, BrainCircuit, Target, Database, RefreshCw, CheckCircle2, Key } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const { currency, setCurrency, formatMoney } = useCurrency()
  
  const [aovTarget, setAovTarget] = useState(120)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    setMounted(true)
    const savedAov = localStorage.getItem("app_aov_target")
    if (savedAov) setAovTarget(Number(savedAov))

    // 👇 3. ĐÃ THÊM: Tải API Key từ LocalStorage lên khi mở trang 👇
    const savedKey = localStorage.getItem("GROQ_API_KEY")
    if (savedKey) setApiKey(savedKey)
  }, [])

  const handleAovChange = (val: number) => {
    setAovTarget(val)
    localStorage.setItem("app_aov_target", val.toString())
  }

  // 👇 4. ĐÃ THÊM: Hàm lưu API Key vào trình duyệt 👇
  const handleSaveKey = () => {
    localStorage.setItem("GROQ_API_KEY", apiKey);
    alert("Đã lưu khóa API thành công!");
  }

  const handleSyncData = async () => {
    setIsSyncing(true)
    setSyncSuccess(false)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
      const response = await fetch(`${baseUrl}/api/system/clear-cache`, {
        method: 'POST', 
      })

      if (response.ok) {
        setSyncSuccess(true)
        setTimeout(() => setSyncSuccess(false), 3000)
      } else {
        alert("Lỗi: Không thể dọn dẹp bộ nhớ đệm trên Server!")
      }
    } catch (error) {
      console.error(error)
      alert("Lỗi mất kết nối đến Server Backend!")
    } finally {
      setIsSyncing(false)
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 flex flex-col min-h-screen max-w-5xl mx-auto w-full pb-10">
        
        {/* TIÊU ĐỀ TRANG */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <Settings className="h-6 w-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Cài đặt Hệ thống</h1>
            </div>
            <p className="text-sm md:text-base text-slate-500">Quản lý giao diện, tiền tệ và các tham số cho mô hình AI.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          
          {/* CỘT TRÁI */}
          <div className="md:col-span-7 space-y-6">
            
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950">
              <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-indigo-500" /> Chủ đề (Theme)
                </CardTitle>
                <CardDescription>Tùy chỉnh giao diện hiển thị của bảng điều khiển.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-semibold">Sáng</span>
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-semibold">Tối</span>
                  </button>
                  <button 
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="text-sm font-semibold">Hệ thống</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950">
              <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" /> Định dạng tiền tệ
                </CardTitle>
                <CardDescription>Chọn loại tiền tệ hiển thị trên các biểu đồ báo cáo.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    { id: "BRL", name: "Real Brazil (R$)", desc: "Tiền tệ gốc của bộ dữ liệu Olist" },
                    { id: "USD", name: "Đô la Mỹ ($)", desc: "Tỷ giá tham khảo: 1 R$ ≈ 0.20 USD" },
                    { id: "VND", name: "Việt Nam Đồng (₫)", desc: "Tỷ giá tham khảo: 1 R$ ≈ 5,000 VNĐ" }
                  ].map((curr) => (
                    <label key={curr.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${currency === curr.id ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
                      <div className="flex items-center h-5 mt-0.5">
                        <input 
                          type="radio" 
                          name="currency" 
                          value={curr.id} 
                          checked={currency === curr.id}
                          onChange={() => {
                            setCurrency(curr.id as "BRL" | "USD" | "VND");
                            // 🔥 ĐÂY LÀ DÒNG QUYẾT ĐỊNH 🔥
                            localStorage.setItem("currency", curr.id);
                          }}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${currency === curr.id ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{curr.name}</span>
                        <span className="text-xs text-slate-500">{curr.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CỘT PHẢI */}
          <div className="md:col-span-5 space-y-6">
            
            {/* 👇 5. ĐÃ THÊM: KHỐI NHẬP API KEY (Nằm trên cùng bên phải) 👇 */}
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950 border-amber-200 dark:border-amber-900/50">
              <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4 bg-amber-50/30 dark:bg-amber-900/10">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-500" /> Cấu hình Trợ lý AI
                </CardTitle>
                <CardDescription>Nhập khóa Groq API để kích hoạt Chatbot Copilot.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hệ thống sử dụng mô hình BYOK (Bring Your Own Key). Mã này chỉ lưu trữ cục bộ trên trình duyệt của sếp để đảm bảo an toàn.
                </p>
                <div className="flex flex-col gap-3">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Dán Groq API Key vào đây..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                  <button 
                    onClick={handleSaveKey}
                    className="w-full py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-colors text-sm shadow-sm"
                  >
                    Lưu khóa cấu hình
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* KHỐI HUẤN LUYỆN AI */}
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950">
              <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-purple-500" /> Huấn luyện AI
                </CardTitle>
                <CardDescription>Thiết lập các mốc KPI để AI đưa ra lời khuyên chuẩn xác hơn.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-purple-500"/> Ngưỡng AOV Mục tiêu
                      </label>
                      <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                        {formatMoney(aovTarget)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nếu giá trị trung bình mỗi đơn (AOV) thấp hơn mức này, AI sẽ kích hoạt cảnh báo yêu cầu chiến dịch Bán chéo (Upsell).
                    </p>
                    <input 
                      type="range" 
                      min="50" max="300" step="10"
                      value={aovTarget}
                      onChange={(e) => handleAovChange(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] font-medium text-slate-400">
                      <span>{formatMoney(50, true)}</span>
                      <span>{formatMoney(150, true)}</span>
                      <span>{formatMoney(300, true)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KHỐI DỮ LIỆU & CACHE */}
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950">
              <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Database className="h-5 w-5 text-sky-500" /> Dữ liệu & Cache
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Trạng thái API</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Đang kết nối
                  </span>
                </div>
                
                <button 
                  onClick={handleSyncData}
                  disabled={isSyncing}
                  className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isSyncing ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : syncSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'}`}
                >
                  {isSyncing ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Đang dọn Cache máy chủ...</>
                  ) : syncSuccess ? (
                    <><CheckCircle2 className="h-4 w-4" /> Đã xóa Cache thành công!</>
                  ) : (
                    <><RefreshCw className="h-4 w-4" /> Xóa Cache & Đồng bộ lại</>
                  )}
                </button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}