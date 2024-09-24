'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="container mx-auto p-4">
      <div className="w-full max-w-2xl mx-auto bg-card text-card-foreground rounded-lg shadow-md">
        <div className="flex flex-row items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold">Business Model Canvas Chatbot</h1>
          <button
            className="p-2 rounded-full bg-secondary text-secondary-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>
        <div className="p-4 space-y-4 h-[60vh] overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <p className="font-semibold">{message.role === 'user' ? 'You:' : 'AI:'}</p>
              <p>{message.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
              <p className="font-semibold">AI is thinking...</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow p-2 border rounded-md bg-background text-foreground"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}