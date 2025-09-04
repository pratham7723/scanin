"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import type { Template, TemplateElement, TemplateElementType } from "@/lib/types"
import useSWR from "swr"
import { defaultTemplates } from "@/lib/templates"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PALETTE: { type: TemplateElementType; label: string }[] = [
  { type: "photo", label: "Photo" },
  { type: "name", label: "Name" },
  { type: "designation", label: "Designation" },
  { type: "logo", label: "Logo" },
  { type: "qr", label: "QR Code" },
  { type: "barcode", label: "Barcode" },
  { type: "text", label: "Static Text" },
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function CardDesigner() {
  const [templateName, setTemplateName] = useState("Standard ID")
  const [size, setSize] = useState({ width: 860, height: 540 }) // ~54x86 mm @ 10px/mm
  const [background, setBackground] = useState("#ffffff")
  const [elements, setElements] = useState<TemplateElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const resizeRef = useRef<{ id: string; ox: number; oy: number; sw: number; sh: number } | null>(null)

  const selected = useMemo(() => elements.find((e) => e.id === selectedId), [elements, selectedId])

  const dragRef = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number } | null>(null)

  function snap(n: number) {
    const grid = 10
    return Math.round(n / grid) * grid
  }

  function loadPremade(id: string) {
    const t = defaultTemplates.find((x) => x.id === id)
    if (!t) return
    setBackground(t.bg)
    const mapped: TemplateElement[] = t.layers.map((layer) => {
      if (layer.type === "photo") {
        return { id: uid(), type: "photo", x: layer.x, y: layer.y, w: layer.w, h: layer.h }
      }
      if (layer.type === "qr") {
        return { id: uid(), type: "qr", x: layer.x, y: layer.y, w: layer.w, h: layer.h, valueKey: "studentId" }
      }
      const lower = layer.text.toLowerCase()
      if (lower.includes("{name}")) {
        return {
          id: uid(),
          type: "name",
          x: layer.x,
          y: layer.y,
          w: layer.w,
          h: layer.h,
          fontSize: layer.fontSize,
          align: layer.align,
          valueKey: "name",
        }
      }
      return {
        id: uid(),
        type: "text",
        x: layer.x,
        y: layer.y,
        w: layer.w,
        h: layer.h,
        fontSize: layer.fontSize,
        align: layer.align,
        staticText: layer.text,
      }
    })
    setElements(mapped)
    setSelectedId(mapped[0]?.id ?? null)
    setSize({ width: 860, height: 540 })
  }

  function addElement(type: TemplateElementType) {
    const base: TemplateElement = {
      id: uid(),
      type,
      x: 40,
      y: 40,
      w: type === "photo" ? 180 : type === "qr" ? 140 : 200,
      h: type === "photo" ? 220 : type === "qr" ? 140 : 48,
      fontSize: 20,
      valueKey: type === "name" ? "name" : type === "designation" ? "designation" : undefined,
      staticText: type === "text" ? "Your Text" : undefined,
      align: "left",
    }
    setElements((p) => [...p, base])
    setSelectedId(base.id)
  }

  function onMouseDown(e: React.MouseEvent, id: string) {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    const el = elements.find((el) => el.id === id)
    if (!el) return
    dragRef.current = { id, ox: e.clientX - rect.left, oy: e.clientY - rect.top, sx: el.x, sy: el.y }
  }

  function onResizeMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const rect = (e.currentTarget.parentElement?.parentElement as HTMLElement).getBoundingClientRect()
    const el = elements.find((x) => x.id === id)
    if (!el) return
    resizeRef.current = { id, ox: e.clientX - rect.left, oy: e.clientY - rect.top, sw: el.w, sh: el.h }
  }

  function onMouseMove(e: React.MouseEvent) {
    const canvas = e.currentTarget as HTMLElement
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (resizeRef.current) {
      const dx = x - resizeRef.current.ox
      const dy = y - resizeRef.current.oy
      setElements((els) =>
        els.map((el) =>
          el.id === resizeRef.current!.id
            ? {
                ...el,
                w: Math.max(24, snap(resizeRef.current!.sw + dx)),
                h: Math.max(24, snap(resizeRef.current!.sh + dy)),
              }
            : el,
        ),
      )
      return
    }

    if (!dragRef.current) return
    const dx = x - dragRef.current.ox
    const dy = y - dragRef.current.oy
    setElements((els) =>
      els.map((el) =>
        el.id === dragRef.current!.id
          ? { ...el, x: snap(dragRef.current!.sx + dx), y: snap(dragRef.current!.sy + dy) }
          : el,
      ),
    )
  }

  function onMouseUp() {
    dragRef.current = null
    resizeRef.current = null
  }

  async function saveTemplate() {
    const payload: Template = {
      id: "",
      name: templateName,
      width: size.width,
      height: size.height,
      background,
      elements,
      createdAt: new Date().toISOString(),
    }
    const res = await fetch("/api/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.log("[v0] saveTemplate error:", await res.text())
      alert("Failed to save template")
      return
    }
    const data = await res.json()
    alert(`Template saved: ${data.id}`)
  }

  const { data: templates } = useSWR("/api/templates", fetcher)

  return (
    <div className="grid gap-6 md:grid-cols-[320px,1fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Template</h3>
          <label className="mt-3 block text-sm text-gray-600">
            Name
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm text-gray-600">
              Width
              <input
                type="number"
                value={size.width}
                onChange={(e) => setSize((s) => ({ ...s, width: Number(e.target.value) }))}
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
              />
            </label>
            <label className="text-sm text-gray-600">
              Height
              <input
                type="number"
                value={size.height}
                onChange={(e) => setSize((s) => ({ ...s, height: Number(e.target.value) }))}
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm text-gray-600">
            Background
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="mt-1 h-8 w-full cursor-pointer rounded border"
            />
          </label>
          <button
            onClick={saveTemplate}
            className="mt-4 w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save Template
          </button>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Premade Templates</h3>
          <ul className="mt-2 space-y-2">
            {defaultTemplates.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-700">{t.name}</span>
                <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => loadPremade(t.id)}>
                  Load
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Elements</h3>
          <ul className="mt-2 space-y-2">
            {PALETTE.map((p) => (
              <li key={p.type}>
                <button
                  onClick={() => addElement(p.type)}
                  className="w-full rounded border px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                >
                  + {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Layers</h3>
          {elements.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No elements yet.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {elements.map((el) => (
                <li key={el.id} className="flex items-center justify-between text-sm">
                  <button
                    className={`truncate text-left ${selectedId === el.id ? "font-semibold text-blue-700" : "text-gray-700"}`}
                    onClick={() => setSelectedId(el.id)}
                    title={el.id}
                  >
                    {el.type} — {Math.round(el.x)},{Math.round(el.y)}
                  </button>
                  <button
                    className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setElements((arr) => arr.filter((x) => x.id !== el.id))
                      if (selectedId === el.id) setSelectedId(null)
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium text-gray-900">Saved Templates</h3>
          {!templates ? (
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          ) : templates.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No templates yet.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {templates.map((t: any) => (
                <li key={t.id} className="text-sm text-gray-700">
                  {t.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section>
        <div className="rounded-lg border bg-white p-3" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
          <div
            className="relative overflow-hidden rounded-md"
            style={{ width: size.width, height: size.height, background }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,#e5e7eb_95%),linear-gradient(90deg,transparent_95%,#e5e7eb_95%)] bg-[size:20px_20px]" />
            {elements.map((el) => (
              <CanvasElement
                key={el.id}
                el={el}
                selected={selected?.id === el.id}
                onMouseDown={(e) => onMouseDown(e, el.id)}
                onSelect={() => setSelectedId(el.id)}
                onChange={(next) => setElements((arr) => arr.map((x) => (x.id === next.id ? next : x)))}
                onResizeMouseDown={(e) => onResizeMouseDown(e, el.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function CanvasElement({
  el,
  selected,
  onMouseDown,
  onSelect,
  onChange,
  onResizeMouseDown,
}: {
  el: TemplateElement
  selected?: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onSelect: () => void
  onChange: (n: TemplateElement) => void
  onResizeMouseDown: (e: React.MouseEvent) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={onMouseDown}
      onClick={onSelect}
      className="absolute cursor-move rounded"
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        outline: selected ? "2px solid #2563eb" : "1px dashed #cbd5e1",
        background: el.type === "photo" || el.type === "logo" ? "#f1f5f9" : "transparent",
      }}
    >
      <div className="h-full w-full p-2 text-xs text-gray-700">
        {el.type === "name" && <span className="text-base font-semibold">{"{name}"}</span>}
        {el.type === "designation" && <span className="text-sm">{"{designation}"}</span>}
        {el.type === "text" && <span>{el.staticText}</span>}
        {el.type === "qr" && <span className="text-[10px] text-gray-600">QR Code</span>}
        {el.type === "barcode" && <span className="text-[10px] text-gray-600">Barcode</span>}
        {(el.type === "photo" || el.type === "logo") && (
          <span className="text-[10px] text-gray-600">Image placeholder</span>
        )}
      </div>

      {selected && (el.type === "text" || el.type === "name" || el.type === "designation") && (
        <div className="absolute left-0 top-full z-10 mt-1 flex items-center gap-2 rounded border bg-white p-1 text-xs shadow">
          <label className="flex items-center gap-1">
            Key:
            <input
              value={el.valueKey || ""}
              onChange={(e) => onChange({ ...el, valueKey: e.target.value || undefined })}
              placeholder="CSV column (e.g. name)"
              className="w-36 rounded border px-1 py-0.5"
            />
          </label>
          {el.type === "text" && (
            <label className="flex items-center gap-1">
              Text:
              <input
                value={el.staticText || ""}
                onChange={(e) => onChange({ ...el, staticText: e.target.value })}
                className="w-36 rounded border px-1 py-0.5"
              />
            </label>
          )}
          <label className="flex items-center gap-1">
            Font:
            <input
              type="number"
              value={el.fontSize || 16}
              onChange={(e) => onChange({ ...el, fontSize: Number(e.target.value) })}
              className="w-16 rounded border px-1 py-0.5"
            />
          </label>
        </div>
      )}

      <div
        onMouseDown={onResizeMouseDown}
        className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize rounded bg-blue-500"
        aria-label="resize"
        title="Resize"
      />
    </div>
  )
}
