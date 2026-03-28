export interface WikiAPI {
  login(): Promise<{ success: boolean; error?: string }>
  fetchPage(title: string): Promise<{ content?: string; error?: string }>
}

declare global {
  interface Window {
    wikiAPI: WikiAPI
  }
}
