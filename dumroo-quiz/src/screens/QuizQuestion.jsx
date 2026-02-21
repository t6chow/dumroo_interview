import { useState, useEffect, useRef } from 'react'

export default function QuizQuestion({ question, questionNumber, total, onSubmit }) {
  const [selected, setSelected] = useState(null)
  const [toggleCount, setToggleCount] = useState(0)
  const startTime = useRef(Date.now())

  // Reset state when question changes
  useEffect(() => {
    setSelected(null)
    setToggleCount(0)
    startTime.current = Date.now()
  }, [question.id])

  function handleSelect(option) {
    if (selected !== null) {
      setToggleCount(c => c + 1)
    }
    setSelected(option)
  }

  function handleSubmit() {
    if (selected === null) return
    const raw_rt = (Date.now() - startTime.current) / 1000 // seconds
    const is_correct = selected === question.correct_answer
    onSubmit({ raw_rt, toggle_count: toggleCount, is_correct })
  }

  return (
    <div className="screen">
      <p className="progress">Question {questionNumber} of {total}</p>
      <h2>{question.title}</h2>
      <div className="options">
        {Object.entries(question.options).map(([key, value]) => (
          <button
            key={key}
            className={`option ${selected === key ? 'selected' : ''}`}
            onClick={() => handleSelect(key)}
          >
            {value}
          </button>
        ))}
      </div>
      <button
        className="submit"
        onClick={handleSubmit}
        disabled={selected === null}
      >
        {questionNumber === total ? 'Finish' : 'Next'}
      </button>
    </div>
  )
}
