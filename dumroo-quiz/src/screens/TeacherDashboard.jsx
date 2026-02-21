import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ChatWindow from './ChatWindow'

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]) // unique student names
  const [questionStats, setQuestionStats] = useState([]) // per-question avg score
  const [gradeDistribution, setGradeDistribution] = useState([]) // histogram bins
  const [chatOpen, setChatOpen] = useState(false)
  const [selected, setSelected] = useState(null) // selected student name
  const [studentSubmissions, setStudentSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [running, setRunning] = useState(false)
  const [runStatus, setRunStatus] = useState(null) // 'success' | 'error'

  async function fetchStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('student_name, is_correct, questions(title)')

    if (error) {
      console.error('fetchStudents error:', error)
      setFetchError(error.message)
    } else {
      const unique = [...new Set(data.map(s => s.student_name))].sort()
      setStudents(unique)

      // Compute average score per question title
      const grouped = {}
      data.forEach(s => {
        const title = s.questions?.title ?? 'Unknown'
        if (!grouped[title]) grouped[title] = { correct: 0, total: 0 }
        grouped[title].total += 1
        if (s.is_correct) grouped[title].correct += 1
      })
      const stats = Object.entries(grouped).map(([title, { correct, total }]) => ({
        title,
        'Avg Score (%)': Math.round((correct / total) * 100),
      }))
      setQuestionStats(stats)

      // Compute final grade per student and bin into histogram
      const byStudent = {}
      data.forEach(s => {
        if (!byStudent[s.student_name]) byStudent[s.student_name] = { correct: 0, total: 0 }
        byStudent[s.student_name].total += 1
        if (s.is_correct) byStudent[s.student_name].correct += 1
      })
      const bins = [
        { range: '0–20%', min: 0, max: 20, count: 0 },
        { range: '21–40%', min: 21, max: 40, count: 0 },
        { range: '41–60%', min: 41, max: 60, count: 0 },
        { range: '61–80%', min: 61, max: 80, count: 0 },
        { range: '81–100%', min: 81, max: 100, count: 0 },
      ]
      Object.values(byStudent).forEach(({ correct, total }) => {
        const grade = Math.round((correct / total) * 100)
        const bin = bins.find(b => grade >= b.min && grade <= b.max)
        if (bin) bin.count += 1
      })
      setGradeDistribution(bins.map(({ range, count }) => ({ range, Students: count })))
    }
    setLoading(false)
  }

  async function fetchStudentSubmissions(name) {
    setLoadingStudent(true)
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('*, questions(title)')
      .eq('student_name', name)
      .order('created_at', { ascending: true })

    if (!error) setStudentSubmissions(data)
    setLoadingStudent(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  function handleSelectStudent(name) {
    setSelected(name)
    fetchStudentSubmissions(name)
  }

  function handleBack() {
    setSelected(null)
    setStudentSubmissions([])
  }

  async function handleRunPredictions() {
    setRunning(true)
    setRunStatus(null)
    try {
      const res = await fetch('http://localhost:8000/run-predictions', { method: 'POST' })
      if (res.ok) {
        setRunStatus('success')
        if (selected) fetchStudentSubmissions(selected)
      } else {
        setRunStatus('error')
      }
    } catch {
      setRunStatus('error')
    }
    setRunning(false)
  }

  // --- Student detail view ---
  if (selected) {
    return (
      <div className="dashboard">
        <div className="dashboard-actions">
          <button className="teacher-link" onClick={handleBack}>← Back</button>
        </div>

        <h1>{selected}</h1>

        <div className="dashboard-actions">
          <button className="submit" onClick={handleRunPredictions} disabled={running}>
            {running ? 'Running...' : 'Run ML Predictions'}
          </button>
          {runStatus === 'success' && <span className="status-ok">Done! Predictions updated.</span>}
          {runStatus === 'error' && <span className="status-err">Error — is the server running?</span>}
        </div>

        {loadingStudent ? (
          <p>Loading...</p>
        ) : studentSubmissions.length === 0 ? (
          <p>No submissions found.</p>
        ) : (
          <>
          <div className="chart-header">
            <span>Response Time per Question</span>
            <div className="tooltip-wrap">
              <span className="tooltip-icon">?</span>
              <div className="tooltip-box">
                If a student is struggling, the amount of time spent per question may go down.
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={studentSubmissions.map((s, i) => ({
                question: `Q${i + 1}`,
                'Response Time (s)': parseFloat(s.raw_rt?.toFixed(1)),
              }))}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="question" />
              <YAxis unit="s" />
              <Tooltip formatter={val => [`${val}s`, 'Response Time']} />
              <Line type="monotone" dataKey="Response Time (s)" stroke="#646cff" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Correct?</th>
                <th>Time (s)</th>
                <th>Toggles</th>
                <th>ML Prediction</th>
              </tr>
            </thead>
            <tbody>
              {studentSubmissions.map(s => (
                <tr key={s.id}>
                  <td>{s.questions?.title ?? '—'}</td>
                  <td>{s.is_correct ? 'Yes' : 'No'}</td>
                  <td>{s.raw_rt?.toFixed(1)}</td>
                  <td>{s.toggle_count}</td>
                  <td>{s.ml_state_prediction ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>
    )
  }

  function buildQuizContext() {
    const qLines = questionStats.map(q => `  - "${q.title}": ${q['Avg Score (%)']}% avg score`).join('\n')
    const gLines = gradeDistribution.map(b => `  - ${b.range}: ${b.Students} student(s)`).join('\n')
    return `Students: ${students.join(', ')}\n\nAvg score per question:\n${qLines}\n\nGrade distribution:\n${gLines}`
  }

  // --- Main student list ---
  return (
    <div className="dashboard">
      <h1>Teacher Dashboard</h1>

      <div className="dashboard-actions">
        <button className="submit" onClick={handleRunPredictions} disabled={running}>
          {running ? 'Running...' : 'Run ML Predictions'}
        </button>
        {runStatus === 'success' && <span className="status-ok">Done! Predictions updated.</span>}
        {runStatus === 'error' && <span className="status-err">Error — is the server running?</span>}
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : fetchError ? (
        <p className="status-err">Error: {fetchError}</p>
      ) : students.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <>
          <p className="chart-header">Average Score per Question</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={questionStats} margin={{ top: 10, right: 20, left: 0, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-35} textAnchor="end" interval={0} tick={{ dy: 10 }} />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip formatter={val => [`${val}%`, 'Avg Score']} />
              <Bar dataKey="Avg Score (%)" fill="#646cff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <p className="chart-header">Grade Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} label={{ value: 'Students', angle: -90, position: 'insideLeft', offset: 10 }} />
              <Tooltip />
              <Bar dataKey="Students" fill="#34c08b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <button className="submit" onClick={() => setChatOpen(true)}>
            AI Insights
          </button>

          <p className="chart-header">Students</p>
          <div className="student-list">
            {students.map(name => (
              <button key={name} className="student-item" onClick={() => handleSelectStudent(name)}>
                {name}
              </button>
            ))}
          </div>
        </>
      )}

      {chatOpen && (
        <ChatWindow quizContext={buildQuizContext()} onClose={() => setChatOpen(false)} />
      )}
    </div>
  )
}
