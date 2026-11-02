const BASE_URL = 'https://fxuniverse.live/api/v1'

export const setTokens = (access, refresh) => {
  if (access) localStorage.setItem('fxu_access_token', access)
  if (refresh) localStorage.setItem('fxu_refresh_token', refresh)
}

export const clearTokens = () => {
  localStorage.removeItem('fxu_access_token')
  localStorage.removeItem('fxu_refresh_token')
  localStorage.removeItem('fxu_user')
}

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    // Always read fresh from localStorage — never cache the token
    const token = localStorage.getItem('fxu_access_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (res.status === 401 && auth) {
    clearTokens()
    window.location.href = '/login'
    return
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Something went wrong')
  return data
}

export const api = {
  get: (path, auth = true) => request('GET', path, null, auth),
  post: (path, body, auth = true) => request('POST', path, body, auth),
  put: (path, body, auth = true) => request('PUT', path, body, auth),
  delete: (path, auth = true) => request('DELETE', path, null, auth),
}
