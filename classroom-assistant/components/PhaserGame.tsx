"use client"

import { useEffect, useRef, useCallback } from "react"
import Phaser from "phaser"

interface PhaserGameProps {
  gameConfig: Phaser.Types.Core.GameConfig
  onGameReady?: (game: Phaser.Game) => void
  onError?: () => void
}

export default function PhaserGame({ gameConfig, onGameReady, onError }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleResize = useCallback(() => {
    if (gameRef.current) {
      const canvas = gameRef.current.canvas
      if (canvas) {
        // Ensure canvas maintains aspect ratio and fits container
        const container = containerRef.current
        if (container) {
          const containerRect = container.getBoundingClientRect()
          const maxWidth = Math.min(containerRect.width - 32, 900)
          const maxHeight = Math.min(containerRect.height - 32, 700)

          gameRef.current.scale.setGameSize(maxWidth, maxHeight)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      try {
        const config: Phaser.Types.Core.GameConfig = {
          ...gameConfig,
          parent: containerRef.current,
          callbacks: {
            postBoot: (game) => {
              // Add resize listener
              window.addEventListener("resize", handleResize)

              // Game is ready
              if (onGameReady) {
                onGameReady(game)
              }
            },
          },
        }

        gameRef.current = new Phaser.Game(config)
      } catch (error) {
        console.error("Failed to initialize Phaser game:", error)
        if (onError) {
          onError()
        }
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize)
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [gameConfig, onGameReady, onError, handleResize])

  return (
    <div
      ref={containerRef}
      className="phaser-game-container w-full h-full flex items-center justify-center min-h-[500px]"
    />
  )
}
