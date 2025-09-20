"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
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
  { status: "Total", count: 1850, fill: "#aaca52" },
  { status: "Approved", count: 1245, fill: "#4caf50" },
  { status: "Rejected", count: 285, fill: "#f44336" },
  { status: "Pending", count: 185, fill: "#ff9800" },
  { status: "Enrolled", count: 1135, fill: "#2196f3" },
]

const butpData = [
  { status: "Total", count: 1110, fill: "#aaca52" },
  { status: "Approved", count: 747, fill: "#4caf50" },
  { status: "Rejected", count: 171, fill: "#f44336" },
  { status: "Pending", count: 111, fill: "#ff9800" },
  { status: "Enrolled", count: 681, fill: "#2196f3" },
]

const efactData = [
  { status: "Total", count: 296, fill: "#aaca52" },
  { status: "Approved", count: 199, fill: "#4caf50" },
  { status: "Rejected", count: 46, fill: "#f44336" },
  { status: "Pending", count: 30, fill: "#ff9800" },
  { status: "Enrolled", count: 181, fill: "#2196f3" },
]

const ipacData = [
  { status: "Total", count: 259, fill: "#aaca52" },
  { status: "Approved", count: 174, fill: "#4caf50" },
  { status: "Rejected", count: 40, fill: "#f44336" },
  { status: "Pending", count: 26, fill: "#ff9800" },
  { status: "Enrolled", count: 159, fill: "#2196f3" },
]

const altData = [
  { status: "Total", count: 185, fill: "#aaca52" },
  { status: "Approved", count: 125, fill: "#4caf50" },
  { status: "Rejected", count: 28, fill: "#f44336" },
  { status: "Pending", count: 18, fill: "#ff9800" },
  { status: "Enrolled", count: 114, fill: "#2196f3" },
]

type StatusKey = "Total" | "Approved" | "Rejected" | "Pending" | "Enrolled"

const lightModeColors: Record<StatusKey, string> = {
  Total: "#aaca52",
  Approved: "#4caf50",
  Rejected: "#f44336",
  Pending: "#ff9800",
  Enrolled: "#2196f3",
}

const darkModeColors: Record<StatusKey, string> = {
  Total: "#7ba23f",
  Approved: "#388e3c",
  Rejected: "#d32f2f",
  Pending: "#f57c00",
  Enrolled: "#1976d2",
}

type AdmissionApplicationsProps = {
  darkMode: boolean
}

export function AdmissionApplications({ darkMode }: AdmissionApplicationsProps) {
  const [selectedCourse, setSelectedCourse] = useState("all")
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
              Admission Application Status
            </CardTitle>
            <CardDescription className={`text-sm ${darkMode ? "text-[#9e9e9e]" : ""}`}>
              Current status distribution of all admission applications
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
            count: {
              label: "Applications",
              color: "#aaca52",
            },
          }}
          className="h-[200px] w-full max-w-[300px] sm:h-[250px] sm:max-w-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getData()} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#313232" : "#ccc"} />
              <XAxis
                dataKey="status"
                interval={0}
                tick={({ x, y, payload }) => {
                  const shortLabel = screenWidth <= 443 ? payload.value.charAt(0) : payload.value
                  return (
                    <g transform={`translate(${x},${y + 10})`}>
                      <text
                        x={0}
                        y={0}
                        dy={0}
                        textAnchor="middle"
                        fill={darkMode ? "#ccc" : "#333"}
                        fontSize={11}
                      >
                        {shortLabel}
                      </text>
                    </g>
                  )
                }}
              />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [`${value} applications`, name]}
              />
              <Bar
                dataKey="count"
                radius={2}
                barSize={screenWidth < 400 ? 22 : screenWidth < 500 ? 27 : 30}
              >
                {getData().map((entry, index) => {
                  const status = entry.status as StatusKey
                  const fill = darkMode ? darkModeColors[status] : lightModeColors[status]
                  return <Cell key={`cell-${index}`} fill={fill} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
