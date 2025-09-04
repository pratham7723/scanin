"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home" },
  { href: "/idcard-designer", label: "ID Cards" },
  { href: "/upload", label: "Bulk Upload" },
  { href: "/scan/gate", label: "Gate Scan" },
  { href: "/scan/classroom", label: "Class Scan" },
  { href: "/faculty", label: "Faculty" },
  { href: "/analytics", label: "Analytics" },
  { href: "/admin", label: "Admin" },
]

export function SiteNav() {
  const pathname = usePathname()
  return (
    <header className="w-full border-b bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-blue-600">
          ID & Attendance
        </Link>
        <ul className="flex items-center gap-3">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100",
                  pathname === l.href && "bg-blue-50 text-blue-700",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
