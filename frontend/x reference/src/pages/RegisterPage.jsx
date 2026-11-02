import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import logoIcon from '../assets/logo-icon.png'
import logoFull from '../assets/logo-full.png'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [fxuId, setFxuId] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const refId = searchParams.get('ref') || ''

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', confirm_password: '',
    referral_id: refId, address: '',
  })
  const [referrerName, setReferrerName] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (e.target.name === 'referral_id' && e.target.value.length >= 7) {
      api.get(`/auth/referrer-info?ref=${e.target.value.toUpperCase()}`, false)
        .then((data) => setReferrerName(data.name))
        .catch(() => setReferrerName(''))
    } else if (e.target.name === 'referral_id') {
      setReferrerName('')
    }
  }

  // Auto-lookup on mount if ref param present
  useEffect(() => {
    if (refId) {
      api.get(`/auth/referrer-info?ref=${refId.toUpperCase()}`, false)
        .then((data) => setReferrerName(data.name))
        .catch(() => {})
    }
  }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form, false)
      setEmail(form.email)
      setFxuId(res.fxu_id)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { email, otp, purpose: 'registration' }, false)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    try {
      await api.post(`/auth/resend-otp?purpose=registration`, { email }, false)
      setError('')
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="min-h-screen bg-[#060912] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <img src={logoIcon} alt="FX Universe" className="h-10 w-10 object-contain" />
            <img src={logoFull} alt="FX Universe" className="h-9 object-contain" />
          </div>
          <p className="text-slate-400 text-sm">Create your trading account</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{s}</div>
              {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-blue-600' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
          )}

          {/* Step 1 — Registration form */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-5">Create Account</h2>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Mobile Number</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} required placeholder="+1 555 000 0000"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min 8 characters"
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Confirm Password</label>
                  <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required placeholder="Repeat password"
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Referral ID <span className="text-slate-600">(optional)</span></label>
                <input name="referral_id" value={form.referral_id} onChange={handleChange} placeholder="e.g. FXU1234"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 uppercase" />
                {referrerName && (
                  <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Referred by: <span className="font-semibold">{referrerName}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Address <span className="text-slate-600">(optional)</span></label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Your address"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Step 2 — OTP verification */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-lg">Verify Your Email</h2>
                <p className="text-slate-400 text-sm mt-1">We sent a 6-digit OTP to <span className="text-white">{email}</span></p>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Enter OTP</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                  placeholder="000000"
                  className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-4 text-white text-2xl font-bold text-center tracking-[0.5em] focus:outline-none focus:border-blue-500" />
                <p className="text-slate-500 text-xs mt-2 text-center">OTP expires in 10 minutes</p>
              </div>
              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={handleResend}
                className="w-full text-slate-400 hover:text-white text-sm transition-colors">
                Didn't receive it? Resend OTP
              </button>
            </form>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Account Created</h2>
                <p className="text-slate-400 text-sm mt-2">Your account is ready. Save your FXU ID to login.</p>
              </div>
              <div className="bg-[#1a2035] border border-slate-700 rounded-xl p-5">
                <p className="text-slate-400 text-xs mb-2">Your FXU ID</p>
                <p className="text-blue-400 text-3xl font-bold tracking-wider">{fxuId}</p>
                <p className="text-slate-500 text-xs mt-2">Use this ID + your password to login</p>
              </div>
              <button onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                Go to Login
              </button>
            </div>
          )}

          {step === 1 && (
            <p className="text-center text-slate-500 text-sm mt-5">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
