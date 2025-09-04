"use client"

import useSWR from "swr"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminPage() {
  const { data: events } = useSWR("/api/attendance", fetcher)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Manage attendance logs. Database integration will enable advanced filters, analytics, and exports.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Recent Attendance Events</h3>
          {!events ? (
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          ) : events.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No events yet.</p>
          ) : (
            <div className="mt-2 max-h-[480px] overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">Time</th>
                    <th className="px-2 py-1 text-left font-medium">Type</th>
                    <th className="px-2 py-1 text-left font-medium">Person ID</th>
                    <th className="px-2 py-1 text-left font-medium">Class</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e: any) => (
                    <tr key={e.id} className="even:bg-gray-50">
                      <td className="px-2 py-1">{new Date(e.scannedAt).toLocaleString()}</td>
                      <td className="px-2 py-1">
                        <span className={e.type === "gate" ? "text-green-600" : "text-blue-600"}>{e.type}</span>
                      </td>
                      <td className="px-2 py-1">{e.personId}</td>
                      <td className="px-2 py-1">{e.classCode || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Quick Links</h3>
          <p className="text-sm text-gray-600">Manage your role-based workflows and tools.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Link href="/faculty" className="rounded border p-3 hover:bg-gray-50">
              <div className="font-medium">Faculty</div>
              <div className="text-sm text-gray-600">View assigned classes & lectures</div>
            </Link>
            <Link href="/analytics" className="rounded border p-3 hover:bg-gray-50">
              <div className="font-medium">Analytics</div>
              <div className="text-sm text-gray-600">Attendance trends & insights</div>
            </Link>
            <Link href="/idcard-designer" className="rounded border p-3 hover:bg-gray-50">
              <div className="font-medium">ID Card Designer</div>
              <div className="text-sm text-gray-600">Front/back templates with university fields</div>
            </Link>
          </div>
      </div>
    </div>
  )
}
