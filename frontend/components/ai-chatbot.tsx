"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, X, Send, GripHorizontal, FileText, LayoutDashboard, Mic, Loader2 } from "lucide-react"
import { useFilters } from "@/contexts/FilterContext"
import { usePathname } from "next/navigation"

// 🔥 BƯỚC 1: Thêm isSilent vào Type để giấu tin nhắn hệ thống 🔥
type Message = { role: 'user' | 'ai', text: string, isSilent?: boolean, options?: { label: string, actionName: string, icon: any }[] }

export function AIChatbot() {
  const pathname = usePathname()
  const { date, category } = useFilters()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Chào sếp! Sếp cần phân tích gì, xuất PDF, hay vẽ biểu đồ ạ?' }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  const [charts, setCharts] = useState<{id: number, html: string}[]>([])
  const [hasAlerted, setHasAlerted] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // LOGIC KÉO THẢ AI WIDGET
  const [chartPos, setChartPos] = useState({ x: 20, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: chartPos.x, initY: chartPos.y }
  }

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      setChartPos({ x: dragRef.current.initX + (e.clientX - dragRef.current.startX), y: dragRef.current.initY + (e.clientY - dragRef.current.startY) })
    }
    const onMouseUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [isDragging])

  // 🔥 BƯỚC 2: Thêm cờ isSilent vào hàm handleSend 🔥
  const handleSend = async (textOverride?: string, isSilent: boolean = false) => {
    const userMsg = textOverride || input;
    if (!userMsg.trim()) return;
    
    const savedKey = localStorage.getItem("GROQ_API_KEY") || localStorage.getItem("GEMINI_API_KEY");
    if (!savedKey) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sếp chưa cài đặt API Key kìa!' }]); return;
    }

    // Chỉ hiện tin nhắn người dùng nếu không phải là tin nhắn ẩn
    if (!isSilent) {
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      if (!textOverride) setInput("");
    }
    setIsTyping(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const userCurrency = localStorage.getItem("currency") || localStorage.getItem("selectedCurrency") || "BRL";
      const fmtDate = (d: Date | undefined) => d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0] : null;
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          api_key: savedKey, 
          currency: userCurrency,
          start_date: fmtDate(date?.from),
          end_date: fmtDate(date?.to),
          category: category !== "all" ? category : null
        })
      });
      const data = await res.json();
      
      console.log("📥 Dữ liệu AI trả về:", data);

      if (data.action === "ASK_PDF_OPTIONS") {
        setMessages(prev => [...prev, { 
          role: 'ai', text: data.reply,
          options: [
            { label: "Biểu đồ AI đang mở", actionName: "EXPORT_WIDGET", icon: FileText },
            { label: "Toàn bộ Dashboard", actionName: "EXPORT_DASHBOARD", icon: LayoutDashboard }
          ]
        }]);
      } 
      else if (data.action === "UPDATE_FILTER") {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        console.log("🚀 Phát lệnh cập nhật Dashboard:", data.filters);
        window.dispatchEvent(new CustomEvent('ai-update-global-filter', { detail: data.filters }));
      } 
      else if (data.action === "OPEN_CHART" && data.html) {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        setTimeout(() => setCharts(prev => [{ id: Date.now(), html: data.html }, ...prev]), 1000);
      } 
      else {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      }
    } catch (error) {
      if (!isSilent) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Lỗi mất kết nối đến AI!' }]);
      }
    } finally { setIsTyping(false); }
  }

  // TỰ ĐỘNG BÁO CÁO KHI MỞ CHAT LẦN ĐẦU
  useEffect(() => {
    if (isOpen && !hasAlerted) {
      setHasAlerted(true);
      handleSend("[INIT_ALERT]", true); // Gửi tin nhắn ẩn
    }
  }, [isOpen]);
  
  // NHẬN DIỆN GIỌNG NÓI (VOICE COMMAND)
  const toggleMic = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ giọng nói. Sếp dùng Chrome hoặc Edge nhé!"); return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript); 
      handleSend(transcript, false); 
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }

  const handleOptionClick = async (actionName: string) => {
    setMessages(prev => [...prev, { role: 'user', text: actionName === "EXPORT_WIDGET" ? "Xuất PDF danh sách biểu đồ này" : "Xuất PDF toàn Dashboard" }]);
    setIsTyping(true);
    
    try {
      if (actionName === "EXPORT_DASHBOARD") {
        await exportToPDF('DASHBOARD'); 
      } else if (actionName === "EXPORT_WIDGET") {
        const widgetElem = document.getElementById("ai-chart-scroll-area");
        if (!widgetElem) {
          setMessages(prev => [...prev, { role: 'ai', text: 'Sếp chưa mở biểu đồ AI nào cả!' }]);
          setIsTyping(false);
          return;
        }
        await exportToPDF('WIDGET');
      }
      setMessages(prev => [...prev, { role: 'ai', text: 'Sếp hãy chọn "Lưu dưới dạng PDF" (Save as PDF) trên cửa sổ vừa hiện ra nhé!' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Lỗi khi tạo PDF!' }]);
    }
    
    setIsTyping(false);
  }

  // 🔥 GIẢI PHÁP XUẤT PDF NGUYÊN BẢN CỦA TRÌNH DUYỆT (NATIVE PRINT) 🔥
  const exportToPDF = (mode: 'WIDGET' | 'DASHBOARD') => {
    return new Promise<void>((resolve) => {
      // Tạo một thẻ Style tạm thời để "định hình" lại giao diện khi in
      const printStyle = document.createElement('style');
      
      if (mode === 'WIDGET') {
        // NẾU XUẤT WIDGET: Ẩn mọi thứ, chỉ phóng to khu vực chứa biểu đồ AI
        printStyle.innerHTML = `
          @media print {
            body * { visibility: hidden !important; }
            #ai-chart-scroll-area, #ai-chart-scroll-area * { visibility: visible !important; }
            #ai-chart-scroll-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: max-content !important;
              overflow: visible !important;
              display: block !important;
              background: white !important;
            }
            /* Ẩn các nút rườm rà */
            button, .export-btn { display: none !important; }
            /* Cấm biểu đồ bị cắt ngang giữa 2 trang giấy */
            iframe, canvas { page-break-inside: avoid !important; margin-bottom: 20px !important; }
          }
        `;
      } else {
        // NẾU XUẤT TOÀN DASHBOARD: Ẩn thanh Sidebar, thanh Menu trên và Khung chat
        printStyle.innerHTML = `
          @media print {
            /* Ẩn các thành phần điều hướng */
            aside, header, nav, .fixed.bottom-6, button.fixed, .z-50 { display: none !important; }
            /* Ép thẻ chính full chiều rộng giấy */
            main, .p-8 { width: 100% !important; margin: 0 !important; padding: 0 !important; }
            body { background: white !important; }
            /* Cấm cắt đôi biểu đồ */
            .recharts-wrapper, canvas, .card { page-break-inside: avoid !important; }
          }
        `;
      }

      document.head.appendChild(printStyle);
      
      // Chờ 0.5s để CSS kịp ăn vào trình duyệt, sau đó gọi lệnh Print
      setTimeout(() => {
        window.print();
        
        // Sau khi sếp tắt hộp thoại in, dọn dẹp CSS trả web về nguyên trạng
        document.head.removeChild(printStyle);
        resolve();
      }, 500);
    });
  }

  return (
    <div className={pathname === "/settings" ? "hidden" : ""}>
      
      {charts.length > 0 && (
        <div style={{ top: chartPos.y, left: chartPos.x }} className="fixed z-[100] w-[380px] md:w-[480px] h-[550px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col overflow-hidden border-2 border-purple-500/30">
          <div onMouseDown={onMouseDown} className="p-3 bg-slate-100 dark:bg-slate-800 flex justify-between items-center cursor-move border-b border-slate-200 dark:border-slate-700 select-none">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <GripHorizontal className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Widget ({charts.length} biểu đồ)</span>
            </div>
            <button onClick={() => setCharts([])} className="text-slate-500 hover:text-red-500 transition-colors bg-white dark:bg-slate-700 rounded-md p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div id="ai-chart-scroll-area" className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50">
            {charts.map((chart) => (
              <div key={chart.id} className="w-full h-[400px] flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                 <iframe srcDoc={chart.html} className="w-full h-full border-0" title={`AI Chart ${chart.id}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(true)} className={`fixed bottom-6 right-6 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all z-50 ${isOpen ? 'hidden' : 'flex'}`}>
        <Bot className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold"><Bot className="h-5 w-5" /> Trợ lý AI Copilot</div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
          </div>

          <div className="h-[400px] p-4 overflow-y-auto flex flex-col gap-4 bg-slate-50 dark:bg-slate-950">
            {/* 🔥 BƯỚC 3: Ẩn các tin nhắn có cờ isSilent 🔥 */}
            {messages.map((m, i) => !m.isSilent && (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'}`}>
                  {m.text}
                </div>
                {m.options && (
                  <div className="flex flex-col gap-2 mt-2 w-[85%]">
                    {m.options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleOptionClick(opt.actionName)} className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold transition-colors w-full text-left">
                        <opt.icon className="h-4 w-4" /> {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none text-slate-500 dark:text-slate-400 text-sm flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-center">
            {/* 🔥 BƯỚC 4: Nút Micro xịn xò 🎙️ 🔥 */}
            <button 
              onClick={toggleMic} 
              className={`p-2 rounded-full transition-colors ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600'}`}
              title="Nhập bằng giọng nói"
            >
              {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
            </button>

            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập hoặc nói..." 
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
            />
            <button onClick={() => handleSend()} className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      )}    
    </div>
  )
}