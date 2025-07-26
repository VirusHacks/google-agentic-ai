"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, BookOpen } from "lucide-react"
import MCQGame from "@/components/games/MCQGame"
import ImageMatchGame from "@/components/games/ImageMatchGame"
import FillInTheBlankGame from "@/components/games/FillInTheBlankGame"

interface GameData {
  component: "MCQGame" | "ImageMatchGame" | "FillInTheBlankGame"
  gameProps: any
  title: string
}

export default function ChatGameGenerator() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [error, setError] = useState("")

  const generateGame = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError("")
    setGameData(null) // 

    try {
      const response = await fetch("/api/generate-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate game")
      }

      const data = await response.json()
      setGameData(data)
    } catch (err: any) {
      setError(err.message || "Failed to generate game. Please try again.")
      console.error("Error generating game:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const renderGame = () => {
    if (!gameData) return null

    const { component, gameProps, title } = gameData

    switch (component) {
      case "MCQGame":
        return <MCQGame {...gameProps} title={title} />
      case "ImageMatchGame":
        return <ImageMatchGame {...gameProps} title={title} />
      case "FillInTheBlankGame":
        return <FillInTheBlankGame {...gameProps} title={title} />
      default:
        return <div>Unknown game type</div>
    }
  }

  const examplePrompts = [
    "Create a quiz about the solar system for 5th grade students",
    "Make an image matching game for learning animal habitats",
    "Generate fill-in-the-blank questions about photosynthesis for middle school",
    "Create a math quiz on fractions for 4th graders",
    "Make a matching game for learning world capitals",
  ]

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text">
              AI Educational Game Generator
            </h1>
          </div>
          <p className="max-w-3xl mx-auto text-xl text-gray-600">
            Describe what you want to teach, and AI will create the perfect educational game for your students
          </p>
        </div>

        {/* Game Generator Input */}
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-purple-600" size={24} />
              Generate Your Game
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="game-prompt" className="text-sm font-medium text-gray-700">
                Describe the educational game you want to create:
              </label>
              <Textarea
                id="game-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a quiz about the water cycle for 6th grade students with 5 questions..."
                className="min-h-[120px] resize-none"
                disabled={isGenerating}
              />
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Or try one of these examples:</label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="p-3 text-sm text-left transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
                    disabled={isGenerating}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateGame}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Generating Game...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={20} />
                  Generate Educational Game
                </>
              )}
            </Button>

            {error && <div className="p-4 text-red-700 border border-red-200 rounded-lg bg-red-50">{error}</div>}
          </CardContent>
        </Card>

        {/* Generated Game Display */}
        {isGenerating && (
          <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl shadow-lg">
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto text-blue-500 animate-spin" size={48} />
              <p className="text-lg text-gray-600">AI is crafting your game...</p>
            </div>
          </div>
        )}

        {gameData && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">🎮 Your Generated Game</h2>
              <p className="text-gray-600">Ready to play and learn!</p>
            </div>
            {renderGame()}
          </div>
        )}
      </div>
    </div>
  )
}
