import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminROI() {
  const [stats, setStats] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [saving, setSaving] = useState(false)
  const [interval, setIntervalVal] = useState(1440)
  const [msg, setMsg] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  const load = async () => {
    try {
      const [s, sc] = await Promise.all([
        api.get('/admin/roi/stats'),
        api.get('/admin/roi/schedule'),
      ])
      setStats(s)
      setSchedule(sc)
      setIntervalVal(sc.interval_minutes)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const triggerROI = async () => {
    setShowConfirm(false)
    setTriggering(true)
    setMsg('')
    try {
      const res = await api.post('/admin/roi/trigger', {})
      setMsg(res.message)
      load()
    } catch (err) { setMsg(err.message) }
    finally { setTriggering(false) }
  }

  const saveSchedule = async () => {
    setShowSaveConfirm(false)
    setSaving(true)
    try {
      await api.post(`/admin/roi/schedule?interval_minutes=${interval}`, {})
      setMsg(`✅ ROI interval set to ${interval} minute${interval !== 1 ? 's' : ''}`)
      load()
    } catch (err) { setMsg(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  const presets = [
    { label: '1 Minute (Test)', value: 1 },
    { label: '12 Hours', value: 720 },
    { label: '24 Hours (Daily)', value: 1440 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Profit Management" subtitle="Control daily profit credits and commission distribution" />

      {showConfirm && (
        <ConfirmModal
          title="Trigger ROI Now?"
          message={`This will credit $${(stats?.total_daily_roi || 0).toFixed(4)} ROI to ${stats?.active_investments || 0} active investors immediately using the current interval (${schedule?.interval_minutes || 1440} min). Weekday restriction is bypassed for manual trigger.`}
          confirmLabel="Yes, Trigger ROI"
          onConfirm={triggerROI}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showSaveConfirm && (
        <ConfirmModal
          title="Save Profit Interval?"
          message={`Set profit credit interval to ${interval} minute${interval !== 1 ? 's' : ''}? ${interval === 1 ? '⚠️ 1 minute is for testing only — change to 1440 for production.' : interval < 60 ? '⚠️ Short intervals will credit profit very frequently.' : 'This will take effect on the next automatic cycle.'}`}
          confirmLabel="Save Interval"
          onConfirm={saveSchedule}
          onCancel={() => setShowSaveConfirm(false)}
        />
      )}

      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 ${msg.includes('credited') || msg.includes('set') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Active Investments</p>
          <p className="text-2xl font-bold text-white">{stats?.active_investments || 0}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Daily Profit</p>
          <p className="text-2xl font-bold text-emerald-400">${(stats?.total_daily_roi || 0).toFixed(4)}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Profit Paid</p>
          <p className="text-2xl font-bold text-blue-400">${(stats?.total_roi_paid_all_time || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Current Interval</p>
          <p className="text-2xl font-bold text-yellow-400">{schedule?.interval_minutes || 1440}min</p>
        </div>
      </div>

      {/* Schedule settings */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1">Profit Credit Interval</h3>
        <p className="text-slate-400 text-sm mb-5">Set how often profit is automatically credited to active investors. Use 1 minute for testing, 1440 minutes (24h) for production. Credits only on weekdays (Mon-Fri IST).</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {presets.map((p) => (
            <button key={p.value} onClick={() => setIntervalVal(p.value)}
              className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors border ${interval === p.value ? 'bg-orange-600/20 border-orange-500/50 text-orange-400' : 'bg-[#1a2035] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-slate-400 text-xs mb-1.5 block">Custom interval (minutes)</label>
            <input type="number" value={interval} onChange={(e) => setIntervalVal(parseInt(e.target.value) || 1440)}
              min="1" className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div className="pt-5">
            <button onClick={() => setShowSaveConfirm(true)} disabled={saving}
              className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
              {saving ? 'Saving...' : 'Save Interval'}
            </button>
          </div>
        </div>

        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400 text-xs font-semibold mb-1">How it works</p>
          <p className="text-slate-400 text-xs">
            <span className="text-white">Auto Schedule</span> — Runs automatically based on the saved interval. Only credits on weekdays (Mon-Fri IST).<br />
            <span className="text-white">1 min (Test)</span> — Credits profit every minute. Switch back to 1440 (daily) for production.
          </p>
        </div>
      </div>

      {/* Recent Profit Credits */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-white font-semibold">Recent Profit Credits</h3>
        </div>
        {!stats?.recent_credits || stats.recent_credits.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No profit credits yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Wallet ID', 'Amount', 'Description', 'Date'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_credits.map((c, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs">#{c.wallet_id}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">+${c.amount.toFixed(4)}</td>
                    <td className="py-3 px-4 text-slate-300 text-xs">{c.description}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatIST(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
