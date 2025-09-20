"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const allCoursesData = [
  { session: "2020-21", pendingFees: 28000, percentage: 32.9 },
  { session: "2021-22", pendingFees: 32000, percentage: 37.6 },
  { session: "2022-23", pendingFees: 25000, percentage: 29.4 },
  { session: "2023-24", pendingFees: 45000, percentage: 52.9 },
]

const butpData = [
  { session: "2020-21", pendingFees: 16800, percentage: 60.0 },
  { session: "2021-22", pendingFees: 19200, percentage: 60.0 },
  { session: "2022-23", pendingFees: 15000, percentage: 60.0 },
  { session: "2023-24", pendingFees: 27000, percentage: 60.0 },
]

const efactData = [
  { session: "2020-21", pendingFees: 5600, percentage: 20.0 },
  { session: "2021-22", pendingFees: 6400, percentage: 20.0 },
  { session: "2022-23", pendingFees: 5000, percentage: 20.0 },
  { session: "2023-24", pendingFees: 9000, percentage: 20.0 },
]

const ipacData = [
  { session: "2020-21", pendingFees: 4200, percentage: 15.0 },
  { session: "2021-22", pendingFees: 4800, percentage: 15.0 },
  { session: "2022-23", pendingFees: 3750, percentage: 15.0 },
  { session: "2023-24", pendingFees: 6750, percentage: 15.0 },
]

const altData = [
  { session: "2020-21", pendingFees: 1400, percentage: 5.0 },
  { session: "2021-22", pendingFees: 1600, percentage: 5.0 },
  { session: "2022-23", pendingFees: 1250, percentage: 5.0 },
  { session: "2023-24", pendingFees: 2250, percentage: 5.0 },
]

type PendingFeesProps = {
  darkMode: boolean
}

export function PendingFees({ darkMode }: PendingFeesProps) {
  const [selectedCourse, setSelectedCourse] = useState("all")

  // ✅ Responsive bar size tracking
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const getData = () => {
    switch (selectedCourse) {
      case "butp":
        return butpData
      case "efact":
        return efactData
      case "ipac":
        return ipacData
      case "alt":
        return altData
      default:
        return allCoursesData
    }
  }

  const barFillColor = darkMode ? "#80993a" : "#3a3b3c"
  const selectTriggerClass = darkMode
    ? "w-[120px] !bg-[#313131] text-gray-200 text-xs border border-gray-500/40 truncate"
    : "w-[120px] text-xs truncate"

  const selectContentClass = darkMode
    ? "w-[120px] bg-[#242526] border border-[#9e9e9e] text-gray-200"
    : "w-[120px]"

  return (
    <Card className="border-[0.5px] dark:border-gray-500/40 dark:bg-[#242526]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2 sm:flex-nowrap">

          <div>
            <CardTitle className="text-xl font-bold text-black dark:text-gray-200">
              Pending Fees by Session
            </CardTitle>
            <CardDescription className={`text-sm ${darkMode ? "text-[#9e9e9e]" : ""}`}>
              Outstanding fee amounts and percentage of total fees
            </CardDescription>
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent className={selectContentClass} style={{ width: "var(--radix-select-trigger-width)" }}>
              <SelectItem value="all" className="text-xs">All Courses</SelectItem>
              <SelectItem value="butp" className="text-xs">BUTP</SelectItem>
              <SelectItem value="efact" className="text-xs">EFACT</SelectItem>
              <SelectItem value="ipac" className="text-xs">IPAC</SelectItem>
              <SelectItem value="alt" className="text-xs">ALT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            pendingFees: {
              label: "Pending Fees",
              color: barFillColor,
            },
          }}
          className="h-[200px] w-full max-w-[300px] sm:h-[250px] sm:max-w-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getData()} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#313232" : "#ccc"} />
              <XAxis
                dataKey="session"
                tickFormatter={(session: string) =>
                  screenWidth < 443 ? session.slice(2) : session
                }
              />
              <YAxis tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}K`} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  `Rs${(value as number).toLocaleString()} (${getData().find((d) => d.pendingFees === value)?.percentage}%)`,
                  name,
                ]}
              />
              {/* ✅ Responsive bar size logic added here */}
              <Bar
                dataKey="pendingFees"
                fill={barFillColor}
                radius={2}
                barSize={
                  screenWidth < 400 ? 22 : screenWidth < 500 ? 27 : 30
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
