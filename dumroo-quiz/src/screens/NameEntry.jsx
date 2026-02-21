import { useState } from 'react'

export default function NameEntry({ onStart, onTeacher }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onStart(trimmed)
  }

  return (
    <div className="screen">
      <h1>Welcome</h1>
      <p>Enter your name to begin the quiz.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!name.trim()}>
          Start Quiz
        </button>
      </form>
      <button className="teacher-link" onClick={onTeacher}>
        Click if you're a teacher
      </button>
    </div>
  )
}
