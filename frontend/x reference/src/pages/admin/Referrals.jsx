import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

function TreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-slate-700/50 pl-3' : ''}>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a2035] border border-slate-700/50 mb-2 hover:border-slate-600 transition-colors">
        {hasChildren && (
          <button onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center flex-shrink-0">
            <svg className={`w-3 h-3 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-5 h-5 flex-shrink-0" />}
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-full flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
          {node.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white text-sm font-medium">{node.name}</p>
            <span className="text-blue-400 font-mono text-xs">{node.fxu_id}</span>
            {node.rank && node.rank !== 'Member' && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">{node.rank}</span>
            )}
            <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">L{node.level}</span>
          </div>
          <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
            <span>Invested: <span className="text-emerald-400">${(node.total_invested || 0).toLocaleString()}</span></span>
            <span>Deposited: <span className="text-blue-400">${(node.total_deposited || 0).toLocaleString()}</span></span>
            {hasChildren && <span>{node.children.length} direct</span>}
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="space-y-0">
          {node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

export default function AdminReferrals() {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [treeData, setTreeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [treeLoading, setTreeLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/users?limit=100').then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadTree = async (user) => {
    setSelected(user)
    setTreeLoading(true)
    try {
      const data = await api.get(`/referral/admin/user/${user.id}/tree`)
      setTreeData(data)
    } catch {}
    finally { setTreeLoading(false) }
  }

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.fxu_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Referral Management" subtitle="Browse user downline trees" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <input type="text" placeholder="Search user..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-slate-500" />
          </div>
          <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
            {loading ? <div className="p-6 text-center text-slate-500">Loading...</div> :
              filtered.map((u) => (
                <button key={u.id} onClick={() => loadTree(u)}
                  className={`w-full text-left p-4 hover:bg-slate-800/30 transition-colors ${selected?.id === u.id ? 'bg-slate-800/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-full flex items-center justify-center text-xs font-bold text-orange-400">
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{u.name}</p>
                      <p className="text-blue-400 font-mono text-xs">{u.fxu_id}</p>
                    </div>
                  </div>
                </button>
              ))
            }
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          {treeLoading ? (
            <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : treeData ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">{treeData.user?.name} — Downline Tree</h3>
                  <div className="flex gap-4 mt-1 text-xs text-slate-400">
                    <span>Business Volume: <span className="text-emerald-400 font-semibold">${(treeData.business_volume || 0).toLocaleString()}</span></span>
                    <span>Team Size: <span className="text-blue-400 font-semibold">{treeData.team_size || 0}</span></span>
                  </div>
                </div>
              </div>
              {!treeData.downline_tree || treeData.downline_tree.length === 0 ? (
                <p className="text-slate-500 text-sm">No downline members.</p>
              ) : (
                <div className="space-y-1 max-h-[450px] overflow-y-auto pr-2">
                  {treeData.downline_tree.map((node) => <TreeNode key={node.id} node={node} depth={0} />)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p className="text-sm">Select a user to view their downline tree</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
