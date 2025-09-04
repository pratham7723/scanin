"use client"
import { useEffect, useState } from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts"

export default function AnalyticsPage() {
  const [data, setData] = useState<any[]>([])
  useEffect(() => {
    setData([
      { day: "Mon", present: 82, absent: 18 },
      { day: "Tue", present: 90, absent: 10 },
      { day: "Wed", present: 76, absent: 24 },
      { day: "Thu", present: 88, absent: 12 },
      { day: "Fri", present: 93, absent: 7 },
    ])
  }, [])
  return (
    <main className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Attendance overview and trends</p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-3">Attendance Trend</h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#2563eb" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium mb-3">Present vs Absent</h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#16a34a" />
                <Bar dataKey="absent" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </main>
  )
}
