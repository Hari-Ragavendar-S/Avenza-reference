import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

export default function UserSecurity() {
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const requestOtp = async () => {
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: user.email })
      setStep(2)
      setMsg('OTP sent to your email')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPass !== confirmPass) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/change-password', { email: user.email, otp, new_password: newPass, confirm_password: confirmPass })
      setMsg('Password changed successfully')
      setStep(1)
      setOtp('')
      setNewPass('')
      setConfirmPass('')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Security Center" subtitle="Manage your account security" />

      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">{msg}</div>}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Change password */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Change Password</h3>
        {step === 1 ? (
          <div>
            <p className="text-slate-400 text-sm mb-4">An OTP will be sent to <span className="text-white">{user?.email}</span> to verify your identity.</p>
            <button onClick={requestOtp} disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>
          </div>
        ) : (
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">OTP Code</label>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} placeholder="000000"
                className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold text-center tracking-[0.5em] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">New Password</label>
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required placeholder="New password"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Confirm Password</label>
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required placeholder="Confirm password"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Account info */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Account Security Info</h3>
        <div className="space-y-3">
          {[
            { label: 'Email', value: user?.email, verified: true },
            { label: 'FXU ID', value: user?.fxu_id, verified: true },
            { label: 'OTP on Withdrawal', value: 'Enabled', verified: true },
            { label: 'OTP on Password Change', value: 'Enabled', verified: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.value}</p>
              </div>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                {item.verified ? 'Verified' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
