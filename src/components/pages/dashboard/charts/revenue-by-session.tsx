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
  { session: "2020-21", revenue: 580000, percentage: 46.4 },
  { session: "2021-22", revenue: 640000, percentage: 51.2 },
  { session: "2022-23", revenue: 555000, percentage: 44.4 },
  { session: "2023-24", revenue: 650000, percentage: 52.0 },
]

const butpData = [
  { session: "2020-21", revenue: 348000, percentage: 60.0 },
  { session: "2021-22", revenue: 384000, percentage: 60.0 },
  { session: "2022-23", revenue: 333000, percentage: 60.0 },
  { session: "2023-24", revenue: 390000, percentage: 60.0 },
]

const efactData = [
  { session: "2020-21", revenue: 116000, percentage: 20.0 },
  { session: "2021-22", revenue: 128000, percentage: 20.0 },
  { session: "2022-23", revenue: 111000, percentage: 20.0 },
  { session: "2023-24", revenue: 130000, percentage: 20.0 },
]

const ipacData = [
  { session: "2020-21", revenue: 87000, percentage: 15.0 },
  { session: "2021-22", revenue: 96000, percentage: 15.0 },
  { session: "2022-23", revenue: 83250, percentage: 15.0 },
  { session: "2023-24", revenue: 97500, percentage: 15.0 },
]

const altData = [
  { session: "2020-21", revenue: 29000, percentage: 5.0 },
  { session: "2021-22", revenue: 32000, percentage: 5.0 },
  { session: "2022-23", revenue: 27750, percentage: 5.0 },
  { session: "2023-24", revenue: 32500, percentage: 5.0 },
]

type RevenueBySessionProps = {
  darkMode: boolean
}

export function RevenueBySession({ darkMode }: RevenueBySessionProps) {
  const [selectedCourse, setSelectedCourse] = useState("all")

  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  )

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
            <CardTitle className={`text-xl font-bold ${darkMode ? "text-gray-200" : "text-black"}`}>
              Revenue by Session
            </CardTitle>
            <CardDescription className={`text-sm ${darkMode ? "text-[#9e9e9e]" : ""}`}>
              Total revenue and percentage comparison across sessions
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
            revenue: {
              label: "Revenue",
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
                  `Rs${(value as number).toLocaleString()} (${getData().find((d) => d.revenue === value)?.percentage}%)`,
                  name,
                ]}
              />
              <Bar
                dataKey="revenue"
                fill={barFillColor}
                radius={2}
                barSize={screenWidth < 400 ? 22 : screenWidth < 500 ? 27 : 30}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
