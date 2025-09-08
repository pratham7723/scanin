// Shared template utilities for consistent template rendering across components

export const getUniversityStandardTemplate = () => {
  return {
    id: 'uni-standard',
    name: 'University Standard',
    colors: { primary: '#1d4ed8', neutral: '#111827', accent: '#059669' },
    sides: {
      front: [
        // University header - centered at top
        {
          type: 'text',
          field: 'university',
          x: 0,
          y: 8,
          width: 480,
          height: 28,
          textStyle: { size: 16, weight: 700, color: '#111827' },
          placeholder: 'University Name',
          style: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#111827',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
          }
        },
        // Photo section - left side (1/3 width)
        {
          type: 'image',
          field: 'photo',
          x: 12,
          y: 40,
          width: 120,
          height: 150,
          style: {
            backgroundColor: '#e5e7eb',
            borderRadius: 4
          }
        },
        // Student name - right side
        {
          type: 'text',
          field: 'full_name',
          x: 140,
          y: 40,
          width: 240,
          height: 28,
          textStyle: { size: 16, weight: 'bold', color: '#111827' },
          placeholder: 'Student Name',
          style: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        // PRN - right side
        {
          type: 'text',
          field: 'prn',
          x: 140,
          y: 72,
          width: 240,
          height: 24,
          textStyle: { size: 12, weight: 'normal', color: '#111827' },
          placeholder: 'PRN: PRN-0000',
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        // Enrollment - right side
        {
          type: 'text',
          field: 'enrollment_no',
          x: 140,
          y: 100,
          width: 240,
          height: 24,
          textStyle: { size: 12, weight: 'normal', color: '#111827' },
          placeholder: 'Enroll: ENR-123456',
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        // Batch - right side
        {
          type: 'text',
          field: 'batch',
          x: 140,
          y: 128,
          width: 240,
          height: 24,
          textStyle: { size: 12, weight: 'normal', color: '#111827' },
          placeholder: 'Batch: 2022-26',
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        // Department - right side
        {
          type: 'text',
          field: 'department',
          x: 140,
          y: 156,
          width: 240,
          height: 24,
          textStyle: { size: 12, weight: 'normal', color: '#111827' },
          placeholder: 'Department: Computer Science',
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        // Bottom colored bar
        {
          type: 'rect',
          x: 0,
          y: 264,
          width: 480,
          height: 36,
          fill: '#1d4ed8',
          style: {
            backgroundColor: '#1d4ed8'
          }
        }
      ],
      back: [
        // Student information section
        {
          type: 'text',
          field: 'birthdate',
          x: 12,
          y: 12,
          width: 200,
          height: 20,
          textStyle: { size: 12, weight: 'normal', color: '#111827' },
          placeholder: 'DOB: 2004-01-01',
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        {
          type: 'text',
          field: 'address',
          x: 12,
          y: 36,
          width: 200,
          height: 20,
          textStyle: { size: 12, weight: 'normal', color: '#111827' },
          placeholder: 'Address: City, State',
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        {
          type: 'text',
          field: 'mobile',
          x: 12,
          y: 60,
          width: 200,
          height: 20,
          textStyle: { size: 12, weight: 'normal', color: '#111827' },
          placeholder: 'Mobile: +91 90000 00000',
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#111827',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }
        },
        // QR Code - bottom right
        {
          type: 'qr',
          field: 'qr',
          x: 329,
          y: 128,
          width: 134,
          height: 134,
          style: {
            backgroundColor: '#fff'
          }
        },
        // Bottom colored bar
        {
          type: 'rect',
          x: 0,
          y: 264,
          width: 480,
          height: 36,
          fill: '#059669',
          style: {
            backgroundColor: '#059669'
          }
        }
      ]
    }
  }
}

export const getDefaultTemplates = () => {
  return [
    getUniversityStandardTemplate(),
    // Add other templates here as needed
  ]
}
