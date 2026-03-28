import 'dotenv/config'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// --- MediaWiki session state ---
// Node's built-in fetch is used (not net.fetch) to avoid Electron's NSS cert issues on Linux.
// Session cookies are captured manually from the login response and replayed on subsequent requests.
let isLoggedIn = false
let sessionCookie = ''

async function wikiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(sessionCookie ? { Cookie: sessionCookie } : {})
  }
  try {
    return await fetch(url, { ...options, headers, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

// --- IPC: wiki:login ---
ipcMain.handle('wiki:login', async () => {
  const baseUrl = process.env.WIKI_URL
  const username = process.env.WIKI_USERNAME
  const password = process.env.WIKI_PASSWORD

  if (!baseUrl || !username || !password) {
    return { success: false, error: 'Missing WIKI_URL, WIKI_USERNAME or WIKI_PASSWORD in .env' }
  }

  try {
    // Step 1: fetch login token
    const tokenUrl = `${baseUrl}/api.php?action=query&meta=tokens&type=login&format=json`
    const tokenRes = await fetch(tokenUrl)

    // Capture session cookie from token response
    const tokenCookie = tokenRes.headers.getSetCookie?.() ?? tokenRes.headers.get('set-cookie')?.split(',') ?? []
    if (tokenCookie.length) sessionCookie = tokenCookie.map((c) => c.split(';')[0]).join('; ')

    const tokenData = (await tokenRes.json()) as {
      query: { tokens: { logintoken: string } }
    }
    const loginToken = tokenData.query.tokens.logintoken
    // Step 2: POST credentials
    const body = new URLSearchParams({
      action: 'login',
      lgname: username,
      lgpassword: password,
      lgtoken: loginToken,
      format: 'json'
    })
    const loginRes = await wikiFetch(`${baseUrl}/api.php`, {
      method: 'POST',
      body
    })

    // Accumulate all cookies from the login response
    const loginCookies = loginRes.headers.getSetCookie?.() ?? loginRes.headers.get('set-cookie')?.split(',') ?? []
    if (loginCookies.length) sessionCookie = loginCookies.map((c) => c.split(';')[0]).join('; ')

    const loginData = (await loginRes.json()) as {
      login: { result: string; reason?: string }
    }
    if (loginData.login?.result === 'Success') {
      isLoggedIn = true
      return { success: true }
    }
    return { success: false, error: loginData.login?.reason ?? 'Login failed' }
  } catch (err) {
    console.error('[wiki:login] Error:', err)
    return { success: false, error: String(err) }
  }
})

// --- IPC: wiki:fetchPage ---
ipcMain.handle('wiki:fetchPage', async (_event, title: string) => {
  if (!isLoggedIn) return { error: 'Not authenticated' }

  const baseUrl = process.env.WIKI_URL!
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'revisions',
    rvprop: 'content',
    format: 'json'
  })

  try {
    const res = await wikiFetch(`${baseUrl}/api.php?${params}`)
    const data = (await res.json()) as {
      query: { pages: Record<string, { missing?: string; revisions?: Array<{ '*': string }> }> }
    }
    const pages = data.query?.pages ?? {}
    const page = Object.values(pages)[0]

    if (page.missing !== undefined) return { error: 'Page not found' }
    const content = page.revisions?.[0]?.['*'] ?? ''
    return { content }
  } catch (err) {
    return { error: String(err) }
  }
})

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
