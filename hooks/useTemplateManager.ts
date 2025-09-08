import { useState, useEffect, useCallback } from 'react'
import { templates as defaultTemplates } from '@/lib/idcard-templates'

export interface Template {
  id: string
  name: string
  description?: string
  is_public?: boolean
  created_at?: string
  updated_at?: string
  created_by?: string
  template_data?: any
  colors?: any
  sides?: any
}

export const useTemplateManager = () => {
  const [adminTemplates, setAdminTemplates] = useState<Template[]>([])
  const [loadingAdminTemplates, setLoadingAdminTemplates] = useState(false)
  const [refreshTemplates, setRefreshTemplates] = useState(0)

  // Combine default and admin templates
  const allTemplates = [...defaultTemplates, ...adminTemplates]

  // Fetch admin templates from API
  const fetchAdminTemplates = useCallback(async () => {
    try {
      setLoadingAdminTemplates(true)
      const response = await fetch('/api/templates')

      if (response.ok) {
        const data = await response.json()
        const templatesArray = Array.isArray(data) ? data : []
        setAdminTemplates(templatesArray)
      } else {
        setAdminTemplates([])
      }
    } catch (error) {
      console.error('Error fetching admin templates:', error)
      setAdminTemplates([])
    } finally {
      setLoadingAdminTemplates(false)
    }
  }, [])

  // Refresh templates (trigger re-fetch)
  const refreshTemplatesList = useCallback(() => {
    setRefreshTemplates(prev => prev + 1)
  }, [])

  // Save template
  const saveTemplate = useCallback(async (templateData: any) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      })

      if (response.ok) {
        const savedTemplate = await response.json()
        console.log('Template saved:', savedTemplate)
        // Refresh the templates list
        refreshTemplatesList()
        return { success: true, template: savedTemplate }
      } else {
        throw new Error('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      return { success: false, error: error.message }
    }
  }, [refreshTemplatesList])

  // Fetch templates on mount and when refresh is triggered
  useEffect(() => {
    fetchAdminTemplates()
  }, [fetchAdminTemplates, refreshTemplates])

  return {
    allTemplates,
    adminTemplates,
    loadingAdminTemplates,
    refreshTemplatesList,
    saveTemplate
  }
}
