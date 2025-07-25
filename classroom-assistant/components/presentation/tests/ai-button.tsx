"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function AIButton({
  onClick,
  loading = false,
  disabled = false,
  children,
  variant = "default",
  size = "default",
  className,
}: AIButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  )
}
