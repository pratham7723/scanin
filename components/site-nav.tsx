"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import UserMenu from "@/components/user-menu"

const links = [
  { href: "/", label: "Home" },
  { href: "/idcard-designer", label: "ID Cards" },
  { href: "/canva-editor", label: "Canva Editor" },
  { href: "/upload", label: "Bulk Upload" },
  { href: "/scan/gate", label: "Gate Scan" },
  { href: "/scan/classroom", label: "Class Scan" },
  { href: "/faculty", label: "Faculty" },
  { href: "/analytics", label: "Analytics" },
  { href: "/admin", label: "Admin" },
]

export function SiteNav() {
  const pathname = usePathname()
  const { isAuthenticated, user, isAdmin, isFaculty } = useAuth()

  // Filter links based on user role
  const getVisibleLinks = () => {
    if (!isAuthenticated) return []
    
    const baseLinks = [
      { href: "/", label: "Home" },
      { href: "/idcard-designer", label: "ID Cards" },
      { href: "/canva-editor", label: "Canva Editor" },
      { href: "/upload", label: "Bulk Upload" },
    ]

    if (isFaculty || isAdmin) {
      baseLinks.push(
        { href: "/scan/gate", label: "Gate Scan" },
        { href: "/scan/classroom", label: "Class Scan" },
        { href: "/faculty", label: "Faculty" },
        { href: "/analytics", label: "Analytics" }
      )
    }

    if (isAdmin) {
      baseLinks.push({ href: "/admin", label: "Admin" })
    }

    return baseLinks
  }

  const visibleLinks = getVisibleLinks()

  return (
    <header className="w-full border-b bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-blue-600">
          ID & Attendance
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <ul className="flex items-center gap-3">
                {visibleLinks.map((l) => (
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
              <UserMenu />
            </>
          ) : (
            <Link
              href="/auth"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
