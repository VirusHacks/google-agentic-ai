"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RotateCcw, Trophy } from "lucide-react"
import Image from "next/image"

interface ImagePair {
  term: string
  imageURL: string
}

interface ImageMatchGameProps {
  pairs: ImagePair[]
  title?: string
}

interface GameCard {
  id: string
  content: string
  type: "term" | "image"
  isFlipped: boolean
  isMatched: boolean
  pairId: string
}

export default function ImageMatchGame({ pairs, title = "Image Match Game" }: ImageMatchGameProps) {
  const [cards, setCards] = useState<GameCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matches, setMatches] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)

  useEffect(() => {
    initializeGame()
  }, [pairs])

  const initializeGame = () => {
    const gameCards: GameCard[] = []

    pairs.forEach((pair, index) => {
      const pairId = `pair-${index}`

      // Add term card
      gameCards.push({
        id: `term-${index}`,
        content: pair.term,
        type: "term",
        isFlipped: false,
        isMatched: false,
        pairId,
      })

      // Add image card
      gameCards.push({
        id: `image-${index}`,
        content: pair.imageURL,
        type: "image",
        isFlipped: false,
        isMatched: false,
        pairId,
      })
    })

    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5)
    setCards(shuffledCards)
    setFlippedCards([])
    setMatches(0)
    setMoves(0)
    setGameComplete(false)
  }

  const handleCardClick = (cardId: string) => {
    if (flippedCards.length === 2) return
    if (flippedCards.includes(cardId)) return

    const card = cards.find((c) => c.id === cardId)
    if (!card || card.isMatched) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card flip state
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)

      const [firstCardId, secondCardId] = newFlippedCards
      const firstCard = cards.find((c) => c.id === firstCardId)
      const secondCard = cards.find((c) => c.id === secondCardId)

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Match found
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c)))
          setMatches(matches + 1)
          setFlippedCards([])

          if (matches + 1 === pairs.length) {
            setGameComplete(true)
          }
        }, 1000)
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (newFlippedCards.includes(c.id) ? { ...c, isFlipped: false } : c)))
          setFlippedCards([])
        }, 1500)
      }
    }
  }

  if (gameComplete) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
            <Trophy size={24} />
            Congratulations!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-lg">
            You completed the game in <span className="font-bold text-blue-600">{moves}</span> moves!
          </div>
          <Button onClick={initializeGame} className="flex items-center gap-2">
            <RotateCcw size={16} />
            Play Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="text-sm text-gray-600">
            Moves: {moves} | Matches: {matches}/{pairs.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
              aspect-square border-2 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center p-2
              ${
                card.isMatched
                  ? "border-green-500 bg-green-50"
                  : card.isFlipped
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-100 hover:border-gray-400"
              }
            `}
            >
              {card.isFlipped || card.isMatched ? (
                card.type === "image" ? (
                  <Image
                    src={card.content || "/placeholder.svg"}
                    alt={`Image for ${card.pairId}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <span className="text-sm font-medium text-center">{card.content}</span>
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center">
                  <span className="text-white text-2xl">?</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
