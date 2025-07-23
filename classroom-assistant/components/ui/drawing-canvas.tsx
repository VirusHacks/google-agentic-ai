"use client"

import type React from "react"
import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react"
import { cn } from "@/lib/utils"

interface DrawingCanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  width: number
  height: number
  lineColor?: string
  lineWidth?: number
  backgroundColor?: string
}

export interface DrawingCanvasRef {
  clearCanvas: () => void
  getCanvasDataURL: () => string
  isCanvasEmpty: () => boolean
  loadImage: (dataUrl: string) => void
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width, height, lineColor = "#FFFFFF", lineWidth = 4, backgroundColor = "#292C33", className, ...props }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawing, setHasDrawing] = useState(false)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const scale = window.devicePixelRatio
      canvas.width = width * scale
      canvas.height = height * scale
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) return

      context.scale(scale, scale)
      context.lineCap = "round"
      context.strokeStyle = lineColor
      context.lineWidth = lineWidth
      contextRef.current = context

      clearCanvasLocal(context, width, height)
    }, [width, height, lineColor, lineWidth, backgroundColor])

    const clearCanvasLocal = (context: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvasWidth, canvasHeight)
      setHasDrawing(false)
    }

    const getCoords = (event: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return { offsetX: 0, offsetY: 0 }
      const rect = canvas.getBoundingClientRect()

      let clientX, clientY
      if (window.TouchEvent && event instanceof TouchEvent) {
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
      } else {
        clientX = (event as MouseEvent).clientX
        clientY = (event as MouseEvent).clientY
      }

      return {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      }
    }

    const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const nativeEvent = event.nativeEvent
      const { offsetX, offsetY } = getCoords(nativeEvent as MouseEvent)
      contextRef.current?.beginPath()
      contextRef.current?.moveTo(offsetX, offsetY)
      setIsDrawing(true)
      setHasDrawing(true)
    }

    const finishDrawing = () => {
      contextRef.current?.closePath()
      setIsDrawing(false)
    }

    const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      event.preventDefault()
      const nativeEvent = event.nativeEvent
      const { offsetX, offsetY } = getCoords(nativeEvent as MouseEvent)
      contextRef.current?.lineTo(offsetX, offsetY)
      contextRef.current?.stroke()
    }

    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        const context = contextRef.current
        const canvas = canvasRef.current
        if (context && canvas) {
          clearCanvasLocal(context, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)
        }
      },
      getCanvasDataURL: () => {
        const canvas = canvasRef.current
        if (!canvas) return ""

        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = canvas.width / window.devicePixelRatio
        tempCanvas.height = canvas.height / window.devicePixelRatio
        const tempCtx = tempCanvas.getContext("2d")
        if (!tempCtx) return ""

        tempCtx.fillStyle = backgroundColor
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height)

        return tempCanvas.toDataURL("image/png")
      },
      isCanvasEmpty: () => {
        return !hasDrawing
      },
      loadImage: (dataUrl: string) => {
        const canvas = canvasRef.current
        const context = contextRef.current
        if (!canvas || !context) return

        const image = new Image()
        image.onload = () => {
          clearCanvasLocal(context, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)
          context.drawImage(
            image,
            0,
            0,
            canvas.width / window.devicePixelRatio,
            canvas.height / window.devicePixelRatio,
          )
          setHasDrawing(true)
        }
        image.src = dataUrl
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
        width={width}
        height={height}
        className={cn("cursor-crosshair touch-none rounded-lg", className)}
        {...props}
      />
    )
  },
)

DrawingCanvas.displayName = "DrawingCanvas"

export default DrawingCanvas
