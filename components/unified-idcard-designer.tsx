"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { templates as templatesData } from "@/lib/idcard-templates"
import QRCode from "react-qr-code"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import NoSSR from "@/components/no-ssr"

type Values = {
  university?: string
  full_name?: string
  prn?: string
  enrollment_no?: string
  batch?: string
  birthdate?: string
  address?: string
  mobile?: string
  photo?: string
  qr?: string
} & Record<string, string | undefined>

export default function UnifiedIdCardDesigner() {
  const templates = templatesData

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "")
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0],
    [templates, selectedTemplateId],
  )

  const [values, setValues] = useState<Values>({
    university: "University of Technology",
    student_id: "STU-2024-001",
    full_name: "John Doe",
    department: "Computer Science",
    course: "Bachelor of Technology",
    academic_year: "2024-2025",
    valid_until: "2028-05-31",
    photo: "",
    qr: "STU-2024-001",
  })

  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string; type: 'text' | 'textarea' }>>([])
  const [newFieldKey, setNewFieldKey] = useState("")
  const [newFieldValue, setNewFieldValue] = useState("")
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea'>('text')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldKey, setEditFieldKey] = useState("")
  const [editFieldValue, setEditFieldValue] = useState("")
  const [editFieldType, setEditFieldType] = useState<'text' | 'textarea'>('text')
  
  // Add new core element
  const [newCoreElement, setNewCoreElement] = useState({ key: '', text: '', type: 'text' as 'text' | 'image' | 'qr' })
  
  // Text reordering and styling
  const [textElements, setTextElements] = useState<Array<{ id: string; text: string; bold: boolean; order: number; type: 'text' | 'image' | 'qr' }>>([
    { id: 'university', text: 'University Name', bold: true, order: 1, type: 'text' },
    { id: 'student_id', text: 'Student ID', bold: true, order: 2, type: 'text' },
    { id: 'full_name', text: 'Full Name', bold: true, order: 3, type: 'text' },
    { id: 'department', text: 'Department', bold: false, order: 4, type: 'text' },
    { id: 'course', text: 'Course/Program', bold: false, order: 5, type: 'text' },
    { id: 'academic_year', text: 'Academic Year', bold: false, order: 6, type: 'text' },
    { id: 'valid_until', text: 'Valid Until', bold: false, order: 7, type: 'text' },
    { id: 'photo', text: 'Student Photo', bold: false, order: 8, type: 'image' },
    { id: 'qr', text: 'QR Code', bold: false, order: 9, type: 'qr' },
  ])

  const frontRef = useRef(null)
  const backRef = useRef(null)

  const addCustomField = () => {
    if (!newFieldKey.trim()) return
    setCustomFields((prev) => [...prev, { key: newFieldKey.trim(), value: newFieldValue.trim(), type: newFieldType }])
    setValues((v) => ({ ...v, [newFieldKey.trim()]: newFieldValue.trim() }))
    setNewFieldKey("")
    setNewFieldValue("")
    setNewFieldType('text')
  }

  const removeCustomField = (key: string) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== key))
    setValues((v) => {
      const next = { ...v }
      delete next[key]
      return next
    })
  }

  const startEditField = (key: string, value: string, type: 'text' | 'textarea' = 'text') => {
    setEditingField(key)
    setEditFieldKey(key)
    setEditFieldValue(value)
    setEditFieldType(type)
  }

  const saveEditField = () => {
    if (!editingField || !editFieldKey.trim()) return
    
    const oldKey = editingField
    const newKey = editFieldKey.trim()
    
    // Update custom fields
    setCustomFields((prev) => 
      prev.map((f) => 
        f.key === oldKey ? { key: newKey, value: editFieldValue.trim(), type: editFieldType } : f
      )
    )
    
    // Update values
    setValues((v) => {
      const next = { ...v }
      if (oldKey !== newKey) {
        delete next[oldKey]
      }
      next[newKey] = editFieldValue.trim()
      return next
    })
    
    // Reset edit state
    setEditingField(null)
    setEditFieldKey("")
    setEditFieldValue("")
  }

  const cancelEditField = () => {
    setEditingField(null)
    setEditFieldKey("")
    setEditFieldValue("")
    setEditFieldType('text')
  }

  const moveFieldUp = (index: number) => {
    if (index > 0) {
      setCustomFields((prev) => {
        const newFields = [...prev]
        const temp = newFields[index]
        newFields[index] = newFields[index - 1]
        newFields[index - 1] = temp
        return newFields
      })
    }
  }

  const moveFieldDown = (index: number) => {
    setCustomFields((prev) => {
      if (index < prev.length - 1) {
        const newFields = [...prev]
        const temp = newFields[index]
        newFields[index] = newFields[index + 1]
        newFields[index + 1] = temp
        return newFields
      }
      return prev
    })
  }

  // Text element functions
  const moveTextUp = (index: number) => {
    if (index > 0) {
      setTextElements((prev) => {
        const newElements = [...prev]
        const temp = newElements[index]
        newElements[index] = newElements[index - 1]
        newElements[index - 1] = temp
        // Update order numbers
        return newElements.map((el, idx) => ({ ...el, order: idx + 1 }))
      })
    }
  }

  const moveTextDown = (index: number) => {
    setTextElements((prev) => {
      if (index < prev.length - 1) {
        const newElements = [...prev]
        const temp = newElements[index]
        newElements[index] = newElements[index + 1]
        newElements[index + 1] = temp
        // Update order numbers
        return newElements.map((el, idx) => ({ ...el, order: idx + 1 }))
      }
      return prev
    })
  }

  const toggleTextBold = (id: string) => {
    setTextElements((prev) => 
      prev.map((el) => 
        el.id === id ? { ...el, bold: !el.bold } : el
      )
    )
  }

  const deleteCoreElement = (id: string) => {
    if (confirm(`Are you sure you want to delete the ${id} element?`)) {
      setTextElements((prev) => prev.filter((el) => el.id !== id))
      setValues((v) => {
        const next = { ...v }
        delete next[id as keyof Values]
        return next
      })
    }
  }

  const addCoreElement = () => {
    if (!newCoreElement.key.trim() || !newCoreElement.text.trim()) return
    
    const newElement = {
      id: newCoreElement.key.trim(),
      text: newCoreElement.text.trim(),
      bold: false,
      order: textElements.length + 1,
      type: newCoreElement.type
    }
    
    setTextElements((prev) => [...prev, newElement])
    setValues((v) => ({ ...v, [newCoreElement.key.trim()]: "" }))
    setNewCoreElement({ key: '', text: '', type: 'text' })
  }

  const handleChange = (key: keyof Values, val: string) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 36
    const cardRatio = 0.63

    const frontImg = await html2canvas(frontRef.current, { backgroundColor: null, scale: 2 }).then((canvas) =>
      canvas.toDataURL("image/png"),
    )
    const backImg = await html2canvas(backRef.current, { backgroundColor: null, scale: 2 }).then((canvas) =>
      canvas.toDataURL("image/png"),
    )

    if (frontImg) {
      const w = pageWidth - margin * 2
      const h = w * cardRatio
      pdf.addImage(frontImg, "PNG", margin, margin, w, h)
    }
    pdf.addPage()
    if (backImg) {
      const w = pageWidth - margin * 2
      const h = w * cardRatio
      pdf.addImage(backImg, "PNG", margin, margin, w, h)
    }

    pdf.save("idcard.pdf")
  }

  const handleDownloadPNG = async (side: 'front' | 'back') => {
    const ref = side === 'front' ? frontRef : backRef
    const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 2 })
    const link = document.createElement('a')
    link.download = `idcard_${side}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const palette = {
    primary: selectedTemplate?.colors?.primary || "#1d4ed8",
    accent: selectedTemplate?.colors?.accent || "#029e74",
    bg: "#ffffff",
    muted: "#f3f4f6",
    text: selectedTemplate?.colors?.neutral || "#111827",
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ID Card Designer</h1>
        <p className="text-gray-600">Create professional student ID cards with custom templates and fields</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Card Preview</h2>
            
            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Choose Template</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTemplate?.id === t.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front Side */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700">Front Side</h3>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div
                    ref={frontRef}
                    className="mx-auto rounded-lg shadow-lg relative"
                    style={{
                      width: 300,
                      height: 190,
                      background: palette.bg,
                      color: palette.text,
                    }}
                  >
                {/* Header */}
                <div className={`w-full text-center pt-3 pb-2 ${textElements.find(e => e.id === 'university')?.bold ? 'font-bold' : 'font-semibold'} text-white`} style={{ background: palette.primary }}>
                  {values.university}
                </div>
                
                <div className="p-4 grid grid-cols-3 gap-4">
                  {/* Photo Section */}
                  <div className="col-span-1">
                    <div
                      className="bg-gray-200 rounded overflow-hidden border-2 border-gray-300"
                      style={{ width: "100%", height: 120 }}
                    >
                      {values.photo ? (
                        <img
                          src={values.photo || "/placeholder.svg"}
                          alt="Student photo"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          Student Photo
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Student Info */}
                  <div className="col-span-2 space-y-2 text-sm">
                    <div className={`text-lg ${textElements.find(e => e.id === 'full_name')?.bold ? 'font-bold' : 'font-semibold'}`}>
                      {values.full_name}
                    </div>
                    <div className={textElements.find(e => e.id === 'student_id')?.bold ? 'font-bold' : 'font-medium'}>
                      ID: {values.student_id}
                    </div>
                    <div className={textElements.find(e => e.id === 'department')?.bold ? 'font-bold' : 'font-normal'}>
                      {values.department}
                    </div>
                    <div className={textElements.find(e => e.id === 'course')?.bold ? 'font-bold' : 'font-normal'}>
                      {values.course}
                    </div>
                    <div className={textElements.find(e => e.id === 'academic_year')?.bold ? 'font-bold' : 'font-normal'}>
                      {values.academic_year}
                    </div>
                    {customFields.map((f) =>
                      f.key ? (
                        <div key={f.key} className="text-xs">
                          {f.key}: {values[f.key] ?? f.value}
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
                
                {/* QR Code Section */}
                <div className="absolute right-4 top-4">
                  <div className="bg-white p-2 rounded border">
                    <NoSSR fallback={<div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">QR</div>}>
                      <QRCode value={values.qr || values.student_id || "QR"} size={64} />
                    </NoSSR>
                  </div>
                </div>
                    <div className="absolute bottom-0 left-0 right-0 h-6" style={{ background: palette.primary }} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => handleDownloadPNG('front')} size="sm" variant="outline">
                    Download Front
                  </Button>
                </div>
              </div>

              {/* Back Side */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700">Back Side</h3>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div
                    ref={backRef}
                    className="mx-auto rounded-lg shadow-lg relative"
                    style={{
                      width: 300,
                      height: 190,
                      background: palette.muted,
                      color: palette.text,
                    }}
                  >
                {/* Header */}
                <div className="w-full text-center pt-3 pb-2 font-semibold text-white" style={{ background: palette.accent }}>
                  Student Information
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Student ID</div>
                      <div className={textElements.find(e => e.id === 'student_id')?.bold ? 'font-bold' : 'font-medium'}>
                        {values.student_id}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Valid Until</div>
                      <div className={textElements.find(e => e.id === 'valid_until')?.bold ? 'font-bold' : 'font-medium'}>
                        {values.valid_until}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600 mb-1">Department</div>
                      <div className={textElements.find(e => e.id === 'department')?.bold ? 'font-bold' : 'font-medium'}>
                        {values.department}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600 mb-1">Course/Program</div>
                      <div className={textElements.find(e => e.id === 'course')?.bold ? 'font-bold' : 'font-medium'}>
                        {values.course}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Academic Year</div>
                      <div className={textElements.find(e => e.id === 'academic_year')?.bold ? 'font-bold' : 'font-medium'}>
                        {values.academic_year}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Full Name</div>
                      <div className={textElements.find(e => e.id === 'full_name')?.bold ? 'font-bold' : 'font-medium'}>
                        {values.full_name}
                      </div>
                    </div>
                  </div>
                  
                  {customFields.map((f) =>
                    f.key ? (
                      <div key={f.key} className="text-sm">
                        <div className="text-xs text-gray-600 mb-1">{f.key}</div>
                        <div>{values[f.key] ?? f.value}</div>
                      </div>
                    ) : null,
                  )}
                </div>
                
                {/* QR Code */}
                <div className="absolute right-4 bottom-4">
                  <div className="bg-white p-2 rounded border">
                    <NoSSR fallback={<div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">QR</div>}>
                      <QRCode value={values.qr || values.student_id || "QR"} size={64} />
                    </NoSSR>
                  </div>
                </div>
                
                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center text-white text-xs" style={{ background: palette.accent }}>
                      Valid Student ID Card
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => handleDownloadPNG('back')} size="sm" variant="outline">
                    Download Back
                  </Button>
                </div>
              </div>
            </div>

            {/* Download Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
                  Download Complete PDF
                </Button>
                <Button onClick={() => handleDownloadPNG('front')} variant="outline">
                  Download Front PNG
                </Button>
                <Button onClick={() => handleDownloadPNG('back')} variant="outline">
                  Download Back PNG
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Card Elements</h2>
            
            {/* Clear All Button */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all data?")) {
                    setValues({
                      university: "",
                      student_id: "",
                      full_name: "",
                      department: "",
                      course: "",
                      academic_year: "",
                      valid_until: "",
                      photo: "",
                      qr: "",
                    })
                    setCustomFields([])
                  }
                }}
                className="w-full"
              >
                Clear All Data
              </Button>
            </div>

            {/* Core Elements */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Edit Card Information</h3>
              
              {textElements
                .sort((a, b) => a.order - b.order)
                .map((element, index) => (
                  <div key={element.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {element.text}
                        {element.type === 'text' && (
                          <button
                            onClick={() => toggleTextBold(element.id)}
                            className={`ml-2 px-2 py-1 text-xs rounded ${
                              element.bold ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {element.bold ? 'Bold' : 'Normal'}
                          </button>
                        )}
                      </label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveTextUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveTextDown(index)}
                          disabled={index === textElements.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => deleteCoreElement(element.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {element.type === 'image' ? (
                      <Input
                        value={values[element.id as keyof Values] || ""}
                        onChange={(e) => handleChange(element.id as keyof Values, e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full"
                      />
                    ) : element.type === 'qr' ? (
                      <Input
                        value={values[element.id as keyof Values] || ""}
                        onChange={(e) => handleChange(element.id as keyof Values, e.target.value)}
                        placeholder="QR code value"
                        className="w-full"
                      />
                    ) : (
                      <Input
                        value={values[element.id as keyof Values] || ""}
                        onChange={(e) => handleChange(element.id as keyof Values, e.target.value)}
                        placeholder={`Enter ${element.text.toLowerCase()}`}
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
            </div>

            {/* Add Custom Fields */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add Custom Fields</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Field name (e.g. Program)"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as 'text' | 'textarea')}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Text Area</option>
                  </select>
                  <Button onClick={addCustomField} size="sm">
                    Add
                  </Button>
                </div>
                
                {newFieldType === 'textarea' ? (
                  <textarea
                    placeholder="Enter value..."
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                ) : (
                  <Input 
                    placeholder="Enter value..." 
                    value={newFieldValue} 
                    onChange={(e) => setNewFieldValue(e.target.value)} 
                  />
                )}
              </div>

              {/* Custom Fields List */}
              {customFields.length > 0 && (
                <div className="mt-4 space-y-2">
                  {customFields.map((f, index) => (
                    <div key={f.key} className="flex items-center gap-2 p-3 border rounded bg-gray-50">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 mb-1">{f.key}</div>
                        {f.type === 'textarea' ? (
                          <textarea
                            value={values[f.key] ?? f.value}
                            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                            className="w-full px-2 py-1 border rounded text-sm"
                            rows={2}
                          />
                        ) : (
                          <Input
                            value={values[f.key] ?? f.value}
                            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                            className="text-sm"
                          />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${f.key}?`)) {
                            removeCustomField(f.key)
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Remove field"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}