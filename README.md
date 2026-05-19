# Kratos: Quantale-Backed Zero-Trust Token Mint

A full-stack web application simulating an automated cloud infrastructure pipeline where API tokens are dynamically combined and delegated using a custom **Residuated Quantale Algebraic Engine** built from scratch.

## Architecture

```
kratos-app/
├── backend/
│   ├── main.py              # FastAPI server (API endpoints)
│   ├── quantale_core.py     # 8-stage quantale engine (importable)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   ├── App.jsx          # Main React component (React Flow canvas)
│   │   └── index.css        # Forest Dark theme styles
│   ├── index.html           # HTML entry
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite config with API proxy
└── README.md                # This file
```

## Domain: API Rate Limit Tiers

| Tier | Requests/sec | Description |
|------|-------------|-------------|
| `blocked` | 0 | No requests allowed |
| `limited` | 10 | Minimal access (health checks) |
| `standard` | 100 | Normal production traffic |
| `elevated` | 1000 | High-throughput batch ops |
| `unlimited` | ∞ | No rate limit (internal) |

**⊗ = meet (min)** — Combining tiers gives the more restrictive one (policy intersection)

**Unit = `unlimited`** — Top element, identity for min

**Residual (→)** — Given gateway tier `a` and budget cap `c`, max tier safely delegable

## Quick Start

### Backend
```bash
# Recommendation: use the root entry point for submission compliance
python app.py  
```

Alternatively, from the backend folder:
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Client runs on http://localhost:3000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quantale/state` | GET | Full quantale state + matrices |
| `/api/security/evaluate-role` | POST | Lattice Join (⋁) on role array |
| `/api/security/compose-pipeline` | POST | Monoid product (⊗) on service chain |
| `/api/security/calculate-delegation` | POST | Right residual (a→c) for delegation |
| `/api/security/verify-adjunction` | GET | Full Galois adjunction verification |
| `/api/security/verify-distributivity` | GET | Full distributivity verification |

## 8-Stage Quantale Hierarchy

1. **FiniteSet** — Membership in $Q = \{\text{blocked}, \text{limited}, \text{standard}, \text{elevated}, \text{unlimited}\}$
2. **BinaryRelation** — Ordered pairs $Q \times Q$
3. **Poset** — Reflexive, antisymmetric, transitive $\le$
4. **Lattice** — Join ($\bigvee$) and Meet ($\bigwedge$) for every pair
5. **CompleteLattice** — Arbitrary joins/meets, $\bot=\text{blocked}$, $\top=\text{unlimited}$
6. **Monoid** — Associative $\otimes$ with identity `unlimited`
7. **Quantale** — Distributivity: $a \otimes (b \vee c) = (a \otimes b) \vee (a \otimes c)$
8. **Residuals** — Right residual $a \to c = \max \{b \mid a \otimes b \le c\}$ with Galois adjunction

## Sample Output

When running the application, the backend provides algebraic evaluation logs. For example:

**1. Lattice Join (Effective Permission)**
- Input: `['limited', 'standard']`
- Result: `standard`
- Interpretation: User gets the best available tier.

**2. Monoid Product (Pipeline Composition)**
- Input: `['elevated', 'limited']`
- Result: `limited`
- Interpretation: The pipeline is constrained by its weakest link.

**3. Right Residual (Safe Delegation)**
- Input: `parent='elevated', budget='standard'`
- Result: `standard`
- Interpretation: Max delegatable tier that won't exceed budget.

## Theme
Forest Dark / Carbon Black premium engineering dashboard.
