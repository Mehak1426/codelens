import { useRef, useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'

const palette = {
  bg: '#0d0d14',
  surface: '#13131a',
  elevated: '#1a1a26',
  border: '#2a2a3d',
  borderLight: '#3a3a55',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  purpleDim: '#4c1d95',
  purpleGlow: 'rgba(139, 92, 246, 0.15)',
  purpleGlow2: 'rgba(139, 92, 246, 0.08)',
  purpleStrong: 'rgba(139, 92, 246, 0.25)',
  white: '#ffffff',
  offWhite: '#e8e8f0',
  muted: '#9898b0',
  faint: '#4a4a65',
  red: '#f87171',
  redDim: 'rgba(248, 113, 113, 0.1)',
  orange: '#fb923c',
  orangeDim: 'rgba(251, 146, 60, 0.1)',
  sidebarBg: '#0f0f18',
  editorBg: '#0a0a10',
}

const categoryColors = {
  bug: palette.red,
  security: palette.orange,
}

const categoryIcons = {
  bug: '⬡',
  security: '◈',
}

function FileTree({ uploadedFiles, activeFile, onFileSelect }) {
  const fileNames = Object.keys(uploadedFiles)
  const folders = {}
  const rootFiles = []

  fileNames.forEach(name => {
    const parts = name.split('/')
    if (parts.length > 1) {
      const folder = parts[0]
      if (!folders[folder]) folders[folder] = []
      folders[folder].push(name)
    } else {
      rootFiles.push(name)
    }
  })

  const FileIcon = ({ name }) => {
    const ext = name.split('.').pop()
    const colors = { js: '#f7df1e', ts: '#3178c6', jsx: '#a78bfa', tsx: '#a78bfa', py: '#a78bfa', json: '#fb923c', md: '#9898b0', css: '#7c3aed', html: '#f87171' }
    return <span style={{ color: colors[ext] || palette.faint, fontSize: 10, marginRight: 6 }}>◆</span>
  }

  const itemStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', padding: '5px 8px 5px 18px',
    cursor: 'pointer', borderRadius: 4, fontSize: 13,
    fontFamily: "'DM Mono', 'Fira Mono', monospace",
    background: isActive ? palette.purpleStrong : 'transparent',
    color: isActive ? '#c4b5fd' : palette.muted,
    borderLeft: isActive ? `2px solid ${palette.purple}` : '2px solid transparent',
    transition: 'all 0.12s',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  })

  if (fileNames.length === 0) {
    return (
      <div style={{ padding: '20px 12px', color: palette.faint, fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: 'center', lineHeight: 1.6 }}>
        No files uploaded
      </div>
    )
  }

  return (
    <div>
      {Object.entries(folders).map(([folder, files]) => (
        <div key={folder}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', color: '#c4b5fd', fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
            <span style={{ marginRight: 5, fontSize: 10 }}>▾</span>
            <span style={{ color: palette.purple }}>◫</span>
            <span style={{ marginLeft: 5 }}>{folder}</span>
          </div>
          {files.map(f => (
            <div key={f} style={itemStyle(activeFile === f)} onClick={() => onFileSelect(f)}>
              <FileIcon name={f} />
              {f.split('/').slice(1).join('/')}
            </div>
          ))}
        </div>
      ))}
      {rootFiles.map(f => (
        <div key={f} style={itemStyle(activeFile === f)} onClick={() => onFileSelect(f)}>
          <FileIcon name={f} />
          {f}
        </div>
      ))}
    </div>
  )
}

function IssueSummaryBar({ comments }) {
  const counts = { bug: 0, security: 0 }
  comments.forEach(c => { if (counts[c.severity] !== undefined) counts[c.severity]++ })

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {Object.entries(counts).map(([sev, count]) => (
        <div key={sev} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: palette.elevated, border: `1px solid ${palette.border}`,
          borderRadius: 8, padding: '8px 14px',
          borderLeft: `3px solid ${categoryColors[sev]}`
        }}>
          <span style={{ fontSize: 18, color: categoryColors[sev] }}>{categoryIcons[sev]}</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: categoryColors[sev], fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 11, color: palette.faint, fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, marginTop: 2 }}>{sev.toUpperCase()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function IssueCard({ issue, onClick }) {
  const borderColor = categoryColors[issue.severity] || palette.purple
  const bgColor = issue.severity === 'bug' ? palette.redDim : palette.orangeDim

  return (
    <div onClick={onClick} style={{
      background: palette.elevated,
      border: `1px solid ${palette.border}`,
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = palette.purpleGlow2; e.currentTarget.style.borderColor = palette.borderLight }}
      onMouseLeave={e => { e.currentTarget.style.background = palette.elevated; e.currentTarget.style.borderColor = palette.border }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 14, color: palette.offWhite, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
          {issue.message}
        </div>
        {issue.severity && (
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 20,
            background: bgColor, color: borderColor,
            border: `1px solid ${borderColor}`,
            fontFamily: "'DM Mono', monospace",
            whiteSpace: 'nowrap', fontWeight: 700, letterSpacing: 1
          }}>
            {issue.severity.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
        {issue.filename && (
          <span style={{ fontSize: 12, color: palette.purple, fontFamily: "'DM Mono', monospace" }}>
            {issue.filename}:{issue.line}
          </span>
        )}
        {issue.category && (
          <span style={{ fontSize: 12, color: palette.faint, fontFamily: "'DM Mono', monospace" }}>{issue.category}</span>
        )}
      </div>
      {issue.fix && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: 'rgba(139, 92, 246, 0.08)',
          borderLeft: `2px solid ${palette.purple}`, borderRadius: 4
        }}>
          <div style={{ fontSize: 10, color: palette.purple, fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, marginBottom: 4 }}>SUGGESTED FIX</div>
          <div style={{ fontSize: 13, color: palette.purpleLight, fontFamily: "'DM Mono', monospace", lineHeight: 1.5 }}>{issue.fix}</div>
        </div>
      )}
    </div>
  )
}

function IssueGroup({ label, icon, issues, onIssueClick }) {
  const [open, setOpen] = useState(true)
  if (issues.length === 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', cursor: 'pointer', borderBottom: `1px solid ${palette.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ color: palette.offWhite, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700 }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: palette.purpleGlow, color: palette.purpleLight, borderRadius: 20, fontSize: 12, padding: '2px 9px', fontFamily: "'DM Mono', monospace", border: `1px solid ${palette.border}` }}>{issues.length}</span>
          <span style={{ color: palette.faint, fontSize: 13 }}>{open ? '▾' : '▸'}</span>
        </div>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} onClick={() => onIssueClick(issue)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const editorRef = useRef(null)
  const [language, setLanguage] = useState('python')
  const [comments, setComments] = useState([])
  const [graphSummary, setGraphSummary] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [activeFile, setActiveFile] = useState(null)
  const [openTabs, setOpenTabs] = useState([])
  const [bottomTab, setBottomTab] = useState('dependency')
  useEffect(() => { loadHistory() }, [])

  function handleEditorDidMount(editor) {
    editorRef.current = editor
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files)
    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve({ name: file.webkitRelativePath || file.name, content: ev.target.result })
      reader.readAsText(file)
    }))
    Promise.all(readers).then(results => {
      const filesMap = {}
      results.forEach(r => filesMap[r.name] = r.content)
      setUploadedFiles(filesMap)
      const firstName = results[0]?.name
      setActiveFile(firstName)
      setOpenTabs([firstName])
      editorRef.current?.setValue(results[0]?.content || '')
    })
  }

  function exportReview() {
    let text = "CODELENS REVIEW REPORT\n\n"
    text += `Generated: ${new Date().toLocaleString()}\n`
    text += `Issues Found: ${comments.length}\n\n`
    if (graphSummary.length > 0) {
      text += "DEPENDENCY GRAPH\n================\n"
      graphSummary.forEach(line => { text += line + "\n" })
      text += "\n"
    }
    text += "FINDINGS\n========\n\n"
    comments.forEach((c, i) => {
      text += `Issue ${i + 1}\nFile: ${c.filename}\nLine: ${c.line}\nSeverity: ${c.severity}\nCategory: ${c.category}\nMessage: ${c.message}\n`
      if (c.fix) text += `Fix: ${c.fix}\n`
      text += "\n----------------------\n\n"
    })
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'review-report.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function loadOldReview(review) {
    setComments(review.findings || [])
    setGraphSummary(review.graph_summary || [])
  }

  function openTab(fname) {
    setActiveFile(fname)
    setOpenTabs(prev => prev.includes(fname) ? prev : [...prev, fname])
    editorRef.current?.setValue(uploadedFiles[fname] || '')
  }

  function closeTab(e, fname) {
    e.stopPropagation()
    const newTabs = openTabs.filter(t => t !== fname)
    setOpenTabs(newTabs)
    if (activeFile === fname) {
      const next = newTabs[newTabs.length - 1]
      setActiveFile(next || null)
      editorRef.current?.setValue(next ? uploadedFiles[next] : '')
    }
  }

  async function loadHistory() {
    try {
      const res = await axios.get('https://codelens-q6b5.onrender.com/history')
      setHistory(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleReview() {
    setLoading(true)
    setError(null)
    setComments([])
    setGraphSummary([])
    if (Object.keys(uploadedFiles).length === 0) {
      setError('Please upload a project first')
      setLoading(false)
      return
    }
    try {
      const res = await axios.post('https://codelens-q6b5.onrender.com/review', {
  files: uploadedFiles,
  language
})
      setComments(res.data.comments || [])
      setGraphSummary(res.data.graph || [])
      await loadHistory()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function jumpToIssue(issue) {
    if (!editorRef.current) return
    if (issue.filename && uploadedFiles[issue.filename]) openTab(issue.filename)
    setTimeout(() => {
      editorRef.current.revealLineInCenter(issue.line)
      editorRef.current.setPosition({ lineNumber: issue.line, column: 1 })
      editorRef.current.focus()
    }, 100)
  }

  const groupedIssues = {
    bug: comments.filter(c => c.severity === 'bug'),
    security: comments.filter(c => c.severity === 'security'),
  }

  const totalIssues = comments.length
  const fileCount = Object.keys(uploadedFiles).length
  const projectName = fileCount > 0 ? Object.keys(uploadedFiles)[0].split('/')[0] || 'project' : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: palette.bg, overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3a3a55; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .history-item:hover { background: rgba(139,92,246,0.1) !important; }
        .filetree-item:hover { background: rgba(139,92,246,0.08) !important; color: #c4b5fd !important; }
      `}</style>

      {/* TOP NAVBAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 54, background: '#0f0f18',
        borderBottom: `1px solid ${palette.border}`, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: `linear-gradient(135deg, ${palette.purple}, #6d28d9)`,
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15
            }}>⬡</div>
            <span style={{ color: palette.white, fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>CodeLens</span>
            <span style={{
              background: palette.purpleGlow, color: palette.purpleLight,
              fontSize: 10, padding: '2px 7px', borderRadius: 4,
              border: `1px solid ${palette.border}`, letterSpacing: 1, fontFamily: "'DM Mono', monospace"
            }}>BETA</span>
          </div>
          {projectName && (
            <>
              <span style={{ color: palette.border, fontSize: 18 }}>⎇</span>
              <span style={{ color: palette.muted, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>main</span>
              <span style={{ color: palette.faint, fontSize: 14 }}>/</span>
              <span style={{ color: palette.purpleLight, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>{projectName}</span>
            </>
          )}
        </div>

        <div style={{
          flex: 1, maxWidth: 420, margin: '0 28px',
          background: palette.elevated, border: `1px solid ${palette.border}`,
          borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ color: palette.faint, fontSize: 14 }}>⌕</span>
          <span style={{ color: palette.faint, fontSize: 13 }}>Search files, findings, symbols...</span>
          <span style={{ marginLeft: 'auto', color: palette.faint, fontSize: 11, fontFamily: "'DM Mono', monospace", border: `1px solid ${palette.border}`, padding: '1px 5px', borderRadius: 3 }}>⌘K</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{
            padding: '7px 12px', background: palette.elevated, color: palette.offWhite,
            border: `1px solid ${palette.border}`, borderRadius: 8, fontSize: 13,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", outline: 'none'
          }}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
          </select>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', background: palette.elevated, color: palette.offWhite,
            border: `1px solid ${palette.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s', fontWeight: 500
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = palette.purple; e.currentTarget.style.color = palette.white }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.color = palette.offWhite }}
          >
            <span style={{ fontSize: 13 }}>↑</span> Upload Project
            <input type="file" multiple webkitdirectory="" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            onClick={exportReview}
            disabled={comments.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 16px', background: palette.elevated,
              color: comments.length === 0 ? palette.faint : palette.offWhite,
              border: `1px solid ${palette.border}`,
              borderRadius: 8, fontSize: 13,
              cursor: comments.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600
            }}
          >
            ↓ Export Report
          </button>

          <button onClick={handleReview} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 20px',
            background: loading ? palette.elevated : `linear-gradient(135deg, ${palette.purple}, #6d28d9)`,
            color: loading ? palette.faint : palette.white,
            border: `1px solid ${loading ? palette.border : 'transparent'}`,
            borderRadius: 8, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            transition: 'all 0.2s', letterSpacing: 0.2
          }}>
            {loading
              ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span> Analyzing...</>
              : <><span>⬡</span> Review Project</>
            }
          </button>

          <div style={{
            width: 34, height: 34, background: palette.elevated, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: palette.muted, fontSize: 15,
            border: `1px solid ${palette.border}`, transition: 'all 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = palette.purple; e.currentTarget.style.color = palette.purpleLight }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.color = palette.muted }}
          >⚙</div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR — distinct darker bg */}
        <div style={{
          width: 230, background: palette.sidebarBg,
          borderRight: `1px solid ${palette.border}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
          {/* Explorer header — accented */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px 8px',
            borderBottom: `1px solid ${palette.border}`,
            background: 'rgba(139,92,246,0.07)',
          }}>
            <span style={{ color: '#c4b5fd', fontSize: 11, letterSpacing: 2, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>EXPLORER</span>
            <span style={{ color: palette.purpleLight, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{fileCount > 0 ? `${fileCount} files` : ''}</span>
          </div>

          <div style={{ overflow: 'auto', flex: 1, padding: '8px 0' }}>
            {fileCount > 0 && projectName && (
              <div style={{ padding: '4px 14px 4px', color: '#7c6fa8', fontSize: 11, letterSpacing: 1.5, fontFamily: "'DM Mono', monospace" }}>
                {projectName.toUpperCase()}
              </div>
            )}
            <FileTree uploadedFiles={uploadedFiles} activeFile={activeFile} onFileSelect={openTab} />

            {/* History section */}
            <div style={{ marginTop: 20, borderTop: `1px solid ${palette.border}`, paddingTop: 12 }}>
              <div style={{
                color: '#c4b5fd', fontSize: 11, letterSpacing: 2,
                padding: '0 14px 8px', fontFamily: "'DM Mono', monospace", fontWeight: 600,
                background: 'rgba(139,92,246,0.07)', marginBottom: 4
              }}>
                HISTORY
              </div>
              {history.map(h => (
                <div
                  key={h.id}
                  className="history-item"
                  onClick={() => loadOldReview(h)}
                  style={{
                    padding: '8px 14px', cursor: 'pointer',
                    borderBottom: `1px solid ${palette.border}`,
                    fontSize: 12, transition: 'background 0.15s'
                  }}
                >
                  <div style={{ color: palette.offWhite, fontWeight: 600 }}>{h.project_name}</div>
                  <div style={{ color: palette.muted, fontSize: 11, marginTop: 2 }}>{h.issue_count} issues</div>
                  <div style={{ color: palette.faint, fontSize: 10 }}>{new Date(h.review_time).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER - Editor — distinctly darker bg */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: palette.editorBg }}>

          {/* Tab Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', background: '#0e0e16',
            borderBottom: `1px solid ${palette.border}`, height: 40, overflow: 'auto', flexShrink: 0
          }}>
            {openTabs.map(tab => {
              const shortName = tab.split('/').pop()
              const isActive = tab === activeFile
              return (
                <div key={tab} onClick={() => openTab(tab)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0 16px', height: '100%', cursor: 'pointer',
                  borderRight: `1px solid ${palette.border}`, whiteSpace: 'nowrap',
                  background: isActive ? palette.editorBg : 'transparent',
                  borderBottom: isActive ? `2px solid ${palette.purple}` : '2px solid transparent',
                  color: isActive ? palette.offWhite : palette.muted, fontSize: 13,
                  transition: 'all 0.1s', fontFamily: "'DM Mono', monospace"
                }}>
                  <span style={{ fontSize: 8, color: isActive ? palette.purple : palette.faint }}>●</span>
                  {shortName}
                  <span onClick={e => closeTab(e, tab)} style={{
                    fontSize: 15, color: palette.faint, lineHeight: 1, padding: '0 2px', borderRadius: 2, cursor: 'pointer'
                  }}>×</span>
                </div>
              )
            })}
          </div>

          {/* Breadcrumb */}
          {activeFile && (
            <div style={{ padding: '5px 18px', background: '#0e0e16', borderBottom: `1px solid ${palette.border}`, color: palette.faint, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              {activeFile}
            </div>
          )}

          {/* Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language}
              defaultValue="# Paste your code here"
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 14 }, fontFamily: "'DM Mono', monospace" }}
            />
          </div>

          {/* Bottom Panel */}
          {graphSummary.length > 0 && (
            <div style={{ height: 160, background: '#0e0e16', borderTop: `1px solid ${palette.border}`, flexShrink: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${palette.border}` }}>
                <div style={{ padding: '7px 18px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: palette.purpleLight, borderBottom: `2px solid ${palette.purple}`, fontFamily: "'DM Mono', monospace" }}>
                  <span>⬡</span> DEPENDENCY GRAPH
                </div>
              </div>
              <div style={{ padding: 14, overflow: 'auto', height: 'calc(100% - 34px)' }}>
                {graphSummary.map((line, i) => (
                  <div key={i} style={{ color: palette.muted, fontSize: 13, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — slightly lighter surface with accent header */}
        <div style={{
          width: 360, background: palette.sidebarBg,
          borderLeft: `1px solid ${palette.border}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
          {/* Header — purple accent bar */}
          <div style={{
            padding: '12px 18px',
            borderBottom: `1px solid ${palette.border}`,
            borderTop: `2px solid ${palette.purple}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            background: 'rgba(139,92,246,0.07)',
          }}>
            <span style={{ color: '#c4b5fd', fontSize: 11, letterSpacing: 2, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>REVIEW FINDINGS</span>
            {totalIssues > 0 && (
              <span style={{
                background: palette.purpleStrong, color: '#c4b5fd',
                fontSize: 11, padding: '2px 9px', borderRadius: 20,
                fontFamily: "'DM Mono', monospace", border: `1px solid ${palette.purple}`
              }}>
                {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'}
              </span>
            )}
          </div>

          {/* Summary Bar */}
          {totalIssues > 0 && (
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${palette.border}`, flexShrink: 0 }}>
              <IssueSummaryBar comments={comments} />
            </div>
          )}

          {/* Issue List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px' }}>
            {error && (
              <div style={{ background: palette.redDim, border: `1px solid ${palette.red}`, borderRadius: 8, padding: '12px 14px', color: palette.red, fontSize: 14, marginBottom: 14 }}>
                {error}
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '50px 0', color: palette.muted, fontSize: 14 }}>
                <div style={{ fontSize: 28, animation: 'spin 1.2s linear infinite', color: palette.purple }}>◌</div>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>Analyzing code...</span>
              </div>
            )}

            {!loading && totalIssues === 0 && !error && (
              <div style={{ color: palette.faint, fontSize: 14, textAlign: 'center', padding: '50px 0', lineHeight: 1.7 }}>
                {fileCount > 0
                  ? <><div style={{ fontSize: 28, marginBottom: 10, color: palette.purple }}>⬡</div>Click <strong style={{ color: palette.purpleLight }}>Review Project</strong><br />to analyze your code</>
                  : <><div style={{ fontSize: 28, marginBottom: 10, color: palette.purple }}>◫</div>Upload a project<br />to get started</>
                }
              </div>
            )}

            <IssueGroup label="Bugs" icon="⬡" issues={groupedIssues.bug} onIssueClick={jumpToIssue} />
            <IssueGroup label="Security" icon="◈" issues={groupedIssues.security} onIssueClick={jumpToIssue} />
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{
        height: 26, background: '#0d0d16',
        borderTop: `1px solid ${palette.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ color: palette.muted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>⎇ main</span>
          <span style={{ color: '#4ade80', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{totalIssues} Findings</span>
          {totalIssues > 0 && <span style={{ color: palette.purpleLight, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>⬡ {totalIssues} findings</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {activeFile && <span style={{ color: palette.muted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{activeFile.split('/').pop()}</span>}
          <span style={{ color: palette.muted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>UTF-8</span>
          <span style={{ color: palette.purpleLight, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{language === 'python' ? 'Python' : language === 'javascript' ? 'JavaScript' : 'C++'}</span>
        </div>
      </div>
    </div>
  )
}