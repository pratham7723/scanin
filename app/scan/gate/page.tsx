"use client"

import { useState } from "react"
import QrScanner from "@/components/qr-scanner"

export default function GateScanPage() {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  async function recordGate(personId: string) {
    if (!personId.trim()) return
    const payload = {
      type: "gate",
      personId: personId.trim(),
      scannedAt: new Date().toISOString(),
    }
    const res = await fetch("/api/attendance", { method: "POST", body: JSON.stringify(payload) })
    if (res.ok) {
      setStatus("Entry recorded ✅")
    } else {
      const data = await res.json().catch(() => ({}))
      setStatus(`Failed: ${data?.reason || "Unknown error"}`)
    }
  }

  async function submit() {
    await recordGate(value)
    setValue("")
  }

  async function handleScan(text: string) {
    await recordGate(text)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Gate Scan</h1>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Scan the QR on the ID card at the entry gate. You can also manually enter the ID if needed.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900 mb-2">Scan QR</h3>
          <QrScanner onResult={handleScan} />
      </div>

      <div className="rounded-lg border bg-white p-4">
          <label className="block text-sm text-gray-700">
            Person ID (from QR)
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="e.g. S12345"
            />
          </label>
          <button
            onClick={submit}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Record Entry
          </button>
          {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  )
}
