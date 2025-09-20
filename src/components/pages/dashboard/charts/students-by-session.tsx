"use client"

import { useState, useEffect } from "react"
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
  { session: "2020-21", students: 1456, percentage: 51.2 },
  { session: "2021-22", students: 1602, percentage: 56.3 },
  { session: "2022-23", students: 1389, percentage: 48.8 },
  { session: "2023-24", students: 1245, percentage: 43.7 },
]

const butpData = [
  { session: "2020-21", students: 856, percentage: 58.8 },
  { session: "2021-22", students: 942, percentage: 58.8 },
  { session: "2022-23", students: 817, percentage: 58.8 },
  { session: "2023-24", students: 732, percentage: 58.8 },
]

const efactData = [
  { session: "2020-21", students: 234, percentage: 16.1 },
  { session: "2021-22", students: 257, percentage: 16.0 },
  { session: "2022-23", students: 223, percentage: 16.1 },
  { session: "2023-24", students: 199, percentage: 16.0 },
]

const ipacData = [
  { session: "2020-21", students: 233, percentage: 16.0 },
  { session: "2021-22", students: 256, percentage: 16.0 },
  { session: "2022-23", students: 222, percentage: 16.0 },
  { session: "2023-24", students: 199, percentage: 16.0 },
]

const altData = [
  { session: "2020-21", students: 133, percentage: 9.1 },
  { session: "2021-22", students: 147, percentage: 9.2 },
  { session: "2022-23", students: 127, percentage: 9.1 },
  { session: "2023-24", students: 115, percentage: 9.2 },
]

interface StudentsBySessionProps {
  darkMode: boolean
}

export function StudentsBySession({ darkMode }: StudentsBySessionProps) {
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
              Students by Session
            </CardTitle>
            <CardDescription className={`text-sm ${darkMode ? "text-[#9e9e9e]" : ""}`}>
              Total students and percentage comparison across sessions
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
            students: {
              label: "Students",
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
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  `${value} students (${getData().find((d) => d.students === value)?.percentage}%)`,
                  name,
                ]}
              />
              <Bar
                dataKey="students"
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
