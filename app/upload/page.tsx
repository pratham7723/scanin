"use client"

import { useState, useRef } from "react"
import Papa from "papaparse"
import useSWR, { mutate } from "swr"
import type { Dataset } from "@/lib/types"
import { getDefaultTemplates } from "@/lib/template-utils"
import QRCode from "react-qr-code"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UploadPage() {
  const [name, setName] = useState("Student List")
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [photos, setPhotos] = useState<{ file: string; url: string }[]>([])
  const [mapSummary, setMapSummary] = useState<string | null>(null)
  const [unmappedPhotos, setUnmappedPhotos] = useState<string[]>([])
  const [savedDatasetId, setSavedDatasetId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCards, setGeneratedCards] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)
  const [selectedSide, setSelectedSide] = useState<"front" | "back">("front")
  const [selectedTemplateId, setSelectedTemplateId] = useState("uni-standard")
  const cardRef = useRef<HTMLDivElement>(null)

  const { data: datasets } = useSWR("/api/datasets", fetcher)

  // Use templates from template-utils.ts
  const workingTemplates = getDefaultTemplates().reduce((acc, template) => {
    acc[template.id] = template
    return acc
  }, {} as Record<string, any>)

  // Get the current template
  const currentTemplate = workingTemplates[selectedTemplateId as keyof typeof workingTemplates] || workingTemplates["uni-standard"]
  
  // Template is now working correctly

  // Get the current card data
  const currentCard = generatedCards[selectedCardIndex] || {}
  
  // Debug logging
  console.log("Current card data:", currentCard)
  console.log("Generated cards:", generatedCards)
  console.log("Photo URL in current card:", currentCard.photo_url)
  console.log("Photo field in current card:", currentCard.photo)

  async function downloadCard(side: "front" | "back") {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      })
      
      const imgData = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `${currentCard?.name || "idcard"}_${side}.png`
      link.href = imgData
      link.click()
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download card")
    }
  }

  async function printCard(side: "front" | "back") {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      })
      
      const imgData = canvas.toDataURL("image/png")
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print ID Card - ${side}</title></head>
            <body style="margin:0; padding:20px; display:flex; justify-content:center; align-items:center; min-height:100vh;">
              <img src="${imgData}" style="max-width:100%; max-height:100%;" />
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error("Print failed:", error)
      alert("Failed to print card")
    }
  }

  async function downloadAllCards() {
    if (generatedCards.length === 0) return

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [86, 54] // Standard ID card size
      })

      for (let i = 0; i < generatedCards.length; i++) {
        if (i > 0) pdf.addPage()
        
        // Generate front side
        setSelectedCardIndex(i)
        setSelectedSide("front")
        await new Promise(resolve => setTimeout(resolve, 100)) // Wait for state update
        
        if (cardRef.current) {
          const canvas = await html2canvas(cardRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true
          })
          const imgData = canvas.toDataURL("image/png")
          pdf.addImage(imgData, "PNG", 0, 0, 86, 54)
        }
      }

      pdf.save("id_cards_front.pdf")
    } catch (error) {
      console.error("PDF generation failed:", error)
      alert("Failed to generate PDF")
    }
  }

  // Function to generate blob storage URL from filename
  const generatePhotoUrl = (filename: string): string => {
    if (!filename) return ""
    if (filename.startsWith('http') || filename.startsWith('blob:') || filename.startsWith('data:')) {
      return filename
    }
    const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_STORE_URL || 'https://blob.vercel-storage.com'
    return `${blobBaseUrl}/student-photos/${filename}`
  }

  // Function to download CSV template
  const downloadCSVTemplate = () => {
    const csvHeaders = [
      'university',
      'full_name', 
      'prn',
      'enrollment_no',
      'batch',
      'department',
      'birthdate',
      'address',
      'mobile',
      'photo_url'
    ]
    
    const sampleData = [
      'Your University',
      'John Doe',
      'STU-2024-001',
      'ENR-123456',
      '2022-26',
      'Computer Science',
      '2004-01-01',
      '123 Main St, City, State',
      '+91 90000 00000',
      'john_doe.jpg'
    ]
    
    const csvContent = [
      csvHeaders.join(','),
      sampleData.join(','),
      // Add empty rows for user to fill
      csvHeaders.map(() => '').join(','),
      csvHeaders.map(() => '').join(','),
      csvHeaders.map(() => '').join(',')
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_data_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Function to manually map photos to students
  const mapPhotosToStudents = () => {
    if (!photos.length || !rows.length) return
    
    console.log("Manually mapping photos to students...")
    console.log("Available photos:", photos)
    console.log("Current rows:", rows)
    
    let hits = 0
    const usedPhotos = new Set<string>()
    const next = rows.map((r) => {
      // First, try to match by explicit photo file column
      const photoFileCol = r.photo_file || r.photo || r["photo file"] || r.photo_url || r.image
      console.log(`Trying to match photo for row:`, { photoFileCol, availablePhotos: photos.map(p => p.file) })
      let match: { file: string; url: string } | undefined
      if (photoFileCol) {
        match = photos.find((it) => it.file === photoFileCol)
        console.log(`Exact match result:`, match)
      }
      
      // If no explicit match, try to match by various ID fields
      if (!match) {
        const idFields = [
          r.studentId, r.id, r.rollNo, r.roll_no, r.student_id, 
          r.enrollment_no, r.enrollmentNo, r.prn, r.reg_no, r.regNo,
          r.name, r.full_name, r.fullName, r.student_name
        ].filter(Boolean)
        
        for (const id of idFields) {
          if (id) {
            // Try exact match first
            match = photos.find((it) => {
              const base = it.file.replace(/\.[a-zA-Z0-9]+$/, "")
              return base.toLowerCase() === id.toString().toLowerCase()
            })
            
            // If no exact match, try partial match
            if (!match) {
              match = photos.find((it) => {
                const base = it.file.replace(/\.[a-zA-Z0-9]+$/, "").toLowerCase()
                const idStr = id.toString().toLowerCase()
                return base.includes(idStr) || idStr.includes(base)
              })
            }
            
            if (match) break
          }
        }
      }
      
      if (match && !usedPhotos.has(match.file)) {
        usedPhotos.add(match.file)
        hits++
        return { ...r, photo_url: match.url }
      }
      return r
    })
    
    setRows(next)
    setMapSummary(`Mapped ${hits} photos to students`)
    console.log(`Photo mapping complete: ${hits} matches found`)
  }

  async function previewDataset(dataset: any) {
    try {
      // Map the dataset rows to the same format as generated cards
      const students = dataset.rows.map((row: any) => ({
        ...row,
        // Map common field names to template fields
        university: row.university || row.institution || "Your University",
        full_name: row.full_name || row.name || row.student_name || row.fullName || "",
        prn: row.prn || row.student_id || row.id || row.rollNo || row.roll_no || "",
        enrollment_no: row.enrollment_no || row.enrollmentNo || row.enroll_no || "",
        batch: row.batch || row.year || row.class || "",
        department: row.department || row.dept || row.department_name || "",
        birthdate: row.birthdate || row.dob || row.date_of_birth || "",
        address: row.address || row.location || "",
        mobile: row.mobile || row.phone || row.contact || "",
        photo: row.photo_url || row.photo || row.photo_file || "",
        photo_url: row.photo_url || row.photo || row.photo_file || "",
        qr: row.prn || row.student_id || row.id || row.rollNo || row.roll_no || ""
      }))

      setGeneratedCards(students)
      setShowPreview(true)
      setSelectedCardIndex(0)
      setSelectedSide("front")
    } catch (error) {
      console.error("Failed to preview dataset:", error)
      alert("Failed to preview dataset")
    }
  }

  async function deleteDataset(datasetId: string) {
    if (!confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`/api/datasets?id=${datasetId}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        throw new Error("Failed to delete dataset")
      }

      await mutate("/api/datasets")
      alert("Dataset deleted successfully")
    } catch (error) {
      console.error("Failed to delete dataset:", error)
      alert("Failed to delete dataset")
    }
  }

  function parseCSV(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[]
        setRows(data)
        setColumns(Object.keys(data[0] || {}))
      },
      error: (err) => {
        console.log("[v0] CSV parse error:", err)
        alert("Failed to parse CSV")
      },
    })
  }

  async function uploadPhotos(files: FileList) {
    if (!files || files.length === 0) return
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append("files", f))
    const res = await fetch("/api/uploads", { method: "POST", body: fd })
    if (!res.ok) {
      alert("Photo upload failed")
      return
    }
    const data = (await res.json()) as { items: { file: string; url: string }[] }
    console.log("Uploaded photos:", data.items)
    setPhotos(data.items)
    // Try auto-map into rows
    if (rows.length > 0) {
      console.log("Current rows for mapping:", rows)
      let hits = 0
      const usedPhotos = new Set<string>()
      const next = rows.map((r) => {
        // First, try to match by explicit photo file column
        const photoFileCol = r.photo_file || r.photo || r["photo file"] || r.photo_url || r.image
        console.log(`Trying to match photo for row:`, { photoFileCol, availablePhotos: data.items.map(p => p.file) })
        let match: { file: string; url: string } | undefined
        if (photoFileCol) {
          match = data.items.find((it) => it.file === photoFileCol)
          console.log(`Exact match result:`, match)
        }
        
        // If no explicit match, try to match by various ID fields
        if (!match) {
          const idFields = [
            r.studentId, r.id, r.rollNo, r.roll_no, r.student_id, 
            r.enrollment_no, r.enrollmentNo, r.prn, r.reg_no, r.regNo,
            r.name, r.full_name, r.fullName, r.student_name
          ].filter(Boolean)
          
          for (const id of idFields) {
            if (id) {
              // Try exact match first
              match = data.items.find((it) => {
                const base = it.file.replace(/\.[a-zA-Z0-9]+$/, "")
                return base.toLowerCase() === id.toString().toLowerCase()
              })
              
              // If no exact match, try partial match
              if (!match) {
                match = data.items.find((it) => {
                  const base = it.file.replace(/\.[a-zA-Z0-9]+$/, "").toLowerCase()
                  const idStr = id.toString().toLowerCase()
                  return base.includes(idStr) || idStr.includes(base)
                })
              }
              
              if (match) break
            }
          }
        }
        
        if (match) {
          hits++
          usedPhotos.add(match.file)
          return { ...r, photo_url: match.url }
        }
        return r
      })
      
      // Find unmapped photos
      const unmapped = data.items.filter(item => !usedPhotos.has(item.file)).map(item => item.file)
      setUnmappedPhotos(unmapped)
      
      setRows(next)
      setMapSummary(`Mapped ${hits}/${rows.length} rows to uploaded photos`)
    }
  }

  async function saveDataset() {
    const payload: Omit<Dataset, "id" | "createdAt"> = {
      name,
      columns: Array.from(new Set([...columns, ...(rows.some((r) => r.photo_url) ? ["photo_url"] : [])])),
      rows,
    } as any
    const res = await fetch("/api/datasets", { method: "POST", body: JSON.stringify(payload) })
    if (!res.ok) {
      console.log("[v0] saveDataset error:", await res.text())
      alert("Failed to save dataset")
      return
    }
    const savedDataset = await res.json()
    setSavedDatasetId(savedDataset.id)
    await mutate("/api/datasets")
    alert("Dataset saved successfully!")
  }

  function resetForm() {
    setRows([])
    setColumns([])
    setPhotos([])
    setMapSummary(null)
    setUnmappedPhotos([])
    setSavedDatasetId(null)
    setIsGenerating(false)
    setGeneratedCards([])
    setShowPreview(false)
    setSelectedCardIndex(0)
    setSelectedSide("front")
    setSelectedTemplateId("uni-standard")
  }

  async function generateIdCards() {
    if (!savedDatasetId || rows.length === 0) {
      alert("Please save the dataset first")
      return
    }

    setIsGenerating(true)
    try {
      // Use the selected template
      const templateId = selectedTemplateId
      const students = rows.map(row => ({
        ...row,
        // Map common field names to template fields
        university: row.university || row.institution || "Your University",
        full_name: row.full_name || row.name || row.student_name || row.fullName || "",
        prn: row.prn || row.student_id || row.id || row.rollNo || row.roll_no || "",
        enrollment_no: row.enrollment_no || row.enrollmentNo || row.enroll_no || "",
        batch: row.batch || row.year || row.class || "",
        department: row.department || row.dept || row.department_name || "",
        birthdate: row.birthdate || row.dob || row.date_of_birth || "",
        address: row.address || row.location || "",
        mobile: row.mobile || row.phone || row.contact || "",
        photo: row.photo_url || row.photo || row.photo_file || "",
        photo_url: row.photo_url || row.photo || row.photo_file || "",
        qr: row.prn || row.student_id || row.id || row.rollNo || row.roll_no || ""
      }))

      const res = await fetch("/api/generate-idcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, students })
      })

      if (!res.ok) {
        throw new Error("Failed to generate ID cards")
      }

      const data = await res.json()
      
      // Store the generated cards data for preview
      setGeneratedCards(students)
      setShowPreview(true)
      setSelectedCardIndex(0)
      setSelectedSide("front")
      
    } catch (error) {
      console.error("ID card generation error:", error)
      alert("Failed to generate ID cards. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-pretty text-2xl font-semibold text-gray-900">Bulk Upload</h1>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Upload a CSV with columns like name, designation, photo_url, id, etc. We'll use these keys in your template.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <label className="block text-sm text-gray-700">
              Dataset Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>

            <label className="mt-4 block text-sm text-gray-700">
              CSV File
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) parseCSV(f)
                }}
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>

            <label className="mt-4 block text-sm text-gray-700">
              Student Photos (multiple)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) uploadPhotos(files)
                }}
                className="mt-1 w-full rounded border px-2 py-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Name photos to match student IDs (e.g., "12345.jpg" for student ID 12345) or add a photo_file column to your CSV
              </p>
              {photos.length > 0 && rows.length > 0 && (
                <button
                  onClick={mapPhotosToStudents}
                  className="mt-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Map Photos to Students ({photos.length} photos, {rows.length} students)
                </button>
              )}
              <button
                onClick={downloadCSVTemplate}
                className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download CSV Template
              </button>
            </label>

            <label className="mt-4 block text-sm text-gray-700">
              Template
                                <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="mt-1 w-full rounded border px-2 py-1"
                  >
                    {Object.values(workingTemplates).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
            </label>

            {rows.length > 0 && (
              <div className="mt-4 space-y-2">
                
                <button
                  onClick={saveDataset}
                  className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save Dataset
                </button>
                {savedDatasetId && (
                  <button
                    onClick={generateIdCards}
                    disabled={isGenerating}
                    className="w-full rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? "Generating ID Cards..." : "Generate ID Cards"}
                  </button>
                )}
                {(rows.length > 0 || photos.length > 0) && (
                  <button
                    onClick={resetForm}
                    className="w-full rounded bg-gray-500 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"
                  >
                    Reset Form
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-medium text-gray-900">Preview</h3>
            {rows.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No rows yet.</p>
            ) : (
              <div className="mt-2 max-h-72 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      {columns.map((c) => (
                        <th key={c} className="px-2 py-1 text-left font-medium">
                          {c}
                        </th>
                      ))}
                      {rows.some((r) => r.photo_url) && <th className="px-2 py-1 text-left font-medium">photo_url</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="even:bg-gray-50">
                        {columns.map((c) => (
                          <td key={c} className="px-2 py-1">
                            {r[c]}
                          </td>
                        ))}
                        {rows.some((x) => x.photo_url) && (
                          <td className="px-2 py-1">
                            {r.photo_url ? (
                              <span className="text-green-700">mapped</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 text-sm text-gray-700">
              {photos.length > 0 && <p>Uploaded photos: {photos.length}</p>}
              {mapSummary && <p>{mapSummary}</p>}
              {unmappedPhotos.length > 0 && (
                <div className="mt-2">
                  <p className="text-orange-600 font-medium">Unmapped photos ({unmappedPhotos.length}):</p>
                  <div className="max-h-20 overflow-y-auto">
                    {unmappedPhotos.map((photo, i) => (
                      <p key={i} className="text-xs text-gray-600">• {photo}</p>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Rename photos to match student IDs or add a photo_file column to your CSV
                  </p>
                </div>
              )}
            </div>
          </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Saved Datasets</h3>
          {!datasets ? (
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          ) : datasets.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No datasets yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {datasets.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{d.name}</p>
                    <p className="text-sm text-gray-600">{d.rows?.length || 0} rows</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => previewDataset(d)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => deleteDataset(d.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ID Card Preview Modal */}
      {showPreview && generatedCards.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">ID Card Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.values(workingTemplates).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Card ({selectedCardIndex + 1} of {generatedCards.length})
                  </label>
                  <select
                    value={selectedCardIndex}
                    onChange={(e) => setSelectedCardIndex(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {generatedCards.map((card, index) => (
                      <option key={index} value={index}>
                        {card.name || card.full_name || `Card ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Side
                  </label>
                  <div className="flex border rounded overflow-hidden">
                    <button
                      onClick={() => setSelectedSide("front")}
                      className={`px-4 py-2 flex-1 ${selectedSide === "front" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                    >
                      Front
                    </button>
                    <button
                      onClick={() => setSelectedSide("back")}
                      className={`px-4 py-2 flex-1 ${selectedSide === "back" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => downloadCard(selectedSide)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Download {selectedSide === "front" ? "Front" : "Back"}
                  </button>
                  <button
                    onClick={() => printCard(selectedSide)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Print {selectedSide === "front" ? "Front" : "Back"}
                  </button>
                  <button
                    onClick={downloadAllCards}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Download All as PDF
                  </button>
                </div>
              </div>

              {/* Card Preview */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div
                    ref={cardRef}
                    className="relative mx-auto rounded border shadow-sm"
                    style={{
                      width: 480,
                      height: 300,
                      background: "#ffffff",
                      color: "#000000",
                      border: "1px solid #e5e7eb",
                      borderRadius: "4px"
                    }}
                  >
                    <IDCardPreview 
                      template={currentTemplate} 
                      side={selectedSide} 
                      data={currentCard} 
                    />
                  </div>
                </div>
                
                {/* Debug Info */}
                <div className="w-full max-w-md text-xs bg-gray-100 p-2 rounded max-h-64 overflow-y-auto">
                  <div className="font-bold mb-1">Debug Info:</div>
                  <div className="space-y-1">
                    <div>Template: {currentTemplate?.id}</div>
                    <div>Template Name: {currentTemplate?.name}</div>
                    <div>Side: {selectedSide}</div>
                    <div>Card Index: {selectedCardIndex}</div>
                    <div>Data Keys: {currentCard ? Object.keys(currentCard).join(", ") : "No data"}</div>
                    <div>Photo URL: {currentCard?.photo || "No photo"}</div>
                    <div>Template Elements: {currentTemplate?.sides?.[selectedSide]?.length || 0}</div>
                    <div>Available Sides: {currentTemplate?.sides ? Object.keys(currentTemplate.sides).join(", ") : "None"}</div>
                    <div>Template Structure: {currentTemplate ? "Loaded" : "Not loaded"}</div>
                    <div>Front Elements: {currentTemplate?.sides?.front?.length || 0}</div>
                    <div>Back Elements: {currentTemplate?.sides?.back?.length || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ID Card Preview Component - PIXEL-PERFECT RENDERING
// Photo renderer component to handle image loading with proper React state
function PhotoRenderer({ photoUrl, shouldTryLoadPhoto, item }: { 
  photoUrl: string, 
  shouldTryLoadPhoto: boolean, 
  item: any 
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageLoad = () => {
    console.log("Image loaded successfully:", photoUrl)
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    console.log("Image failed to load:", photoUrl)
    console.log("This is expected if the photo hasn't been uploaded to blob storage yet")
    setImageError(true)
    setImageLoaded(false)
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width || item.w}px`,
        height: `${item.height || item.h}px`,
        overflow: "hidden",
        borderRadius: "2px",
        zIndex: 5,
        backgroundColor: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {shouldTryLoadPhoto && !imageError ? (
        <>
          <img
            src={photoUrl}
            alt="Student photo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "2px",
              display: imageLoaded ? "block" : "none"
            }}
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {!imageLoaded && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#666",
              fontSize: "10px",
              textAlign: "center"
            }}>
              Loading...
            </div>
          )}
        </>
      ) : null}
      
      {(!shouldTryLoadPhoto || imageError) && (
        <div style={{ 
          color: "#666", 
          fontSize: "10px", 
          fontWeight: "500", 
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "4px"
          }}>
            📷
          </div>
          <div>{imageError ? "Photo Not Found" : "No Photo"}</div>
          {photoUrl && (
            <div style={{ fontSize: "8px", color: "#999", textAlign: "center", maxWidth: "100%", wordBreak: "break-all" }}>
              {imageError ? "Upload photo to blob storage" : photoUrl}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IDCardPreview({ template, side, data }: { 
  template: any, 
  side: "front" | "back", 
  data: any 
}) {
  if (!template || !data) {
    return <div style={{ padding: "20px", color: "#666", textAlign: "center" }}>No template or data available</div>
  }

  const sideElements = template.sides?.[side]
  if (!sideElements || sideElements.length === 0) {
    return <div style={{ padding: "20px", color: "#666", textAlign: "center" }}>No elements defined for {side} side</div>
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {sideElements.map((item: any, idx: number) => {
        // Render rectangles (background elements) - EXACT MATCH
        if (item.type === "rect") {
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width || item.w}px`,
                height: `${item.height || item.h}px`,
                backgroundColor: item.style?.backgroundColor || item.fill || "#ffffff",
                border: item.stroke ? `${item.strokeWidth || 1}px solid ${item.stroke}` : "none",
                borderRadius: item.style?.borderRadius || "2px",
                zIndex: 1
              }}
            />
          )
        }
        
        // Render text elements - EXACT POSITIONING
        if (item.type === "text") {
          const text = item.field ? (data[item.field] ?? item.placeholder ?? "") : (item.placeholder ?? "")
          const size = item.style?.fontSize || item.textStyle?.size || 12
          const weight = item.style?.fontWeight || item.textStyle?.weight || 400
          const color = item.style?.color || item.textStyle?.color || template.colors?.neutral || "#000"
          const textAlign = item.style?.textAlign || "left"
          const fontFamily = item.style?.fontFamily || "Arial, sans-serif"
          
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${item.x}px`,
                top: `${item.y}px`,
                fontSize: `${size}px`,
                fontWeight: weight,
                color: color,
                fontFamily: fontFamily,
                lineHeight: 1.1,
                maxWidth: `${item.width || item.w || 200}px`,
                wordWrap: "break-word",
                overflow: "hidden",
                textAlign: textAlign,
                zIndex: 10
              }}
            >
              {text}
            </div>
          )
        }
        
        // Render photo images - EXACT POSITIONING
        if (item.type === "image" && item.field === "photo") {
          const photoUrl = data.photo_url || data.photo || data.photo_file || ""
          
          // Debug logging
          console.log("Photo rendering:", { photoUrl, data, item })
          
          // Check if we have a valid blob storage URL or data URL
          const hasValidPhoto = photoUrl && (
            photoUrl.startsWith('http') || 
            photoUrl.startsWith('blob:') || 
            photoUrl.startsWith('data:')
          )
          
          // For now, let's try to load any photo URL, even if it's just a filename
          // This will show the actual image if it exists, or fallback to placeholder
          const shouldTryLoadPhoto = photoUrl && photoUrl.trim() !== ''
          
          return (
            <PhotoRenderer
              key={idx}
              photoUrl={photoUrl}
              shouldTryLoadPhoto={shouldTryLoadPhoto}
              item={item}
            />
          )
        }
        
        // Render QR codes - EXACT POSITIONING
        if (item.type === "qr") {
          const qrValue = data[item.field] || data.qr || data.prn || data.id || "QR_CODE"
          
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width || item.w}px`,
                height: `${item.height || item.h}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                zIndex: 5
              }}
            >
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <QRCode
                  value={qrValue}
                  size={Math.min((item.width || item.w) - 4, (item.height || item.h) - 4)}
                />
              </div>
            </div>
          )
        }
        
        return null
      })}
    </div>
  )
}