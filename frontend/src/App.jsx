import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import Sidebar from './components/Sidebar'

function App() {
  const editorRef = useRef(null)
  const [language, setLanguage] = useState('python')

  const [comments, setComments] = useState([])
  const [graphSummary, setGraphSummary] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [activeFile, setActiveFile] = useState(null)
  

  function handleEditorDidMount(editor) {
    editorRef.current = editor
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files)
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve({
  name: file.webkitRelativePath || file.name,
  content: ev.target.result
})
        reader.readAsText(file)
      })
    })
    Promise.all(readers).then(results => {
      const filesMap = {}
      results.forEach(r => filesMap[r.name] = r.content)
      setUploadedFiles(filesMap)
      setActiveFile(results[0]?.name)
      editorRef.current?.setValue(results[0]?.content || '')
    })
  }

  async function handleReview() {
    setLoading(true)
    setError(null)
    setComments([])
    setGraphSummary([])

    try {
     if (Object.keys(uploadedFiles).length === 0) {
  setError('Please upload a project first')
  setLoading(false)
  return
}

const files = uploadedFiles

      const res = await axios.post('http://localhost:5000/review', { files, language })
      setComments(res.data.comments || [])
      setGraphSummary(res.data.graph || [])
    } catch (err) {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const severityColors = {
    bug: '#ff6b6b',
   
    security: '#ff9f43'
    
  }
 const jumpToIssue = (issue) => {
  if (!editorRef.current) return

  if (
    issue.filename &&
    uploadedFiles[issue.filename]
  ) {
    setActiveFile(issue.filename)

    editorRef.current.setValue(
      uploadedFiles[issue.filename]
    )
  }

  setTimeout(() => {
    editorRef.current.revealLineInCenter(
      issue.line
    )

    editorRef.current.setPosition({
      lineNumber: issue.line,
      column: 1
    })

    editorRef.current.focus()
  }, 100)
}
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: '#1e1e1e', padding: '20px', gap: '12px', boxSizing: 'border-box'
    }}>

      <h1 style={{ color: '#0ea5e9', margin: 0, fontFamily: 'monospace', fontSize: '24px' }}>
        CodeLens 
      </h1>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={language} onChange={e => setLanguage(e.target.value)}
          style={{ padding: '8px', background: '#2d2d2d', color: 'white', border: '1px solid #555', borderRadius: '4px', fontFamily: 'monospace' }}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
        </select>

        <input
  type="file"
  multiple
  webkitdirectory=""
  onChange={handleFileUpload}
  style={{
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '13px'
  }}
/>
      </div>

     

      {/* Editor */}
      <div
  style={{
    display: 'flex',
    gap: '12px',
    minHeight: '45vh'
  }}
>
 <Sidebar
  uploadedFiles={uploadedFiles}
  activeFile={activeFile}
  setActiveFile={setActiveFile}
  onFileSelect={(fname) => {
    editorRef.current?.setValue(uploadedFiles[fname])
  }}
/>

  <div style={{ flex: 1 }}>
    <Editor
      height="45vh"
      language={language}

      defaultValue="# Paste your code here"
      theme="vs-dark"
      onMount={handleEditorDidMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false
      }}
    />
  </div>
</div>

      <button onClick={handleReview} disabled={loading}
        style={{ padding: '10px 24px', background: loading ? '#555' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontSize: '14px', width: 'fit-content' }}>
        {loading ? 'Reviewing...' : 'Review Code'}
      </button>

      {error && <div style={{ color: '#ff6b6b', fontFamily: 'monospace', fontSize: '13px' }}>{error}</div>}

      {/* Dependency graph */}
      {graphSummary.length > 0 && (
        <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '12px' }}>
          <div style={{ color: '#0ea5e9', fontFamily: 'monospace', fontSize: '11px', marginBottom: '8px', letterSpacing: 2 }}>DEPENDENCY GRAPH</div>
          {graphSummary.map((line, i) => (
            <div key={i} style={{ color: '#888', fontFamily: 'monospace', fontSize: '12px', marginBottom: '2px' }}>{line}</div>
          ))}
        </div>
      )}

      {/* Comments */}
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: '12px' }}>
            {comments.length} issue{comments.length !== 1 ? 's' : ''} found
          </div>
       {comments.map((c, i) => (
  <div
    key={i}
    onClick={() => jumpToIssue(c)}
    style={{
      background: '#2d2d2d',
      border: `1px solid ${severityColors[c.severity] || '#555'}`,
      borderLeft: `3px solid ${severityColors[c.severity] || '#555'}`,
      borderRadius: '4px',
      padding: '10px 14px',
      fontFamily: 'monospace',
      fontSize: '13px',
      cursor: 'pointer'
    }}
  >
    <div
      style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '4px',
        flexWrap: 'wrap'
      }}
    >
      {c.filename && (
        <span style={{ color: '#0ea5e9' }}>
          {c.filename}
        </span>
      )}

      <span style={{ color: '#888' }}>
        Line {c.line}
      </span>

      <span
        style={{
          color:
            severityColors[c.severity] || '#fff'
        }}
      >
        {c.severity?.toUpperCase()}
      </span>

      <span style={{ color: '#888' }}>
        {c.category}
      </span>
    </div>

   <div style={{ color: '#ddd' }}>
  {c.message}
</div>

{c.fix && (
  <div
    style={{
      marginTop: '8px',
      padding: '8px',
      background: '#111827',
      borderLeft: '3px solid #0ea5e9',
      borderRadius: '4px',
      color: '#7dd3fc'
    }}
  >
    <strong>Suggested Fix:</strong>
    <div>{c.fix}</div>
  </div>
)}
  </div>
))}
        </div>
      )}

    </div>
  )
}

export default App