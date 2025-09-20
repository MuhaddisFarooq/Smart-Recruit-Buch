"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Quiz } from "@/lib/types"
import { Clock } from "lucide-react"

interface QuizSolverProps {
  quiz: Quiz
  onExit: () => void
}

export function QuizSolver({ quiz, onExit }: QuizSolverProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number | null>>({})
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showSubmitWarning, setShowSubmitWarning] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setSelectedAnswer(answers[currentQuestion] ?? null)
  }, [currentQuestion])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setAnswers({ ...answers, [currentQuestion]: answerIndex })
    setErrorMessage("") // Clear error
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index)
    setErrorMessage("") // Reset error
  }

  const nextQuestion = () => {
    if (selectedAnswer === null) {
      setErrorMessage("Please select an answer before moving to the next question.")
      return
    }
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const previousQuestion = () => {
    setErrorMessage("") // Clear error on back
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      setErrorMessage("Please select an answer before submitting the quiz.")
      return
    }

    const unansweredCount = quiz.questions.length - Object.keys(answers).length
    if (unansweredCount > 0) {
      setShowSubmitWarning(true)
      return
    }

    // Calculate score
    let correct = 0
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && q.correctAnswers.includes(answers[idx]!)) {
        correct += q.points
      }
    })

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)
    quiz.score = Math.round((correct / totalPoints) * 100)
    quiz.status = "completed"

    onExit()
  }

  const getQuestionStatus = (index: number) => {
    if (index === currentQuestion) return "current"
    if (answers[index] !== undefined) return "answered"
    return "not-answered"
  }

  const currentQ = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const unansweredCount = quiz.questions.length - answeredCount
  const isLastQuestion = currentQuestion === quiz.questions.length - 1

  if (quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-4">This quiz doesn't have any questions yet.</p>
          <Button onClick={onExit}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">
              {quiz.subject} • {quiz.questions.length} Questions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-md">{formatTime(timeLeft)}</span>
            </div>
            <Button variant="outline" onClick={onExit}>
              Exit Quiz
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>Answered: {answeredCount}/{quiz.questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-black h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-60 border-r bg-white p-6">
          <h3 className="font-semibold mb-4">Questions</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {quiz.questions.map((_, index) => {
              const status = getQuestionStatus(index)
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={`h-10 ${
                    status === "current"
                      ? "bg-black text-white border-black"
                      : status === "answered"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "border-gray-300"
                  }`}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                </Button>
              )
            })}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-black rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-gray-300 rounded"></div>
              <span>Not answered</span>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold">Question {currentQuestion + 1}</h2>
                <Badge variant="outline" className="text-sm">
                  {currentQ.points} point{currentQ.points !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-md leading-relaxed">{currentQ.question}</p>
            </div>

            {/* Options */}
            {currentQ.options?.map((option, index) => (
              <div
                key={index}
                className={`p-2 mb-3 border rounded-lg cursor-pointer transition-all ${
                  selectedAnswer === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedAnswer === index ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}
                  >
                    {selectedAnswer === index && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className="font-mono text-base px-2 py-1">{option}</span>
                </div>
              </div>
            ))}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚠️</span>
                  <div>
                    <p className="font-medium text-orange-800">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
                className="px-8"
              >
                Previous
              </Button>
              {isLastQuestion ? (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-8">
                  Submit Quiz
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="bg-black hover:bg-gray-800 text-white px-8">
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
