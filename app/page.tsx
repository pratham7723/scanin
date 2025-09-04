import Link from "next/link"

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="text-pretty text-3xl font-semibold text-gray-900">
          Design IDs. Scan Attendance. All in one place.
        </h1>
        <p className="mt-3 text-gray-700 leading-relaxed">
          Build ID card templates with drag-and-drop, generate in bulk from CSV, embed unique QR codes, and enforce
          entry-gate-first attendance—then confirm in-class presence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          title="ID Card Designer"
          desc="Drag elements like photo, name, designation, logo, QR."
          href="/idcard-designer"
        />
        <Card title="Bulk Upload" desc="Upload CSV to generate multiple ID cards." href="/upload" />
        <Card title="Gate Scan" desc="Scan at the main gate to enter." href="/scan/gate" />
        <Card title="Classroom Scan" desc="Faculty confirm presence in class." href="/scan/classroom" />
        <Card title="Admin Dashboard" desc="Manage data, view logs, and analyze attendance." href="/admin" />
      </div>
    </div>
  )
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border bg-white p-5 shadow-sm transition hover:shadow">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
      <span className="mt-3 inline-block text-sm font-medium text-blue-600">Open →</span>
    </Link>
  )
}
