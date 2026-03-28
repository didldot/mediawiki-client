import { useState, useEffect } from 'react'

type AppState = 'logging-in' | 'ready' | 'fetching' | 'done' | 'login-error' | 'fetch-error'

export default function App(): React.JSX.Element {
  const [appState, setAppState] = useState<AppState>('logging-in')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    window.wikiAPI.login().then((res) => {
      if (res.success) {
        setAppState('ready')
      } else {
        setLoginError(res.error ?? 'Unknown error')
        setAppState('login-error')
      }
    })
  }, [])

  const handleFetch = async (): Promise<void> => {
    if (!title.trim()) return
    setAppState('fetching')
    setFetchError(null)
    setContent('')

    const res = await window.wikiAPI.fetchPage(title.trim())
    if (res.error) {
      setFetchError(res.error)
      setAppState('fetch-error')
    } else {
      setContent(res.content ?? '')
      setAppState('done')
    }
  }

  if (appState === 'logging-in') {
    return (
      <div style={styles.container}>
        <p>Connecting to wiki...</p>
      </div>
    )
  }

  if (appState === 'login-error') {
    return (
      <div style={styles.container}>
        <p style={styles.error}>Login failed: {loginError}</p>
        <p style={styles.hint}>Check your .env file (WIKI_URL, WIKI_USERNAME, WIKI_PASSWORD)</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>MediaWiki Client</h1>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          placeholder="Page title (e.g. Main Page)"
          disabled={appState === 'fetching'}
        />
        <button
          style={styles.button}
          onClick={handleFetch}
          disabled={appState === 'fetching' || !title.trim()}
        >
          {appState === 'fetching' ? 'Fetching…' : 'Fetch'}
        </button>
      </div>

      {appState === 'fetch-error' && <p style={styles.error}>{fetchError}</p>}

      {appState === 'done' && (
        <pre style={styles.content}>{content}</pre>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    maxWidth: 860,
    margin: '0 auto',
    color: '#1a1a1a'
  },
  heading: {
    marginTop: 0,
    color: '#1a1a1a'
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    marginBottom: '1rem'
  },
  input: {
    flex: 1,
    padding: '6px 10px',
    fontSize: 14,
    color: '#1a1a1a',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: 4
  },
  button: {
    padding: '6px 16px',
    fontSize: 14,
    cursor: 'pointer'
  },
  error: {
    color: '#c00'
  },
  hint: {
    color: '#666',
    fontSize: 13
  },
  content: {
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    maxHeight: 460,
    background: '#f5f5f5',
    color: '#1a1a1a',
    padding: '1rem',
    borderRadius: 4,
    fontSize: 13,
    lineHeight: 1.5
  }
}
