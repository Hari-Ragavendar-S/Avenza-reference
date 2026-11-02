import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

function TreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0
  const colors = ['border-blue-500/40', 'border-purple-500/40', 'border-emerald-500/40', 'border-yellow-500/40', 'border-cyan-500/40']
  const borderColor = colors[depth % colors.length]
  return (
    <div className={`ml-${depth > 0 ? '6' : '0'}`}>
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${borderColor} bg-[#1a2035] mb-2 hover:bg-[#1e2540] transition-colors`}>
        {hasChildren && (
          <button onClick={() => setExpanded(!expanded)} className="w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center flex-shrink-0 transition-colors">
            <svg className={`w-3 h-3 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-5 h-5 flex-shrink-0" />}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
          {node.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white text-sm font-medium">{node.name}</p>
            <span className="text-blue-400 font-mono text-xs">{node.fxu_id}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span>Invested: <span className="text-emerald-400">${(node.total_invested || 0).toLocaleString()}</span></span>
            <span>Depth: L{node.depth || depth + 1}</span>
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="ml-6 border-l border-slate-700/50 pl-3">
          {node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

export default function UserReferral() {
  const [data, setData] = useState(null)
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const load = async () => {
      try {
        const [team, comms] = await Promise.all([api.get('/referral/my-team'), api.get('/referral/commissions')])
        setData(team)
        setCommissions(comms)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const totalCommission = commissions.reduce((s, c) => s + c.amount, 0)
  const directComm = commissions.filter((c) => c.level === 0).reduce((s, c) => s + c.amount, 0)
  const levelComm = commissions.filter((c) => c.level > 0).reduce((s, c) => s + c.amount, 0)
  const unlockedLevels = data?.unlocked_levels || 0
  const directReferrals = data?.direct_referrals || 0
  const levelStructure = data?.level_structure || []

  // Level unlock: BOTH conditions required
  // 1. Each direct referral = 1 potential level
  // 2. Each $100 direct business volume = 1 potential level
  // Final unlocked = min(direct_referrals, floor(volume / 100)), max 15
  const directBusinessVolume = data?.direct_business_volume || 0
  const unlockedByVolume = Math.floor(directBusinessVolume / 100)
  const unlockedLevelCount = Math.min(directReferrals, unlockedByVolume, 15)

  const fixedLevelStructure = levelStructure
    .filter((lv) => lv.level <= 15)
    .map((lv) => ({
      ...lv,
      is_unlocked: lv.level <= unlockedLevelCount
    }))

  return (
    <div className="space-y-6">
      <PageHeader title="My Referral" subtitle="Team structure and commission earnings" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Direct Referrals</p>
          <p className="text-2xl font-bold text-white">{directReferrals}</p>
          <p className="text-slate-500 text-xs mt-1">${directReferrals * 50} est. volume</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Team</p>
          <p className="text-2xl font-bold text-emerald-400">{data?.total_team_size || 0}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Business Volume</p>
          <p className="text-2xl font-bold text-white">${(data?.business_volume || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-blue-400">${totalCommission.toFixed(2)}</p>
        </div>
      </div>

      {/* Unlocked Levels Banner */}
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-white font-semibold">Your Referral Link</h3>
              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full">
                {unlockedLevelCount} / 15 Levels Unlocked
              </span>
            </div>
            <p className="text-slate-400 text-sm">Each level needs <span className="text-white font-semibold">1 direct referral</span> + <span className="text-white font-semibold">$100 business volume</span> per level.</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">Direct Business Volume</p>
            <p className="text-emerald-400 font-bold text-xl">${directBusinessVolume.toLocaleString()}</p>
            <p className="text-slate-500 text-xs">$100 needed per level</p>
          </div>
        </div>

        {/* Level unlock — two conditions */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Direct referrals</span>
              <span>{directReferrals} / 15</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all" style={{ width: `${Math.min(100, (directReferrals / 15) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Business volume</span>
              <span>${directBusinessVolume.toFixed(0)} / $1,500</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{ width: `${Math.min(100, (directBusinessVolume / 1500) * 100)}%` }} />
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-xs mb-4">
          Levels unlocked: <span className="text-blue-400 font-semibold">{unlockedLevelCount}</span> — limited by {directReferrals <= unlockedByVolume ? `direct referrals (${directReferrals})` : `business volume ($${directBusinessVolume.toFixed(0)})`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-[#0a0e1a] border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm font-mono truncate">
            {data?.referral_link || ''}
          </div>
          <button onClick={() => copy(data?.referral_link || '')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Join FX Universe and start earning! Use my referral link: ' + (data?.referral_link || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['overview', 'levels', 'tree', 'commissions'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-slate-800 text-slate-400 hover:text-white'}`}>
            {t === 'tree' ? 'Team Tree' : t === 'commissions' ? 'History' : t === 'levels' ? 'Level System' : 'Overview'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Earnings Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Level Income (L1-L15)', value: levelComm, color: 'text-blue-400' },
                { label: 'Total Earned', value: totalCommission, color: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-400 text-sm">{s.label}</span>
                  <span className={`font-bold ${s.color}`}>${s.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">How Levels Work</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-[#1a2035] rounded-xl">
                <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-400 text-xs font-bold">1</span>
                </div>
                <p className="text-slate-300">Each level requires <span className="text-emerald-400 font-semibold">1 direct referral</span> AND <span className="text-emerald-400 font-semibold">$100 business volume</span></p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#1a2035] rounded-xl">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-bold">2</span>
                </div>
                <p className="text-slate-300">Example: 2 referrals × $50 = $100 vol → <span className="text-blue-400 font-semibold">1 level</span> · 4 referrals × $50 = $200 vol → <span className="text-blue-400 font-semibold">2 levels</span></p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#1a2035] rounded-xl">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-xs font-bold">3</span>
                </div>
                <p className="text-slate-300">Level income is credited Monday–Friday only (IST timezone)</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#1a2035] rounded-xl">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-xs font-bold">4</span>
                </div>
                <p className="text-slate-300">Reach <span className="text-purple-400 font-semibold">$1,500</span> direct business volume to unlock all 15 levels</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 20-Level System */}
      {tab === 'levels' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">15-Level Commission System</h3>
                <p className="text-slate-400 text-xs mt-1">Need 1 direct referral + $100 volume per level · {unlockedLevelCount} of 15 unlocked</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Referrals / Volume</p>
                <p className="text-blue-400 font-bold">{directReferrals} refs · ${directBusinessVolume.toFixed(0)}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fixedLevelStructure.map((lv) => (
                <div key={lv.level}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${lv.is_unlocked ? 'bg-[#1a2035] border-blue-500/30' : 'bg-[#0a0e1a] border-slate-800/50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${lv.is_unlocked ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                      L{lv.level}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${lv.is_unlocked ? 'text-white' : 'text-slate-600'}`}>Level {lv.level}</p>
                      <p className={`text-xs ${lv.is_unlocked ? 'text-slate-400' : 'text-slate-700'}`}>
                        {lv.is_unlocked
                          ? 'Unlocked'
                          : (() => {
                              const needRefs = lv.level - directReferrals
                              const needVol = lv.level * 100 - directBusinessVolume
                              if (needRefs > 0 && needVol > 0)
                                return `Need ${needRefs} ref${needRefs > 1 ? 's' : ''} + $${needVol.toFixed(0)} vol`
                              if (needRefs > 0)
                                return `Need ${needRefs} more direct referral${needRefs > 1 ? 's' : ''}`
                              return `Need $${needVol.toFixed(0)} more volume`
                            })()
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${lv.is_unlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {lv.commission_pct}%
                    </span>
                    {lv.is_unlocked ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>Unlocked — earning commissions</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Locked — refer more to unlock</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Tree */}
      {tab === 'tree' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Team Hierarchy (15 Levels)</h3>
            <span className="text-slate-400 text-xs">Click arrows to expand/collapse</span>
          </div>
          {!data?.downline_tree || data.downline_tree.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <p>No team members yet.</p>
              <p className="text-xs mt-1">Share your referral link to start building your team.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
              {data.downline_tree.map((node) => <TreeNode key={node.id} node={node} depth={0} />)}
            </div>
          )}
        </div>
      )}

      {/* Commission History */}
      {tab === 'commissions' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800"><h3 className="text-white font-semibold">Commission History</h3></div>
          {commissions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No commissions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Type', 'Level', 'Amount', 'Rate', 'Date'].map((h) => (
                      <th key={h} className="text-left text-slate-400 font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/15 text-blue-400`}>
                          {c.level === 0 ? 'Direct Referral' : `Level ${c.level}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{c.level === 0 ? 'Direct' : `L${c.level}`}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">+${c.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-300">{c.commission_pct}%</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{formatIST(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
