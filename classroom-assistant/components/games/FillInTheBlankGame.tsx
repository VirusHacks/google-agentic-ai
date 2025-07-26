"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCcw, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

const FillInTheBlankGame: React.FC<{ title: string; blanks: { sentence: string; answer: string }[] }> = ({
  title,
  blanks,
}) => {
  const [currentQuestion, setCurrentQuestion] = React.useState(0)
  const [userAnswer, setUserAnswer] = React.useState("")
  const [showResult, setShowResult] = React.useState(false)
  const [score, setScore] = React.useState(0)
  const [gameComplete, setGameComplete] = React.useState(false)

  const handleSubmit = () => {
    if (showResult || !userAnswer.trim()) return

    setShowResult(true)

    if (userAnswer.trim().toLowerCase() === blanks[currentQuestion].answer.toLowerCase()) {
      setScore(score + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < blanks.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setUserAnswer("")
      setShowResult(false)
    } else {
      setGameComplete(true)
    }
  }

  const resetGame = () => {
    setCurrentQuestion(0)
    setUserAnswer("")
    setShowResult(false)
    setScore(0)
    setGameComplete(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showResult) {
      handleSubmit()
    }
  }

  if (gameComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">🎉 Game Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold text-blue-600">
            {score}/{blanks.length}
          </div>
          <p className="text-lg text-gray-600">You scored {Math.round((score / blanks.length) * 100)}%</p>
          <Button onClick={resetGame} className="flex items-center gap-2">
            <RotateCcw size={16} />
            Play Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const question = blanks[currentQuestion]
  const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <span className="text-sm text-gray-500">
            {currentQuestion + 1} / {blanks.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / blanks.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-lg">
          {question.sentence.split("____").map((part, index) => (
            <span key={index}>
              {part}
              {index < question.sentence.split("____").length - 1 && (
                <span className="inline-block mx-2">
                  {showResult ? (
                    <span
                      className={`px-3 py-1 rounded font-medium ${
                        isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {question.answer}
                    </span>
                  ) : (
                    <Input
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="inline-block w-32 text-center"
                      placeholder="..."
                      disabled={showResult}
                    />
                  )}
                </span>
              )}
            </span>
          ))}
        </div>

        {showResult && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle size={20} />
                <span>Correct!</span>
              </>
            ) : (
              <>
                <XCircle size={20} />
                <span>Incorrect. The answer is: {question.answer}</span>
              </>
            )}
          </div>
        )}

        <div className="text-center">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!userAnswer.trim()}>
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentQuestion < blanks.length - 1 ? "Next Question" : "Finish Game"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FillInTheBlankGame
