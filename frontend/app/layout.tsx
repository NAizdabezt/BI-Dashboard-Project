import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FilterProvider } from "@/contexts/FilterContext"; 
// Đã import thành công
import { CurrencyProvider } from "@/contexts/CurrencyContext"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Olist BI Dashboard", 
  description: "Hệ thống phân tích và dự báo dữ liệu kinh doanh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {/* 👇 ĐÃ SỬA: Bọc CurrencyProvider bao ngoài FilterProvider 👇 */}
            <CurrencyProvider>
              <FilterProvider>
                {children}
              </FilterProvider>
            </CurrencyProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}