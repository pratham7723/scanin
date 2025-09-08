import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, templateData, dynamicFields, sampleCount = 1 } = body

    // Use dynamic fields if provided, otherwise extract from template data, otherwise use default fields
    let fields: string[]
    if (dynamicFields && dynamicFields.length > 0) {
      fields = dynamicFields
    } else if (templateData) {
      fields = extractFieldsFromTemplate(templateData)
    } else {
      fields = getDefaultFields()
    }
    
    // Generate sample data
    const sampleData = generateSampleData(fields, sampleCount)
    
    // Convert to CSV
    const csv = convertToCSV(sampleData, fields)

    // Return CSV as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sample-template.csv"',
      },
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDefaultFields(): string[] {
  return [
    'full_name', 'prn', 'enrollment_no', 'batch', 'university', 
    'department', 'birthdate', 'address', 'mobile', 'photo', 'qr'
  ]
}

function extractFieldsFromTemplate(templateData: any): string[] {
  const fields = new Set<string>()
  
  // Extract from front and back elements
  const allElements = [
    ...(templateData.front?.elements || []),
    ...(templateData.back?.elements || []),
    ...(templateData.front_elements || []),
    ...(templateData.back_elements || []),
    ...(templateData.elements || [])
  ]
  
  allElements.forEach((element: any) => {
    if (element.dataField) {
      fields.add(element.dataField)
    }
    if (element.field) {
      fields.add(element.field)
    }
    if (element.text && element.text.includes('{{') && element.text.includes('}}')) {
      // Extract field names from template strings like {{full_name}}
      const matches = element.text.match(/\{\{([^}]+)\}\}/g)
      if (matches) {
        matches.forEach((match: string) => {
          const fieldName = match.replace(/\{\{|\}\}/g, '')
          fields.add(fieldName)
        })
      }
    }
  })
  
  // Add common fields that are typically needed
  const commonFields = getDefaultFields()
  commonFields.forEach(field => fields.add(field))
  
  return Array.from(fields)
}

function generateSampleData(fields: string[], count: number): Record<string, string>[] {
  const sampleData = []
  
  for (let i = 1; i <= count; i++) {
    const row: Record<string, string> = {}
    
    fields.forEach(field => {
      switch (field) {
        case 'full_name':
          row[field] = `Student ${i}`
          break
        case 'prn':
          row[field] = `STU-2024-${String(i).padStart(3, '0')}`
          break
        case 'enrollment_no':
          row[field] = `ENR-${String(i).padStart(6, '0')}`
          break
        case 'batch':
          row[field] = '2022-26'
          break
        case 'university':
          row[field] = 'University of Technology'
          break
        case 'department':
          row[field] = 'Computer Science'
          break
        case 'birthdate':
          row[field] = '2004-01-01'
          break
        case 'address':
          row[field] = `Address ${i}, City, State`
          break
        case 'mobile':
          row[field] = `+91 90000 ${String(i).padStart(5, '0')}`
          break
        case 'photo':
          row[field] = `student_${i}.jpg`
          break
        case 'qr':
          row[field] = `STU-2024-${String(i).padStart(3, '0')}`
          break
        default:
          row[field] = `Sample ${field} ${i}`
      }
    })
    
    sampleData.push(row)
  }
  
  return sampleData
}

function convertToCSV(data: Record<string, string>[], fields: string[]): string {
  if (data.length === 0) return ''
  
  // Create header row
  const header = fields.join(',')
  
  // Create data rows
  const rows = data.map(row => 
    fields.map(field => {
      const value = row[field] || ''
      // Escape commas and quotes in CSV
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  return [header, ...rows].join('\n')
}
