"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, RotateCcw } from "lucide-react"

interface MCQQuestion {
  question: string
  options: string[]
  correctAnswer: string
}

interface MCQGameProps {
  questions: MCQQuestion[]
  title?: string
}

export default function MCQGame({ questions, title = "Quiz Game" }: MCQGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return
    setSelectedAnswer(answer)
    setShowResult(true)

    if (answer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setGameComplete(true)
    }
  }

  const resetGame = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setGameComplete(false)
  }

  if (gameComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">🎉 Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold text-blue-600">
            {score}/{questions.length}
          </div>
          <p className="text-lg text-gray-600">You scored {Math.round((score / questions.length) * 100)}%</p>
          <Button onClick={resetGame} className="flex items-center gap-2">
            <RotateCcw size={16} />
            Play Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const question = questions[currentQuestion]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <span className="text-sm text-gray-500">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <h3 className="text-lg font-medium">{question.question}</h3>

        <div className="grid gap-3">
          {question.options.map((option, index) => {
            let buttonClass =
              "w-full text-left p-4 border-2 rounded-lg transition-all duration-200 hover:border-blue-300"

            if (showResult) {
              if (option === question.correctAnswer) {
                buttonClass += " border-green-500 bg-green-50 text-green-700"
              } else if (option === selectedAnswer && option !== question.correctAnswer) {
                buttonClass += " border-red-500 bg-red-50 text-red-700"
              } else {
                buttonClass += " border-gray-200 bg-gray-50 text-gray-500"
              }
            } else if (selectedAnswer === option) {
              buttonClass += " border-blue-500 bg-blue-50"
            } else {
              buttonClass += " border-gray-200 hover:bg-gray-50"
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={buttonClass}
                disabled={showResult}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && option === question.correctAnswer && (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                  {showResult && option === selectedAnswer && option !== question.correctAnswer && (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className="text-center">
            <Button onClick={handleNext} className="px-8">
              {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
