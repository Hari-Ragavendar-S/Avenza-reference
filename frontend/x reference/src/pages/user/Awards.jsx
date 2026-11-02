import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatISTDate } from '../../utils/dateFormatter'

export default function UserAwards() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const awards = await api.get('/referral/my-awards')
        setData(awards)
      } catch (err) {
        console.error('Failed to load awards:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentAward = data?.current_award
  const awards = data?.awards || []
  const totalRewards = data?.total_rewards || 0
  const selfVolume = data?.self_volume || 0
  const directBusiness = data?.direct_business || 0
  const teamVolume = data?.team_volume || 0

  // Find next award to unlock
  const nextAward = awards.find((a) => a.status === 'locked')

  return (
    <div className="space-y-6">
      <PageHeader title="My Awards" subtitle="Premium rewards for your achievements" />

      {/* Current Rank Header Card */}
      <div className="relative bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-pink-600/10 border border-blue-500/30 rounded-3xl p-6 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Current Award */}
            <div className="flex items-center gap-4">
              {currentAward ? (
                <>
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-yellow-500/20 animate-pulse">
                    {currentAward.emoji}
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Current Award</p>
                    <h2 className="text-white text-3xl font-bold">{currentAward.emoji} {currentAward.name}</h2>
                    <p className="text-emerald-400 text-sm font-semibold mt-1">Earned ${currentAward.reward.toLocaleString()}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl">
                    🏆
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Current Award</p>
                    <h2 className="text-white text-3xl font-bold">No Award Yet</h2>
                    <p className="text-slate-500 text-sm mt-1">Start your journey below</p>
                  </div>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0e1a]/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Total Rewards</p>
                <p className="text-2xl font-bold text-yellow-400">${totalRewards.toLocaleString()}</p>
              </div>
              <div className="bg-[#0a0e1a]/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Awards Unlocked</p>
                <p className="text-2xl font-bold text-blue-400">{awards.filter((a) => a.status === 'claimed').length} / 9</p>
              </div>
            </div>
          </div>

          {/* Next Milestone */}
          {nextAward && (
            <div className="mt-6 bg-[#0a0e1a]/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Next Milestone: <span className="text-white font-semibold">{nextAward.emoji} {nextAward.name}</span></p>
                <p className="text-emerald-400 font-bold">${nextAward.reward.toLocaleString()} Reward</p>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (
                      (nextAward.progress.self_volume.percentage + 
                       nextAward.progress.direct_business.percentage + 
                       nextAward.progress.team.percentage) / 3
                    ))}%` 
                  }}
                />
              </div>
              
              <p className="text-slate-500 text-xs">
                {nextAward.progress.self_volume.met && nextAward.progress.direct_business.met && nextAward.progress.team.met
                  ? '🎉 All conditions met! Award will be credited automatically.'
                  : `Keep going! ${[
                      !nextAward.progress.self_volume.met && `$${(nextAward.progress.self_volume.required - nextAward.progress.self_volume.current).toFixed(0)} more self volume`,
                      !nextAward.progress.direct_business.met && `$${(nextAward.progress.direct_business.required - nextAward.progress.direct_business.current).toFixed(0)} more direct business`,
                      !nextAward.progress.team.met && `${nextAward.progress.team.required - nextAward.progress.team.current} more ${nextAward.progress.team.type === 'volume' ? 'team volume' : nextAward.name + ' members'}`
                    ].filter(Boolean).join(', ')} needed`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Award Journey Timeline */}
      <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-6">Award Journey</h3>
        
        <div className="space-y-4">
          {awards.map((award, index) => {
            const isClaimed = award.status === 'claimed'
            const isUnlocked = award.status === 'unlocked'
            const isLocked = award.status === 'locked'
            
            return (
              <div key={award.id} className="relative">
                {/* Connector line */}
                {index < awards.length - 1 && (
                  <div className={`absolute left-6 top-16 w-0.5 h-8 ${isClaimed ? 'bg-emerald-500/30' : 'bg-slate-700'}`} />
                )}
                
                <div className={`
                  relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300
                  ${isClaimed ? 'bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/10' : ''}
                  ${isUnlocked ? 'bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/10 animate-pulse' : ''}
                  ${isLocked ? 'bg-[#1a2035] border-slate-800/50 opacity-70' : ''}
                `}>
                  {/* Award Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all
                    ${isClaimed ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/30' : ''}
                    ${isUnlocked ? 'bg-blue-500/20 shadow-lg shadow-blue-500/30' : ''}
                    ${isLocked ? 'bg-slate-800 grayscale' : ''}
                  `}>
                    {award.emoji}
                  </div>

                  {/* Award Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className={`text-lg font-bold ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                          {award.name}
                        </h4>
                        <p className={`text-sm font-semibold ${isClaimed ? 'text-emerald-400' : isUnlocked ? 'text-blue-400' : 'text-slate-500'}`}>
                          ${award.reward.toLocaleString()} Reward
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {isClaimed && (
                          <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Claimed
                          </span>
                        )}
                        {isUnlocked && (
                          <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            Unlocked
                          </span>
                        )}
                        {isLocked && (
                          <span className="flex items-center gap-1.5 bg-slate-800 text-slate-500 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Indicators */}
                    <div className="space-y-3">
                      {/* Self Volume */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                            Self Volume
                          </span>
                          <span className={`text-xs font-semibold ${award.progress.self_volume.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                            ${award.progress.self_volume.current.toLocaleString()} / ${award.progress.self_volume.required.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${award.progress.self_volume.met ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${award.progress.self_volume.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Direct Business */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                            Direct Business
                          </span>
                          <span className={`text-xs font-semibold ${award.progress.direct_business.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                            ${award.progress.direct_business.current.toLocaleString()} / ${award.progress.direct_business.required.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${award.progress.direct_business.met ? 'bg-emerald-500' : 'bg-purple-500'}`}
                            style={{ width: `${award.progress.direct_business.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Team Condition */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                            {award.progress.team.label}
                          </span>
                          <span className={`text-xs font-semibold ${award.progress.team.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {award.progress.team.type === 'volume' 
                              ? `$${award.progress.team.current.toLocaleString()} / $${award.progress.team.required.toLocaleString()}`
                              : `${award.progress.team.current} / ${award.progress.team.required}`
                            }
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${award.progress.team.met ? 'bg-emerald-500' : 'bg-pink-500'}`}
                            style={{ width: `${award.progress.team.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Claimed Date */}
                    {isClaimed && award.claimed_at && (
                      <p className="text-slate-500 text-xs mt-3">
                        Claimed on {formatISTDate(award.claimed_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2">How Awards Work</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Awards are automatically credited to your Rewards Wallet when all conditions are met</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Each award can only be claimed once</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Progress is checked automatically after ROI credits and investments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Team conditions require your direct referrals to achieve the specified award rank</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
