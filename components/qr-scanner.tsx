"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { Button } from "./ui/button"

type Props = {
  onResult: (text: string) => void
}

export default function QrScanner({ onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!started) return
    const codeReader = new BrowserMultiFormatReader()
    let active = true
    let currentStream: MediaStream | null = null
    const video = videoRef.current

    async function start() {
      try {
        if (!video) return
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        video.srcObject = currentStream
        await video.play()

        // Use decodeFromVideoDevice which provides a continuous callback.
        codeReader.decodeFromVideoDevice(undefined, video, (result, err) => {
          if (!active) return
          if (result && result.getText()) {
            // Found a QR result, emit once and stop
            onResult(result.getText())
            stop()
          } else if (err) {
            // Ignore "NotFoundException" style cases (no code in frame)
            const name = (err as any)?.name || ""
            if (name !== "NotFoundException") {
              // console.log("[v0] scan error:", (err as Error)?.message)
            }
          }
        })
      } catch (e) {
        setError((e as Error).message)
      }
    }

    function stop() {
      active = false
      try {
        codeReader.reset()
      } catch {}
      try {
        const stream = (videoRef.current?.srcObject as MediaStream) || currentStream
        stream?.getTracks().forEach((t) => t.stop())
      } catch {}
    }

    start()

    return () => {
      stop()
    }
  }, [started, onResult])

  return (
    <div className="flex flex-col gap-3">
      <video ref={videoRef} className="w-full max-w-md rounded bg-black/10" />
      {!started ? (
        <Button onClick={() => setStarted(true)}>Start Scanner</Button>
      ) : (
        <Button variant="secondary" onClick={() => setStarted(false)}>
          Stop
        </Button>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
