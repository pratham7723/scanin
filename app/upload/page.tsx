"use client"

import { useState, useRef } from "react"
import Papa from "papaparse"
import useSWR, { mutate } from "swr"
import type { Dataset } from "@/lib/types"
import { templates } from "@/lib/idcard-templates"
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
  const cardRef = useRef<HTMLDivElement>(null)

  const { data: datasets } = useSWR("/api/datasets", fetcher)

  // Get the current template
  const currentTemplate = templates.find(t => t.id === "uni-standard") || templates[0]

  // Get the current card data
  const currentCard = generatedCards[selectedCardIndex]

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
    setPhotos(data.items)
    // Try auto-map into rows
    if (rows.length > 0) {
      let hits = 0
      const usedPhotos = new Set<string>()
      const next = rows.map((r) => {
        // First, try to match by explicit photo file column
        const photoFileCol = r.photo_file || r.photo || r["photo file"] || r.photo_url || r.image
        let match: { file: string; url: string } | undefined
        if (photoFileCol) {
          match = data.items.find((it) => it.file === photoFileCol)
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
  }

  async function generateIdCards() {
    if (!savedDatasetId || rows.length === 0) {
      alert("Please save the dataset first")
      return
    }

    setIsGenerating(true)
    try {
      // Use the first available template (you can make this selectable later)
      const templateId = "uni-standard" // Using the first template from idcard-templates.ts
      const students = rows.map(row => ({
        ...row,
        // Ensure photo_url is properly mapped
        photo: row.photo_url || row.photo || row.photo_file || ""
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
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {datasets.map((d: any) => (
                <li key={d.id}>
                  {d.name} — {d.rows} rows
                </li>
              ))}
            </ul>
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
              <div className="lg:col-span-2 flex items-center justify-center">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div
                    ref={cardRef}
                    className="relative mx-auto rounded border shadow-sm"
                    style={{
                      width: 350,
                      height: 220,
                      background: "#ffffff",
                      color: "#000000"
                    }}
                  >
                    <IDCardPreview 
                      template={currentTemplate} 
                      side={selectedSide} 
                      data={currentCard} 
                    />
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

// ID Card Preview Component
function IDCardPreview({ template, side, data }: { 
  template: any, 
  side: "front" | "back", 
  data: any 
}) {
  if (!template || !data) return null

  return (
    <>
      {template.sides[side]?.map((item: any, idx: number) => {
        if (item.type === "text") {
          const text = item.field ? (data[item.field] ?? item.placeholder ?? "") : (item.placeholder ?? "")
          const size = item.textStyle?.size ?? 12
          const weight = item.textStyle?.weight ?? 400
          return (
            <span
              key={idx}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                fontSize: size,
                fontWeight: weight,
                color: template.colors.neutral
              }}
            >
              {text}
            </span>
          )
        }
        if (item.type === "image" && item.field === "photo") {
          const src = data.photo || data.photo_url || "/placeholder.svg"
          return (
            <img
              key={idx}
              src={src}
              alt="Student photo"
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h,
                objectFit: "cover",
                borderRadius: "4px"
              }}
            />
          )
        }
        if (item.type === "qr") {
          const qrValue = data[item.field] || data.qr || data.prn || data.id || "QR_CODE"
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h
              }}
            >
              <QRCode
                value={qrValue}
                size={Math.min(item.w, item.h)}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )
        }
        return null
      })}
    </>
  )
}
