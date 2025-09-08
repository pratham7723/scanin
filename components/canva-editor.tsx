'use client'

import { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDefaultTemplates } from '@/lib/template-utils'
import { 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon, 
  QrCode, 
  Palette, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  RotateCcw,
  RotateCw,
  Trash2,
  Copy,
  Download,
  Save
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Element {
  id: string
  type: 'text' | 'image' | 'shape' | 'qr'
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  content: string
  isDynamic?: boolean // For dynamic text that updates from student data
  dataField?: string // Field name for dynamic text
  shapeType?: 'rectangle' | 'circle' // For shape elements
  style: {
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
    textDecoration?: 'none' | 'underline'
    textAlign?: 'left' | 'center' | 'right'
    color?: string
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    fontFamily?: string
    letterSpacing?: number
    lineHeight?: number
  }
  locked?: boolean
  visible?: boolean
  opacity?: number
}

interface CanvasEditorProps {
  initialData?: {
    full_name: string
    prn: string
    enrollment_no: string
    batch: string
    university: string
    department: string
    birthdate: string
    address: string
    mobile: string
    photo: string
    qr: string
  }
  onSave?: (elements: Element[]) => void
  onExport?: (format: 'png' | 'pdf') => void
  onSaveTemplate?: (templateData: any) => void
  onGenerateCSV?: (templateData: any) => void
}

function CanvasEditor({ initialData, onSave, onExport, onSaveTemplate, onGenerateCSV }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<Element[]>([])
  const initializedRef = useRef(false)
  const [elements, setElements] = useState<Element[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragThreshold] = useState(5) // Minimum movement to start dragging
  
  // Toolbar state
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'shape' | 'image' | 'qr'>('select')
  const [currentZoom, setCurrentZoom] = useState(1)
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle'>('rectangle')
  const [textType, setTextType] = useState<'static' | 'dynamic'>('static')
  
  // Card side state
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front')
  const [frontElements, setFrontElements] = useState<Element[]>([])
  const [backElements, setBackElements] = useState<Element[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('uni-standard')
  // Template management states
  const [adminTemplates, setAdminTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  
  // Default templates
  const defaultTemplates = useMemo(() => {
    return getDefaultTemplates().map(template => ({
      ...template,
      sides: {
        front: template.sides.front || [],
        back: template.sides.back || []
      }
    }))
  }, [])
  
  // Fetch admin templates
  const fetchAdminTemplates = useCallback(async () => {
    console.log('🔄 Fetching admin templates...')
    try {
      setLoadingTemplates(true)
      const response = await fetch('/api/templates')
      console.log('🔄 Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('🔄 Fetched data:', data)
        const templates = Array.isArray(data) ? data : []
        console.log('🔄 Setting admin templates:', templates.length)
        console.log('🔄 Template data:', templates)
        
        // Update admin templates state
        setAdminTemplates(templates)
        console.log('🔄 Admin templates state updated')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setAdminTemplates([]) // Reset on error
    } finally {
      setLoadingTemplates(false)
    }
  }, [])
  
  // Combined templates
  const allTemplates = useMemo(() => {
    console.log('🔄 Combining templates - admin:', adminTemplates.length, 'default:', defaultTemplates.length)
    console.log('🔄 Admin templates:', adminTemplates)
    console.log('🔄 Default templates:', defaultTemplates)
    const combined = [...defaultTemplates, ...adminTemplates]
    console.log('🔄 Combined templates:', combined.length)
    return combined
  }, [adminTemplates, defaultTemplates])
  
  // Fetch templates on mount
  useEffect(() => {
    fetchAdminTemplates()
  }, [fetchAdminTemplates])
  
  // Monitor adminTemplates state changes
  useEffect(() => {
    console.log('🔄 Admin templates state changed:', adminTemplates.length)
  }, [adminTemplates])
  
  const refreshTemplatesList = useCallback(async () => {
    console.log('🔄 Manual refresh triggered')
    await fetchAdminTemplates()
  }, [fetchAdminTemplates])
  
  
  // Get current side elements
  const currentElements = currentSide === 'front' ? frontElements : backElements
  const setCurrentElements = currentSide === 'front' ? setFrontElements : setBackElements

  // Get current template
  const currentTemplate = allTemplates.find((t: any) => t.id === selectedTemplateId) || allTemplates[0]

  // Convert template to elements - Copy exact design from ID card page
  const convertTemplateToElements = useCallback((template: any, side: 'front' | 'back', data: any): Element[] => {
    try {
      console.log(`Converting template for side ${side}:`, template)
      console.log(`Data passed to convertTemplateToElements:`, data)
      
      // Check if this is a saved template with custom elements
      if (template.template_data || template.front || template.back) {
        // Saved template with custom elements
        const sideElements = side === 'front' 
          ? (template.front?.elements || template.front_elements || template.template_data?.front_elements || [])
          : (template.back?.elements || template.back_elements || template.template_data?.back_elements || [])
        
        if (sideElements && sideElements.length > 0) {
          console.log(`Loading ${side} elements from saved template:`, sideElements)
          return sideElements.map((element: any, index: number) => ({
            ...element,
            id: element.id || `element_${index}`,
            zIndex: element.zIndex || index
          }))
        }
      }
      
      if (side === 'front') {
        // Front side - exact copy from ID card page
        console.log('🔄 Creating front side elements with data:', data)
        console.log('🔄 Photo data:', data?.photo)
        return [
          // University header - centered at top
          {
            id: 'university',
            type: 'text',
            x: 0,
            y: 8,
            width: 480,
            height: 28,
            zIndex: 10,
            content: data?.university || 'University Name',
            isDynamic: true,
            dataField: 'university',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 16,
              fontWeight: 'bold',
              color: template.colors?.neutral || '#111827',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif'
            }
          },
          // Photo section - left side (1/3 width)
          {
            id: 'photo',
            type: 'image',
            x: 12,
            y: 40,
            width: 120,
            height: 150,
            zIndex: 5,
            content: data?.photo || '',
            isDynamic: true,
            dataField: 'photo',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              backgroundColor: '#e5e7eb',
              borderRadius: 4
            }
          },
          // Student name - right side
          {
            id: 'name',
            type: 'text',
            x: 140,
            y: 40,
            width: 240,
            height: 28,
            zIndex: 10,
            content: data?.full_name || 'Student Name',
            isDynamic: true,
            dataField: 'full_name',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 16,
              fontWeight: 'bold',
              color: template.colors?.neutral || '#111827',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }
          },
          // PRN - right side
          {
            id: 'prn',
            type: 'text',
            x: 140,
            y: 72,
            width: 240,
            height: 24,
            zIndex: 10,
            content: `PRN: ${data?.prn || 'PRN-0000'}`,
            isDynamic: true,
            dataField: 'prn',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 12,
              fontWeight: 'normal',
              color: template.colors?.neutral || '#111827',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }
          },
          // Enrollment - right side
          {
            id: 'enrollment',
            type: 'text',
            x: 140,
            y: 100,
            width: 240,
            height: 24,
            zIndex: 10,
            content: `Enroll: ${data?.enrollment_no || 'ENR-123456'}`,
            isDynamic: true,
            dataField: 'enrollment_no',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 12,
              fontWeight: 'normal',
              color: template.colors?.neutral || '#111827',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }
          },
          // Batch - right side
          {
            id: 'batch',
            type: 'text',
            x: 140,
            y: 128,
            width: 240,
            height: 24,
            zIndex: 10,
            content: `Batch: ${data?.batch || '2022-26'}`,
            isDynamic: true,
            dataField: 'batch',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 12,
              fontWeight: 'normal',
              color: template.colors?.neutral || '#111827',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }
          },
          // Bottom colored bar
          {
            id: 'bottom_bar',
            type: 'shape',
            x: 0,
            y: 264,
            width: 480,
            height: 36,
            zIndex: 1,
            content: '',
            isDynamic: false,
            dataField: '',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              backgroundColor: template.colors?.primary || '#1d4ed8'
            }
          }
        ]
      } else {
        // Back side - exact copy from ID card page
        return [
          // Student information section
          {
            id: 'dob',
            type: 'text',
            x: 12,
            y: 12,
            width: 200,
            height: 20,
            zIndex: 10,
            content: `DOB: ${data?.birthdate || '2004-01-01'}`,
            isDynamic: true,
            dataField: 'birthdate',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 12,
              fontWeight: 'normal',
              color: template.colors?.neutral || '#111827',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }
          },
          {
            id: 'address',
            type: 'text',
            x: 12,
            y: 36,
            width: 200,
            height: 20,
            zIndex: 10,
            content: `Address: ${data?.address || 'City, State'}`,
            isDynamic: true,
            dataField: 'address',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 12,
              fontWeight: 'normal',
              color: template.colors?.neutral || '#111827',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }
          },
          {
            id: 'mobile',
            type: 'text',
            x: 12,
            y: 60,
            width: 200,
            height: 20,
            zIndex: 10,
            content: `Mobile: ${data?.mobile || '+91 90000 00000'}`,
            isDynamic: true,
            dataField: 'mobile',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              fontSize: 12,
              fontWeight: 'normal',
              color: template.colors?.neutral || '#111827',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }
          },
          // QR Code - bottom right
          {
            id: 'qr',
            type: 'qr',
            x: 329,
            y: 128,
            width: 134,
            height: 134,
            zIndex: 10,
            content: data?.qr || data?.prn || 'QR',
            isDynamic: true,
            dataField: 'qr',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              backgroundColor: '#ffffff',
              borderRadius: 4
            }
          },
          // Bottom colored bar
          {
            id: 'bottom_bar',
            type: 'shape',
            x: 0,
            y: 264,
            width: 480,
            height: 36,
            zIndex: 1,
            content: '',
            isDynamic: false,
            dataField: '',
            locked: false,
            visible: true,
            opacity: 1,
            style: {
              backgroundColor: template.colors?.accent || '#059669'
            }
          }
        ]
      }
    } catch (error) {
      console.error('Error converting template to elements:', error)
      return []
    }
  }, [])
  
  // Properties panel state
  const [showProperties, setShowProperties] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  
  // Undo/Redo state
  const [history, setHistory] = useState<Element[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Layer dragging state
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null)
  
  // Main background state
  const [mainBackground, setMainBackground] = useState({
    innerColor: '#ffffff',
    borderWidth: 0,
    borderColor: '#000000'
  })

  // Sync ref with elements
  useEffect(() => {
    elementsRef.current = elements
  }, [elements])

  // Sync elements when switching sides
  useEffect(() => {
    setElements(currentElements)
    elementsRef.current = currentElements
  }, [currentSide, currentElements])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      initializedRef.current = false
    }
  }, [])

  // Save to history for undo/redo
  const saveToHistory = useCallback((newElements: Element[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newElements])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    elementsRef.current = newElements
  }, [history, historyIndex])

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    try {
      console.log('🔄 Looking for template with ID:', templateId)
      console.log('🔄 Available templates:', allTemplates.map(t => ({ id: t.id, name: t.name })))
      const template = allTemplates.find((t: any) => t.id === templateId)
      if (!template) {
        console.warn(`Template with id ${templateId} not found`)
        return
      }

      console.log('🔄 Applying template:', template)
      const frontElements = convertTemplateToElements(template, 'front', initialData)
      const backElements = convertTemplateToElements(template, 'back', initialData)
      
      console.log('Front elements:', frontElements)
      console.log('Back elements:', backElements)
      
      setFrontElements(frontElements)
      setBackElements(backElements)
      setElements(currentSide === 'front' ? frontElements : backElements)
      saveToHistory(currentSide === 'front' ? frontElements : backElements)
      
      // Apply main background if it's a saved template
      if (template.main_background) {
        console.log('Applying main background from saved template:', template.main_background)
        setMainBackground(template.main_background)
      }
    } catch (error) {
      console.error('Error applying template:', error)
    }
  }, [convertTemplateToElements, currentSide, initialData, saveToHistory])

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
    }
  }, [historyIndex])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    }
  }, [historyIndex, history.length])

  // Update elements when history index changes
  useEffect(() => {
    if (history.length > 0 && historyIndex >= 0 && historyIndex < history.length) {
      const newElements = [...history[historyIndex]]
      setElements(newElements)
      elementsRef.current = newElements
    }
  }, [historyIndex, history])

  // Initialize history with current elements
  useEffect(() => {
    if (elements.length > 0 && history.length === 0) {
      setHistory([[...elements]])
      setHistoryIndex(0)
    }
  }, [elements, history.length])

  // Initialize with template
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      console.log('🔄 Initializing template with ID:', selectedTemplateId)
      console.log('🔄 Initial data:', initialData)
      applyTemplate(selectedTemplateId)
    }
  }, [selectedTemplateId, applyTemplate, initialData])

  // Handle mouse down for dragging/resizing
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only allow dragging if select tool is active
    if (activeTool !== 'select') return
    
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    setSelectedElement(elementId)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Check if clicking on resize handle
    const handleSize = 8
    const isOnResizeHandle = 
      (mouseX >= element.x + element.width - handleSize && mouseX <= element.x + element.width + handleSize &&
       mouseY >= element.y + element.height - handleSize && mouseY <= element.y + element.height + handleSize)

    if (isOnResizeHandle) {
      setIsResizing(true)
      setResizeHandle('se') // southeast
    } else {
      // Don't start dragging immediately - wait for mouse movement
      setDragStart({
        x: mouseX - element.x,
        y: mouseY - element.y,
        startX: mouseX,
        startY: mouseY
      })
    }
  }, [elements, activeTool])

  // Handle mouse move for dragging/resizing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedElement) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Check if we should start dragging (only if mouse moved enough)
    if (!isDragging && !isResizing && dragStart.startX !== 0 && dragStart.startY !== 0) {
      const deltaX = Math.abs(mouseX - dragStart.startX)
      const deltaY = Math.abs(mouseY - dragStart.startY)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance > dragThreshold) {
        setIsDragging(true)
      }
    }

    if (isDragging) {
      setCurrentElements(prev => prev.map(el => 
        el.id === selectedElement 
          ? { ...el, x: mouseX - dragStart.x, y: mouseY - dragStart.y }
          : el
      ))
    } else if (isResizing) {
      setCurrentElements(prev => prev.map(el => 
        el.id === selectedElement 
          ? { 
              ...el, 
              width: Math.max(20, mouseX - el.x), 
              height: Math.max(20, mouseY - el.y) 
            }
          : el
      ))
    }
  }, [isDragging, isResizing, selectedElement, dragStart, dragThreshold])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      // Save to history when dragging/resizing ends
      saveToHistory(elementsRef.current)
    }
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setDragStart({ x: 0, y: 0, startX: 0, startY: 0 })
  }, [isDragging, isResizing, saveToHistory])

  // Add new element
  const addElement = useCallback((type: 'text' | 'image' | 'shape' | 'qr', x?: number, y?: number) => {
    const newElement: Element = {
      id: `${type}_${Date.now()}`,
      type,
      x: x || 100,
      y: y || 100,
      width: type === 'text' ? 150 : type === 'qr' ? 60 : 100,
      height: type === 'text' ? 30 : type === 'qr' ? 60 : 100,
      zIndex: currentElements.length + 1,
      content: type === 'text' ? (textType === 'dynamic' ? 'Dynamic Text' : 'Static Text') : type === 'qr' ? 'QR Code' : '',
      isDynamic: type === 'text' ? textType === 'dynamic' : type === 'qr' || type === 'image',
      dataField: type === 'text' && textType === 'dynamic' ? 'custom_field' : undefined,
      shapeType: type === 'shape' ? (selectedShape as 'rectangle' | 'circle') : undefined,
      style: {
        fontSize: 14,
        color: '#000000',
        textAlign: 'left',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: type === 'shape' ? '#3b82f6' : undefined,
        borderRadius: type === 'shape' ? 8 : undefined
      }
    }
    
    const newElements = [...currentElements, newElement]
    setCurrentElements(newElements)
    setSelectedElement(newElement.id)
    saveToHistory(newElements)
  }, [currentElements, textType, saveToHistory])

  // Handle canvas click to add elements
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'select') return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Add element at clicked position
    if (activeTool === 'text') {
      addElement('text', mouseX - 75, mouseY - 15) // Center the text element
    } else if (activeTool === 'shape') {
      addElement('shape', mouseX - 50, mouseY - 50) // Center the shape element
    } else if (activeTool === 'image') {
      addElement('image', mouseX - 50, mouseY - 50) // Center the image element
    } else if (activeTool === 'qr') {
      addElement('qr', mouseX - 30, mouseY - 30) // Center the QR element
    }

    // Reset to select tool after adding
    setActiveTool('select')
  }, [activeTool, addElement])

  // Handle double click to edit text
  const handleElementDoubleClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (!element || element.type !== 'text') return

    setSelectedElement(elementId)
    setActiveTool('select')
    
    // Focus on the text input in properties panel
    setTimeout(() => {
      const input = document.querySelector('input[value="' + element.content + '"]') as HTMLInputElement
      if (input) {
        input.focus()
        input.select()
      }
    }, 100)
  }, [elements])

  // Delete selected element
  const deleteElement = useCallback(() => {
    if (selectedElement) {
      const newElements = currentElements.filter(el => el.id !== selectedElement)
      setCurrentElements(newElements)
      setSelectedElement(null)
      saveToHistory(newElements)
    }
  }, [selectedElement, currentElements, saveToHistory])

  // Duplicate selected element
  const duplicateElement = useCallback(() => {
    if (selectedElement) {
      const element = currentElements.find(el => el.id === selectedElement)
      if (element) {
        const newElement = {
          ...element,
          id: `${element.type}_${Date.now()}`,
          x: element.x + 20,
          y: element.y + 20,
          zIndex: currentElements.length + 1
        }
        const newElements = [...currentElements, newElement]
        setCurrentElements(newElements)
        setSelectedElement(newElement.id)
        saveToHistory(newElements)
      }
    }
  }, [selectedElement, currentElements, saveToHistory])

  // Update element style
  const updateElementStyle = useCallback((property: string, value: any) => {
    if (selectedElement) {
      const newElements = currentElements.map(el => 
        el.id === selectedElement 
          ? { ...el, style: { ...el.style, [property]: value } }
          : el
      )
      setCurrentElements(newElements)
      saveToHistory(newElements)
    }
  }, [selectedElement, currentElements, saveToHistory])

  // Update element content
  const updateElementContent = useCallback((content: string) => {
    if (selectedElement) {
      const newElements = currentElements.map(el => 
        el.id === selectedElement 
          ? { ...el, content }
          : el
      )
      setCurrentElements(newElements)
      saveToHistory(newElements)
    }
  }, [selectedElement, currentElements, saveToHistory])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 's':
            e.preventDefault()
            onSave?.(elementsRef.current)
            break
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedElement) {
              deleteElement()
            }
            break
          case 'Escape':
            setSelectedElement(null)
            setActiveTool('select')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedElement, deleteElement, onSave])

  // Move element up/down in z-index
  const moveElementZ = useCallback((direction: 'up' | 'down') => {
    if (selectedElement) {
      setCurrentElements(prev => {
        const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex)
        const currentIndex = sorted.findIndex(el => el.id === selectedElement)
        
        if (direction === 'up' && currentIndex < sorted.length - 1) {
          [sorted[currentIndex], sorted[currentIndex + 1]] = [sorted[currentIndex + 1], sorted[currentIndex]]
        } else if (direction === 'down' && currentIndex > 0) {
          [sorted[currentIndex], sorted[currentIndex - 1]] = [sorted[currentIndex - 1], sorted[currentIndex]]
        }
        
        const newElements = sorted.map((el, index) => ({ ...el, zIndex: index + 1 }))
        saveToHistory(newElements)
        return newElements
      })
    }
  }, [selectedElement, saveToHistory])

  // Export functionality
  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    if (!canvasRef.current) {
      console.error('Canvas ref not found')
      alert('Canvas not found. Please try again.')
      return
    }

    try {
      console.log('Starting export for format:', format)
      
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      console.log('Canvas generated successfully')

      if (format === 'png') {
        const link = document.createElement('a')
        link.download = 'id-card.png'
        link.href = canvas.toDataURL('image/png')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        console.log('PNG download initiated')
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [85.6, 53.98] // ID card dimensions in mm
        })
        
        pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98)
        pdf.save('id-card.pdf')
        console.log('PDF download initiated')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    }
  }, [])

  // Handle save template
  const handleSaveTemplate = useCallback(() => {
    const templateData = {
      id: selectedTemplateId,
      name: currentTemplate.name || 'My Template',
      colors: currentTemplate.colors || { primary: '#3B82F6', secondary: '#1E40AF' },
      front: {
        elements: frontElements
      },
      back: {
        elements: backElements
      },
      main_background: mainBackground
    }
    onSaveTemplate?.(templateData)
    
    // Refresh templates after saving
    setTimeout(() => {
      refreshTemplatesList()
    }, 500)
  }, [selectedTemplateId, currentTemplate, frontElements, backElements, mainBackground, onSaveTemplate, refreshTemplatesList])

  // Handle generate CSV
  const handleGenerateCSV = useCallback(() => {
    const templateData = {
      id: selectedTemplateId,
      name: currentTemplate.name,
      colors: currentTemplate.colors,
      elements: currentElements, // Include current elements for dynamic field extraction
      front: {
        elements: frontElements
      },
      back: {
        elements: backElements
      },
      mainBackground
    }
    onGenerateCSV?.(templateData)
  }, [selectedTemplateId, currentTemplate, frontElements, backElements, mainBackground, currentElements, onGenerateCSV])

  const selectedElementData = currentElements.find(el => el.id === selectedElement)

  return (
    <div className="h-full max-h-screen flex bg-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-2 space-y-1 flex-shrink-0">
        {/* Undo/Redo */}
        <div className="flex flex-col space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
            className="h-10 w-10 p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Shift+Z)"
            className="h-10 w-10 p-0"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="border-t border-gray-200 w-full my-2" />
        
        {/* Tools */}
        <Button
          variant={activeTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('select')}
          title="Select (V)"
          className="h-10 w-10 p-0"
        >
          <Move className="w-4 h-4" />
        </Button>
        
        <div className="flex flex-col space-y-1">
          <Button
            variant={activeTool === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool('text')}
            title="Add Text (T)"
            className="h-10 w-10 p-0"
          >
            <Type className="w-4 h-4" />
          </Button>
          {activeTool === 'text' && (
            <div className="flex flex-col space-y-1">
              <Button
                variant={textType === 'static' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextType('static')}
                title="Static Text"
                className="h-6 w-6 p-0 text-xs"
              >
                S
              </Button>
              <Button
                variant={textType === 'dynamic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextType('dynamic')}
                title="Dynamic Text"
                className="h-6 w-6 p-0 text-xs"
              >
                D
              </Button>
            </div>
          )}
        </div>
        
        <Button
          variant={activeTool === 'shape' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('shape')}
          title="Add Shape (S)"
          className="h-10 w-10 p-0"
        >
          <Square className="w-4 h-4" />
        </Button>
        
        <Button
          variant={activeTool === 'image' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('image')}
          title="Add Image (I)"
          className="h-10 w-10 p-0"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        
        <Button
          variant={activeTool === 'qr' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('qr')}
          title="Add QR Code (Q)"
          className="h-10 w-10 p-0"
        >
          <QrCode className="w-4 h-4" />
        </Button>
        
        <div className="border-t border-gray-200 w-full my-2" />
        
        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={deleteElement}
          disabled={!selectedElement}
          title="Delete (Del)"
          className="h-10 w-10 p-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={duplicateElement}
          disabled={!selectedElement}
          title="Duplicate (Ctrl+D)"
          className="h-10 w-10 p-0"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-2 sm:px-4 flex-shrink-0 overflow-x-auto">
          {/* Left Section */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Side Selection */}
            <div className="flex border border-gray-300 rounded-md">
              <Button
                variant={currentSide === 'front' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentSide('front')}
                className="rounded-r-none border-r border-gray-300"
              >
                Front
              </Button>
              <Button
                variant={currentSide === 'back' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentSide('back')}
                className="rounded-l-none"
              >
                Back
              </Button>
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
              {/* Template Selection */}
              <div className="flex items-center space-x-2">
                <Label className="text-xs font-medium whitespace-nowrap">Template:</Label>
                <span className="text-xs text-gray-500">({adminTemplates.length} saved)</span>
                <button
                  onClick={refreshTemplatesList}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Refresh
                </button>
                <select
                value={selectedTemplateId}
                onChange={(e) => {
                  console.log('🔄 Template selected:', e.target.value)
                  setSelectedTemplateId(e.target.value)
                  applyTemplate(e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {/* Default Templates */}
                <optgroup label="Default Templates">
                  {defaultTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
                
                {/* Admin Templates */}
                {loadingTemplates ? (
                  <optgroup label="Loading...">
                    <option disabled>Loading templates...</option>
                  </optgroup>
                ) : adminTemplates.length > 0 ? (
                  <optgroup label="Saved Templates">
                    {adminTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <optgroup label="No Saved Templates">
                    <option disabled>No saved templates found</option>
                  </optgroup>
                )}
              </select>
            </div>
          </div>
          
          {/* Center Section - Spacer */}
          <div className="flex-1" />
          
          {/* Right Section */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Panel Toggles */}
            <Button 
              variant={showProperties ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setShowProperties(!showProperties)} 
              className="text-xs px-2 py-1 hidden sm:flex"
            >
              Properties
            </Button>
            <Button 
              variant={showLayers ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setShowLayers(!showLayers)} 
              className="text-xs px-2 py-1 hidden sm:flex"
            >
              Layers
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2 hidden sm:block" />
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-md">
              <span className="text-xs text-gray-600 px-2 hidden sm:inline">Zoom:</span>
              <button 
                onClick={() => {
                  const canvas = canvasRef.current
                  if (canvas) {
                    canvas.style.transform = 'scale(0.8)'
                    setCurrentZoom(0.8)
                  }
                }}
                className={`text-xs px-2 py-1 rounded-l ${currentZoom === 0.8 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                80%
              </button>
              <button 
                onClick={() => {
                  const canvas = canvasRef.current
                  if (canvas) {
                    canvas.style.transform = 'scale(1)'
                    setCurrentZoom(1)
                  }
                }}
                className={`text-xs px-2 py-1 ${currentZoom === 1 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                100%
              </button>
              <button 
                onClick={() => {
                  const canvas = canvasRef.current
                  if (canvas) {
                    canvas.style.transform = 'scale(1.2)'
                    setCurrentZoom(1.2)
                  }
                }}
                className={`text-xs px-2 py-1 rounded-r ${currentZoom === 1.2 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                120%
              </button>
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            {/* Export Buttons */}
            <Button variant="outline" size="sm" onClick={() => handleExport('png')} className="text-xs px-2 py-1 whitespace-nowrap">
              <Download className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">PNG</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="text-xs px-2 py-1 whitespace-nowrap">
              <Download className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 p-8 flex items-center justify-center overflow-auto min-w-0 bg-gray-50" style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '25px 25px'
          }}>
            {/* Tool Indicator */}
            {activeTool !== 'select' && (
              <div className="absolute top-4 left-4 z-50 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {activeTool === 'text' && 'Click to add text'}
                {activeTool === 'shape' && 'Click to add shape'}
                {activeTool === 'image' && 'Click to add image'}
                {activeTool === 'qr' && 'Click to add QR code'}
              </div>
            )}
            <div className="relative">
              <div
                ref={canvasRef}
                className={`relative bg-white shadow-2xl border-2 border-gray-300 max-w-full max-h-full ${
                  activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
                }`}
              style={{ 
                width: 480, 
                height: 300,
                maxWidth: '100%',
                maxHeight: '100%',
                minWidth: '480px',
                minHeight: '300px'
              }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
              >
              {/* ID Card Background - Plain white with optional border */}
              <div 
                className="absolute inset-0 rounded-lg"
                style={{ 
                  background: '#ffffff',
                  color: currentTemplate.colors?.neutral || '#111827',
                  border: mainBackground.borderWidth ? `${mainBackground.borderWidth}px solid ${mainBackground.borderColor}` : '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              >
                <div 
                  className="absolute inset-0 rounded-lg m-1"
                  style={{ 
                    background: mainBackground.innerColor,
                    borderRadius: '6px'
                  }}
                ></div>
              </div>

              {/* Elements */}
              {currentElements
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move ${
                      selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      zIndex: element.zIndex
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                    onDoubleClick={(e) => handleElementDoubleClick(e, element.id)}
                  >
                    {/* Element Content */}
                    {element.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center"
                        style={{
                          fontSize: element.style.fontSize,
                          fontWeight: element.style.fontWeight,
                          fontStyle: element.style.fontStyle,
                          textDecoration: element.style.textDecoration,
                          color: element.style.color,
                          textAlign: element.style.textAlign || 'left',
                          backgroundColor: element.style.backgroundColor,
                          border: element.style.borderWidth ? `${element.style.borderWidth}px solid ${element.style.borderColor}` : 'none',
                          borderRadius: Math.max(element.style.borderRadius || 0, 0),
                          padding: '2px 4px',
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          lineHeight: '1.2'
                        }}
                      >
                        <span className="truncate w-full">
                          {element.content}
                        </span>
                      </div>
                    )}
                    
                    {element.type === 'image' && (
                      <div
                        className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"
                        style={{
                          borderRadius: Math.max(element.style.borderRadius || 0, 0)
                        }}
                      >
                        {element.content && element.content.trim() !== '' && (
                          element.content.startsWith('http') || 
                          element.content.startsWith('blob:') || 
                          element.content.startsWith('data:')
                        ) ? (
                          <img
                            src={element.content}
                            alt="Element"
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              console.log('Image failed to load:', element.content)
                              e.currentTarget.style.display = 'none'
                              // Show fallback
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="flex flex-col items-center justify-center text-gray-400"><svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs">No Image</span></div>'
                              }
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', element.content)
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mb-1">
                              📷
                            </div>
                            <span className="text-xs">
                              {element.content && element.content.includes('.') ? "Photo Available" : "No Photo"}
                            </span>
                            {element.content && element.content.includes('.') && (
                              <span className="text-xs text-gray-300 mt-1">{element.content}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {element.type === 'shape' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: element.style.backgroundColor || '#3b82f6',
                          borderRadius: element.shapeType === 'circle' ? '50%' : (element.style.borderRadius ?? 8),
                          border: element.style.borderWidth ? `${element.style.borderWidth}px solid ${element.style.borderColor || '#000000'}` : 'none'
                        }}
                      />
                    )}
                    
                    {element.type === 'qr' && (
                      <div className="w-full h-full bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
                        <QrCode className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Resize Handle */}
                    {selectedElement === element.id && (
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                        style={{ transform: 'translate(50%, 50%)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Properties Panel */}
          {showProperties && (
            <div className="w-64 bg-white border-l border-gray-200 p-3 flex-shrink-0 overflow-y-auto max-h-full">
              <h3 className="font-semibold mb-4">Properties</h3>
              
              <div className="space-y-4">
                {/* Main Background Controls - Only show when no element is selected */}
                {!selectedElementData && (
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3 text-sm text-gray-700">Main Background</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={mainBackground.innerColor}
                          onChange={(e) => setMainBackground(prev => ({ ...prev, innerColor: e.target.value }))}
                          className="flex-1"
                        />
                        <Input
                          type="text"
                          value={mainBackground.innerColor}
                          onChange={(e) => setMainBackground(prev => ({ ...prev, innerColor: e.target.value }))}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Border</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!mainBackground.borderWidth}
                            onChange={(e) => {
                              const borderWidth = e.target.checked ? 2 : 0
                              setMainBackground(prev => ({ 
                                ...prev, 
                                borderWidth: borderWidth,
                                borderColor: borderWidth ? (prev.borderColor || '#000000') : prev.borderColor
                              }))
                            }}
                            className="rounded"
                          />
                          <Label className="text-xs">Show border</Label>
                        </div>
                        
                        {mainBackground.borderWidth > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Border Width</Label>
                              <Input
                                type="number"
                                value={mainBackground.borderWidth}
                                onChange={(e) => setMainBackground(prev => ({ ...prev, borderWidth: parseInt(e.target.value) || 0 }))}
                                min="0"
                                max="10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Border Color</Label>
                              <Input
                                type="color"
                                value={mainBackground.borderColor}
                                onChange={(e) => setMainBackground(prev => ({ ...prev, borderColor: e.target.value }))}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Element Properties */}
                {selectedElementData && (
                  <>
                {/* Element Type Indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedElementData.type === 'text' ? 'bg-blue-100 text-blue-700' :
                    selectedElementData.type === 'image' ? 'bg-green-100 text-green-700' :
                    selectedElementData.type === 'shape' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedElementData.type.toUpperCase()}
                  </div>
                  {selectedElementData.isDynamic && (
                    <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      DYNAMIC
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <Label>Content</Label>
                  {selectedElementData.type === 'text' && selectedElementData.isDynamic ? (
                    <div className="space-y-2">
                      <select
                        value={selectedElementData.dataField || ''}
                        onChange={(e) => {
                          const newElements = currentElements.map(el => 
                            el.id === selectedElement 
                              ? { ...el, dataField: e.target.value, content: e.target.value ? `{${e.target.value}}` : 'Dynamic Text' }
                              : el
                          )
                          setCurrentElements(newElements)
                          saveToHistory(newElements)
                        }}
                        className="w-full px-3 py-2 border rounded text-sm"
                      >
                        <option value="">Select data field</option>
                        <option value="name">Name</option>
                        <option value="id">Student ID</option>
                        <option value="university">University</option>
                        <option value="department">Department</option>
                        <option value="course">Course</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="address">Address</option>
                        <option value="custom_field">Custom Field</option>
                      </select>
                      <div className="text-xs text-gray-500">
                        This text will automatically update from student data
                      </div>
                    </div>
                  ) : (
                    <Input
                      value={selectedElementData.content}
                      onChange={(e) => updateElementContent(e.target.value)}
                    />
                  )}
                </div>

                {/* Text Type Toggle */}
                {selectedElementData.type === 'text' && (
                  <div>
                    <Label>Text Type</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant={!selectedElementData.isDynamic ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newElements = currentElements.map(el => 
                            el.id === selectedElement 
                              ? { ...el, isDynamic: false, dataField: undefined }
                              : el
                          )
                          setCurrentElements(newElements)
                          saveToHistory(newElements)
                        }}
                        className="flex-1"
                      >
                        Static
                      </Button>
                      <Button
                        variant={selectedElementData.isDynamic ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newElements = currentElements.map(el => 
                            el.id === selectedElement 
                              ? { ...el, isDynamic: true, dataField: 'custom_field' }
                              : el
                          )
                          setCurrentElements(newElements)
                          saveToHistory(newElements)
                        }}
                        className="flex-1"
                      >
                        Dynamic
                      </Button>
                    </div>
                  </div>
                )}

                {/* Position & Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>X</Label>
                    <Input
                      type="number"
                      value={selectedElementData.x}
                      onChange={(e) => {
                        const newElements = currentElements.map(el => 
                          el.id === selectedElement ? { ...el, x: parseInt(e.target.value) || 0 } : el
                        )
                        setCurrentElements(newElements)
                        saveToHistory(newElements)
                      }}
                    />
                  </div>
                  <div>
                    <Label>Y</Label>
                    <Input
                      type="number"
                      value={selectedElementData.y}
                      onChange={(e) => {
                        const newElements = currentElements.map(el => 
                          el.id === selectedElement ? { ...el, y: parseInt(e.target.value) || 0 } : el
                        )
                        setCurrentElements(newElements)
                        saveToHistory(newElements)
                      }}
                    />
                  </div>
                  <div>
                    <Label>Width</Label>
                    <Input
                      type="number"
                      value={selectedElementData.width}
                      onChange={(e) => {
                        const newElements = currentElements.map(el => 
                          el.id === selectedElement ? { ...el, width: parseInt(e.target.value) || 0 } : el
                        )
                        setCurrentElements(newElements)
                        saveToHistory(newElements)
                      }}
                    />
                  </div>
                  <div>
                    <Label>Height</Label>
                    <Input
                      type="number"
                      value={selectedElementData.height}
                      onChange={(e) => {
                        const newElements = currentElements.map(el => 
                          el.id === selectedElement ? { ...el, height: parseInt(e.target.value) || 0 } : el
                        )
                        setCurrentElements(newElements)
                        saveToHistory(newElements)
                      }}
                    />
                  </div>
                </div>


                {/* Text Styles */}
                {selectedElementData.type === 'text' && (
                  <>
                    <div>
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={selectedElementData.style.fontSize || 14}
                        onChange={(e) => updateElementStyle('fontSize', parseInt(e.target.value) || 14)}
                      />
                    </div>

                    <div>
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={selectedElementData.style.color || '#000000'}
                        onChange={(e) => updateElementStyle('color', e.target.value)}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant={selectedElementData.style.fontWeight === 'bold' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElementStyle('fontWeight', 
                          selectedElementData.style.fontWeight === 'bold' ? 'normal' : 'bold'
                        )}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.style.fontStyle === 'italic' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElementStyle('fontStyle', 
                          selectedElementData.style.fontStyle === 'italic' ? 'normal' : 'italic'
                        )}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.style.textDecoration === 'underline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElementStyle('textDecoration', 
                          selectedElementData.style.textDecoration === 'underline' ? 'none' : 'underline'
                        )}
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Text Align</Label>
                      <div className="flex space-x-1">
                        <Button
                          variant={selectedElementData.style.textAlign === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElementStyle('textAlign', 'left')}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedElementData.style.textAlign === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElementStyle('textAlign', 'center')}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedElementData.style.textAlign === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElementStyle('textAlign', 'right')}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Shape Styles */}
                {selectedElementData.type === 'shape' && (
                  <>
                    <div>
                      <Label>Background Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={selectedElementData.style.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="text"
                          value={selectedElementData.style.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                          className="flex-1"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Border</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!selectedElementData.style.borderWidth}
                            onChange={(e) => {
                              const borderWidth = e.target.checked ? 2 : 0
                              const newElements = currentElements.map(el => 
                                el.id === selectedElement 
                                  ? { 
                                      ...el, 
                                      style: { 
                                        ...el.style, 
                                        borderWidth: borderWidth,
                                        borderColor: borderWidth ? (el.style.borderColor || '#000000') : undefined
                                      } 
                                    } 
                                  : el
                              )
                              setCurrentElements(newElements)
                              saveToHistory(newElements)
                            }}
                            className="rounded"
                          />
                          <Label className="text-sm">Show border</Label>
                        </div>
                        
                        {selectedElementData.style.borderWidth && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Border Width</Label>
                              <Input
                                type="number"
                                value={selectedElementData.style.borderWidth || 2}
                                onChange={(e) => updateElementStyle('borderWidth', parseInt(e.target.value) || 0)}
                                min="0"
                                max="10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Border Color</Label>
                              <Input
                                type="color"
                                value={selectedElementData.style.borderColor || '#000000'}
                                onChange={(e) => updateElementStyle('borderColor', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Border Radius</Label>
                      <Input
                        type="number"
                        value={selectedElementData.style.borderRadius ?? 8}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          if (inputValue === '') {
                            updateElementStyle('borderRadius', 8)
                            return
                          }
                          const value = parseInt(inputValue)
                          if (isNaN(value) || value < 0) {
                            updateElementStyle('borderRadius', 8)
                          } else {
                            updateElementStyle('borderRadius', Math.min(value, 50))
                          }
                        }}
                        min="0"
                        max="50"
                      />
                    </div>

                    <div>
                      <Label>Shape Type</Label>
                      <div className="flex space-x-2">
                        <Button
                          variant={selectedElementData.shapeType === 'rectangle' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newElements = currentElements.map(el => 
                              el.id === selectedElement ? { ...el, shapeType: 'rectangle' as const } : el
                            )
                            setCurrentElements(newElements)
                            saveToHistory(newElements)
                          }}
                          className="flex-1"
                        >
                          Rectangle
                        </Button>
                        <Button
                          variant={selectedElementData.shapeType === 'circle' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newElements = currentElements.map(el => 
                              el.id === selectedElement ? { ...el, shapeType: 'circle' as const } : el
                            )
                            setCurrentElements(newElements)
                            saveToHistory(newElements)
                          }}
                          className="flex-1"
                        >
                          Circle
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Layer Controls */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveElementZ('up')}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveElementZ('down')}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Layers Panel */}
          {showLayers && (
            <div className="w-64 bg-white border-l border-gray-200 p-3 flex-shrink-0 overflow-y-auto max-h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Layers</h3>
                <div className="text-xs text-gray-500">
                  {currentElements.length} element{currentElements.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {currentElements
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((element, index) => (
                    <div
                      key={element.id}
                      className={`group p-2 rounded cursor-pointer border transition-all ${
                        selectedElement === element.id 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'hover:bg-gray-50 border-transparent'
                      } ${
                        draggedLayer === element.id ? 'opacity-50' : ''
                      } ${
                        dragOverLayer === element.id ? 'border-blue-400' : ''
                      }`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedLayer(element.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOverLayer(element.id)
                      }}
                      onDragLeave={() => setDragOverLayer(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (draggedLayer && draggedLayer !== element.id) {
                          // Reorder elements
                          const draggedEl = currentElements.find(el => el.id === draggedLayer)
                          const targetEl = element
                          
                          if (draggedEl && targetEl) {
                            const newElements = currentElements.map(el => {
                              if (el.id === draggedLayer) {
                                return { ...el, zIndex: targetEl.zIndex }
                              } else if (el.zIndex > targetEl.zIndex && el.id !== draggedLayer) {
                                return { ...el, zIndex: el.zIndex + 1 }
                              }
                              return el
                            })
                            
                            // Reassign z-indexes properly
                            const sorted = newElements.sort((a, b) => a.zIndex - b.zIndex)
                            const finalElements = sorted.map((el, idx) => ({ ...el, zIndex: idx + 1 }))
                            
                            setElements(finalElements)
                            saveToHistory(finalElements)
                          }
                        }
                        setDraggedLayer(null)
                        setDragOverLayer(null)
                      }}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                            element.type === 'text' ? 'bg-blue-200 text-blue-800' :
                            element.type === 'image' ? 'bg-green-200 text-green-800' :
                            element.type === 'shape' ? 'bg-purple-200 text-purple-800' :
                            'bg-orange-200 text-orange-800'
                          }`}>
                            {element.type === 'text' ? 'T' : 
                             element.type === 'image' ? 'I' :
                             element.type === 'shape' ? 'S' : 'Q'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {element.content || `${element.type} element`}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                              <span>{element.type}</span>
                              {element.isDynamic && (
                                <span className="bg-blue-100 text-blue-700 px-1 rounded text-xs">
                                  Dynamic
                                </span>
                              )}
                              {element.locked && (
                                <span className="bg-gray-100 text-gray-700 px-1 rounded text-xs">
                                  Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveElementZ('up')
                            }}
                            disabled={index === 0}
                            title="Bring Forward"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveElementZ('down')
                            }}
                            disabled={index === elements.length - 1}
                            title="Send Backward"
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteElement()
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {elements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">No elements yet</div>
                  <div className="text-xs mt-1">Add elements using the tools on the left</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(CanvasEditor)
