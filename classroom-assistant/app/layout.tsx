import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import TanStackQueryProvider from "@/provider/TanstackProvider";
import { ThemeProvider } from "@/provider/theme-provider";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Classroom Assistant",
  description: "A modern classroom management platform",
    generator: 'Hustlers'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TanStackQueryProvider>
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
    </TanStackQueryProvider>
  )
}
