"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Currency = "BRL" | "USD" | "VND"

interface CurrencyContextProps {
  currency: Currency
  setCurrency: (c: Currency) => void
  formatMoney: (value: number, compact?: boolean) => string
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined)

const EXCHANGE_RATES = {
  BRL: 1,
  USD: 0.20,
  VND: 5000
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BRL")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("app_currency") as Currency
    if (saved && ["BRL", "USD", "VND"].includes(saved)) {
      setCurrencyState(saved)
    }
  }, [])

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem("app_currency", c)
  }

  const formatMoney = (value: number, compact: boolean = false) => {
    if (!mounted) return "" 

    const convertedValue = value * EXCHANGE_RATES[currency]

    // 💡 TÍNH NĂNG MỚI: Rút gọn số cực lớn (Ví dụ: 95 Tỷ ₫, 1.5 Tr ₫)
    if (compact) {
      if (currency === "VND") {
        if (convertedValue >= 1000000000) return (convertedValue / 1000000000).toFixed(1) + "\u00A0Tỷ\u00A0₫"
        if (convertedValue >= 1000000) return (convertedValue / 1000000).toFixed(1) + "\u00A0Tr\u00A0₫"
        if (convertedValue >= 1000) return (convertedValue / 1000).toFixed(0) + "k\u00A0₫"
      } else {
        if (convertedValue >= 1000000) {
          const compactVal = (convertedValue / 1000000).toFixed(1) + "M"
          return currency === "BRL" ? `R$\u00A0${compactVal}` : `$\u00A0${compactVal}`
        }
        if (convertedValue >= 1000) {
          const compactVal = (convertedValue / 1000).toFixed(0) + "k"
          return currency === "BRL" ? `R$\u00A0${compactVal}` : `$\u00A0${compactVal}`
        }
      }
    }

    const formattedNum = convertedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })
    
    // 💡 ĐÃ SỬA LỖI: Dùng \u00A0 thay cho dấu cách để ký hiệu tiền tệ dính chặt vào số
    if (currency === "BRL") return `R$\u00A0${formattedNum}`
    if (currency === "USD") return `$\u00A0${formattedNum}`
    if (currency === "VND") return `${formattedNum}\u00A0₫`
    
    return formattedNum
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error("useCurrency must be used within a CurrencyProvider")
  return context
}