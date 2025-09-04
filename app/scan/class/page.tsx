"use client"

import QrScanner from "@/components/qr-scanner"

export default function ClassScanPage() {
  async function handleResult(text: string) {
    const personId = (text || "").toString()
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({ type: "classroom", personId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j?.reason || "Class scan failed (gate not scanned?)")
        return
      }
      alert("Class scan recorded")
    } catch {
      alert("Failed to record class scan")
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Class Scan</h1>
      <p className="text-muted-foreground mb-6">Gate must be scanned before class entry.</p>
      <QrScanner onResult={handleResult} />
    </main>
  )
}
