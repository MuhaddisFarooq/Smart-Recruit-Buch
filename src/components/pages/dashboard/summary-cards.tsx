"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import {
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Banknote,
  Percent,
  Clock,
  GraduationCap,
  FileText
} from "lucide-react"

interface SummaryCardProps {
  title: string
  total: number
  current: number
  previous: number
  icon: React.ReactNode
  format?: "number" | "currency" | "percentage" | "pkr"
  male?: number
  female?: number
}

function SummaryCard({
  title,
  total,
  current,
  previous,
  icon,
  format = "number",
  male,
  female
}: SummaryCardProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case "currency":
      case "pkr":
        return new Intl.NumberFormat("en-PK", {
          style: "currency",
          currency: "PKR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value)
      case "percentage":
        return `${value}%`
      default:
        return value.toLocaleString()
    }
  }

  const trendUp = current > previous
  const trendPercentage =
    previous > 0 ? (((current - previous) / previous) * 100).toFixed(1) : "0"
  const trendColor = trendUp ? "text-green-600" : "text-red-600"
  const TrendIcon = trendUp ? TrendingUp : TrendingDown

  return (
    <div className="relative w-full h-[190px] rounded-2xl mb-2 bg-[#242526] dark:bg-[#80993a] border p-4 transition duration-500 ease-out dark:border-0 hover:border-black dark:hover:border-black hover:shadow-[0_4px_18px_rgba(0,0,0,0.25)] group overflow-visible">
      <CardHeader className="flex flex-row items-start justify-between p-0">
        <CardTitle className="!text-sm !font-semibold text-white dark:text-[#242526] max-w-[calc(100%-2.5rem)] whitespace-normal">
          {title}
        </CardTitle>
        <div className="text-primary dark:text-[#242526] flex-shrink-0 ml-2">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0">
        <div className="text-xl font-bold text-[#aaca52] dark:text-[#242526]">{formatValue(total)}</div>

        <div className="mt-2 text-xs text-[#9e9e9e] dark:text-[#242526]">
          <div>
            <span>Current: </span>
            <span className="font-semibold">{formatValue(current)}</span>
          </div>
          <div>
            <span>Previous: </span>
            <span className="font-semibold">{formatValue(previous)}</span>
          </div>
          {title === "Students" && (
            <>
              <div className="mt-1">
                <span>Male: </span>
                <span className="font-semibold">{male}</span>
              </div>
              <div>
                <span>Female: </span>
                <span className="font-semibold">{female}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>

      <div className="absolute left-1/2 bottom-0 translate-x-[-50%] translate-y-4 group-hover:translate-y-1/2 opacity-0 group-hover:opacity-100 transition duration-300 ease-out w-[60%] rounded-xl bg-black text-white dark:bg-black text-sm py-2 px-3 flex items-center justify-center gap-1">
        <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        <span className={`${trendColor}`}>{trendPercentage}%</span>
      </div>
    </div>
  )
}

export function SummaryCards() {
  const [data, setData] = useState<any[]>([])

  const [studentData, setStudentData] = useState({
    total: 0,
    current: 0,
    previous: 0,
    male: 0,
    female: 0
  })

  const [revenueData, setRevenueData] = useState({
    total: 0,
    current: 0,
    previous: 0
  })

  const [discountData, setDiscountData] = useState({
    total: 0,
    current: 0,
    previous: 0
  })

  const [pendingFeeData, setPendingFeeData] = useState({
    total: 0,
    current: 0,
    previous: 0
  })

  const [applicationsData, setApplicationsData] = useState({
    total: 0,
    current: 0,
    previous: 0
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get("/api/key-metrics")
        const raw = res.data

// 🎓 Students (only from first 4 objects)
let current = 0
let previous = 0
let male = 0
let female = 0

raw.slice(0, 4).forEach((item: any) => {
  const batch = item.batch
  const gender = item.gender?.toLowerCase()
  const applications = parseInt(item.Applications || "0")

  if (batch === "Batch-1") previous += applications
  if (batch === "Batch-2") current += applications

  if (gender === "male") male += applications
  if (gender === "female") female += applications
})

setStudentData({
  total: current + previous,
  current,
  previous,
  male,
  female
})


        // 💰 Revenue & Discount
        let revenueCurrent = 0
        let revenuePrevious = 0
        let discountCurrent = 0
        let discountPrevious = 0

        raw.forEach((item: any) => {
          if (item.gender === null) {
            const batch = item.batch?.toLowerCase()
            const revenue = parseFloat(item.Revenue || "0")
            const discount = parseFloat(item.Discount || "0")

            if (batch === "batch-1") {
              revenuePrevious += revenue
              discountPrevious += discount
            }
            if (batch === "batch-2") {
              revenueCurrent += revenue
              discountCurrent += discount
            }
          }
        })

        setRevenueData({
          total: revenueCurrent + revenuePrevious,
          current: revenueCurrent,
          previous: revenuePrevious
        })

        setDiscountData({
          total: discountCurrent + discountPrevious,
          current: discountCurrent,
          previous: discountPrevious
        })

        // 🕒 Pending Fee
        let pendingCurrent = 0
        raw.forEach((item: any) => {
          if (item.gender === null && item.batch === "Batch-2") {
            const pending = parseFloat(item.Pending || "0")
            pendingCurrent += pending
          }
        })
        setPendingFeeData({
          total: pendingCurrent,
          current: pendingCurrent,
          previous: 0
        })

        // 📄 Applications (from last two objects)
        const lastTwo = raw.slice(-2)
        let appPrev = 0
        let appCurr = 0

        lastTwo.forEach((item: any) => {
          const batch = item.batch
          const apps = parseInt(item.Applications || "0")
          if (batch === "Batch-1") appPrev += apps
          if (batch === "Batch-2") appCurr += apps
        })

        setApplicationsData({
          total: appPrev + appCurr,
          current: appCurr,
          previous: appPrev
        })

        setData(raw)
      } catch (err) {
        console.error("Error fetching key metrics:", err)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
      <SummaryCard
        title="Students"
        total={studentData.total}
        current={studentData.current}
        previous={studentData.previous}
        icon={<Users className="h-4 w-4" />}
        male={studentData.male}
        female={studentData.female}
      />
      <SummaryCard
        title="Revenue"
        total={revenueData.total}
        current={revenueData.current}
        previous={revenueData.previous}
        icon={<Banknote className="h-4 w-4" />}
        format="pkr"
      />
      <SummaryCard
        title="Discount/Waive Off"
        total={discountData.total}
        current={discountData.current}
        previous={discountData.previous}
        icon={<Percent className="h-4 w-4" />}
        format="pkr"
      />
      <SummaryCard
        title="Pending Fee"
        total={pendingFeeData.total}
        current={pendingFeeData.current}
        previous={pendingFeeData.previous}
        icon={<Clock className="h-4 w-4" />}
        format="pkr"
      />
      <SummaryCard
        title="Scholarships"
        total={0}
        current={0}
        previous={0}
        icon={<GraduationCap className="h-4 w-4" />}
      />
      <SummaryCard
        title="Applications"
        total={applicationsData.total}
        current={applicationsData.current}
        previous={applicationsData.previous}
        icon={<FileText className="h-4 w-4" />}
      />
    </div>
  )
}
