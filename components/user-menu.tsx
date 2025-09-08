'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isAdmin, isFaculty, isStudent } = useAuth()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    window.location.href = '/auth'
  }

  const getRoleColor = () => {
    if (isAdmin) return 'text-red-600 bg-red-100'
    if (isFaculty) return 'text-blue-600 bg-blue-100'
    if (isStudent) return 'text-green-600 bg-green-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin'
    if (isFaculty) return 'Faculty'
    if (isStudent) return 'Student'
    return 'User'
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100"
      >
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium">{user.full_name}</div>
          <div className={`text-xs px-2 py-1 rounded-full ${getRoleColor()}`}>
            {getRoleLabel()}
          </div>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
            <div className="py-1">
              <div className="px-4 py-2 border-b">
                <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to settings or profile
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/admin'
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-3" />
                  Admin Panel
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
