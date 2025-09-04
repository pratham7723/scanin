export type Field =
  | "university"
  | "full_name"
  | "prn"
  | "enrollment_no"
  | "batch"
  | "birthdate"
  | "address"
  | "mobile"
  | "photo"
  | "qr"

export type Side = "front" | "back"

export type TemplateItem = {
  id: string
  name: string
  colors: { primary: string; neutral: string; accent?: string }
  sides: Record<
    Side,
    Array<{
      type: "text" | "image" | "qr"
      field?: Field
      x: number
      y: number
      w?: number
      h?: number
      textStyle?: { size: number; weight?: number }
      placeholder?: string
    }>
  >
}

export const templates: TemplateItem[] = [
  {
    id: "uni-standard",
    name: "University Standard",
    colors: { primary: "#1d4ed8", neutral: "#111827", accent: "#059669" },
    sides: {
      front: [
        { type: "text", field: "university", x: 12, y: 12, textStyle: { size: 14, weight: 700 } },
        { type: "image", field: "photo", x: 12, y: 32, w: 64, h: 80 },
        { type: "text", field: "full_name", x: 84, y: 48, textStyle: { size: 12, weight: 600 } },
        { type: "text", field: "batch", x: 84, y: 66, textStyle: { size: 10 } },
        { type: "qr", field: "qr", x: 160, y: 32, w: 64, h: 64 },
      ],
      back: [
        { type: "text", placeholder: "PRN/Enrollment No:", x: 12, y: 16, textStyle: { size: 10 } },
        { type: "text", field: "prn", x: 140, y: 16, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Birthdate:", x: 12, y: 36, textStyle: { size: 10 } },
        { type: "text", field: "birthdate", x: 140, y: 36, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Address:", x: 12, y: 56, textStyle: { size: 10 } },
        { type: "text", field: "address", x: 140, y: 56, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Mobile:", x: 12, y: 76, textStyle: { size: 10 } },
        { type: "text", field: "mobile", x: 140, y: 76, textStyle: { size: 10, weight: 600 } },
        { type: "qr", field: "qr", x: 160, y: 96, w: 56, h: 56 },
      ],
    },
  },
  {
    id: "blue-accent",
    name: "Blue Accent",
    colors: { primary: "#2563eb", neutral: "#0f172a", accent: "#eab308" },
    sides: {
      front: [
        { type: "text", field: "university", x: 12, y: 10, textStyle: { size: 14, weight: 700 } },
        { type: "image", field: "photo", x: 12, y: 32, w: 72, h: 88 },
        { type: "qr", field: "qr", x: 170, y: 32, w: 56, h: 56 },
        { type: "text", field: "full_name", x: 12, y: 130, textStyle: { size: 12, weight: 600 } },
        { type: "text", field: "batch", x: 12, y: 146, textStyle: { size: 10 } },
      ],
      back: [
        { type: "text", placeholder: "PRN:", x: 12, y: 16, textStyle: { size: 10 } },
        { type: "text", field: "prn", x: 52, y: 16, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Enrollment:", x: 12, y: 34, textStyle: { size: 10 } },
        { type: "text", field: "enrollment_no", x: 88, y: 34, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Mobile:", x: 12, y: 52, textStyle: { size: 10 } },
        { type: "text", field: "mobile", x: 88, y: 52, textStyle: { size: 10, weight: 600 } },
        { type: "qr", field: "qr", x: 160, y: 72, w: 56, h: 56 },
      ],
    },
  },
  {
    id: "green-bar",
    name: "Green Bar",
    colors: { primary: "#16a34a", neutral: "#111827", accent: "#2563eb" },
    sides: {
      front: [
        { type: "text", field: "university", x: 12, y: 12, textStyle: { size: 14, weight: 700 } },
        { type: "image", field: "photo", x: 12, y: 34, w: 60, h: 80 },
        { type: "text", field: "full_name", x: 80, y: 50, textStyle: { size: 12, weight: 600 } },
        { type: "qr", field: "qr", x: 160, y: 40, w: 60, h: 60 },
      ],
      back: [
        { type: "text", placeholder: "Batch:", x: 12, y: 16, textStyle: { size: 10 } },
        { type: "text", field: "batch", x: 80, y: 16, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Birthdate:", x: 12, y: 36, textStyle: { size: 10 } },
        { type: "text", field: "birthdate", x: 80, y: 36, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Address:", x: 12, y: 56, textStyle: { size: 10 } },
        { type: "text", field: "address", x: 80, y: 56, textStyle: { size: 10, weight: 600 } },
        { type: "qr", field: "qr", x: 160, y: 84, w: 56, h: 56 },
      ],
    },
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    colors: { primary: "#0ea5e9", neutral: "#0b1220" },
    sides: {
      front: [
        { type: "text", field: "university", x: 14, y: 14, textStyle: { size: 14, weight: 700 } },
        { type: "image", field: "photo", x: 14, y: 40, w: 60, h: 78 },
        { type: "qr", field: "qr", x: 168, y: 40, w: 60, h: 60 },
        { type: "text", field: "full_name", x: 14, y: 128, textStyle: { size: 12, weight: 600 } },
      ],
      back: [
        { type: "text", placeholder: "PRN:", x: 14, y: 18, textStyle: { size: 10 } },
        { type: "text", field: "prn", x: 64, y: 18, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Enrollment:", x: 14, y: 36, textStyle: { size: 10 } },
        { type: "text", field: "enrollment_no", x: 94, y: 36, textStyle: { size: 10, weight: 600 } },
        { type: "text", placeholder: "Mobile:", x: 14, y: 54, textStyle: { size: 10 } },
        { type: "text", field: "mobile", x: 94, y: 54, textStyle: { size: 10, weight: 600 } },
        { type: "qr", field: "qr", x: 160, y: 72, w: 56, h: 56 },
      ],
    },
  },
]
