import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'

function App() {
  const editorRef = useRef(null)
  const [language, setLanguage] = useState('python')

  function handleEditorDidMount(editor) {
    editorRef.current = editor
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
        height="65vh"
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
        style={{
          padding: '10px 24px',
          background: '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '14px',
          width: 'fit-content'
        }}
      >
        Review Code
      </button>

    </div>
  )
}

export default App