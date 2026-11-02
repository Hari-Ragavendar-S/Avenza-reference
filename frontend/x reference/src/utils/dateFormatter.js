/**
 * IST Date Formatter — all dates/times across the app use this
 * IST = UTC+5:30
 */

const IST_OPTIONS = { timeZone: 'Asia/Kolkata' }

/**
 * Format: 14 May 2026, 12:00 AM
 */
export function formatIST(dateInput) {
  if (!dateInput) return '—'
  const d = new Date(dateInput)
  if (isNaN(d)) return '—'
  return d.toLocaleString('en-IN', {
    ...IST_OPTIONS,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format: 14 May 2026
 */
export function formatISTDate(dateInput) {
  if (!dateInput) return '—'
  const d = new Date(dateInput)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-IN', {
    ...IST_OPTIONS,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format: 14 May 2026 (alias for formatISTDate)
 */
export function formatDateIST(dateInput, includeTime = true) {
  if (!dateInput) return '—'
  const d = new Date(dateInput)
  if (isNaN(d)) return '—'
  if (includeTime) {
    return d.toLocaleString('en-IN', {
      ...IST_OPTIONS,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }
  return d.toLocaleDateString('en-IN', {
    ...IST_OPTIONS,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format: 12:00 AM
 */
export function formatISTTime(dateInput) {
  if (!dateInput) return '—'
  const d = new Date(dateInput)
  if (isNaN(d)) return '—'
  return d.toLocaleTimeString('en-IN', {
    ...IST_OPTIONS,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Relative: "2 hours ago", "just now"
 */
export function formatRelativeIST(dateInput) {
  if (!dateInput) return '—'
  const d = new Date(dateInput)
  if (isNaN(d)) return '—'
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatISTDate(d)
}

/**
 * Get today's date in IST
 */
export function getTodayIST() {
  const now = new Date()
  return now.toLocaleDateString('en-CA', IST_OPTIONS) // YYYY-MM-DD format
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(dateInput) {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-CA', IST_OPTIONS) // YYYY-MM-DD format
}
