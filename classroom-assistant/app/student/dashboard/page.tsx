import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute requiredRole="student">
      <SidebarLayout role="student">
        <StudentDashboard />
      </SidebarLayout>
    </ProtectedRoute>
  )
}
