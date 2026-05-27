import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'

function App() {
  const editorRef = useRef(null)
  const [language, setLanguage] = useState('python')
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleEditorDidMount(editor) {
    editorRef.current = editor
  }

  async function handleReview() {
    const code = editorRef.current.getValue()
    if (!code.trim()) return

    setLoading(true)
    setError(null)
    setComments([])

    try {
      const res = await axios.post('http://localhost:5000/review', {
        code,
        language
      })
      setComments(res.data.comments || [])
    } catch (err) {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const severityColors = {
    bug: '#ff6b6b',
    performance: '#ffd93d',
    security: '#ff9f43',
    style: '#a29bfe'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#1e1e1e',
      padding: '20px',
      gap: '12px',
      boxSizing: 'border-box'
    }}>

      <h1 style={{
        color: '#0ea5e9',
        margin: 0,
        fontFamily: 'monospace',
        fontSize: '24px'
      }}>
        CodeLens 🔍
      </h1>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          width: '150px',
          padding: '8px',
          background: '#2d2d2d',
          color: 'white',
          border: '1px solid #555',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}
      >
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
        <option value="cpp">C++</option>
      </select>

      <Editor
        height="50vh"
        language={language}
        defaultValue="# Paste your code here"
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />

      <button
        onClick={handleReview}
        disabled={loading}
        style={{
          padding: '10px 24px',
          background: loading ? '#555' : '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace',
          fontSize: '14px',
          width: 'fit-content'
        }}
      >
        {loading ? 'Reviewing...' : 'Review Code'}
      </button>

      {error && (
        <div style={{ color: '#ff6b6b', fontFamily: 'monospace', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: '12px' }}>
            {comments.length} issue{comments.length !== 1 ? 's' : ''} found
          </div>
          {comments.map((c, i) => (
            <div key={i} style={{
              background: '#2d2d2d',
              border: `1px solid ${severityColors[c.severity] || '#555'}`,
              borderLeft: `3px solid ${severityColors[c.severity] || '#555'}`,
              borderRadius: '4px',
              padding: '10px 14px',
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                <span style={{ color: '#888' }}>Line {c.line}</span>
                <span style={{ color: severityColors[c.severity] || '#fff' }}>
                  {c.severity?.toUpperCase()}
                </span>
                <span style={{ color: '#888' }}>{c.category}</span>
              </div>
              <div style={{ color: '#ddd' }}>{c.message}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default App