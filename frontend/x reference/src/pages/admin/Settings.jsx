import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

const tabs = ['General', 'Withdrawal', 'Levels', 'Awards', 'Maintenance']

export default function AdminSettings() {
  const [tab, setTab] = useState('General')
  const [settings, setSettings] = useState({})
  const [levels, setLevels] = useState([])
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, l, a] = await Promise.all([api.get('/admin/settings'), api.get('/admin/levels'), api.get('/admin/awards')])
        setSettings(s)
        setLevels(l.length > 0 ? l : Array.from({ length: 10 }, (_, i) => ({ level: i + 1, name: `Level ${i + 1}`, commission_pct: 0, min_business_volume: 0, min_direct_referrals: 0, min_team_size: 0, is_active: true })))
        setAwards(a)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const saveSetting = async (key, value) => {
    setSaving(true)
    try {
      await api.post(`/admin/settings?key=${key}&value=${encodeURIComponent(value)}`, {})
      setMsg('Saved successfully')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) { setMsg(err.message) }
    finally { setSaving(false) }
  }

  const saveLevel = async (level) => {
    try {
      await api.post('/admin/levels', level)
      setMsg(`Level ${level.level} saved`)
      setTimeout(() => setMsg(''), 3000)
    } catch (err) { setMsg(err.message) }
  }

  const updateLevel = (index, field, value) => {
    const updated = [...levels]
    updated[index] = { ...updated[index], [field]: field.includes('pct') || field.includes('volume') || field.includes('referrals') || field.includes('team') ? parseFloat(value) || 0 : value }
    setLevels(updated)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" subtitle="Configure platform settings" />

      {msg && <div className={`text-sm rounded-xl px-4 py-3 ${msg.includes('success') || msg.includes('saved') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>{msg}</div>}

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-orange-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'General' && (
        <div className="space-y-4">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">FXU Wallet Receiver Addresses</h3>
            <p className="text-slate-400 text-sm mb-4">All user deposits will be directed to these addresses. Set them carefully.</p>
            <div className="space-y-4">
              {[
                { key: 'usdt_receiver_address', label: 'USDT (BEP-20) Receiver Address', placeholder: '0x...' },
                { key: 'bnb_receiver_address', label: 'BNB Receiver Address', placeholder: '0x...' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-slate-400 text-xs mb-1.5 block">{f.label}</label>
                  <div className="flex gap-3">
                    <input type="text" defaultValue={settings[f.key] || ''} id={f.key} placeholder={f.placeholder}
                      className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-orange-500" />
                    <button onClick={() => saveSetting(f.key, document.getElementById(f.key).value)} disabled={saving}
                      className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Platform Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'site_name', label: 'Site Name', default: 'FXUniverse Protocol' },
                { key: 'support_email', label: 'Support Email', default: 'support@fxuniverse.live' },
                { key: 'min_deposit', label: 'Minimum Deposit ($)', default: '10' },
                { key: 'min_withdrawal', label: 'Minimum Withdrawal ($)', default: '10' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-slate-400 text-xs mb-1.5 block">{f.label}</label>
                  <div className="flex gap-2">
                    <input type="text" defaultValue={settings[f.key] || f.default} id={`setting_${f.key}`}
                      className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                    <button onClick={() => saveSetting(f.key, document.getElementById(`setting_${f.key}`).value)}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-xl transition-colors">Save</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Withdrawal' && (
        <div className="space-y-4">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-1">Withdrawal Window</h3>
            <p className="text-slate-400 text-sm mb-5">Set the days and times when users can submit withdrawal requests (IST timezone).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'withdrawal_window_start', label: 'Window Start', placeholder: 'Friday 00:01', default: settings.withdrawal_window_start || 'Friday 00:01' },
                { key: 'withdrawal_window_end', label: 'Window End', placeholder: 'Sunday 23:59', default: settings.withdrawal_window_end || 'Sunday 23:59' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-slate-400 text-xs mb-1.5 block">{f.label} (IST)</label>
                  <div className="flex gap-2">
                    <input type="text" defaultValue={f.default} id={f.key} placeholder={f.placeholder}
                      className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                    <button onClick={() => saveSetting(f.key, document.getElementById(f.key).value)} disabled={saving}
                      className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm">Save</button>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">Format: "DayName HH:MM" e.g. "Friday 00:01"</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-400 text-xs">Current window: <span className="font-semibold">{settings.withdrawal_window_start || 'Friday 00:01'}</span> to <span className="font-semibold">{settings.withdrawal_window_end || 'Sunday 23:59'}</span> (IST)</p>
            </div>
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-1">Withdrawal Fee</h3>
            <p className="text-slate-400 text-sm mb-4">Percentage fee deducted from all withdrawal requests.</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-slate-400 text-xs mb-1.5 block">Fee Percentage (%)</label>
                <input type="number" defaultValue={settings.withdrawal_fee_percentage || '5.0'} id="withdrawal_fee_percentage" step="0.1" min="0" max="100"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <button onClick={() => saveSetting('withdrawal_fee_percentage', document.getElementById('withdrawal_fee_percentage').value)} disabled={saving}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm">Save</button>
            </div>
          </div>

          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-1">Platform USDT Address</h3>
            <p className="text-slate-400 text-sm mb-4">The wallet address where users send USDT deposits. Must be a BEP-20 address.</p>
            <div className="flex gap-3">
              <input type="text" defaultValue={settings.platform_usdt_address || ''} id="platform_usdt_address" placeholder="0x..."
                className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-orange-500" />
              <button onClick={() => saveSetting('platform_usdt_address', document.getElementById('platform_usdt_address').value)} disabled={saving}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm">Save</button>
            </div>
            <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400 text-xs">⚠️ This address receives all user USDT deposits. Double-check before saving.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'Levels' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-white font-semibold">Level Configuration (10 Levels)</h3>
            <p className="text-slate-400 text-xs mt-1">Set commission % and requirements for each level. Set min values to 0 to disable that condition.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Level', 'Name', 'Commission %', 'Min BV ($)', 'Min Directs', 'Min Team', 'Active', 'Save'].map((h) => (
                    <th key={h} className="text-left text-slate-400 font-medium py-3 px-3 whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {levels.map((lv, i) => (
                  <tr key={lv.level} className="border-b border-slate-800/50">
                    <td className="py-2 px-3"><span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">L{lv.level}</span></td>
                    <td className="py-2 px-3">
                      <input value={lv.name || ''} onChange={(e) => updateLevel(i, 'name', e.target.value)}
                        className="w-24 bg-[#1a2035] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" value={lv.commission_pct} onChange={(e) => updateLevel(i, 'commission_pct', e.target.value)} step="0.1"
                        className="w-16 bg-[#1a2035] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" value={lv.min_business_volume} onChange={(e) => updateLevel(i, 'min_business_volume', e.target.value)}
                        className="w-20 bg-[#1a2035] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" value={lv.min_direct_referrals} onChange={(e) => updateLevel(i, 'min_direct_referrals', e.target.value)}
                        className="w-16 bg-[#1a2035] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" value={lv.min_team_size} onChange={(e) => updateLevel(i, 'min_team_size', e.target.value)}
                        className="w-16 bg-[#1a2035] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="py-2 px-3">
                      <button onClick={() => updateLevel(i, 'is_active', !lv.is_active)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${lv.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${lv.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <button onClick={() => saveLevel(lv)}
                        className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Awards' && (
        <div className="space-y-4">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Create Award</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Award Name</label>
                <input type="text" id="award_name" placeholder="e.g. First $1000 Team Volume"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Condition Type</label>
                <select id="award_condition_type" className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="business_volume">Business Volume ($)</option>
                  <option value="total_deposited">Total Deposited ($)</option>
                  <option value="team_size">Team Size (people)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Condition Value</label>
                <input type="number" id="award_condition_value" placeholder="e.g. 1000"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Bonus Amount ($)</label>
                <input type="number" id="award_bonus" placeholder="e.g. 50"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
            </div>
            <button onClick={async () => {
              const name = document.getElementById('award_name').value
              const ct = document.getElementById('award_condition_type').value
              const cv = document.getElementById('award_condition_value').value
              const bonus = document.getElementById('award_bonus').value
              if (!name || !cv || !bonus) return
              try {
                await api.post(`/admin/awards?name=${encodeURIComponent(name)}&condition_type=${ct}&condition_value=${cv}&bonus_amount=${bonus}`, {})
                setMsg('Award created')
                const a = await api.get('/admin/awards')
                setAwards(a)
              } catch (err) { setMsg(err.message) }
            }} className="mt-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
              Create Award
            </button>
          </div>

          {awards.length > 0 && (
            <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800"><h3 className="text-white font-semibold">Existing Awards</h3></div>
              <div className="divide-y divide-slate-800/50">
                {awards.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-white font-medium text-sm">{a.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{a.condition_type} ≥ {a.condition_value} → ${a.bonus_amount} bonus</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${a.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Maintenance' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Maintenance Mode</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#1a2035] rounded-xl">
              <div>
                <p className="text-white font-medium">Enable Maintenance Mode</p>
                <p className="text-slate-400 text-xs mt-0.5">Users will see a maintenance page</p>
              </div>
              <button onClick={() => saveSetting('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode === 'true' ? 'bg-red-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.maintenance_mode === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Maintenance Message</label>
              <textarea rows={3} id="maintenance_msg" defaultValue={settings.maintenance_message || 'We are performing scheduled maintenance. Back shortly.'}
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 resize-none" />
              <button onClick={() => saveSetting('maintenance_message', document.getElementById('maintenance_msg').value)}
                className="mt-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
