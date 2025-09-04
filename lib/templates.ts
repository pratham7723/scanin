export type DesignerLayer =
  | {
      id: string
      type: "text"
      x: number
      y: number
      w: number
      h: number
      text: string
      fontSize: number
      weight: 400 | 500 | 600 | 700
      align: "left" | "center" | "right"
      color: string
    }
  | { id: string; type: "photo"; x: number; y: number; w: number; h: number; radius?: number }
  | { id: string; type: "qr"; x: number; y: number; w: number; h: number; value: string }

export type DesignerTemplate = {
  id: string
  name: string
  bg: string
  layers: DesignerLayer[]
}

export type DesignerState = {
  templateId: string
  bg: string
  layers: DesignerLayer[]
  sampleData: {
    name: string
    class: string
    rollNo: string
    studentId: string
    photoUrl: string
  }
  showGrid: boolean
}

export const defaultTemplates: DesignerTemplate[] = [
  {
    id: "classic-blue",
    name: "Classic Blue",
    bg: "#FFFFFF",
    layers: [
      {
        id: "name",
        type: "text",
        x: 40,
        y: 420,
        w: 500,
        h: 40,
        text: "{name}",
        fontSize: 28,
        weight: 700,
        align: "left",
        color: "#0F172A",
      },
      {
        id: "class",
        type: "text",
        x: 40,
        y: 460,
        w: 500,
        h: 32,
        text: "{class}  ·  {rollNo}",
        fontSize: 18,
        weight: 500,
        align: "left",
        color: "#334155",
      },
      { id: "photo", type: "photo", x: 600, y: 120, w: 200, h: 260, radius: 12 },
      { id: "qr", type: "qr", x: 640, y: 400, w: 120, h: 120, value: "{studentId}" },
    ],
  },
  {
    id: "minimal-gray",
    name: "Minimal Gray",
    bg: "#F8FAFC",
    layers: [
      {
        id: "name",
        type: "text",
        x: 40,
        y: 60,
        w: 520,
        h: 44,
        text: "{name}",
        fontSize: 30,
        weight: 700,
        align: "left",
        color: "#111827",
      },
      {
        id: "class",
        type: "text",
        x: 40,
        y: 110,
        w: 520,
        h: 32,
        text: "{class}",
        fontSize: 20,
        weight: 500,
        align: "left",
        color: "#374151",
      },
      {
        id: "roll",
        type: "text",
        x: 40,
        y: 150,
        w: 520,
        h: 28,
        text: "Roll: {rollNo}",
        fontSize: 18,
        weight: 500,
        align: "left",
        color: "#4B5563",
      },
      { id: "photo", type: "photo", x: 40, y: 210, w: 220, h: 300, radius: 8 },
      { id: "qr", type: "qr", x: 300, y: 260, w: 180, h: 180, value: "{studentId}" },
    ],
  },
  {
    id: "bold-accent",
    name: "Bold Accent",
    bg: "#FFFFFF",
    layers: [
      {
        id: "name",
        type: "text",
        x: 40,
        y: 350,
        w: 520,
        h: 44,
        text: "{name}",
        fontSize: 30,
        weight: 700,
        align: "left",
        color: "#0F766E",
      }, // teal accent
      {
        id: "class",
        type: "text",
        x: 40,
        y: 400,
        w: 520,
        h: 32,
        text: "{class}",
        fontSize: 20,
        weight: 600,
        align: "left",
        color: "#111827",
      },
      { id: "photo", type: "photo", x: 600, y: 80, w: 200, h: 260, radius: 16 },
      { id: "qr", type: "qr", x: 620, y: 360, w: 160, h: 160, value: "{studentId}" },
    ],
  },
  {
    id: "academic-badge",
    name: "Academic Badge",
    bg: "#F1F5F9",
    layers: [
      {
        id: "name",
        type: "text",
        x: 60,
        y: 80,
        w: 520,
        h: 44,
        text: "{name}",
        fontSize: 28,
        weight: 700,
        align: "left",
        color: "#0F172A",
      },
      {
        id: "class",
        type: "text",
        x: 60,
        y: 126,
        w: 520,
        h: 32,
        text: "{class}",
        fontSize: 18,
        weight: 600,
        align: "left",
        color: "#334155",
      },
      {
        id: "roll",
        type: "text",
        x: 60,
        y: 160,
        w: 520,
        h: 28,
        text: "ID: {studentId}",
        fontSize: 18,
        weight: 600,
        align: "left",
        color: "#334155",
      },
      { id: "photo", type: "photo", x: 60, y: 210, w: 240, h: 300, radius: 12 },
      { id: "qr", type: "qr", x: 340, y: 260, w: 180, h: 180, value: "{studentId}" },
    ],
  },
]
