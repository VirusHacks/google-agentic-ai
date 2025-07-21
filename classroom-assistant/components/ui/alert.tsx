import * as React from "react"
import { cn } from "@/lib/utils"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string
  type?: "success" | "warning" | "error"
}

const bgFor = {
  success: "bg-green-100 text-green-700 border-green-400",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-400",
  error: "bg-red-100 text-red-700 border-red-400",
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, message, type = "error", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn("w-full rounded-lg border px-4 py-3 text-sm", bgFor[type], className)}
      {...props}
    >
      {message}
    </div>
  ),
)
Alert.displayName = "Alert"
