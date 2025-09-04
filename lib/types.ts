export type TemplateElementType = "photo" | "name" | "designation" | "logo" | "qr" | "barcode" | "text"

export type TemplateElement = {
  id: string
  type: TemplateElementType
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  fontSize?: number
  valueKey?: string // for text fields bound to CSV columns
  staticText?: string // for static text
  align?: "left" | "center" | "right"
}

export type Template = {
  id: string
  name: string
  width: number
  height: number
  background?: string
  elements: TemplateElement[]
  createdAt: string
}

export type Dataset = {
  id: string
  name: string
  columns: string[]
  rows: Record<string, string>[]
  createdAt: string
}

export type AttendanceEvent = {
  id: string
  type: "gate" | "classroom"
  personId: string
  personName?: string
  classCode?: string
  facultyId?: string
  scannedAt: string // ISO datetime
}

export type AttendanceRuleCheck = {
  allowed: boolean
  reason?: string
}
