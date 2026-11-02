import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatISTDate } from '../../utils/dateFormatter'

export default function UserProfile() {
  const { user, refreshUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/auth/me')
        setProfile(data)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const u = profile || user

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your account information" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-3xl font-bold">{u?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <h3 className="text-white font-bold text-lg">{u?.name}</h3>
          <p className="text-slate-400 text-sm">{u?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">Level {u?.level || 0}</span>
            <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">Active</span>
            {u?.rank && u.rank !== 'Member' && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full">{u.rank}</span>
            )}
          </div>
          <div className="mt-4 w-full bg-[#1a2035] rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Your FXU ID</p>
            <p className="text-blue-400 text-xl font-bold tracking-wider">{u?.fxu_id}</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: u?.name },
              { label: 'Email Address', value: u?.email },
              { label: 'Mobile Number', value: u?.mobile },
              { label: 'FXU ID', value: u?.fxu_id },
              { label: 'Referral Code', value: u?.referral_code },
              { label: 'Referred By', value: u?.referred_by || 'Direct signup' },
              { label: 'Member Since', value: u?.created_at ? formatISTDate(u.created_at) : '-' },
              { label: 'Current Level', value: `Level ${u?.level || 0}` },
            ].map((f) => (
              <div key={f.label} className="bg-[#1a2035] rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">{f.label}</p>
                <p className="text-white text-sm font-medium">{f.value || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Referral Link</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm font-mono truncate">
            https://fxuniverse.live/register?ref={u?.referral_code}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`https://fxuniverse.live/register?ref=${u?.referral_code}`) }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
            Copy Link
          </button>
        </div>
      </div>
    </div>
  )
}
