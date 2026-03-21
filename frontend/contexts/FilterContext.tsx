"use client"
import React, { createContext, useContext, useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface FilterContextType {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  category: string
  setCategory: (cat: string) => void
  startDate: string
  endDate: string
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState<DateRange | undefined>()
  const [category, setCategory] = useState("all")
  // Đã xóa biến status ở đây

  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bi-dashboard-project.onrender.com"
        const response = await fetch(`${baseUrl}/api/metadata/date-range`)
        if (response.ok) {
          const { min_date, max_date } = await response.json()
          setDate({ from: new Date(min_date), to: new Date(max_date) })
        }
      } catch (error) {}
    }
    fetchDateRange()
  }, [])

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : ""
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : ""

  return (
    // Đã xóa status khỏi value truyền đi
    <FilterContext.Provider value={{ date, setDate, category, setCategory, startDate, endDate }}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilters = () => {
  const context = useContext(FilterContext)
  if (!context) throw new Error("useFilters phải được bọc trong FilterProvider")
  return context
}