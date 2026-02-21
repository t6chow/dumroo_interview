import { useState, useEffect, useRef } from 'react'

export default function ChatWindow({ quizContext, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-send initial summary request on open
  useEffect(() => {
    sendMessage('Please give me a brief summary of the quiz results. Highlight which questions students struggled with and any students who stand out.')
  }, [])

  async function sendMessage(text) {
    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages([...updatedMessages, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, quiz_context: quizContext }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data)
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + text,
              }
              return updated
            })
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Error: could not reach server.'
        return updated
      })
    }

    setStreaming(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (input.trim() && !streaming) sendMessage(input.trim())
  }

  return (
    <div className="chat-overlay">
      <div className="chat-window">
        <div className="chat-header">
          <span>AI Insights</span>
          <button className="chat-close" onClick={onClose}>✕</button>
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.content || (m.role === 'assistant' && streaming ? '...' : '')}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ask a follow-up question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={streaming}
          />
          <button type="submit" disabled={streaming || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
