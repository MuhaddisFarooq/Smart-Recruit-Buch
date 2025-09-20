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
  { session: "2020-21", discounts: 58000, percentage: 46.4 },
  { session: "2021-22", discounts: 64000, percentage: 51.2 },
  { session: "2022-23", discounts: 55500, percentage: 44.4 },
  { session: "2023-24", discounts: 65000, percentage: 52.0 },
]

const butpData = [
  { session: "2020-21", discounts: 34800, percentage: 60.0 },
  { session: "2021-22", discounts: 38400, percentage: 60.0 },
  { session: "2022-23", discounts: 33300, percentage: 60.0 },
  { session: "2023-24", discounts: 39000, percentage: 60.0 },
]

const efactData = [
  { session: "2020-21", discounts: 11600, percentage: 20.0 },
  { session: "2021-22", discounts: 12800, percentage: 20.0 },
  { session: "2022-23", discounts: 11100, percentage: 20.0 },
  { session: "2023-24", discounts: 13000, percentage: 20.0 },
]

const ipacData = [
  { session: "2020-21", discounts: 8700, percentage: 15.0 },
  { session: "2021-22", discounts: 9600, percentage: 15.0 },
  { session: "2022-23", discounts: 8325, percentage: 15.0 },
  { session: "2023-24", discounts: 9750, percentage: 15.0 },
]

const altData = [
  { session: "2020-21", discounts: 2900, percentage: 5.0 },
  { session: "2021-22", discounts: 3200, percentage: 5.0 },
  { session: "2022-23", discounts: 2775, percentage: 5.0 },
  { session: "2023-24", discounts: 3250, percentage: 5.0 },
]

type DiscountsBySessionProps = {
  darkMode: boolean
}

export function DiscountsBySession({ darkMode }: DiscountsBySessionProps) {
  const [selectedCourse, setSelectedCourse] = useState("all")

  // ✅ Responsive bar size logic
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
              Discounts/Waive Off by Session
            </CardTitle>
            <CardDescription className={`text-sm ${darkMode ? "text-[#9e9e9e]" : ""}`}>
              Total discounts and percentage comparison across sessions
            </CardDescription>
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent
              className={selectContentClass}
              style={{ width: "var(--radix-select-trigger-width)" }}
            >
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
            discounts: {
              label: "Discounts",
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
              <YAxis
                tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}K`}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  `Rs${(value as number).toLocaleString()} (${getData().find((d) => d.discounts === value)?.percentage}%)`,
                  name,
                ]}
              />
              <Bar
                dataKey="discounts"
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
