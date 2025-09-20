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
  { course: "BUTP", students: 1856, percentage: 65.2 },
  { course: "EFACT", students: 456, percentage: 16.0 },
  { course: "IPAC", students: 335, percentage: 11.8 },
  { course: "ALT", students: 200, percentage: 7.0 },
]

const currentSessionData = [
  { course: "BUTP", students: 785, percentage: 63.1 },
  { course: "EFACT", students: 198, percentage: 15.9 },
  { course: "IPAC", students: 162, percentage: 13.0 },
  { course: "ALT", students: 100, percentage: 8.0 },
]

const butpData = [
  { course: "BUTP Batch 1", students: 285, percentage: 36.3 },
  { course: "BUTP Batch 2", students: 245, percentage: 31.2 },
  { course: "BUTP Batch 3", students: 155, percentage: 19.7 },
  { course: "BUTP Batch 4", students: 100, percentage: 12.7 },
]

const efactData = [
  { course: "EFACT Batch 1", students: 118, percentage: 59.6 },
  { course: "EFACT Batch 2", students: 80, percentage: 40.4 },
]

const ipacData = [
  { course: "IPAC Batch 1", students: 170, percentage: 50.7 },
  { course: "IPAC Batch 2", students: 165, percentage: 49.3 },
]

const altData = [
  { course: "ALT Batch 1", students: 110, percentage: 55 },
  { course: "ALT Batch 2", students: 90, percentage: 45 },
  { course: "ALT Batch 3", students: 80, percentage: 40 },
  { course: "ALT Batch 4", students: 60, percentage: 30 },
]

type StudentsByCourseProps = {
  darkMode: boolean
}

export function StudentsByCourse({ darkMode }: StudentsByCourseProps) {
  const [selectedCourse, setSelectedCourse] = useState("all")

  // ✅ Add responsive bar size logic
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
      case "current":
        return currentSessionData
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

  const data = getData()
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
              Students by Course
            </CardTitle>
            <CardDescription className={`text-sm ${darkMode ? "text-[#9e9e9e]" : ""}`}>
              Student distribution across different nursing courses
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
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#313232" : "#ccc"} />
              <XAxis dataKey="course" />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => {
                  const item = data.find((d) => d.students === value)
                  return [
                    `${value} students${item?.percentage ? ` (${item.percentage}%)` : ""}`,
                    name,
                  ]
                }}
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
