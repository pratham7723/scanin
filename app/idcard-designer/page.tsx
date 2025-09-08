import UnifiedIdCardDesigner from "@/components/unified-idcard-designer"

export default function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-balance">ID Card Designer</h1>
        <p className="text-sm text-muted-foreground">
          Design individual ID cards with custom templates. Set student information, add custom fields, and export as PDF or PNG.
        </p>
      </div>
      <UnifiedIdCardDesigner />
    </div>
  )
}
