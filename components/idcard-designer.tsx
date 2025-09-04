"use client"
import { useState } from "react"
import { templates, type TemplateItem, type Side } from "@/lib/idcard-templates"

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
}

export default function IDCardDesigner() {
  const [tpl, setTpl] = useState<TemplateItem>(templates[0])
  const [side, setSide] = useState<Side>("front")
  const [values, setValues] = useState<Values>({
    university: "Your University",
    full_name: "Student Name",
    prn: "PRN-0000",
    enrollment_no: "ENR-123456",
    batch: "2022-26",
    birthdate: "2004-01-01",
    address: "City, State",
    mobile: "+91 90000 00000",
    qr: "PRN-0000",
  })

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex gap-2">
          <select
            className="border rounded p-2"
            value={tpl.id}
            onChange={(e) => {
              const next = templates.find((t) => t.id === e.target.value)!
              setTpl(next)
            }}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="inline-flex border rounded overflow-hidden">
            <button
              className={`px-3 py-2 ${side === "front" ? "bg-primary text-white" : ""}`}
              onClick={() => setSide("front")}
              type="button"
            >
              Front
            </button>
            <button
              className={`px-3 py-2 ${side === "back" ? "bg-primary text-white" : ""}`}
              onClick={() => setSide("back")}
              type="button"
            >
              Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(values).map(([k, v]) => (
            <input
              key={k}
              className="border rounded p-2"
              placeholder={k}
              value={(v as string) || ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))}
            />
          ))}
          <input
            className="border rounded p-2 col-span-2"
            placeholder="Photo URL"
            value={values.photo || ""}
            onChange={(e) => setValues((p) => ({ ...p, photo: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <CardPreview tpl={tpl} side={side} values={values} />
      </div>
    </div>
  )
}

function CardPreview({ tpl, side, values }: { tpl: TemplateItem; side: Side; values: any }) {
  const width = 240
  const height = 152
  return (
    <div
      className="relative rounded border"
      style={{ width, height, background: "#fff" }}
      aria-label={`ID card ${side}`}
    >
      {tpl.sides[side].map((item, idx) => {
        if (item.type === "text") {
          const text = item.field ? (values[item.field] ?? item.placeholder ?? "") : (item.placeholder ?? "")
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
                fontWeight: weight as any,
              }}
            >
              {text}
            </span>
          )
        }
        if (item.type === "image" && item.field === "photo") {
          const src = values.photo || "/student-photo-placeholder.png"
          // eslint-disable-next-line @next/next/no-img-element
          return (
            <img
              key={idx}
              src={src || "/placeholder.svg"}
              alt="Student photo"
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h,
                objectFit: "cover",
              }}
            />
          )
        }
        if (item.type === "qr") {
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h,
                background: "#e5e7eb",
                display: "grid",
                placeItems: "center",
                fontSize: 10,
                color: "#374151",
              }}
            >
              QR
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
