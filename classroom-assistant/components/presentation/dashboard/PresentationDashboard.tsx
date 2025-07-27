"use client";

import { Wand2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { PresentationInput } from "./PresentationInput";
import { PresentationControls } from "./PresentationControls";
import { PresentationTemplates } from "./PresentationTemplates";
import { RecentPresentations } from "./RecentPresentations";
import { PresentationExamples } from "./PresentationExamples";
import { PresentationsSidebar } from "./PresentationsSidebar";
import { useEffect } from "react";
import { PresentationHeader } from "./PresentationHeader";
import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export function PresentationDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Detect role based on URL pattern
  const getRoleFromUrl = () => {
    if (pathname.includes('/teacher/classroom')) {
      return 'teacher';
    } else if (pathname.includes('/student/classroom')) {
      return 'student';
    }
    return 'teacher'; // default fallback
  };
  
  const role = getRoleFromUrl();
  
  // Extract classroom ID from URL
  const getClassroomIdFromUrl = () => {
    const pathSegments = pathname.split('/');
    const classroomIndex = pathSegments.findIndex(segment => segment === 'classroom');
    if (classroomIndex !== -1 && pathSegments[classroomIndex + 1]) {
      return pathSegments[classroomIndex + 1];
    }
    return null;
  };
  
  const classroomId = getClassroomIdFromUrl();
  
  const {
    presentationInput,
    isGeneratingOutline,
    setCurrentPresentation,
    setIsGeneratingOutline,
    // We'll use these instead of directly calling startOutlineGeneration
    setShouldStartOutlineGeneration,
  } = usePresentationState();

  useEffect(() => {
    setCurrentPresentation("", "");
    // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
  }, []);

  const handleGenerate = async () => {
    if (!presentationInput.trim()) {
      toast.error("Please enter a topic for your presentation");
      return;
    }

    // Set UI loading state and trigger outline generation
    setIsGeneratingOutline(true);
    setShouldStartOutlineGeneration(true);

    try {
      const result = await createEmptyPresentation(
        presentationInput.substring(0, 50) || "Untitled Presentation"
      );

      if (result.success && result.presentation) {
        // Set the current presentation
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title
        );
        // Use the correct route based on role and classroom context
        const generateRoute = classroomId 
          ? `/${role}/classroom/${classroomId}/presentation/generate/${result.presentation.id}`
          : `/presentation/generate/${result.presentation.id}`;
        router.push(generateRoute);
      } else {
        setIsGeneratingOutline(false);
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      setIsGeneratingOutline(false);
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
  };

  const handleCreateBlank = async () => {
    try {
      setIsGeneratingOutline(true);
      setShouldStartOutlineGeneration(true);
      const result = await createEmptyPresentation("Untitled Presentation");
      if (result.success && result.presentation) {
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title
        );
        // Use the correct route based on role and classroom context
        const generateRoute = classroomId 
          ? `/${role}/classroom/${classroomId}/presentation/generate/${result.presentation.id}`
          : `/presentation/generate/${result.presentation.id}`;
        router.push(generateRoute);
      } else {
        setIsGeneratingOutline(false);
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      setIsGeneratingOutline(false);
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
  };

  return (
    <SidebarLayout role={role}>
    <div className="notebook-section relative w-full">
      <PresentationsSidebar />
      <div className="mx-auto w-full max-w-4xl space-y-12 px-6 py-12">
        <PresentationHeader />

        <div className="space-y-8">
          <PresentationInput />
          <PresentationControls />
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!presentationInput.trim() || isGeneratingOutline}
                  variant={isGeneratingOutline ? "secondary" : "default"}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Generate Presentation
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateBlank}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Blank
              </Button>
            </div>
          </div>
        </div>

        <PresentationExamples />
        <RecentPresentations />
        <PresentationTemplates />
      </div>
    </div>
    </SidebarLayout>
  );
}
