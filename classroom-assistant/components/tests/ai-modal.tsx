"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AIButton } from "./ai-button"
import type { Classroom } from "@/lib/types"

interface AIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (instruction: string) => void
  loading: boolean
  classroom?: Classroom
}

export function AIModal({ open, onOpenChange, onGenerate, loading, classroom }: AIModalProps) {
  const [instruction, setInstruction] = useState("")

  const handleGenerate = () => {
    if (instruction.trim()) {
      onGenerate(instruction.trim())
    }
  }

  const examplePrompts = [
    "Create a 50-mark test with 10 MCQs and 2 long answers for mid-term revision",
    "Make a quick 20-mark quiz with fill-in-the-blanks and short answers",
    "Generate a comprehensive 100-mark test with all question types for final exam",
    "Create a 30-mark test focusing on practical applications with matching and MCQs",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Test with AI</DialogTitle>
          <DialogDescription>
            Describe what kind of test you want to create. The AI will generate questions based on your classroom
            curriculum and student level.
          </DialogDescription>
        </DialogHeader>

        {classroom && (
          <div className="flex gap-2 mb-4">
            <Badge variant="outline">{classroom.subject}</Badge>
            <Badge variant="outline">{classroom.gradeRange}</Badge>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="instruction">Test Instructions</Label>
            <Textarea
              id="instruction"
              placeholder="e.g., Create a 50-mark test with 10 MCQs and 2 long answers covering photosynthesis and plant biology for grade 8 students"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Example Prompts:</Label>
            <div className="mt-2 space-y-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInstruction(prompt)}
                  className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors block w-full p-2 rounded border hover:bg-muted"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <AIButton onClick={handleGenerate} loading={loading} disabled={!instruction.trim()}>
            Generate Test
          </AIButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
