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

const ROLES = ['none', 'read', 'append', 'write', 'admin'];

const API_BASE = 'http://localhost:8000';

// ═════════════════════════════════════════════════════════════════════════════
// MOCK DATA / PRE-POPULATED TEMPLATES
// ═════════════════════════════════════════════════════════════════════════════

const TEMPLATES = [
  {
    name: 'GitHub Actions Cloud Push',
    nodes: [
      { id: '1', type: 'serviceNode', position: { x: 100, y: 100 }, data: { label: 'GitHub Runner', role: 'admin' } },
      { id: '2', type: 'serviceNode', position: { x: 400, y: 50 }, data: { label: 'Build Step', role: 'write' } },
      { id: '3', type: 'serviceNode', position: { x: 400, y: 150 }, data: { label: 'Test Step', role: 'read' } },
      { id: '4', type: 'serviceNode', position: { x: 700, y: 100 }, data: { label: 'AWS Deploy', role: 'admin' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e3-4', source: '3', target: '4' },
    ],
  },
  {
    name: 'Third-Party Log Aggregator Pipe',
    nodes: [
      { id: '1', type: 'serviceNode', position: { x: 100, y: 100 }, data: { label: 'App Server', role: 'write' } },
      { id: '2', type: 'serviceNode', position: { x: 400, y: 50 }, data: { label: 'Log Buffer', role: 'append' } },
      { id: '3', type: 'serviceNode', position: { x: 400, y: 150 }, data: { label: 'Log Parser', role: 'read' } },
      { id: '4', type: 'serviceNode', position: { x: 700, y: 100 }, data: { label: 'Analytics', role: 'read' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
    ],
  },
  {
    name: 'Payment Portal Gateway Setup',
    nodes: [
      { id: '1', type: 'serviceNode', position: { x: 100, y: 100 }, data: { label: 'API Gateway', role: 'admin' } },
      { id: '2', type: 'serviceNode', position: { x: 400, y: 50 }, data: { label: 'Auth Service', role: 'write' } },
      { id: '3', type: 'serviceNode', position: { x: 400, y: 150 }, data: { label: 'Payment Core', role: 'admin' } },
      { id: '4', type: 'serviceNode', position: { x: 700, y: 100 }, data: { label: 'Audit Logger', role: 'append' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e3-4', source: '3', target: '4' },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// SERVICE NODE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const ServiceNode = ({ data, id }) => {
  const [role, setRole] = useState(data.role || 'read');

  useEffect(() => {
    data.role = role;
  }, [role, data]);

  return (
    <div style={{
      background: COLORS.glass,
      border: `1px solid ${COLORS.glassBorder}`,
      borderRadius: '8px',
      padding: '12px 16px',
      minWidth: '140px',
      color: COLORS.celadon,
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      backdropFilter: 'blur(10px)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: COLORS.celadon }} />
      <div style={{ fontWeight: 600, marginBottom: '6px', color: COLORS.white }}>{data.label}</div>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.teal}`,
          color: COLORS.celadon,
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
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
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ color: COLORS.celadon, fontSize: '14px', marginBottom: '10px', fontWeight: 500 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${labels.length + 1}, 1fr)`, gap: '2px' }}>
        <div style={{ width: '36px', height: '36px' }} />
        {labels.map(l => (
          <div key={l} style={{
            color: COLORS.gray,
            fontSize: '10px',
            textAlign: 'center',
            padding: '4px',
            textTransform: 'uppercase',
          }}>{l.slice(0, 3)}</div>
        ))}
        {matrix.map((row, i) => (
          <React.Fragment key={i}>
            <div style={{
              color: COLORS.gray,
              fontSize: '10px',
              textAlign: 'center',
              padding: '4px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>{labels[i].slice(0, 3)}</div>
            {row.map((cell, j) => {
              const isActive = activeCell && activeCell[0] === i && activeCell[1] === j;
              return (
                <div key={j} style={{
                  background: isActive ? COLORS.celadon : COLORS.glass,
                  color: isActive ? COLORS.bg : COLORS.celadon,
                  border: `1px solid ${isActive ? COLORS.celadon : COLORS.glassBorder}`,
                  borderRadius: '3px',
                  padding: '6px 4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  fontWeight: isActive ? 700 : 400,
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
// STAGE TIMELINE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const StageTimeline = ({ stages, isAnimating }) => {
  if (!stages) return null;

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ color: COLORS.celadon, fontSize: '14px', marginBottom: '16px', fontWeight: 500 }}>
        8-Stage Execution Timeline
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
              borderRadius: '6px',
              padding: '8px 12px',
              color: color,
              fontSize: '12px',
              fontFamily: 'Inter, monospace',
              opacity: stage.status === 'pending' ? 0.5 : 1,
              transition: `all 0.4s ease ${delay}s`,
              transform: isAnimating && stage.status === 'success' ? 'translateX(4px)' : 'none',
            }}>
              <span style={{ fontWeight: 600, marginRight: '8px' }}>Stage {stage.stage}</span>
              <span style={{ opacity: 0.8 }}>{stage.name}</span>
              <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.6 }}>{stage.detail}</div>
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

  const loadTemplate = (idx) => {
    const t = TEMPLATES[idx];
    setNodes(t.nodes.map(n => ({ ...n })));
    setEdges(t.edges.map(e => ({ ...e })));
    setSelectedTemplate(idx);
  };

  const onConnect = useCallback(async (params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    if (!sourceNode || !targetNode) {
      setEdges((eds) => addEdge(params, eds));
      return;
    }

    const parentRole = sourceNode.data.role || 'read';
    const childRole = targetNode.data.role || 'read';

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
        setTimeout(() => setActiveMonoidCell(null), 2000);
      }
      if (parentIdx >= 0 && childIdx >= 0) {
        setActiveResidualCell([parentIdx, childIdx]);
        setTimeout(() => setActiveResidualCell(null), 2000);
      }

      // Circuit breaker: if residual is 'none', block connection
      if (data.result === 'none' && parentRole !== 'none') {
        setModal({
          title: 'Delegation Blocked',
          message: `Galois Adjunction Ceiling Violated: ${parentRole} ⊗ ${data.result} ≰ ${childRole}. Connection denied.`,
          type: 'error',
        });
        return; // Don't add edge
      }

      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: COLORS.celadon } }, eds));
    } catch (err) {
      console.error(err);
      setEdges((eds) => addEdge(params, eds));
    }
  }, [nodes]);

  const addNode = () => {
    const id = `${nodes.length + 1}`;
    const newNode = {
      id,
      type: 'serviceNode',
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: { label: `Service ${id}`, role: 'read' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const evaluatePipeline = async () => {
    if (nodes.length === 0) return;
    const roles = nodes.map(n => n.data.role || 'read');

    try {
      const res = await fetch(`${API_BASE}/api/security/evaluate-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      });
      const data = await res.json();
      setLastStages(data.stages);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1500);
      setModal({
        title: 'Role Evaluation',
        message: `Effective permission: ${data.result} (Join of [${roles.join(', ')}])`,
        type: 'info',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const composePipeline = async () => {
    if (nodes.length === 0) return;
    // Get nodes in topological order (simple: just use node order)
    const roles = nodes.map(n => n.data.role || 'read');

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
        background: 'rgba(17, 29, 19, 0.95)',
        borderBottom: `1px solid ${COLORS.glassBorder}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: COLORS.celadon, fontWeight: 600, letterSpacing: '-0.5px' }}>
            KRATOS
          </h1>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginTop: '2px' }}>
            Quantale-Backed Zero-Trust Token Mint
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={selectedTemplate}
            onChange={(e) => loadTemplate(Number(e.target.value))}
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.teal}`,
              color: COLORS.celadon,
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {TEMPLATES.map((t, i) => (
              <option key={i} value={i}>{t.name}</option>
            ))}
          </select>
          <button onClick={addNode} style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            color: COLORS.celadon,
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            + Add Node
          </button>
          <button onClick={evaluatePipeline} style={{
            background: 'rgba(161, 204, 165, 0.15)',
            border: `1px solid ${COLORS.celadon}`,
            color: COLORS.celadon,
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            cursor: 'pointer',
          }}>
            Evaluate Roles (⋁)
          </button>
          <button onClick={composePipeline} style={{
            background: 'rgba(161, 204, 165, 0.15)',
            border: `1px solid ${COLORS.celadon}`,
            color: COLORS.celadon,
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
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
            nodeTypes={nodeTypes}
            fitView
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
          width: '340px',
          background: 'rgba(17, 29, 19, 0.6)',
          borderLeft: `1px solid ${COLORS.glassBorder}`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Heatmaps Panel */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${COLORS.glassBorder}` }}>
            <h2 style={{ color: COLORS.celadon, fontSize: '16px', marginBottom: '16px', fontWeight: 500 }}>
              Algebraic Lookup Matrices
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

      {/* MODAL */}
      {modal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setModal(null)}>
          <div style={{
            background: COLORS.bgLight,
            border: `1px solid ${modal.type === 'error' ? COLORS.crimson : COLORS.celadon}`,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: modal.type === 'error'
              ? '0 0 30px rgba(230, 57, 70, 0.3)'
              : '0 0 30px rgba(161, 204, 165, 0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{
              color: modal.type === 'error' ? COLORS.crimson : COLORS.celadon,
              margin: '0 0 12px 0',
              fontSize: '16px',
            }}>
              {modal.title}
            </h3>
            <p style={{ color: COLORS.white, fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              {modal.message}
            </p>
            <button
              onClick={() => setModal(null)}
              style={{
                marginTop: '16px',
                background: modal.type === 'error' ? COLORS.crimson : COLORS.celadon,
                color: COLORS.bg,
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
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
