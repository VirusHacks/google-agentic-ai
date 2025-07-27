"use client";

import PresentationPage from "@/components/presentation/presentation-page/Main";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

// Helper function to get role from URL
function getRoleFromUrl(pathname: string): "teacher" | "student" {
  if (pathname.includes("/teacher/")) {
    return "teacher";
  } else if (pathname.includes("/student/")) {
    return "student";
  }
  return "teacher"; // Default fallback
}

export default function Page() {
  const pathname = usePathname();
  const router = useRouter();
  const role = getRoleFromUrl(pathname);

  return (
    <SidebarLayout role={role}>
      <div className="relative">
        <Button
          variant="ghost"
          className="absolute left-4 top-4 flex items-center gap-2 text-muted-foreground hover:text-foreground z-10"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <PresentationPage />
      </div>
    </SidebarLayout>
  );
}
