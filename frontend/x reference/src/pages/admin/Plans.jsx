import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import Badge from '../../components/Badge'
import { formatISTDate } from '../../utils/dateFormatter'
function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1629] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [msg, setMsg] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState({ name: '', roi_monthly: '', lock_months: '', min_amount: '', description: '' })
  const [editForm, setEditForm] = useState({ name: '', roi_monthly: '', lock_months: '', min_amount: '', description: '' })

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        api.get('/investments/admin/all-plans'),
        api.get('/investments/admin/subscribers'),
      ])
      setPlans(p)
      setSubscribers(s)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = () => {
    if (!form.name || !form.roi_monthly || !form.lock_months) return
    setConfirm({
      title: 'Create Investment Package?',
      message: `Create "${form.name}" — ${form.roi_monthly}% daily profit, ${form.lock_months} days lock-in?`,
      action: async () => {
        setConfirm(null)
        try {
          await api.post('/investments/admin/plans', {
            name: form.name,
            roi_monthly: parseFloat(form.roi_monthly),
            lock_months: parseInt(form.lock_months),
            min_amount: parseFloat(form.min_amount) || 0,
            description: form.description,
          })
          setMsg('✅ Package created')
          setShowAdd(false)
          setForm({ name: '', roi_monthly: '', lock_months: '', min_amount: '', description: '' })
          load()
        } catch (err) { setMsg(err.message) }
      }
    })
  }

  const toggleSpecialOffer = async (planId) => {
    try {
      await api.put(`/investments/admin/plans/${planId}/special-offer`, {})
      setMsg('Special offer updated')
      load()
    } catch (err) { setMsg(err.message) }
  }

  const toggleActive = (plan) => {
    setConfirm({
      title: plan.is_active ? 'Disable Package?' : 'Enable Package?',
      message: `${plan.is_active ? 'Disable' : 'Enable'} the "${plan.name}" package?`,
      danger: plan.is_active,
      confirmLabel: plan.is_active ? 'Disable' : 'Enable',
      action: async () => {
        setConfirm(null)
        try {
          await api.delete(`/investments/admin/plans/${plan.id}`)
          load()
        } catch (err) { setMsg(err.message) }
      }
    })
  }

  const startEdit = (plan, e) => {
    e.stopPropagation()
    setEditingPlan(plan.id)
    setEditForm({
      name: plan.name,
      roi_monthly: String(plan.roi_monthly),
      lock_months: String(plan.lock_months),
      min_amount: String(plan.min_amount || ''),
      description: plan.description || '',
    })
  }

  const handleEdit = (planId) => {
    setConfirm({
      title: 'Save Changes?',
      message: `Update "${editForm.name}" — ${editForm.roi_monthly}% daily profit, ${editForm.lock_months} days lock-in?`,
      action: async () => {
        setConfirm(null)
        try {
          await api.put(`/investments/admin/plans/${planId}`, {
            name: editForm.name,
            roi_monthly: parseFloat(editForm.roi_monthly),
            lock_months: parseInt(editForm.lock_months),
            min_amount: parseFloat(editForm.min_amount) || 0,
            description: editForm.description,
          })
          setMsg('✅ Package updated')
          setEditingPlan(null)
          load()
        } catch (err) { setMsg(err.message) }
      }
    })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  const selectedSubs = subscribers.find((s) => s.plan_id === selectedPlan?.id)

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Packages" subtitle="Manage packages and view subscribers"
        action={<button onClick={() => setShowAdd(!showAdd)} className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">Add Package</button>} />

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} onConfirm={confirm.action} />}

      {msg && <div className={`text-sm rounded-xl px-4 py-3 ${msg.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>{msg}</div>}

      {showAdd && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Create New Package</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Package Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Gold Package"
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Package Amount ($)</label>
              <input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                placeholder="e.g. 500"
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Daily Profit (%)</label>
              <input type="number" value={form.roi_monthly} onChange={(e) => setForm({ ...form, roi_monthly: e.target.value })}
                placeholder="e.g. 1"
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Lock-in (Days)</label>
              <input type="number" value={form.lock_months} onChange={(e) => setForm({ ...form, lock_months: e.target.value })}
                placeholder="e.g. 200"
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-400 text-xs mb-1.5 block">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Package description..."
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 resize-none" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={!form.name || !form.roi_monthly || !form.lock_months || !form.min_amount}
            className="mt-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            Create Package
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id}
              onClick={() => { if (editingPlan !== plan.id) setSelectedPlan(plan) }}
              className={`bg-[#0f1629] border rounded-2xl p-5 cursor-pointer transition-all hover:border-slate-700 ${selectedPlan?.id === plan.id && editingPlan !== plan.id ? 'border-orange-500/50 bg-orange-500/5' : plan.is_special_offer ? 'border-yellow-500/40' : 'border-slate-800'}`}>

              {editingPlan === plan.id ? (
                <div onClick={(e) => e.stopPropagation()} className="space-y-3">
                  <p className="text-white text-sm font-semibold mb-2">Edit Package</p>
                  {[
                    { key: 'name', label: 'Name', type: 'text' },
                    { key: 'min_amount', label: 'Amount ($)', type: 'number' },
            { key: 'roi_monthly', label: 'Daily Profit %', type: 'number' },
                    { key: 'lock_months', label: 'Lock-in (Days)', type: 'number' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-slate-500 text-xs mb-1 block">{f.label}</label>
                      <input type={f.type} value={editForm[f.key]}
                        onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                        className="w-full bg-[#1a2035] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-slate-500 text-xs mb-1 block">Description</label>
                    <textarea rows={2} value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-[#1a2035] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(plan.id)}
                      className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-xs py-2 rounded-lg transition-colors">Save</button>
                    <button onClick={() => setEditingPlan(null)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-lg transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold">{plan.name}</h3>
                        {plan.is_special_offer && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">Special</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{plan.description}</p>
                    </div>
                    <Badge status={plan.is_active ? 'Active' : 'Inactive'} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div><p className="text-slate-500">Amount</p><p className="text-white font-bold">${(plan.min_amount || 0).toLocaleString()}</p></div>
                    <div><p className="text-slate-500">Daily Profit</p><p className="text-emerald-400 font-bold">{plan.roi_monthly}%/day</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => startEdit(plan, e)}
                      className="flex-1 text-xs py-1.5 rounded-lg transition-colors bg-slate-800 text-slate-300 hover:bg-slate-700">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); toggleSpecialOffer(plan.id) }}
                      className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${plan.is_special_offer ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                      {plan.is_special_offer ? 'Remove Special' : 'Set Special'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleActive(plan) }}
                      className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${plan.is_active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
                      {plan.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          {selectedPlan && selectedSubs ? (
            <>
              <div className="p-5 border-b border-slate-800">
                <h3 className="text-white font-semibold">{selectedPlan.name} — Subscribers</h3>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-slate-400">Total: <span className="text-white font-semibold">{selectedSubs.total_subscribers}</span></span>
                  <span className="text-slate-400">Active: <span className="text-emerald-400 font-semibold">{selectedSubs.active_subscribers}</span></span>
                  <span className="text-slate-400">Invested: <span className="text-blue-400 font-semibold">${(selectedSubs.total_invested || 0).toLocaleString()}</span></span>
                </div>
              </div>
              {selectedSubs.subscribers.length === 0 ? (
                <div className="p-10 text-center text-slate-500">No subscribers yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {['User', 'FXU ID', 'Amount', 'Daily Profit', 'Earned', 'End Date', 'Status'].map((h) => (
                          <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubs.subscribers.map((s, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-4 text-white font-medium">{s.user_name}</td>
                          <td className="py-3 px-4 text-blue-400 font-mono text-xs">{s.fxu_id}</td>
                          <td className="py-3 px-4 text-white">${s.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-emerald-400">+${s.daily_roi.toFixed(4)}</td>
                          <td className="py-3 px-4 text-emerald-400 font-semibold">+${s.total_roi_earned.toFixed(2)}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{formatISTDate(s.end_date)}</td>
                          <td className="py-3 px-4"><Badge status={s.status === 'active' ? 'Active' : 'Completed'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p className="text-sm">Select a package to view subscribers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
