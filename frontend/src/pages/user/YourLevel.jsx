import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function YourLevel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [levelData, setLevelData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchLevelData();
    const interval = setInterval(fetchLevelData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchLevelData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://avenza.live/api/level-income/your-level', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLevelData(data);
      }
    } catch (error) {
      console.error('Error fetching level data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const referralLink = `https://avenza.live/${user.username}`;
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const calculateUnlockedLevels = (directRefs) => {
    if (directRefs === 0) return 0;
    if (directRefs >= 10) return 20;
    return directRefs * 2;
  };

  const getLevelTiers = () => {
    return [
      { range: 'L1-2', commission: '10% & 5%', required: 1, levels: [1, 2] },
      { range: 'L3-4', commission: '5% each', required: 2, levels: [3, 4] },
      { range: 'L5-6', commission: '3% each', required: 3, levels: [5, 6] },
      { range: 'L7-8', commission: '2% each', required: 4, levels: [7, 8] },
      { range: 'L9-10', commission: '2% each', required: 5, levels: [9, 10] },
      { range: 'L11-12', commission: '1% each', required: 6, levels: [11, 12] },
      { range: 'L13-14', commission: '1% each', required: 7, levels: [13, 14] },
      { range: 'L15-16', commission: '1% each', required: 8, levels: [15, 16] },
      { range: 'L17-18', commission: '1% each', required: 9, levels: [17, 18] },
      { range: 'L19-20', commission: '1% each', required: 10, levels: [19, 20] }
    ];
  };

  const getRankInfo = (directRefs) => {
    if (directRefs === 0) return { rank: '🔰 Beginner', next: 'Starter (1 ref)' };
    if (directRefs < 3) return { rank: '⭐ Starter', next: 'Explorer (3 refs)' };
    if (directRefs < 5) return { rank: '🥉 Explorer', next: 'Builder (5 refs)' };
    if (directRefs < 7) return { rank: '🥈 Builder', next: 'Expert (7 refs)' };
    if (directRefs < 10) return { rank: '🥇 Expert', next: 'Master (10 refs)' };
    return { rank: '👑 Master', next: 'MAX LEVEL!' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ animation: 'pulse 2s infinite' }}>
          <div style={{ height: '150px', background: 'rgba(74,144,226,0.1)', borderRadius: '16px', marginBottom: '20px' }} />
        </div>
      </div>
    );
  }

  if (!levelData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
        Failed to load level data
      </div>
    );
  }

  const directRefs = levelData.active_direct_referrals || 0;
  const totalRefs = levelData.total_direct_referrals || 0;
  const unlockedLevels = calculateUnlockedLevels(directRefs);
  const progress = (directRefs / 10) * 100;
  const tiers = getLevelTiers();
  const rankInfo = getRankInfo(directRefs);
  const nextUnlock = directRefs < 10 ? directRefs + 1 : null;

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(168,85,247,0.1))',
        border: '1px solid rgba(147,51,234,0.3)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>🎯</span>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            Your Level Status
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
          Track your level unlock progress and earning potential
        </p>
      </div>

      {/* IMPORTANT: Direct Referrals Explanation Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))',
        border: '2px solid rgba(251,191,36,0.5)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <span style={{ fontSize: '40px', flexShrink: 0 }}>📊</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              Understanding Your Direct Referrals
            </h3>
            
            {/* Real User Data */}
            <div style={{ 
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(251,191,36,0.3)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0' }}>TOTAL DIRECT REFERRALS</p>
                  <p style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                    {totalRefs}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
                    People who signed up using your link
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0' }}>ACTIVE REFERRALS</p>
                  <p style={{ color: '#10b981', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                    {directRefs}
                  </p>
                  <p style={{ color: '#10b981', fontSize: '13px', margin: '4px 0 0 0' }}>
                    With active investments
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexWrap: 'wrap',
                paddingTop: '16px',
                borderTop: '1px solid rgba(251,191,36,0.2)'
              }}>
                <div style={{ 
                  flex: 1,
                  minWidth: '120px',
                  background: 'rgba(16,185,129,0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16,185,129,0.4)',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                    {directRefs}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                    ✅ INVESTED<br/>(Count for levels)
                  </p>
                </div>
                <div style={{ 
                  flex: 1,
                  minWidth: '120px',
                  background: 'rgba(239,68,68,0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239,68,68,0.4)',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                    {totalRefs - directRefs}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                    ⚠️ NOT INVESTED<br/>(Don't count yet)
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div style={{ 
              background: 'rgba(251,191,36,0.1)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '12px'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                🔑 KEY POINTS:
              </p>
              <ul style={{ color: '#fff', fontSize: '13px', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                <li><strong>Binary Tree</strong> = Everyone in your network (includes spillover from upline)</li>
                <li><strong>Direct Referrals</strong> = Only people who used YOUR referral link to signup</li>
                <li><strong>Active Referrals</strong> = Direct referrals who made an investment (these unlock your levels)</li>
              </ul>
            </div>

            {totalRefs > directRefs && (
              <div style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '12px'
              }}>
                <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                  ⚠️ {totalRefs - directRefs} Referral{totalRefs - directRefs > 1 ? 's' : ''} Haven't Invested Yet
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  Encourage them to invest so they count toward unlocking your levels and you can earn bonuses!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rank & Progress Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(147,51,234,0.05))',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '120px', opacity: 0.05 }}>
          {directRefs >= 10 ? '👑' : directRefs >= 5 ? '🥇' : directRefs >= 3 ? '🥉' : '⭐'}
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>CURRENT RANK</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
              {rankInfo.rank}
            </p>
            <p style={{ color: '#4a90e2', fontSize: '14px', margin: 0 }}>
              Next: {rankInfo.next}
            </p>
          </div>

          <div style={{ 
            background: 'rgba(74,144,226,0.1)',
            border: '1px solid rgba(74,144,226,0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Direct Referrals</p>
                <p style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  {totalRefs} total
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <p style={{ 
                    color: '#10b981', 
                    fontSize: '12px', 
                    margin: 0,
                    background: 'rgba(16,185,129,0.1)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16,185,129,0.3)'
                  }}>
                    ✅ {directRefs} with investment
                  </p>
                  {totalRefs > directRefs && (
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '12px', 
                      margin: 0,
                      background: 'rgba(239,68,68,0.1)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.3)'
                    }}>
                      ⚠️ {totalRefs - directRefs} no investment
                    </p>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Unlocked Levels</p>
                <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  {unlockedLevels === 0 ? '0' : `1-${unlockedLevels}`}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(74,144,226,0.2)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4a90e2, #10b981)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, textAlign: 'center' }}>
              {progress}% to Master Level
            </p>
          </div>

          {nextUnlock && (
            <div style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: '10px',
              padding: '12px'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                💡 Next Unlock:
              </p>
              <p style={{ color: '#fff', fontSize: '13px', margin: 0 }}>
                Invite {nextUnlock - directRefs} more direct referral{nextUnlock - directRefs > 1 ? 's' : ''} to unlock Level {unlockedLevels + 1}-{unlockedLevels + 2}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Level Unlock Grid */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          📊 Level Unlock Progress
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {tiers.map((tier, index) => {
            const isUnlocked = directRefs >= tier.required;
            const teamCount = levelData.level_breakdown?.find(l => 
              tier.levels.includes(l.level)
            )?.member_count || 0;
            const todayEarned = levelData.level_breakdown?.filter(l => 
              tier.levels.includes(l.level)
            ).reduce((sum, l) => sum + parseFloat(l.today_earned || 0), 0) || 0;

            return (
              <div
                key={index}
                style={{
                  background: isUnlocked 
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                    : 'rgba(74,144,226,0.05)',
                  border: isUnlocked 
                    ? '2px solid rgba(16,185,129,0.5)'
                    : '2px dashed rgba(74,144,226,0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Lock/Unlock Badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '20px'
                }}>
                  {isUnlocked ? '✅' : '🔒'}
                </div>

                <p style={{ 
                  color: isUnlocked ? '#10b981' : '#64748b', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  margin: '0 0 4px 0' 
                }}>
                  {tier.range}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 12px 0' }}>
                  {tier.commission}
                </p>

                <div style={{
                  background: isUnlocked ? 'rgba(16,185,129,0.1)' : 'rgba(74,144,226,0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  marginBottom: '8px'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '10px', margin: '0 0 4px 0' }}>Required</p>
                  <p style={{ 
                    color: isUnlocked ? '#10b981' : '#4a90e2', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    margin: 0 
                  }}>
                    {tier.required} {tier.required === 1 ? 'ref' : 'refs'}
                  </p>
                </div>

                {isUnlocked ? (
                  <>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>
                      Team: {teamCount}
                    </p>
                    <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                      {formatCurrency(todayEarned)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '10px', margin: 0 }}>Today</p>
                  </>
                ) : (
                  <>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                      🔒 Locked
                    </p>
                    {teamCount > 0 && (
                      <p style={{ color: '#fbbf24', fontSize: '11px', margin: '4px 0 0 0' }}>
                        {teamCount} waiting!
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Potential Income Alert */}
      {levelData.locked_potential && levelData.locked_potential > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <div>
              <p style={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                Potential Income Locked!
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                You're missing out on daily earnings
              </p>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>Locked Potential Today:</p>
            <p style={{ color: '#ef4444', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              {formatCurrency(levelData.locked_potential)}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
              Monthly Potential: {formatCurrency(levelData.locked_potential * 30)}
            </p>
          </div>

          <p style={{ color: '#fff', fontSize: '14px', margin: '0 0 12px 0' }}>
            🎯 Invite {nextUnlock ? nextUnlock - directRefs : 0} more direct referral{nextUnlock && nextUnlock - directRefs > 1 ? 's' : ''} to unlock this income!
          </p>

          <button
            onClick={handleCopyLink}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🚀 Unlock Now - Share Link
          </button>
        </div>
      )}

      {/* How It Works */}
      <div style={{
        background: 'rgba(74,144,226,0.05)',
        border: '1px solid rgba(74,144,226,0.2)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h4 style={{ color: '#4a90e2', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
          ℹ️ How Level Unlocking Works
        </h4>
        <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong style={{ color: '#fff' }}>Unlock Formula:</strong> Active Direct Referrals × 2 = Unlocked Levels
          </p>
          <p style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: '12px' }}>
            ⚠️ Only referrals with active investments count toward unlocking levels
          </p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>1 active referral → Unlock Levels 1-2</li>
            <li>2 active referrals → Unlock Levels 1-4</li>
            <li>3 active referrals → Unlock Levels 1-6</li>
            <li>5 active referrals → Unlock Levels 1-10</li>
            <li>10 active referrals → Unlock ALL 20 levels! 👑</li>
          </ul>
          <p style={{ margin: '8px 0 0 0' }}>
            ✅ Only receive level income from unlocked levels<br />
            💰 More referrals = Deeper earnings = Higher passive income!
          </p>
        </div>
      </div>

      {/* Achievement Roadmap */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(74,144,226,0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          🏆 Achievement Roadmap
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { refs: 1, rank: '⭐ Starter', levels: 'L1-2', status: directRefs >= 1 },
            { refs: 3, rank: '🥉 Explorer', levels: 'L1-6', status: directRefs >= 3 },
            { refs: 5, rank: '🥈 Builder', levels: 'L1-10', status: directRefs >= 5 },
            { refs: 7, rank: '🥇 Expert', levels: 'L1-14', status: directRefs >= 7 },
            { refs: 10, rank: '👑 Master', levels: 'L1-20', status: directRefs >= 10 }
          ].map((achievement, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px',
                background: achievement.status 
                  ? 'rgba(16,185,129,0.1)' 
                  : 'rgba(74,144,226,0.05)',
                border: achievement.status
                  ? '1px solid rgba(16,185,129,0.3)'
                  : '1px solid rgba(74,144,226,0.2)',
                borderRadius: '10px'
              }}
            >
              <span style={{ fontSize: '28px' }}>
                {achievement.status ? '✅' : '🔒'}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  color: achievement.status ? '#10b981' : '#94a3b8', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  margin: '0 0 4px 0' 
                }}>
                  {achievement.rank}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  {achievement.refs} refs → {achievement.levels}
                </p>
              </div>
              {!achievement.status && directRefs === achievement.refs - 1 && (
                <span style={{
                  background: 'rgba(251,191,36,0.2)',
                  color: '#fbbf24',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  NEXT!
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
