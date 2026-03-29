import { useState, useEffect } from 'react'
import type { Recipe } from '../../preload/index.d'

type AppState = 'logging-in' | 'ready' | 'fetching' | 'done' | 'login-error' | 'fetch-error'

export default function App(): React.JSX.Element {
  const [appState, setAppState] = useState<AppState>('logging-in')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [rawContent, setRawContent] = useState<string | null>(null)
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
    setRecipe(null)
    setRawContent(null)

    const res = await window.wikiAPI.fetchRecipe(title.trim())
    if (res.error) {
      setFetchError(res.error)
      setAppState('fetch-error')
    } else if (res.recipe) {
      setRecipe(res.recipe)
      setAppState('done')
    } else {
      setRawContent(res.content ?? '')
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

      {appState === 'done' && recipe && <RecipeView recipe={recipe} />}

      {appState === 'done' && rawContent !== null && (
        <pre style={styles.content}>{rawContent}</pre>
      )}
    </div>
  )
}

function RecipeView({ recipe }: { recipe: Recipe }): React.JSX.Element {
  return (
    <div style={styles.recipe}>
      <h2 style={styles.recipeName}>{recipe.name}</h2>

      {recipe.categories.length > 0 && (
        <p style={styles.categories}>{recipe.categories.join(' · ')}</p>
      )}

      {recipe.metadaten && <p style={styles.metadaten}>{recipe.metadaten}</p>}

      {recipe.zutaten.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionHeading}>Zutaten</h3>
          <ul style={styles.list}>
            {recipe.zutaten.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {recipe.zubereitung.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionHeading}>Zubereitung</h3>
          <ol style={styles.list}>
            {recipe.zubereitung.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {recipe.individuelle_zubereitung && (
        <section style={styles.section}>
          <h3 style={styles.sectionHeading}>Individuelle Zubereitung</h3>
          <p>{recipe.individuelle_zubereitung}</p>
        </section>
      )}

      {recipe.beilage && (
        <section style={styles.section}>
          <h3 style={styles.sectionHeading}>Beilage</h3>
          <p>{recipe.beilage}</p>
        </section>
      )}

      <div style={styles.meta}>
        {recipe.jahreszeit && <span>Jahreszeit: {recipe.jahreszeit}</span>}
        {recipe.unterwegs && <span>Unterwegs: {recipe.unterwegs}</span>}
        {recipe.quelle && <span>Quelle: {recipe.quelle}</span>}
        {recipe.buch && (
          <span>
            Buch: {recipe.buch}
            {recipe.seite ? `, S. ${recipe.seite}` : ''}
          </span>
        )}
        {recipe.url && (
          <span>
            URL: <a href={recipe.url}>{recipe.url}</a>
          </span>
        )}
      </div>
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
  },
  recipe: {
    background: '#fafafa',
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '1.5rem',
    overflowY: 'auto',
    maxHeight: 500
  },
  recipeName: {
    marginTop: 0,
    marginBottom: '0.25rem',
    fontSize: 22
  },
  categories: {
    color: '#666',
    fontSize: 12,
    marginTop: 0,
    marginBottom: '0.75rem'
  },
  metadaten: {
    color: '#555',
    fontSize: 13,
    marginBottom: '1rem',
    fontStyle: 'italic'
  },
  section: {
    marginBottom: '1rem'
  },
  sectionHeading: {
    fontSize: 15,
    marginBottom: '0.4rem',
    color: '#333'
  },
  list: {
    margin: 0,
    paddingLeft: '1.4rem',
    fontSize: 14,
    lineHeight: 1.7
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '1rem',
    fontSize: 13,
    color: '#555',
    borderTop: '1px solid #e0e0e0',
    paddingTop: '0.75rem'
  }
}
