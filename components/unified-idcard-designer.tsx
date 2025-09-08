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
    university: "Your University",
    full_name: "Student Name",
    prn: "PRN-0000",
    enrollment_no: "ENR-123456",
    batch: "2022-26",
    birthdate: "2004-01-01",
    address: "City, State",
    mobile: "+91 90000 00000",
    photo: "",
    qr: "PRN-0000",
  })

  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([])
  const [newFieldKey, setNewFieldKey] = useState("")
  const [newFieldValue, setNewFieldValue] = useState("")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldKey, setEditFieldKey] = useState("")
  const [editFieldValue, setEditFieldValue] = useState("")

  const frontRef = useRef(null)
  const backRef = useRef(null)

  const addCustomField = () => {
    if (!newFieldKey.trim()) return
    setCustomFields((prev) => [...prev, { key: newFieldKey.trim(), value: newFieldValue.trim() }])
    setValues((v) => ({ ...v, [newFieldKey.trim()]: newFieldValue.trim() }))
    setNewFieldKey("")
    setNewFieldValue("")
  }

  const removeCustomField = (key: string) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== key))
    setValues((v) => {
      const next = { ...v }
      delete next[key]
      return next
    })
  }

  const startEditField = (key: string, value: string) => {
    setEditingField(key)
    setEditFieldKey(key)
    setEditFieldValue(value)
  }

  const saveEditField = () => {
    if (!editingField || !editFieldKey.trim()) return
    
    const oldKey = editingField
    const newKey = editFieldKey.trim()
    
    // Update custom fields
    setCustomFields((prev) => 
      prev.map((f) => 
        f.key === oldKey ? { key: newKey, value: editFieldValue.trim() } : f
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <Tabs defaultValue="front">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="front">Front</TabsTrigger>
            <TabsTrigger value="back">Back</TabsTrigger>
          </TabsList>

          <TabsContent value="front">
            <Card className="p-4">
              <div
                ref={frontRef}
                className="mx-auto rounded-md shadow relative"
                style={{
                  width: 350,
                  height: 220,
                  background: palette.bg,
                  color: palette.text,
                }}
              >
                <div className="w-full text-center font-semibold pt-2">{values.university}</div>
                <div className="p-3 grid grid-cols-3 gap-3">
                  <div
                    className="col-span-1 bg-gray-200 rounded overflow-hidden"
                    style={{ width: "100%", height: 100 }}
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
                        No Photo
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1 text-sm leading-5">
                    <div className="font-medium">{values.full_name}</div>
                    <div>PRN: {values.prn}</div>
                    <div>Enroll: {values.enrollment_no}</div>
                    <div>Batch: {values.batch}</div>
                    {customFields.map((f) =>
                      f.key ? (
                        <div key={f.key}>
                          {f.key}: {values[f.key] ?? f.value}
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-6" style={{ background: palette.primary }} />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="back">
            <Card className="p-4">
              <div
                ref={backRef}
                className="mx-auto rounded-md shadow relative"
                style={{
                  width: 350,
                  height: 220,
                  background: palette.muted,
                  color: palette.text,
                }}
              >
                <div className="p-3 text-sm leading-5 space-y-1">
                  <div>DOB: {values.birthdate}</div>
                  <div>Address: {values.address}</div>
                  <div>Mobile: {values.mobile}</div>
                  {customFields.map((f) =>
                    f.key ? (
                      <div key={f.key}>
                        {f.key}: {values[f.key] ?? f.value}
                      </div>
                    ) : null,
                  )}
                </div>
                <div className="absolute right-3 bottom-9 bg-white p-1 rounded">
                  <NoSSR fallback={<div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">QR</div>}>
                    <QRCode value={values.qr || values.prn || "QR"} size={64} />
                  </NoSSR>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-6" style={{ background: palette.accent }} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleDownloadPDF}>Download as PDF</Button>
          <Button type="button" variant="secondary" onClick={() => handleDownloadPNG('front')}>
            Download Front PNG
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleDownloadPNG('back')}>
            Download Back PNG
          </Button>
        </div>
      </div>

      <aside className="space-y-4">
        <Card className="p-4 space-y-3">
          <Label className="text-sm">Template</Label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={cn(
                  "text-left border rounded p-2 text-sm",
                  selectedTemplate?.id === t.id ? "border-foreground" : "border-muted-foreground/20",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Student Information</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to clear all student information fields?")) {
                  setValues({
                    university: "",
                    full_name: "",
                    prn: "",
                    enrollment_no: "",
                    batch: "",
                    birthdate: "",
                    address: "",
                    mobile: "",
                    photo: "",
                    qr: "",
                  })
                }
              }}
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-3">
            {[
              { key: "university", label: "University", placeholder: "University Name" },
              { key: "full_name", label: "Full Name", placeholder: "Student Name" },
              { key: "prn", label: "PRN", placeholder: "PRN-0000" },
              { key: "enrollment_no", label: "Enrollment No", placeholder: "ENR-123456" },
              { key: "batch", label: "Batch", placeholder: "2022-26" },
              { key: "birthdate", label: "Birthdate", placeholder: "2004-01-01" },
              { key: "address", label: "Address", placeholder: "City, State" },
              { key: "mobile", label: "Mobile", placeholder: "+91 90000 00000" },
              { key: "photo", label: "Photo URL", placeholder: "https://example.com/photo.jpg" },
              { key: "qr", label: "QR Code Value", placeholder: "PRN-0000" },
            ].map((field) => (
              <div key={field.key} className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    value={values[field.key as keyof Values] || ""}
                    onChange={(e) => handleChange(field.key as keyof Values, e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
                <div className="flex gap-1 mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentValue = values[field.key as keyof Values] || ""
                      startEditField(field.key, currentValue as string)
                    }}
                    className="h-8 w-8 p-0"
                    title="Edit field"
                  >
                    ✏️
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to clear the ${field.label} field?`)) {
                        handleChange(field.key as keyof Values, "")
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Clear field"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Custom Fields</Label>
            {customFields.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to remove all custom fields?")) {
                    setCustomFields([])
                    setValues((v) => {
                      const next = { ...v }
                      customFields.forEach(f => delete next[f.key])
                      return next
                    })
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="field_key (e.g. program)"
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value)}
            />
            <Input placeholder="value" value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} />
            <Button type="button" onClick={addCustomField}>
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {customFields.map((f) => (
              <div key={f.key} className="space-y-2">
                {editingField === f.key ? (
                  <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                    <div className="flex-1">
                      <Input
                        placeholder="Field key"
                        value={editFieldKey}
                        onChange={(e) => setEditFieldKey(e.target.value)}
                        className="mb-1"
                      />
                      <Input
                        placeholder="Field value"
                        value={editFieldValue}
                        onChange={(e) => setEditFieldValue(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" onClick={saveEditField}>
                        Save
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={cancelEditField}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="w-32 text-xs">{f.key}</Label>
                      <Input
                        value={values[f.key] ?? f.value}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-1 mt-5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEditField(f.key, f.value)}
                        className="h-8 w-8 p-0"
                        title="Edit field"
                      >
                        ✏️
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove the ${f.key} field?`)) {
                            removeCustomField(f.key)
                          }
                        }}
                        className="h-8 w-8 p-0"
                        title="Remove field"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  )
}