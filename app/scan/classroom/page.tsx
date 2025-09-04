"use client"

import { useState } from "react"
import QrScanner from "@/components/qr-scanner"

export default function ClassScanPage() {
  const [personId, setPersonId] = useState("")
  const [classCode, setClassCode] = useState("CS101")
  const [status, setStatus] = useState<string | null>(null)

  async function submit() {
    if (!personId.trim()) return
    const payload = {
      type: "classroom",
      personId: personId.trim(),
      classCode,
      scannedAt: new Date().toISOString(),
    }
    const res = await fetch("/api/attendance", { method: "POST", body: JSON.stringify(payload) })
    if (res.ok) {
      setStatus("Attendance confirmed ✅")
    } else {
      const data = await res.json()
      setStatus(`Denied: ${data?.reason || "Unknown error"}`)
    }
    setPersonId("")
  }

  async function handleScan(text: string) {
    const scanned = (text || "").toString().trim()
    if (!scanned) return
    // Optimistically set and submit
    setPersonId(scanned)
    await submit()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Classroom Scan</h1>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Faculty confirm student presence in class. Gate entry is required first.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900 mb-2">Scan QR</h3>
          <p className="text-sm text-gray-600 mb-3">Use the camera to scan the student's QR code.</p>
          <QrScanner onResult={handleScan} />
      </div>

      <div className="rounded-lg border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              Class Code
              <input
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label className="block text-sm text-gray-700">
              Person ID (from QR)
              <input
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="e.g. S12345"
              />
            </label>
          </div>
          <button
            onClick={submit}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Confirm Attendance
          </button>
          {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  )
}
