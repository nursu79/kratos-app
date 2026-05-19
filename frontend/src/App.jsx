import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

// ═════════════════════════════════════════════════════════════════════════════
// THEME CONSTANTS (Forest Dark / Carbon Black)
// ═════════════════════════════════════════════════════════════════════════════

const COLORS = {
  bg: '#111D13',
  bgLight: '#1a2a1d',
  celadon: '#A1CCA5',
  moss: '#8FB996',
  teal: '#709775',
  crimson: '#E63946',
  white: '#F1F7F1',
  gray: '#6B8F71',
  glass: 'rgba(161, 204, 165, 0.08)',
  glassBorder: 'rgba(161, 204, 165, 0.2)',
};

const ROLES = ['blocked', 'limited', 'standard', 'elevated', 'unlimited'];

const API_BASE = 'http://localhost:8000';

// ═════════════════════════════════════════════════════════════════════════════
// MOCK DATA / PRE-POPULATED TEMPLATES
// ═════════════════════════════════════════════════════════════════════════════

const TEMPLATES = [
  {
    name: 'GitHub Actions Cloud Push',
    nodes: [
      { id: 'gh_1', type: 'serviceNode', position: { x: 50, y: 150 }, data: { label: 'GitHub Runner', role: 'unlimited' } },
      { id: 'gh_2', type: 'serviceNode', position: { x: 350, y: 50 }, data: { label: 'Build Step', role: 'standard' } },
      { id: 'gh_3', type: 'serviceNode', position: { x: 350, y: 250 }, data: { label: 'Test Step', role: 'limited' } },
      { id: 'gh_4', type: 'serviceNode', position: { x: 650, y: 150 }, data: { label: 'AWS Deploy', role: 'unlimited' } },
    ],
    edges: [
      { id: 'e_gh1-2', source: 'gh_1', target: 'gh_2', animated: true },
      { id: 'e_gh1-3', source: 'gh_1', target: 'gh_3', animated: true },
      { id: 'e_gh2-4', source: 'gh_2', target: 'gh_4', animated: true },
      { id: 'e_gh3-4', source: 'gh_3', target: 'gh_4', animated: true },
    ],
  },
  {
    name: 'Third-Party Log Aggregator Pipe',
    nodes: [
      { id: 'log_1', type: 'serviceNode', position: { x: 50, y: 150 }, data: { label: 'App Server', role: 'standard' } },
      { id: 'log_2', type: 'serviceNode', position: { x: 350, y: 50 }, data: { label: 'Log Buffer', role: 'limited' } },
      { id: 'log_3', type: 'serviceNode', position: { x: 350, y: 250 }, data: { label: 'Log Parser', role: 'limited' } },
      { id: 'log_4', type: 'serviceNode', position: { x: 650, y: 150 }, data: { label: 'Analytics', role: 'limited' } },
    ],
    edges: [
      { id: 'e_log1-2', source: 'log_1', target: 'log_2', animated: true },
      { id: 'e_log2-3', source: 'log_2', target: 'log_3', animated: true },
      { id: 'e_log3-4', source: 'log_3', target: 'log_4', animated: true },
    ],
  },
  {
    name: 'Payment Portal Gateway Setup',
    nodes: [
      { id: 'pay_1', type: 'serviceNode', position: { x: 50, y: 150 }, data: { label: 'API Gateway', role: 'unlimited' } },
      { id: 'pay_2', type: 'serviceNode', position: { x: 350, y: 50 }, data: { label: 'Auth Service', role: 'standard' } },
      { id: 'pay_3', type: 'serviceNode', position: { x: 350, y: 250 }, data: { label: 'Payment Core', role: 'unlimited' } },
      { id: 'pay_4', type: 'serviceNode', position: { x: 650, y: 150 }, data: { label: 'Audit Logger', role: 'limited' } },
    ],
    edges: [
      { id: 'e_pay1-2', source: 'pay_1', target: 'pay_2', animated: true },
      { id: 'e_pay1-3', source: 'pay_1', target: 'pay_3', animated: true },
      { id: 'e_pay2-4', source: 'pay_2', target: 'pay_4', animated: true },
      { id: 'e_pay3-4', source: 'pay_3', target: 'pay_4', animated: true },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// SERVICE NODE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const ServiceNode = ({ data, id }) => {
  const [role, setRole] = useState(data.role || 'blocked');
  const [label, setLabel] = useState(data.label || 'Service');

  // Sync back to internal data for React Flow's internal persistence
  useEffect(() => {
    data.role = role;
    data.label = label;
  }, [role, label, data]);

  return (
    <div style={{
      background: COLORS.glass,
      border: `1px solid ${COLORS.glassBorder}`,
      borderRadius: '8px',
      padding: '16px',
      minWidth: '180px',
      color: COLORS.celadon,
      fontFamily: 'Inter, sans-serif',
      backdropFilter: 'blur(10px)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: COLORS.celadon, width: '10px', height: '10px' }} />
      
      {/* NO DIV HERE - Only the Input for renaming */}
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Service Name"
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: `2px solid ${COLORS.teal}`,
          color: COLORS.white,
          fontSize: '20px',
          fontWeight: 800,
          width: '100%',
          marginBottom: '16px',
          padding: '4px 0',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.teal}`,
          color: COLORS.celadon,
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: 500,
          width: '100%',
          cursor: 'pointer',
        }}
      >
        {ROLES.map(r => (
          <option key={r} value={r} style={{ background: COLORS.bg }}>
            {r.toUpperCase()}
          </option>
        ))}
      </select>
      <Handle type="source" position={Position.Right} style={{ background: COLORS.celadon }} />
    </div>
  );
};

const nodeTypes = { serviceNode: ServiceNode };

// ═════════════════════════════════════════════════════════════════════════════
// HEATMAP COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const Heatmap = ({ title, labels, matrix, activeCell }) => {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ color: COLORS.celadon, fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${labels.length + 1}, 1fr)`, gap: '2px' }}>
        <div style={{ width: '36px', height: '36px' }} />
        {labels.map(l => (
          <div key={l} style={{
            color: COLORS.gray,
            fontSize: '13px',
            textAlign: 'center',
            padding: '8px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>{l.slice(0, 3)}</div>
        ))}
        {matrix.map((row, i) => (
          <React.Fragment key={i}>
            <div style={{
              color: COLORS.gray,
              fontSize: '13px',
              textAlign: 'center',
              padding: '8px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}>{labels[i].slice(0, 3)}</div>
            {row.map((cell, j) => {
              const isActive = activeCell && activeCell[0] === i && activeCell[1] === j;
              return (
                <div key={j} style={{
                  background: isActive ? COLORS.celadon : COLORS.glass,
                  color: isActive ? COLORS.bg : COLORS.celadon,
                  border: `1px solid ${isActive ? COLORS.celadon : COLORS.glassBorder}`,
                  borderRadius: '4px',
                  padding: '10px 8px',
                  fontSize: '13px',
                  textAlign: 'center',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                }}>
                  {cell.slice(0, 4)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const Modal = ({ isOpen, onClose, title, message, type, onAction }) => {
  if (!isOpen) return null;
  const isError = type === 'error';
  
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{
        background: isError ? 'rgba(45, 10, 13, 0.95)' : 'rgba(15, 30, 20, 0.95)',
        border: `3px solid ${isError ? COLORS.crimson : COLORS.celadon}`,
        borderRadius: '24px',
        padding: '60px',
        maxWidth: '800px',
        width: '90%',
        boxShadow: `0 0 100px ${isError ? 'rgba(230, 57, 70, 0.3)' : 'rgba(128, 255, 219, 0.2)'}`,
        textAlign: 'center',
        position: 'relative',
        animation: 'modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        <style>
          {`@keyframes modalPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}
        </style>
        
        <h2 style={{
          fontSize: '48px',
          color: isError ? COLORS.crimson : COLORS.celadon,
          marginBottom: '32px',
          fontWeight: 900,
          letterSpacing: '-2px'
        }}>
          {title}
        </h2>
        
        <div style={{
          fontSize: '24px',
          color: COLORS.white,
          lineHeight: 1.6,
          marginBottom: '48px',
          whiteSpace: 'pre-wrap',
          fontWeight: 500,
          opacity: 0.9
        }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {onAction && (
            <button 
              onClick={onAction}
              style={{
                background: COLORS.crimson,
                color: COLORS.white,
                border: 'none',
                borderRadius: '12px',
                padding: '18px 48px',
                fontSize: '18px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              DELETE
            </button>
          )}
          <button 
            onClick={onClose}
            style={{
              background: isError && !onAction ? COLORS.crimson : COLORS.celadon,
              color: COLORS.bg,
              border: 'none',
              borderRadius: '12px',
              padding: '18px 48px',
              fontSize: '18px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            {onAction ? 'CANCEL' : isError ? 'ACKNOWLEDGE RISK' : 'DISMISS'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// STAGE TIMELINE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const StageTimeline = ({ stages, isAnimating }) => {
  if (!stages) return null;

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: COLORS.celadon, fontSize: '18px', marginBottom: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
        Execution Timeline
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stages.map((stage, idx) => {
          let color = COLORS.gray;
          let bg = COLORS.glass;
          let border = COLORS.glassBorder;

          if (stage.status === 'success') {
            color = COLORS.celadon;
            bg = 'rgba(161, 204, 165, 0.15)';
            border = COLORS.celadon;
          } else if (stage.status === 'failure') {
            color = COLORS.crimson;
            bg = 'rgba(230, 57, 70, 0.15)';
            border = COLORS.crimson;
          } else if (stage.status === 'blocked') {
            color = '#555';
            bg = 'rgba(0,0,0,0.3)';
            border = '#333';
          }

          const delay = isAnimating ? idx * 0.15 : 0;

          return (
            <div key={idx} style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: color,
              fontSize: '14px',
              fontFamily: 'Inter, monospace',
              opacity: stage.status === 'pending' ? 0.5 : 1,
              transition: `all 0.4s ease ${delay}s`,
              transform: isAnimating && stage.status === 'success' ? 'translateX(6px)' : 'none',
              boxShadow: stage.status === 'success' ? `0 4px 12px ${bg}` : 'none',
            }}>
              <span style={{ fontWeight: 700, marginRight: '10px' }}>Stage {stage.stage}</span>
              <span style={{ opacity: 0.9, fontWeight: 500 }}>{stage.name}</span>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7, lineHeight: 1.4 }}>{stage.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════════

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [quantaleState, setQuantaleState] = useState(null);
  const [activeMonoidCell, setActiveMonoidCell] = useState(null);
  const [activeResidualCell, setActiveResidualCell] = useState(null);
  const [lastStages, setLastStages] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [modal, setModal] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [lastEdgeId, setLastEdgeId] = useState(null);
  const reactFlowWrapper = useRef(null);

  // Load quantale state on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/quantale/state`)
      .then(r => r.json())
      .then(setQuantaleState)
      .catch(console.error);

    // Load first template
    loadTemplate(0);
  }, []);

  // Real-time highlight sync
  useEffect(() => {
    if (!lastEdgeId) return;
    const edge = edges.find(e => (e.source + '-' + e.target) === lastEdgeId || e.id === lastEdgeId);
    if (!edge) return;
    
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (!source || !target) return;

    const a = source.data.role;
    const c = target.data.role;
    
    // Calculate Monoid
    fetch(`${API_BASE}/api/security/compose-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: [a, c] }), // Simple 2-node product
    })
    .then(r => r.json())
    .then(data => {
      const pIdx = ROLES.indexOf(a);
      const rIdx = ROLES.indexOf(data.result);
      if (pIdx >= 0 && rIdx >= 0) setActiveMonoidCell([pIdx, rIdx]);
    });

    // Calculate Residual
    fetch(`${API_BASE}/api/security/calculate-delegation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_token: a, safety_budget: c }),
    })
    .then(r => r.json())
    .then(data => {
      const pIdx = ROLES.indexOf(a);
      const cIdx = ROLES.indexOf(c);
      if (pIdx >= 0 && cIdx >= 0) setActiveResidualCell([pIdx, cIdx]);
    });
  }, [nodes, edges, lastEdgeId]);

  const loadTemplate = (idx) => {
    const t = TEMPLATES[idx];
    setNodes(t.nodes.map(n => ({ ...n })));
    setEdges(t.edges.map(e => ({ ...e })));
    setSelectedTemplate(idx);
    
    // Auto-highlight first connection for visual effect
    if (t.edges.length > 0) {
      const firstEdge = t.edges[0];
      const source = t.nodes.find(n => n.id === firstEdge.source);
      const target = t.nodes.find(n => n.id === firstEdge.target);
      if (source && target) {
        setLastEdgeId(firstEdge.id || (firstEdge.source + '-' + firstEdge.target));
      }
    }
  };

  const onConnect = useCallback(async (params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    if (!sourceNode || !targetNode) {
      setEdges((eds) => addEdge(params, eds));
      return;
    }

    const parentRole = sourceNode.data.role || 'blocked';
    const childRole = targetNode.data.role || 'blocked';

    try {
      const res = await fetch(`${API_BASE}/api/security/calculate-delegation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_token: parentRole, safety_budget: childRole }),
      });
      const data = await res.json();

      // Update stage timeline
      setLastStages(data.stages);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1500);

      // Highlight matrix cells
      const parentIdx = ROLES.indexOf(parentRole);
      const childIdx = ROLES.indexOf(childRole);
      const resultIdx = ROLES.indexOf(data.result);

      if (parentIdx >= 0 && resultIdx >= 0) {
        setActiveMonoidCell([parentIdx, resultIdx]);
      }
      if (parentIdx >= 0 && childIdx >= 0) {
        setActiveResidualCell([parentIdx, childIdx]);
      }

      // Circuit breaker: if residual is 'none', block connection
      if (data.result === 'none' && parentRole !== 'none') {
        setModal({
          title: '🔒 Security Violation',
          message: `DELEGATION DENIED!\n\nThe budget '${childRole}' is too restrictive for parent metadata '${parentRole}'.\n\nQuantale Check: a ⊗ b ≤ c failed for all b > blocked.`,
          type: 'error',
        });
        return;
      }

      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: COLORS.celadon, strokeWidth: 2 } }, eds));
      setLastEdgeId(params.source + '-' + params.target);
    } catch (err) {
      console.error(err);
      setEdges((eds) => addEdge(params, eds));
    }
  }, [nodes, setEdges, setIsAnimating, setLastStages, setModal]);

  const addNode = () => {
    const id = `${nodes.length + 1}`;
    const newNode = {
      id: String(Date.now()),
      type: 'serviceNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `Service ${nodes.length + 1}`, role: 'blocked' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const evaluatePipeline = async () => {
    if (nodes.length === 0) return;
    const roles = nodes.map(n => n.data.role || 'blocked');

    try {
      const res = await fetch(`${API_BASE}/api/security/evaluate-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      });
      const data = await res.json();
      
      const hasBlocked = roles.includes('blocked');
      
      setModal({
        title: hasBlocked ? '🛑 Total Security Blockage' : 'Lattice Join (Effective Permission)',
        message: hasBlocked 
          ? `CRITICAL FAILURE!\n\nOne or more services are BLOCKED. In a Zero-Trust environment, this poisons the entire join. Access is denied system-wide.`
          : `The Least Upper Bound (⋁) of your current roles is: ${data.result}.\n\n(Roles evaluated: ${roles.join(' ∨ ')})`,
        type: hasBlocked ? 'error' : 'info',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const verifyDelegation = async () => {
    if (edges.length === 0) return;
    
    let allValid = true;
    let details = [];

    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) continue;

      const a = source.data.role;
      const c = target.data.role;
      
      const res = await fetch(`${API_BASE}/api/security/calculate-delegation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_token: a, safety_budget: c }),
      });
      const data = await res.json();
      
      if (data.result === 'blocked' && a !== 'blocked') {
        allValid = false;
        details.push(`❌ ${source.data.label} → ${target.data.label} : VIOLATION`);
      } else {
        details.push(`✅ ${source.data.label} → ${target.data.label} : Secure (Max Token: ${data.result})`);
      }
    }

    setModal({
      title: allValid ? '🛡️ Infrastructure Audit Secure' : '🚨 Infrastructure Vulnerability',
      message: details.join('\n'),
      type: allValid ? 'info' : 'error',
    });
  };

  const composePipeline = async () => {
    if (nodes.length === 0) return;
    // Get nodes in topological order (simple: just use node order)
    const roles = nodes.map(n => n.data.role || 'blocked');

    try {
      const res = await fetch(`${API_BASE}/api/security/compose-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: roles }),
      });
      const data = await res.json();
      setLastStages(data.stages);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1500);
      setModal({
        title: 'Pipeline Composition',
        message: `Composed token tier: ${data.result} (Monoid product of [${roles.join(', ')}])`,
        type: 'info',
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      background: COLORS.bg,
      color: COLORS.white,
      fontFamily: 'Inter, sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* HEADER */}
      <header style={{
        background: 'rgba(11, 29, 13, 0.98)',
        borderBottom: `2px solid ${COLORS.celadon}`,
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(15px)',
        zIndex: 100,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', color: COLORS.celadon, fontWeight: 800, letterSpacing: '-1.5px' }}>
            KRATOS
          </h1>
          <div style={{ fontSize: '15px', color: COLORS.gray, marginTop: '4px', fontStyle: 'italic', fontWeight: 500 }}>
            Quantale-Backed Zero-Trust Token Mint
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select
            value={selectedTemplate}
            onChange={(e) => loadTemplate(Number(e.target.value))}
            style={{
              background: COLORS.bg,
              border: `2px solid ${COLORS.teal}`,
              color: COLORS.celadon,
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {TEMPLATES.map((t, i) => (
              <option key={i} value={i}>{t.name}</option>
            ))}
          </select>
          <button onClick={() => { setNodes([]); setEdges([]); }} style={{
            background: 'rgba(230, 57, 70, 0.1)',
            border: `2px solid ${COLORS.crimson}`,
            color: COLORS.crimson,
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            Clear
          </button>
          <button onClick={addNode} style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            color: COLORS.celadon,
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            + Add Node
          </button>
          <button onClick={evaluatePipeline} style={{
            background: 'rgba(161, 204, 165, 0.2)',
            border: `2px solid ${COLORS.celadon}`,
            color: COLORS.celadon,
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            Evaluate Roles (⋁)
          </button>
          <button onClick={verifyDelegation} style={{
            background: 'rgba(112, 151, 117, 0.2)',
            border: `2px solid ${COLORS.teal}`,
            color: COLORS.teal,
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: '8px',
          }}>
            Verify Delegation (→)
          </button>
          <button onClick={composePipeline} style={{
            background: 'rgba(161, 204, 165, 0.2)',
            border: `2px solid ${COLORS.celadon}`,
            color: COLORS.celadon,
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            Compose Pipeline (⊗)
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* REACT FLOW CANVAS */}
        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={(e, edge) => {
              setModal({
                title: 'Delete Connection?',
                message: `Do you want to remove the link between these two services?`,
                type: 'error',
                onAction: () => {
                  setEdges((eds) => eds.filter((ev) => ev.id !== edge.id));
                  setModal(null);
                }
              });
            }}
            nodeTypes={nodeTypes}
            style={{ background: COLORS.bg }}
          >
            <Background color={COLORS.teal} gap={20} size={1} />
            <Controls style={{ background: COLORS.bgLight, color: COLORS.celadon }} />
            <MiniMap
              style={{ background: COLORS.bgLight }}
              nodeColor={() => COLORS.celadon}
              maskColor="rgba(17, 29, 19, 0.8)"
            />
          </ReactFlow>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{
          width: '450px',
          background: 'rgba(11, 29, 13, 0.9)',
          borderLeft: `1px solid ${COLORS.glassBorder}`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Heatmaps Panel */}
          <div style={{ padding: '24px', borderBottom: `2px solid ${COLORS.glassBorder}` }}>
            <h2 style={{ color: COLORS.white, fontSize: '24px', marginBottom: '32px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Algebraic Engine
            </h2>

            {quantaleState && (
              <>
                <Heatmap
                  title="Monoid Composition (⊗)"
                  labels={quantaleState.monoid_matrix.labels}
                  matrix={quantaleState.monoid_matrix.matrix}
                  activeCell={activeMonoidCell}
                />
                <Heatmap
                  title="Right Residual (→)"
                  labels={quantaleState.residual_matrix.labels}
                  matrix={quantaleState.residual_matrix.matrix}
                  activeCell={activeResidualCell}
                />
              </>
            )}
          </div>

          {/* Stage Timeline */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <StageTimeline stages={lastStages} isAnimating={isAnimating} />
          </div>
        </div>
      </div>

      {/* PREMIUM MODAL SYSTEM */}
      <Modal 
        isOpen={!!modal} 
        onClose={() => setModal(null)}
        title={modal?.title}
        message={modal?.message}
        type={modal?.type}
        onAction={modal?.onAction}
      />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  );
}
