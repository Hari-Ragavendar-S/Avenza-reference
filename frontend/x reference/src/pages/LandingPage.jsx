import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoFull from '../assets/logo-full.png'
import logoIcon from '../assets/logo-icon.png'
import { marketPairs, topCoins } from '../data/mockData'
import { api } from '../api/client'

// Animated cursor glow that follows mouse
function CursorGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const move = (e) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 w-[400px] h-[400px] rounded-full z-0 transition-transform duration-100 ease-out"
      style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
    />
  )
}

// Animated counter
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const step = target / 60
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(start))
        }, 16)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

const planStyles = [
  { border: 'border-slate-600/40', glow: '', badge: 'bg-slate-500/10 text-slate-300 border-slate-600/50', accent: 'text-slate-200', btn: 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white' },
  { border: 'border-blue-500/40', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.10)]', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', accent: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
  { border: 'border-emerald-500/40', glow: '', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', accent: 'text-emerald-400', btn: 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white' },
  { border: 'border-yellow-500/50', glow: 'shadow-[0_0_40px_rgba(234,179,8,0.12)]', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40', accent: 'text-yellow-400', btn: 'bg-yellow-500 hover:bg-yellow-400 border-yellow-500 text-black hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]', popular: true },
  { border: 'border-purple-500/40', glow: '', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', accent: 'text-purple-400', btn: 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white' },
  { border: 'border-cyan-500/40', glow: 'shadow-[0_0_40px_rgba(6,182,212,0.10)]', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', accent: 'text-cyan-400', btn: 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white' },
  { border: 'border-orange-500/40', glow: '', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', accent: 'text-orange-400', btn: 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white' },
  { border: 'border-pink-500/40', glow: 'shadow-[0_0_40px_rgba(236,72,153,0.10)]', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30', accent: 'text-pink-400', btn: 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white' },
]

const features = [
  { title: 'AI Trade Bot', desc: 'Machine learning algorithms scan 50+ indicators across all major pairs, executing trades with sub-millisecond precision around the clock.', icon: BotIcon },
  { title: 'Real-Time Markets', desc: 'Institutional-grade live feeds with candlestick charts, order book depth, and spread analytics for every major currency pair.', icon: ChartIcon },
  { title: 'FXU Wallet', desc: 'Non-custodial multi-chain wallet supporting USDT and BNB on BNB Smart Chain with instant settlement and zero hidden fees.', icon: WalletIcon },
  { title: 'Fixed Investment Plans', desc: 'Structured daily-return plans with transparent lock-in periods. Profit credited to your wallet every 24 hours automatically.', icon: TrendIcon },
  { title: 'Referral Network', desc: 'Earn level income from your network across 15 levels. Unlock more levels as your team business volume grows.', icon: NetworkIcon },
  { title: 'Bank-Grade Security', desc: '256-bit SSL, two-factor authentication, biometric login, KYC verification, and cold storage for all platform assets.', icon: ShieldIcon },
]

function BotIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>
}
function ChartIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
}
function WalletIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
}
function TrendIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
}
function NetworkIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function ShieldIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [plans, setPlans] = useState([])
  const [cryptoData, setCryptoData] = useState([])
  const [forexData, setForexData] = useState([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)

    // Fetch live plans
    api.get('/investments/plans', false).then(setPlans).catch(() => {})

    // Fetch real-time market data
    const fetchMarket = () => {
      api.get('/market/crypto', false).then(setCryptoData).catch(() => {})
      api.get('/market/forex', false).then(setForexData).catch(() => {})
    }
    fetchMarket()
    const marketTimer = setInterval(fetchMarket, 30000) // refresh every 30s

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearInterval(marketTimer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#060912] text-white overflow-x-hidden">
      <CursorGlow />

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#060912]/95 backdrop-blur-xl border-b border-slate-800/60 shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="FX Universe" className="h-9 w-9 object-contain" />
            <img src={logoFull} alt="FX Universe" className="h-8 object-contain hidden sm:block" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            {['Features', 'Plans', 'Markets', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="hover:text-white transition-colors duration-200 relative group">
                {item}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-4 py-2">
              Sign In
            </button>
            <button onClick={() => navigate('/login')}
              className="relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 group">
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        {/* Ambient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-blue-600/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 bg-blue-500/8 border border-blue-500/15 rounded-full px-5 py-2 text-blue-400 text-sm mb-10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Live Trading Platform — Markets Open 24/5
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-7">
              <span className="text-white">The Future of</span>
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                  Forex Trading
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-blue-400/0 via-blue-400/60 to-purple-400/0" />
              </span>
              <br />
              <span className="text-white">is Here</span>
            </h1>

            <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Institutional-grade AI trading infrastructure. Real-time market intelligence. Fixed-return investment plans. Built for traders who demand more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <button onClick={() => navigate('/register')}
                className="group relative overflow-hidden bg-blue-600 text-white font-semibold px-9 py-4 rounded-xl transition-all duration-300 text-base hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:-translate-y-0.5">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Trading Free
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <button onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}
                className="group bg-white/4 hover:bg-white/8 border border-white/10 hover:border-white/20 text-white font-semibold px-9 py-4 rounded-xl transition-all duration-300 text-base backdrop-blur-sm hover:-translate-y-0.5">
                <span className="flex items-center justify-center gap-2">
                  View Investment Plans
                  <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </button>
            </div>

            {/* Live ticker */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              {marketPairs.slice(0, 6).map((p) => (
                <div key={p.id}
                  className="bg-white/3 border border-white/6 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/6 hover:border-white/12 transition-all duration-200 group">
                  <p className="text-slate-500 text-xs mb-1.5 group-hover:text-slate-400 transition-colors">{p.pair}</p>
                  <p className="text-white font-mono font-semibold text-sm">{p.price}</p>
                  <p className={`text-xs font-medium mt-1 ${p.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.changePct >= 0 ? '+' : ''}{p.changePct}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-slate-500 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 py-16 px-4 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { target: 4821, suffix: '+', label: 'Active Traders' },
              { target: 2841500, suffix: '', label: 'Total Volume (USD)', prefix: '$' },
              { target: 184210, suffix: '+', label: 'Trades Executed' },
              { target: 99, suffix: '.9%', label: 'Platform Uptime' },
            ].map((s) => (
              <div key={s.label} className="group">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2 tabular-nums">
                  {s.prefix || ''}<Counter target={s.target} suffix={s.suffix} />
                </p>
                <p className="text-slate-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">Platform Capabilities</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
              Built for Serious Traders
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Every tool you need to trade with confidence, from AI automation to institutional-grade security.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title}
                className="group relative bg-white/2 hover:bg-white/4 border border-white/6 hover:border-white/12 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/4 group-hover:to-purple-600/4 transition-all duration-500 rounded-2xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-5 group-hover:bg-blue-500/15 group-hover:border-blue-500/30 transition-all duration-300">
                    <f.icon />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Plans */}
      <section id="plans" className="relative z-10 py-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/4 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">Investment Plans</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
              Fixed Daily Returns. Zero Guesswork.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Choose a structured plan and earn daily profit credited straight to your wallet every 24 hours.
            </p>
            {/* Animated highlight bar */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-blue-500" />
              <span className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Profits credited automatically every 24 hours
              </span>
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-blue-500" />
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((plan, i) => {
                const style = planStyles[i % planStyles.length]
                const dailyEarning = ((plan.min_amount * plan.roi_monthly) / 100).toFixed(2)
                const totalEarning = (parseFloat(dailyEarning) * plan.lock_months).toFixed(2)
                return (
                  <div
                    key={plan.id}
                    style={{ animationDelay: `${i * 80}ms` }}
                    className={`group relative bg-white/2 border ${style.border} ${style.glow} rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:bg-white/4 overflow-hidden
                      ${style.popular ? 'ring-1 ring-yellow-500/30 scale-[1.03]' : ''}`}
                  >
                    {/* Animated shimmer on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)' }} />

                    {style.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-lg animate-pulse">
                        Most Popular
                      </div>
                    )}
                    {plan.is_special_offer && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-lg">
                        Special Offer
                      </div>
                    )}

                    {/* Badge */}
                    <div className={`self-start text-xs font-semibold px-3 py-1 rounded-full border mb-5 ${style.badge}`}>
                      {plan.name}
                    </div>

                    {/* Amount */}
                    <div className="mb-5">
                      <p className="text-slate-500 text-xs mb-1">Package Amount</p>
                      <p className={`text-4xl font-bold tracking-tight ${style.accent}`}>
                        ${(plan.min_amount || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Daily profit highlight */}
                    <div className={`rounded-xl p-3 mb-5 border ${style.border} bg-white/3`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs">Daily Profit</span>
                        <span className={`text-lg font-bold ${style.accent}`}>{plan.roi_monthly}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">You earn daily</span>
                        <span className="text-emerald-400 font-bold text-sm">+${dailyEarning}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Profit duration</span>
                        <span className="text-slate-300 font-medium">{plan.lock_months} days</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Est. total profit</span>
                        <span className="text-emerald-400 font-semibold">+${totalEarning}</span>
                      </div>
                    </div>

                    {/* Progress bar animation */}
                    <div className="mb-5">
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-1000 group-hover:w-full`}
                          style={{
                            width: `${Math.min(100, (plan.roi_monthly / 3) * 100)}%`,
                            background: `linear-gradient(90deg, ${style.accent.includes('yellow') ? '#eab308' : style.accent.includes('blue') ? '#3b82f6' : style.accent.includes('emerald') ? '#10b981' : style.accent.includes('purple') ? '#a855f7' : style.accent.includes('cyan') ? '#06b6d4' : style.accent.includes('orange') ? '#f97316' : style.accent.includes('pink') ? '#ec4899' : '#94a3b8'}, transparent)`
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/register')}
                      className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 text-sm border ${style.btn} group-hover:-translate-y-0.5`}
                    >
                      Get Started →
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom note */}
          <div className="mt-12 text-center">
            <p className="text-slate-600 text-sm">
              Secure blockchain-based deposits · 100% safe transactions
            </p>
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="relative z-10 py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">Live Markets</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
              Real-Time Market Data
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Institutional-grade live feeds across all major forex pairs and digital assets.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Forex */}
            <div className="bg-white/2 border border-white/6 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="text-white font-semibold">Forex Pairs</h3>
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="divide-y divide-white/4">
                {forexData.length > 0
                  ? forexData.slice(0, 6).map((p) => (
                    <div key={p.pair} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/3 transition-colors">
                      <div>
                        <p className="text-white font-semibold text-sm">{p.pair}</p>
                        <p className="text-slate-600 text-xs mt-0.5">Forex</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono text-sm">{p.price.toFixed(4)}</p>
                        <p className="text-emerald-400 text-xs font-semibold mt-0.5">Live</p>
                      </div>
                    </div>
                  ))
                  : marketPairs.slice(0, 6).map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/3 transition-colors">
                      <div>
                        <p className="text-white font-semibold text-sm">{p.pair}</p>
                        <p className="text-slate-600 text-xs mt-0.5">Vol: {p.volume}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono text-sm">{p.price}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${p.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.changePct >= 0 ? '+' : ''}{p.changePct}%
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Crypto */}
            <div className="bg-white/2 border border-white/6 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="text-white font-semibold">Digital Assets</h3>
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="divide-y divide-white/4">
                {cryptoData.length > 0
                  ? cryptoData.map((c) => {
                    const name = c.symbol.replace('USDT', '')
                    return (
                      <div key={c.symbol} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/3 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{name}</p>
                            <p className="text-slate-600 text-xs">{c.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-mono text-sm">${c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className={`text-xs font-semibold mt-0.5 ${c.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    )
                  })
                  : topCoins.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                          {c.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{c.name}</p>
                          <p className="text-slate-600 text-xs">{c.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono text-sm">${c.price.toLocaleString()}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${c.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {c.change >= 0 ? '+' : ''}{c.change}%
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="relative z-10 py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/15 rounded-3xl p-14 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-500/8 rounded-full blur-[60px]" />
            </div>
            <div className="relative z-10">
              <img src={logoIcon} alt="FX Universe" className="h-14 w-14 object-contain mx-auto mb-7" />
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
                Start Trading Today
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join over 4,800 traders using FX Universe to grow their capital with AI-powered forex trading and structured investment plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/login')}
                  className="group relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 text-base hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:-translate-y-0.5">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Create Free Account
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                </button>
                <button onClick={() => navigate('/login')}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 text-base hover:-translate-y-0.5">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="FX Universe" className="h-8 w-8 object-contain" />
              <img src={logoFull} alt="FX Universe" className="h-7 object-contain hidden sm:block" />
            </div>
            <div className="flex gap-8 text-slate-500 text-sm">
              {['Privacy Policy', 'Terms of Service', 'Support', 'Contact'].map((l) => (
                <a key={l} href="#" className="hover:text-white transition-colors duration-200">{l}</a>
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2025 FX Universe. All rights reserved.</p>
            <p className="text-slate-700 text-xs max-w-md text-center sm:text-right">
              Trading forex involves significant risk. Past performance is not indicative of future results. Only invest what you can afford to lose.
            </p>
          </div>

          {/* Privacy & Terms inline */}
          <div className="mt-8 border-t border-white/5 pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-600 leading-relaxed">
            <div>
              <p className="text-slate-400 font-semibold mb-2 text-sm">Privacy Policy</p>
              <p>FX Universe is committed to protecting your personal information. We collect only the data necessary to operate our platform — including your name, email, and wallet address. We do not sell, rent, or share your personal data with any third parties. All data is encrypted using 256-bit SSL and stored on secure servers. You may request deletion of your account and data at any time by contacting support.</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold mb-2 text-sm">Terms of Service</p>
              <p>By using FX Universe, you agree to use the platform lawfully and accept that all investments carry risk. Returns shown are based on current plan configurations and may vary. Withdrawals are subject to the platform's withdrawal window. FX Universe reserves the right to suspend accounts found engaging in fraudulent activity. All transactions are final and processed on the Binance Smart Chain blockchain.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
