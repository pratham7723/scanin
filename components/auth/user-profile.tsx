'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, User, Settings, Save, Trash2, Eye, EyeOff } from 'lucide-react'

interface User {
  id: string
  email: string
}

interface Profile {
  id: string
  full_name: string
  role: string
}

interface UserTemplate {
  id: string
  name: string
  description: string
  template_data: any
  is_public: boolean
  created_at: string
  updated_at: string
}

interface UserProfileProps {
  user: User
  profile: Profile
  onLogout: () => void
  onLoadTemplate?: (template: UserTemplate) => void
}

export function UserProfile({ user, profile, onLogout, onLoadTemplate }: UserProfileProps) {
  const [templates, setTemplates] = useState<UserTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    fetchUserTemplates()
  }, [])

  const fetchUserTemplates = async () => {
    try {
      const response = await fetch('/api/templates/user')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      onLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/templates/user?id=${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Delete template failed:', error)
      alert('Failed to delete template')
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {/* User Info */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-sm">
          <div className="font-medium text-gray-900">{profile.full_name}</div>
          <div className="text-gray-500 capitalize">{profile.role}</div>
        </div>
      </div>

      {/* Templates Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowTemplates(!showTemplates)}
        className="flex items-center space-x-1"
      >
        <Save className="w-4 h-4" />
        <span>My Templates</span>
        {showTemplates ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>

      {/* Logout Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="flex items-center space-x-1"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </Button>

      {/* Templates Dropdown */}
      {showTemplates && (
        <div className="absolute top-16 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">My Templates</h3>
            <p className="text-sm text-gray-500">Manage your saved templates</p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No templates saved yet</div>
            ) : (
              <div className="p-2 space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {template.name}
                        </h4>
                        {template.description && (
                          <p className="text-sm text-gray-500 truncate">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(template.updated_at).toLocaleDateString()}
                          </span>
                          {template.is_public && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {onLoadTemplate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onLoadTemplate(template)}
                            className="h-8 w-8 p-0"
                            title="Load template"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
