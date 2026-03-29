export interface Recipe {
  name: string
  metadaten?: string
  zutaten: string[]
  zubereitung: string[]
  individuelle_zubereitung?: string
  beilage?: string
  jahreszeit?: string
  unterwegs?: string
  media?: string
  quelle?: string
  buch?: string
  seite?: string
  url?: string
  category?: string
  categories: string[]
}

export interface WikiAPI {
  login(): Promise<{ success: boolean; error?: string }>
  fetchPage(title: string): Promise<{ content?: string; error?: string }>
  fetchRecipe(title: string): Promise<{ recipe?: Recipe; content?: string; error?: string }>
}

declare global {
  interface Window {
    wikiAPI: WikiAPI
  }
}
