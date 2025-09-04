"use client"

import { useEffect } from "react"

export default function SuppressWarnings() {
  useEffect(() => {
    // Suppress hydration warnings in development
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      console.error = (...args) => {
        if (
          typeof args[0] === 'string' &&
          (args[0].includes('Hydration') || 
           args[0].includes('hydration') ||
           args[0].includes('server rendered HTML') ||
           args[0].includes('preloaded using link preload'))
        ) {
          return
        }
        originalError.apply(console, args)
      }
    }
  }, [])

  return null
}

