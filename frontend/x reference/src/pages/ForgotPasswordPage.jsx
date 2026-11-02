import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import logoIcon from '../assets/logo-icon.png'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email }, false)
      setStep(2)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        email, otp, new_password: newPassword, confirm_password: confirmPassword
      }, false)
      setStep(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoIcon} alt="FX Universe" className="h-12 w-12 object-contain mx-auto mb-3" />
          <p className="text-slate-400 text-sm">FXUniverse Protocol</p>
        </div>

        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <h2 className="text-white font-semibold text-lg">Reset Password</h2>
              <p className="text-slate-400 text-sm">Enter your email address and we'll send you an OTP.</p>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <h2 className="text-white font-semibold text-lg">Enter New Password</h2>
              <p className="text-slate-400 text-sm">OTP sent to <span className="text-white">{email}</span></p>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">OTP Code</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                  placeholder="000000"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold text-center tracking-[0.5em] focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                  placeholder="New password"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  placeholder="Confirm new password"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-lg">Password Updated</h2>
              <p className="text-slate-400 text-sm">Your password has been changed successfully.</p>
              <button onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                Back to Login
              </button>
            </div>
          )}

          {step < 3 && (
            <button onClick={() => navigate('/login')}
              className="w-full text-slate-500 hover:text-slate-300 text-sm mt-4 transition-colors">
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
