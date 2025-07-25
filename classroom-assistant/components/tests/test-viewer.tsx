"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Test, TestQuestion } from "@/lib/types"

interface TestViewerProps {
  test: Test
  answers: Record<string, any>
  onAnswerChange: (questionId: string, answer: any) => void
}

export function TestViewer({ test, answers, onAnswerChange }: TestViewerProps) {
  return (
    <div className="space-y-6">
      {test.questions
        .sort((a, b) => a.order - b.order)
        .map((question, index) => (
          <QuestionViewer
            key={question.id}
            question={question}
            questionNumber={index + 1}
            answer={answers[question.id]}
            onAnswerChange={(answer) => onAnswerChange(question.id, answer)}
          />
        ))}
    </div>
  )
}

interface QuestionViewerProps {
  question: TestQuestion
  questionNumber: number
  answer: any
  onAnswerChange: (answer: any) => void
}

function QuestionViewer({ question, questionNumber, answer, onAnswerChange }: QuestionViewerProps) {
  const [shuffledOptions, setShuffledOptions] = useState<string[]>(() => {
    if (question.type === "mcq" && question.options) {
      return [...question.options]
    }
    return []
  })

  const [shuffledPairs, setShuffledPairs] = useState(() => {
    if (question.type === "match" && question.pairs) {
      return {
        left: [...question.pairs.map((p) => p.left)],
        right: [...question.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5),
      }
    }
    return { left: [], right: [] }
  })

  const renderMCQ = () => (
    <RadioGroup value={answer || ""} onValueChange={onAnswerChange} className="space-y-3">
      {shuffledOptions.map((option, index) => {
        const optionLetter = String.fromCharCode(65 + index)
        return (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={optionLetter} id={`q${question.id}-${optionLetter}`} />
            <Label htmlFor={`q${question.id}-${optionLetter}`} className="flex-1 cursor-pointer">
              {optionLetter}. {option}
            </Label>
          </div>
        )
      })}
    </RadioGroup>
  )

  const renderFill = () => (
    <Input
      placeholder="Type your answer here"
      value={answer || ""}
      onChange={(e) => onAnswerChange(e.target.value)}
      className="max-w-md"
    />
  )

  const renderMatch = () => {
    const currentAnswers = answer || {}

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Column A</h4>
            <div className="space-y-2">
              {shuffledPairs.left.map((leftItem, index) => (
                <div key={index} className="p-3 border rounded bg-muted">
                  {index + 1}. {leftItem}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Column B</h4>
            <div className="space-y-2">
              {shuffledPairs.right.map((rightItem, index) => (
                <div key={index} className="p-3 border rounded bg-muted">
                  {String.fromCharCode(65 + index)}. {rightItem}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-3">Your Matches</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shuffledPairs.left.map((leftItem, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-8">{index + 1}.</span>
                <Input
                  placeholder="Letter (A, B, C...)"
                  value={currentAnswers[leftItem] || ""}
                  onChange={(e) => {
                    const newAnswers = { ...currentAnswers }
                    newAnswers[leftItem] = e.target.value.toUpperCase()
                    onAnswerChange(newAnswers)
                  }}
                  className="w-20"
                  maxLength={1}
                />
                <span className="text-sm text-muted-foreground flex-1">{leftItem}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderSubjective = () => (
    <Textarea
      placeholder={`Type your ${question.type === "short" ? "short" : "detailed"} answer here`}
      value={answer || ""}
      onChange={(e) => onAnswerChange(e.target.value)}
      rows={question.type === "short" ? 4 : 8}
      className="w-full"
    />
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            Question {questionNumber}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{question.type.toUpperCase()}</Badge>
            <Badge variant="secondary">{question.marks} marks</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{question.text}</p>
        </div>

        <div className="border-t pt-4">
          {question.type === "mcq" && renderMCQ()}
          {question.type === "fill" && renderFill()}
          {question.type === "match" && renderMatch()}
          {(question.type === "short" || question.type === "long") && renderSubjective()}
        </div>

        {answer && <div className="text-sm text-green-600 font-medium">✓ Answered</div>}
      </CardContent>
    </Card>
  )
}
