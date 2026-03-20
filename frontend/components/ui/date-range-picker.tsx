"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface DatePickerProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({ date, setDate }: DatePickerProps) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-md bg-background shadow-sm hover:bg-accent transition-colors">
      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1 text-sm font-medium">
        {/* Input cho ngày bắt đầu */}
        <input
          type="date"
          className="bg-transparent outline-none cursor-pointer focus:text-primary"
          value={date?.from ? format(date.from, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : undefined
            setDate({ ...date, from: newDate } as DateRange)
          }}
        />
        <span className="text-muted-foreground">-</span>
        {/* Input cho ngày kết thúc */}
        <input
          type="date"
          className="bg-transparent outline-none cursor-pointer focus:text-primary"
          value={date?.to ? format(date.to, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : undefined
            setDate({ ...date, to: newDate } as DateRange)
          }}
        />
      </div>
    </div>
  )
}