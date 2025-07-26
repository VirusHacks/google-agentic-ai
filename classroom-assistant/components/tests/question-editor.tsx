"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import type { TestQuestion } from "@/lib/types"

interface QuestionEditorProps {
  question: TestQuestion
  onUpdate: (updates: Partial<TestQuestion>) => void
}

export function QuestionEditor({ question, onUpdate }: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState(question)

  const updateLocal = (updates: Partial<TestQuestion>) => {
    const updated = { ...localQuestion, ...updates }
    setLocalQuestion(updated)
    onUpdate(updates)
  }

  const renderMCQEditor = () => {
    const options = localQuestion.options || ["", "", "", ""]
    const correctAnswer = localQuestion.correctAnswer as string

    return (
      <div className="space-y-4">
        <div>
          <Label>Options</Label>
          <RadioGroup
            value={correctAnswer}
            onValueChange={(value) => updateLocal({ correctAnswer: value })}
            className="mt-2"
          >
            {options.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index) // A, B, C, D
              return (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={optionLetter} id={`option-${index}`} />
                  <Input
                    placeholder={`Option ${optionLetter}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[index] = e.target.value
                      updateLocal({ options: newOptions })
                    }}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = options.filter((_, i) => i !== index)
                        updateLocal({ options: newOptions })
                        // Reset correct answer if it was the deleted option
                        if (correctAnswer === optionLetter) {
                          updateLocal({ correctAnswer: "A" })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </RadioGroup>
          {options.length < 6 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateLocal({ options: [...options, ""] })
              }}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">Select the radio button next to the correct answer</div>
      </div>
    )
  }

  const renderFillEditor = () => (
    <div>
      <Label>Correct Answer</Label>
      <Input
        placeholder="Enter the correct answer"
        value={(localQuestion.correctAnswer as string) || ""}
        onChange={(e) => updateLocal({ correctAnswer: e.target.value })}
        className="mt-2"
      />
      <p className="text-sm text-muted-foreground mt-1">
        Students will need to type this exact answer (case-insensitive)
      </p>
    </div>
  )

  const renderMatchEditor = () => {
    const pairs = localQuestion.pairs || [{ left: "", right: "" }]

    return (
      <div className="space-y-4">
        <div>
          <Label>Matching Pairs</Label>
          <div className="mt-2 space-y-2">
            {pairs.map((pair, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Left item"
                  value={pair.left}
                  onChange={(e) => {
                    const newPairs = [...pairs]
                    newPairs[index].left = e.target.value
                    updateLocal({ pairs: newPairs })
                  }}
                  className="flex-1"
                />
                <span className="text-muted-foreground">↔</span>
                <Input
                  placeholder="Right item"
                  value={pair.right}
                  onChange={(e) => {
                    const newPairs = [...pairs]
                    newPairs[index].right = e.target.value
                    updateLocal({ pairs: newPairs })
                  }}
                  className="flex-1"
                />
                {pairs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPairs = pairs.filter((_, i) => i !== index)
                      updateLocal({ pairs: newPairs })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateLocal({ pairs: [...pairs, { left: "", right: "" }] })
            }}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Pair
          </Button>
        </div>
      </div>
    )
  }

  const renderSubjectiveEditor = () => (
    <div>
      <Label>Model Answer (Optional)</Label>
      <Textarea
        placeholder="Enter a model answer or key points students should mention"
        value={(localQuestion.correctAnswer as string) || ""}
        onChange={(e) => updateLocal({ correctAnswer: e.target.value })}
        rows={4}
        className="mt-2"
      />
      <p className="text-sm text-muted-foreground mt-1">
        This will help with AI-assisted grading and provide feedback to students
      </p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <Label>Question Text</Label>
        <Textarea
          placeholder="Enter your question"
          value={localQuestion.text}
          onChange={(e) => updateLocal({ text: e.target.value })}
          rows={3}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Marks</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={localQuestion.marks}
            onChange={(e) => updateLocal({ marks: Number.parseInt(e.target.value) || 1 })}
            className="mt-2"
          />
        </div>
        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            id="required"
            checked={localQuestion.required}
            onCheckedChange={(checked) => updateLocal({ required: !!checked })}
          />
          <Label htmlFor="required">Required question</Label>
        </div>
      </div>

      {localQuestion.type === "mcq" && renderMCQEditor()}
      {localQuestion.type === "fill" && renderFillEditor()}
      {localQuestion.type === "match" && renderMatchEditor()}
      {(localQuestion.type === "short" || localQuestion.type === "long") && renderSubjectiveEditor()}
    </div>
  )
}
