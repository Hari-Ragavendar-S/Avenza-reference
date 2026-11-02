import { useState, useEffect } from 'react';

export default function BinaryTree({ rootNode, onNodeClick }) {
  // Navigation stack to track tree history
  const [navigationStack, setNavigationStack] = useState([rootNode]);
  const [currentRoot, setCurrentRoot] = useState(rootNode);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Update viewport width on resize
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset when rootNode changes
  useEffect(() => {
    setNavigationStack([rootNode]);
    setCurrentRoot(rootNode);
  }, [rootNode]);

  if (!rootNode) {
    return (
      <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
        No tree data available
      </div>
    );
  }

  // Handle node click - make it the new root
  const handleNodeClick = (node) => {
    if (!node) return;
    
    // Add current root to navigation stack
    setNavigationStack(prev => [...prev, node]);
    setCurrentRoot(node);
    
    // Call parent handler to fetch new tree data if needed
    onNodeClick(node);
  };

  // Navigate back to previous tree
  const handlePreviousTree = () => {
    if (navigationStack.length <= 1) return;
    
    const newStack = [...navigationStack];
    newStack.pop(); // Remove current
    const previousRoot = newStack[newStack.length - 1];
    
    setNavigationStack(newStack);
    setCurrentRoot(previousRoot);
    onNodeClick(previousRoot);
  };

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const found = findNodeByUsername(currentRoot, query.toLowerCase());
      if (found) {
        setHighlightedNode(found.id);
        // Optionally auto-navigate to found node
        // handleNodeClick(found);
      } else {
        setHighlightedNode(null);
      }
    } else {
      setHighlightedNode(null);
    }
  };

  const findNodeByUsername = (node, query) => {
    if (!node) return null;
    if (node.username?.toLowerCase().includes(query)) return node;
    return findNodeByUsername(node.left_child, query) || 
           findNodeByUsername(node.right_child, query);
  };

  // Calculate team stats
  const calculateStats = (node) => {
    if (!node) return { left: 0, right: 0 };
    const countTeam = (n) => n ? 1 + countTeam(n.left_child) + countTeam(n.right_child) : 0;
    return {
      left: countTeam(node.left_child),
      right: countTeam(node.right_child)
    };
  };

  const stats = calculateStats(currentRoot);

  // Responsive sizing calculations
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  
  // Calculate responsive dimensions based on viewport
  let nodeWidth, nodeHeight, horizontalGap, verticalGap, fontSize;
  
  if (viewportWidth <= 360) {
    nodeWidth = 85;
    nodeHeight = 115;
    horizontalGap = 12;
    verticalGap = 45;
    fontSize = 10;
  } else if (viewportWidth <= 390) {
    nodeWidth = 90;
    nodeHeight = 120;
    horizontalGap = 14;
    verticalGap = 50;
    fontSize = 10;
  } else if (viewportWidth <= 480) {
    nodeWidth = 95;
    nodeHeight = 125;
    horizontalGap = 16;
    verticalGap = 55;
    fontSize = 11;
  } else if (viewportWidth <= 768) {
    nodeWidth = 105;
    nodeHeight = 135;
    horizontalGap = 18;
    verticalGap = 60;
    fontSize = 11;
  } else if (viewportWidth <= 1024) {
    nodeWidth = 100;
    nodeHeight = 130;
    horizontalGap = 20;
    verticalGap: 60;
    fontSize = 12;
  } else if (viewportWidth <= 1440) {
    nodeWidth = 110;
    nodeHeight = 140;
    horizontalGap = 25;
    verticalGap = 70;
    fontSize = 12;
  } else {
    nodeWidth = 120;
    nodeHeight = 150;
    horizontalGap = 30;
    verticalGap = 80;
    fontSize = 13;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '500px' }}>
      {/* Mobile Compact Controls */}
      {isMobile ? (
        <>
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))',
            backdropFilter: 'blur(12px)',
            borderRadius: '0 0 16px 16px',
            padding: '12px',
            marginBottom: '16px',
            border: '1px solid rgba(74,144,226,0.2)',
            borderTop: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {/* Search & Back */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(74,144,226,0.1)',
                  border: '2px solid rgba(74,144,226,0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              {navigationStack.length > 1 && (
                <button
                  onClick={handlePreviousTree}
                  style={{
                    background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ← Back
                </button>
              )}
            </div>

            {/* Compact Stats */}
            <div style={{
              display: 'flex',
              gap: '6px',
              fontSize: '11px'
            }}>
              <div style={{
                flex: 1,
                background: 'rgba(74,144,226,0.15)',
                border: '1px solid rgba(74,144,226,0.3)',
                borderRadius: '6px',
                padding: '6px',
                textAlign: 'center'
              }}>
                <span style={{ color: '#94a3b8' }}>L:</span>
                <span style={{ color: '#4a90e2', fontWeight: 'bold', marginLeft: '4px' }}>{stats.left}</span>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(147,51,234,0.15)',
                border: '1px solid rgba(147,51,234,0.3)',
                borderRadius: '6px',
                padding: '6px',
                textAlign: 'center'
              }}>
                <span style={{ color: '#94a3b8' }}>R:</span>
                <span style={{ color: '#9333ea', fontWeight: 'bold', marginLeft: '4px' }}>{stats.right}</span>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '6px',
                padding: '6px',
                textAlign: 'center'
              }}>
                <span style={{ color: '#94a3b8' }}>T:</span>
                <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '4px' }}>{stats.left + stats.right}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Desktop Full Controls */
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(74,144,226,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Search */}
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="🔍 Search username..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(74,144,226,0.1)',
                  border: '2px solid rgba(74,144,226,0.3)',
                  borderRadius: '10px',
                  padding: '10px 15px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Back Button */}
            {navigationStack.length > 1 && (
              <button
                onClick={handlePreviousTree}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ← Previous Tree
              </button>
            )}
          </div>

          {/* Team Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginTop: '16px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))',
              border: '1px solid rgba(74,144,226,0.3)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>LEFT TEAM</p>
              <p style={{ color: '#4a90e2', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.left}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(147,51,234,0.15), rgba(147,51,234,0.05))',
              border: '1px solid rgba(147,51,234,0.3)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>RIGHT TEAM</p>
              <p style={{ color: '#9333ea', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.right}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>TOTAL</p>
              <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {stats.left + stats.right}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tree Container - NO HORIZONTAL SCROLL */}
      <div style={{
        width: '100%',
        overflowX: 'hidden', // STRICT: No horizontal scrolling
        overflowY: 'visible',
        padding: isMobile ? '20px 10px 60px 10px' : '30px 20px 50px 20px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          <ThreeLevelTree 
            rootNode={currentRoot}
            onNodeClick={handleNodeClick}
            nodeWidth={nodeWidth}
            nodeHeight={nodeHeight}
            horizontalGap={horizontalGap}
            verticalGap={verticalGap}
            fontSize={fontSize}
            highlightedNode={highlightedNode}
            isOriginalRoot={currentRoot === rootNode}
            isMobile={isMobile}
            viewportWidth={viewportWidth}
          />
        </div>
      </div>
    </div>
  );
}

// Component that renders EXACTLY 2 levels on desktop, 1 level on mobile
function ThreeLevelTree({ rootNode, onNodeClick, nodeWidth, nodeHeight, horizontalGap, verticalGap, fontSize, highlightedNode, isOriginalRoot, isMobile, viewportWidth }) {
  if (!rootNode) return null;

  // On mobile (< 768px), show only 1 level to prevent overflow
  const maxLevel = isMobile ? 1 : 2;

  // Build structure based on maxLevel
  // Level 0: root (1 node)
  const level0 = [rootNode];
  
  // Level 1: left + right (2 nodes)
  const level1 = [
    rootNode.left_child || null,
    rootNode.right_child || null
  ];
  
  // Level 2: 4 nodes (LL, LR, RL, RR) - only on desktop
  const level2 = maxLevel >= 2 ? [
    rootNode.left_child?.left_child || null,
    rootNode.left_child?.right_child || null,
    rootNode.right_child?.left_child || null,
    rootNode.right_child?.right_child || null
  ] : [];

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: `${verticalGap}px`
    }}>
      {/* Level 0: Root */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <TreeNode 
          node={rootNode}
          onNodeClick={onNodeClick}
          isRoot={isOriginalRoot}
          width={nodeWidth}
          height={nodeHeight}
          fontSize={fontSize}
          isHighlighted={highlightedNode === rootNode.id}
        />
        
        {/* Connector to Level 1 */}
        {(rootNode.left_child || rootNode.right_child) && (
          <svg
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${(nodeWidth + horizontalGap) * 2}px`,
              height: `${verticalGap}px`,
              pointerEvents: 'none',
              overflow: 'visible'
            }}
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(74,144,226,0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(74,144,226,0.2)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            
            {/* Vertical line down */}
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2={`${verticalGap * 0.4}`}
              stroke="url(#lineGrad)"
              strokeWidth="2"
            />
            
            {/* Horizontal connector */}
            {(rootNode.left_child && rootNode.right_child) && (
              <line
                x1={`${50 - (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                y1={`${verticalGap * 0.4}`}
                x2={`${50 + (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                y2={`${verticalGap * 0.4}`}
                stroke="url(#lineGrad)"
                strokeWidth="2"
              />
            )}
            
            {/* Left branch */}
            {rootNode.left_child && (
              <line
                x1={`${50 - (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                y1={`${verticalGap * 0.4}`}
                x2={`${50 - (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                y2="100%"
                stroke="url(#lineGrad)"
                strokeWidth="2"
              />
            )}
            
            {/* Right branch */}
            {rootNode.right_child && (
              <line
                x1={`${50 + (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                y1={`${verticalGap * 0.4}`}
                x2={`${50 + (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                y2="100%"
                stroke="url(#lineGrad)"
                strokeWidth="2"
              />
            )}
          </svg>
        )}
      </div>

      {/* Level 1: Left + Right */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: `${horizontalGap}px`,
        position: 'relative'
      }}>
        {level1.map((node, idx) => (
          <div key={`l1-${idx}`} style={{ position: 'relative' }}>
            {node ? (
              <>
                <TreeNode 
                  node={node}
                  onNodeClick={onNodeClick}
                  isRoot={false}
                  width={nodeWidth}
                  height={nodeHeight}
                  fontSize={fontSize}
                  isHighlighted={highlightedNode === node.id}
                />
                
                {/* Connector to Level 2 - only show on desktop when maxLevel >= 2 */}
                {!isMobile && (node.left_child || node.right_child) && (
                  <svg
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: `${(nodeWidth + horizontalGap) * 2}px`,
                      height: `${verticalGap}px`,
                      pointerEvents: 'none',
                      overflow: 'visible'
                    }}
                  >
                    <line x1="50%" y1="0" x2="50%" y2={`${verticalGap * 0.4}`} stroke="url(#lineGrad)" strokeWidth="2" />
                    
                    {(node.left_child && node.right_child) && (
                      <line
                        x1={`${50 - (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                        y1={`${verticalGap * 0.4}`}
                        x2={`${50 + (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                        y2={`${verticalGap * 0.4}`}
                        stroke="url(#lineGrad)"
                        strokeWidth="2"
                      />
                    )}
                    
                    {node.left_child && (
                      <line
                        x1={`${50 - (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                        y1={`${verticalGap * 0.4}`}
                        x2={`${50 - (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                        y2="100%"
                        stroke="url(#lineGrad)"
                        strokeWidth="2"
                      />
                    )}
                    
                    {node.right_child && (
                      <line
                        x1={`${50 + (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                        y1={`${verticalGap * 0.4}`}
                        x2={`${50 + (nodeWidth + horizontalGap) * 50 / ((nodeWidth + horizontalGap) * 2)}%`}
                        y2="100%"
                        stroke="url(#lineGrad)"
                        strokeWidth="2"
                      />
                    )}
                  </svg>
                )}
              </>
            ) : (
              <EmptySlot width={nodeWidth} height={nodeHeight} fontSize={fontSize} />
            )}
          </div>
        ))}
      </div>

      {/* Level 2: 4 nodes - ONLY SHOW ON DESKTOP */}
      {!isMobile && level2.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: `${horizontalGap}px`,
          position: 'relative'
        }}>
          {level2.map((node, idx) => (
            <div key={`l2-${idx}`} style={{ position: 'relative' }}>
              {node ? (
                <TreeNode 
                  node={node}
                  onNodeClick={onNodeClick}
                  isRoot={false}
                  width={nodeWidth}
                  height={nodeHeight}
                  fontSize={fontSize}
                  isHighlighted={highlightedNode === node.id}
                />
              ) : (
                <EmptySlot width={nodeWidth} height={nodeHeight} fontSize={fontSize} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, onNodeClick, isRoot, width, height, fontSize, isHighlighted }) {
  return (
    <div
      onClick={() => onNodeClick(node)}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        background: isHighlighted 
          ? 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))'
          : node.is_active 
            ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
            : 'linear-gradient(135deg, rgba(107,114,128,0.15), rgba(107,114,128,0.05))',
        backdropFilter: 'blur(12px)',
        border: isHighlighted
          ? '2px solid rgba(251,191,36,0.8)'
          : node.is_active 
            ? '2px solid rgba(16,185,129,0.5)'
            : '2px solid rgba(107,114,128,0.3)',
        borderRadius: `${width * 0.1}px`,
        padding: `${width * 0.08}px`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isHighlighted
          ? '0 0 20px rgba(251,191,36,0.5), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        animation: isHighlighted ? 'pulse 2s infinite' : 'none',
        flexShrink: 0
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,144,226,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = isHighlighted 
          ? '0 0 20px rgba(251,191,36,0.5), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(0,0,0,0.3)';
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Badge */}
      <div style={{
        position: 'absolute',
        top: `${-width * 0.08}px`,
        left: `${width * 0.08}px`,
        background: isRoot 
          ? 'linear-gradient(135deg, #4a90e2, #9333ea)' 
          : node.position === 'left' ? '#4a90e2' : '#9333ea',
        color: '#fff',
        padding: `${width * 0.025}px ${width * 0.08}px`,
        borderRadius: `${width * 0.06}px`,
        fontSize: `${fontSize - 1}px`,
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap'
      }}>
        {isRoot ? '👑 YOU' : (node.position === 'left' ? '← L' : 'R →')}
      </div>

      {/* Avatar */}
      <div style={{
        width: `${width * 0.35}px`,
        height: `${width * 0.35}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `${Math.max(2, width * 0.025)}px solid rgba(74,144,226,0.5)`,
        marginBottom: `${width * 0.05}px`,
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        {node.profile_photo_url ? (
          <img src={node.profile_photo_url} alt={node.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #4a90e2, #9333ea)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: `${fontSize + 4}px`
          }}>
            {node.name?.charAt(0) || node.username?.charAt(0) || 'U'}
          </div>
        )}
      </div>

      {/* Username */}
      <p style={{
        color: '#fff',
        fontSize: `${fontSize}px`,
        fontWeight: '600',
        margin: `0 0 2px 0`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '95%',
        textAlign: 'center',
        lineHeight: '1.1'
      }}>
        {node.username}
      </p>

      {/* Name - ALWAYS show if exists, even if same as username */}
      {node.name && (
        <p style={{
          color: '#94a3b8',
          fontSize: `${Math.max(fontSize - 1, 8)}px`,
          fontWeight: '500',
          margin: `0 0 3px 0`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '95%',
          textAlign: 'center',
          lineHeight: '1.1'
        }}>
          {node.name}
        </p>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '3px',
        fontSize: `${fontSize - 1}px`,
        marginBottom: '3px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <span style={{ 
          background: 'rgba(74,144,226,0.2)', 
          padding: '2px 4px', 
          borderRadius: '3px',
          color: '#4a90e2', 
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          T:{node.team_size || 0}
        </span>
        <span style={{ 
          background: 'rgba(16,185,129,0.2)', 
          padding: '2px 4px', 
          borderRadius: '3px',
          color: '#10b981', 
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          D:{node.direct_referrals || 0}
        </span>
      </div>

      {/* Status */}
      <div style={{
        background: node.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)',
        color: node.is_active ? '#10b981' : '#6b7280',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: `${fontSize - 1}px`,
        fontWeight: 'bold'
      }}>
        {node.is_active ? '🟢' : '○'}
      </div>
    </div>
  );
}

function EmptySlot({ width, height, fontSize }) {
  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      background: 'rgba(74,144,226,0.05)',
      backdropFilter: 'blur(8px)',
      border: '2px dashed rgba(74,144,226,0.2)',
      borderRadius: `${width * 0.1}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <p style={{ color: '#64748b', fontSize: `${fontSize}px`, margin: 0 }}>Empty</p>
    </div>
  );
}
