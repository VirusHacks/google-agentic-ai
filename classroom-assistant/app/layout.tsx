import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import TanstackProvider from "@/provider/TanstackProvider"
import { SidebarLayout } from "@/components/layout/sidebar-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sahayak",
  description: "A modern classroom management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TanstackProvider>
          {children}
          </TanstackProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
