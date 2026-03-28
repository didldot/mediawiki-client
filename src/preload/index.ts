import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('wikiAPI', {
  login: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('wiki:login'),

  fetchPage: (title: string): Promise<{ content?: string; error?: string }> =>
    ipcRenderer.invoke('wiki:fetchPage', title)
})
