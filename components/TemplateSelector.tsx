'use client'

import { useTemplateManager } from '@/hooks/useTemplateManager'

interface TemplateSelectorProps {
  selectedTemplateId: string
  onTemplateChange: (templateId: string) => void
}

export default function TemplateSelector({ selectedTemplateId, onTemplateChange }: TemplateSelectorProps) {
  const { allTemplates, loadingAdminTemplates, refreshTemplatesList } = useTemplateManager()

  // Separate default and admin templates
  const defaultTemplates = allTemplates.filter(t => !t.created_by)
  const userTemplates = allTemplates.filter(t => t.created_by)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Template
        </label>
        <button
          onClick={refreshTemplatesList}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>
      <select
        value={selectedTemplateId}
        onChange={(e) => onTemplateChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {/* Default Templates */}
        {defaultTemplates.length > 0 && (
          <optgroup label="Default Templates">
            {defaultTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </optgroup>
        )}

        {/* User/Admin Templates */}
        {loadingAdminTemplates ? (
          <optgroup label="Loading Templates...">
            <option disabled>Loading...</option>
          </optgroup>
        ) : userTemplates.length > 0 ? (
          <optgroup label="Saved Templates">
            {userTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </optgroup>
        ) : (
          <optgroup label="No Saved Templates">
            <option disabled>No saved templates found</option>
          </optgroup>
        )}
      </select>
    </div>
  )
}
