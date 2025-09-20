import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, Users } from "lucide-react"
import CountUp from "react-countup"

export function AdmissionStatus() {
  const [data, setData] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    enrolled: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admission-status")
        const result = await res.json()

        console.log("📦 Final result:", result)

        setData({
          total: Number(result.Total) || 0,
          approved: Number(result.Approved) || 0,
          rejected: Number(result.Rejected) || 0,
          pending: Number(result.Pending) || 0,
          enrolled: Number(result.Enrolled) || 0,
        })
      } catch (err) {
        console.error("AdmissionStatus fetch error:", err)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])


  const statusData = [
    { label: "Total", value: data.total, icon: <Users className="h-5 w-5" />, color: "text-primary" },
    { label: "Approved", value: data.approved, icon: <CheckCircle className="h-5 w-5" />, color: "text-green-500" },
    { label: "Rejected", value: data.rejected, icon: <XCircle className="h-5 w-5" />, color: "text-red-500" },
    { label: "Pending", value: data.pending, icon: <Clock className="h-5 w-5" />, color: "text-yellow-500" },
    { label: "Enrolled", value: data.enrolled, icon: <Users className="h-5 w-5" />, color: "text-blue-500" },
  ]

  return (
    <Card className="min-h-[200px] py-5 bg-['#242526'] border-[0.5px] dark:border-gray-500/40">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#3a3b3c] dark:text-gray-200">
          Admission Applications Status
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {statusData.map((item) => (
            <div key={item.label} className="flex flex-col items-center space-y-2">
              <div className={`flex justify-center ${item.color}`}>{item.icon}</div>
              <div className="text-2xl font-bold text-[#3a3b3c] dark:text-gray-100">
                {loading ? "..." : <CountUp end={item.value} duration={2} separator="," />}
              </div>
              <div className="text-xs text-muted-foreground dark:text-gray-400 text-center">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
