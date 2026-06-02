// src/components/Sidebar.jsx

function Sidebar({
  uploadedFiles,
  activeFile,
  setActiveFile,
  onFileSelect
}) {
  return (
    <div
      style={{
        width: '220px',
        background: '#161b22',
        borderRight: '1px solid #30363d',
        padding: '12px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          color: '#0ea5e9',
          fontWeight: 'bold',
          marginBottom: '12px'
        }}
      >
        PROJECT FILES
      </div>

      {Object.keys(uploadedFiles).map((fname) => (
        <div
          key={fname}
          onClick={() => {
            setActiveFile(fname)
            onFileSelect(fname)
          }}
          style={{
            padding: '8px',
            marginBottom: '4px',
            borderRadius: '6px',
            cursor: 'pointer',
            background:
              activeFile === fname
                ? '#0ea5e9'
                : 'transparent',
            color: 'white'
          }}
        >
          📄 {fname}
        </div>
      ))}
    </div>
  )
}

export default Sidebar