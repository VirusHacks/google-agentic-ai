"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import Phaser from "phaser"

const PhaserGame = dynamic(() => import("./PhaserGame"), {
  ssr: false,
  loading: () => <GameLoadingSpinner />,
})

// Import game scenes
import MemoryMatchScene from "@/games/memory-match/MemoryMatchScene"
import QuickMathScene from "@/games/quick-math/QuickMathScene"
import TypingSprintScene from "@/games/typing-sprint/TypingSprintScene"
import PatternRecallScene from "@/games/pattern-recall/PatternRecallScene"
import ReactionRushScene from "@/games/reaction-rush/ReactionRushScene"
import LogicGridScene from "@/games/logic-grid/LogicGridScene"

interface GameWrapperProps {
  gameId: string
}

function GameLoadingSpinner() {
  return (
    <div className="game-loading">
      <div className="text-center">
        <div className="relative">
          <Loader2 className="animate-spin mx-auto mb-6 text-blue-500" size={48} />
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Game...</h3>
        <p className="text-gray-500">Preparing your cognitive challenge</p>
        <div className="mt-4 w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

function GameError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="game-loading bg-gradient-to-br from-red-50 to-pink-50">
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Game Failed to Load</h3>
        <p className="text-gray-500 mb-6">Something went wrong. Please try again.</p>
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2 mx-auto">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    </div>
  )
}

export default function GameWrapper({ gameId }: GameWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const getGameConfig = (gameId: string): Phaser.Types.Core.GameConfig => {
    const baseConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 900,
      height: 700,
      backgroundColor: "#f8fafc",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        max: {
          width: 900,
          height: 700,
        },
        min: {
          width: 320,
          height: 240,
        },
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
      },
    }

    switch (gameId) {
      case "memory-match":
        return { ...baseConfig, scene: MemoryMatchScene }
      case "quick-math":
        return { ...baseConfig, scene: QuickMathScene }
      case "typing-sprint":
        return { ...baseConfig, scene: TypingSprintScene }
      case "pattern-recall":
        return { ...baseConfig, scene: PatternRecallScene }
      case "reaction-rush":
        return { ...baseConfig, scene: ReactionRushScene }
      case "logic-grid":
        return { ...baseConfig, scene: LogicGridScene }
      default:
        return { ...baseConfig, scene: MemoryMatchScene }
    }
  }

  const handleGameReady = () => {
    setLoadingProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setHasError(false)
    }, 500)
  }

  const handleGameError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    setLoadingProgress(0)
  }

  if (hasError) {
    return <GameError onRetry={handleRetry} />
  }

  return (
    <div className="w-full">
      {isLoading && <GameLoadingSpinner />}
      <div className={`transition-opacity duration-500 ${isLoading ? "opacity-0 absolute" : "opacity-100"}`}>
        <PhaserGame gameConfig={getGameConfig(gameId)} onGameReady={handleGameReady} onError={handleGameError} />
      </div>
    </div>
  )
}
