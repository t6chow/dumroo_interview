import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import NameEntry from './screens/NameEntry'
import QuizQuestion from './screens/QuizQuestion'
import Done from './screens/Done'
import TeacherDashboard from './screens/TeacherDashboard'
import './App.css'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function App() {
  const [screen, setScreen] = useState('name') // 'name' | 'quiz' | 'done' | 'teacher'
  const [studentName, setStudentName] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('questions')
        .select('id, title, options, correct_answer')

      if (error) {
        setError('Failed to load questions.')
      } else {
        setQuestions(shuffle(data))
      }
      setLoading(false)
    }
    fetchQuestions()
  }, [])

  function handleStart(name) {
    setStudentName(name)
    setScreen('quiz')
  }

  async function handleSubmit({ raw_rt, toggle_count, is_correct }) {
    const question = questions[currentIndex]

    const { error } = await supabase.from('quiz_submissions').insert({
      student_name: studentName,
      question_id: question.id,
      raw_rt,
      toggle_count,
      is_correct,
    })

    if (error) {
      console.error('Submission error:', error)
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1)
    } else {
      setScreen('done')
    }
  }

  if (loading) return <div className="screen"><p>Loading...</p></div>
  if (error) return <div className="screen"><p>{error}</p></div>

  if (screen === 'teacher') return <TeacherDashboard />
  if (screen === 'name') return <NameEntry onStart={handleStart} onTeacher={() => setScreen('teacher')} />
  if (screen === 'done') return <Done studentName={studentName} />

  return (
    <QuizQuestion
      question={questions[currentIndex]}
      questionNumber={currentIndex + 1}
      total={questions.length}
      onSubmit={handleSubmit}
    />
  )
}
