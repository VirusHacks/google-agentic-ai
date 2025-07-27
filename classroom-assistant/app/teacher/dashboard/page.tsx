import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute requiredRole="teacher">
      <SidebarLayout role="teacher">
        <TeacherDashboard />
      </SidebarLayout>
    </ProtectedRoute>
  )
}
