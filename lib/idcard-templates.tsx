export const templates: TemplateItem[] = [
  {
    id: "uni-standard",
    name: "University Standard",
    colors: { primary: "#1d4ed8", neutral: "#111827", accent: "#059669" },
    sides: {
      front: [
        // ... existing code ...
      ],
      back: [
        // ... existing code ...
        // <CHANGE> add QR placeholder on back</CHANGE>
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
        // ... existing code ...
      ],
      back: [
        // ... existing code ...
        // <CHANGE> add QR placeholder on back</CHANGE>
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
        // ... existing code ...
      ],
      back: [
        // ... existing code ...
        // <CHANGE> add QR placeholder on back</CHANGE>
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
        // ... existing code ...
      ],
      back: [
        // ... existing code ...
        // <CHANGE> add QR placeholder on back</CHANGE>
        { type: "qr", field: "qr", x: 160, y: 72, w: 56, h: 56 },
      ],
    },
  },
]
// ... existing code ...
