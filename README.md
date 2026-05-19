# Kratos: Quantale-Backed Zero-Trust Token Mint

A full-stack web application simulating an automated cloud infrastructure pipeline where API tokens are dynamically combined and delegated using a custom **Residuated Quantale Algebraic Engine** built from scratch.

## Architecture

```
kratos-app/
├── app.py                # Main Entry Point (compliance bridge)
├── quantale_core.py      # 8-stage quantale engine (compliance core)
├── backend/
│   ├── main.py           # FastAPI server (API endpoints)
│   ├── quantale_core.py  # Shared core logic
│   └── requirements.txt  # Python dependencies
├── frontend/             # React App
└── README.md             # This file
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

---

## Quick Start

### Option 1: Automated (Recommended)
You can start both the backend and frontend automatically using the Makefile:
```bash
make install
make run
```

---

### Option 2: Manual Startup

**Backend:**
```bash
# From the root directory:
python app.py  
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

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

**1. Lattice Join (Effective Permission)**
- Input: `['limited', 'standard']` -> Result: `standard` (Best available tier)

**2. Monoid Product (Pipeline Composition)**
- Input: `['elevated', 'limited']` -> Result: `limited` (Weakest link)

**3. Right Residual (Safe Delegation)**
- Input: `parent='elevated', budget='standard'` -> Result: `standard` (Max safe delegation)

## Theme
Forest Dark / Carbon Black premium engineering dashboard.
