'use client'

import { useState, useEffect } from 'react'
import CanvasEditor from '@/components/canva-editor'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Save, Eye, Edit3, FileText, Menu, X } from 'lucide-react'


export default function CanvaEditorPage() {
  const [studentData, setStudentData] = useState({
    full_name: 'John Doe',
    prn: 'STU-2024-001',
    enrollment_no: 'ENR-123456',
    batch: '2022-26',
    university: 'University of Technology',
    department: 'Computer Science',
    birthdate: '2004-01-01',
    address: 'City, State',
    mobile: '+91 90000 00000',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    qr: 'STU-2024-001'
  })

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentTemplateData, setCurrentTemplateData] = useState<any>(null)

  const handleSave = (elements: any[]) => {
    console.log('Elements saved:', elements)
  }

  const handleExport = (format: 'png' | 'pdf') => {
    console.log(`Exporting as ${format.toUpperCase()}`)
    alert(`Exporting as ${format.toUpperCase()}... (This would generate and download the file)`)
  }

  const handleSaveTemplate = async (templateData: any) => {
    setTemplateName(templateData.name || 'My Template')
    setShowTemplateModal(true)
    // Store the template data for saving
    setCurrentTemplateData(templateData)
  }

  const handleSaveTemplateConfirm = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          template_data: currentTemplateData || { elements: [], front_elements: [], back_elements: [], main_background: {} },
          is_public: isPublic
        })
      })

      if (response.ok) {
        alert(`Template "${templateName}" saved successfully!\n\nYou can find it in:\n• Templates list (if public)\n• Your saved templates\n• Use it for bulk uploads`)
        setShowTemplateModal(false)
        setTemplateName('')
        setIsPublic(false)
        setCurrentTemplateData(null)
        // Templates will be refreshed automatically by the CanvasEditor component
      } else {
        throw new Error('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    }
  }


  const handleGenerateCSV = async (templateData: any) => {
    try {
      // Get current template elements from the editor
      const currentElements = templateData.elements || []
      
      // Extract dynamic fields from current template
      const dynamicFields = currentElements
        .filter((element: any) => element.isDynamic && element.dataField)
        .map((element: any) => element.dataField)
        .filter((field: string, index: number, arr: string[]) => arr.indexOf(field) === index) // Remove duplicates
      
      const response = await fetch('/api/generate-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: templateData.id || 'current',
          templateData: templateData,
          dynamicFields: dynamicFields,
          sampleCount: 1
        })
      })

      if (response.ok) {
        // Get CSV content from response
        const csv = await response.text()
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${templateData.name || 'template'}_sample.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        alert('Sample CSV generated successfully!')
      } else {
        throw new Error('Failed to generate CSV')
      }
    } catch (error) {
      console.error('Error generating CSV:', error)
      alert('Failed to generate CSV. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ID Card Editor</h1>
            <p className="text-sm text-gray-600">Design professional ID cards</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden"
            >
              {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <div className="flex border border-gray-300 rounded-md">
              <Button
                variant={viewMode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="rounded-r-none border-r border-gray-300"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="rounded-l-none"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Mobile Overlay */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`w-1/5 bg-white border-r border-gray-200 p-3 overflow-y-auto flex-shrink-0 ${showSidebar ? 'block' : 'hidden'} lg:block z-50 lg:z-auto`}>
          <div className="space-y-2">
            {/* Template Actions */}
            <Card className="p-2">
              <h3 className="font-semibold mb-2 text-xs">Actions</h3>
              
              <div className="space-y-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowTemplateModal(true)}
                  className="w-full text-xs h-6"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleGenerateCSV({ id: 'current', name: 'Current Template' })}
                  className="w-full text-xs h-6"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>
            </Card>

            <Card className="p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-xs">Student Info</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setStudentData({
                    full_name: 'John Doe',
                    prn: 'STU-2024-001',
                    enrollment_no: 'ENR-123456',
                    batch: '2022-26',
                    university: 'University of Technology',
                    department: 'Computer Science',
                    birthdate: '2004-01-01',
                    address: 'City, State',
                    mobile: '+91 90000 00000',
                    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                    qr: 'STU-2024-001'
                  })}
                  className="text-xs px-1 py-1 h-6"
                >
                  Reset
                </Button>
              </div>
                
                <div className="space-y-1">
                  <div>
                    <Label htmlFor="full_name" className="text-xs">Name</Label>
                    <Input
                      id="full_name"
                      value={studentData.full_name}
                      onChange={(e) => setStudentData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Name"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prn" className="text-xs">PRN</Label>
                    <Input
                      id="prn"
                      value={studentData.prn}
                      onChange={(e) => setStudentData(prev => ({ ...prev, prn: e.target.value }))}
                      placeholder="PRN"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="enrollment_no" className="text-xs">Enroll</Label>
                    <Input
                      id="enrollment_no"
                      value={studentData.enrollment_no}
                      onChange={(e) => setStudentData(prev => ({ ...prev, enrollment_no: e.target.value }))}
                      placeholder="Enroll"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="batch" className="text-xs">Batch</Label>
                    <Input
                      id="batch"
                      value={studentData.batch}
                      onChange={(e) => setStudentData(prev => ({ ...prev, batch: e.target.value }))}
                      placeholder="Batch"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="university" className="text-xs">Uni</Label>
                    <Input
                      id="university"
                      value={studentData.university}
                      onChange={(e) => setStudentData(prev => ({ ...prev, university: e.target.value }))}
                      placeholder="University"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-xs">Dept</Label>
                    <Input
                      id="department"
                      value={studentData.department}
                      onChange={(e) => setStudentData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Department"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthdate" className="text-xs">DOB</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={studentData.birthdate}
                      onChange={(e) => setStudentData(prev => ({ ...prev, birthdate: e.target.value }))}
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-xs">Address</Label>
                    <Input
                      id="address"
                      value={studentData.address}
                      onChange={(e) => setStudentData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Address"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile" className="text-xs">Mobile</Label>
                    <Input
                      id="mobile"
                      value={studentData.mobile}
                      onChange={(e) => setStudentData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="Mobile"
                      className="text-xs h-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="photo" className="text-xs">Photo</Label>
                    <Input
                      id="photo"
                      value={studentData.photo}
                      onChange={(e) => setStudentData(prev => ({ ...prev, photo: e.target.value }))}
                      placeholder="Photo URL"
                      className="text-xs h-6"
                    />
                  </div>
                </div>
              </Card>

          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {viewMode === 'edit' ? (
            <ErrorBoundary>
              <CanvasEditor
                initialData={studentData}
                onSave={handleSave}
                onExport={handleExport}
                onSaveTemplate={handleSaveTemplate}
                onGenerateCSV={handleGenerateCSV}
              />
            </ErrorBoundary>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Preview Mode</h3>
                <p className="text-gray-600 mb-4">This would show a preview of the ID card</p>
                <Button onClick={() => setViewMode('edit')}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Back to Edit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Save Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Save Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Save your current ID card design as a reusable template.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is-public">Make this template public</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateModal(false)
                  setTemplateName('')
                  setIsPublic(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplateConfirm}
                disabled={!templateName.trim()}
              >
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
