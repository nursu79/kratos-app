# Kratos: Quantale-Backed Zero-Trust Token Mint

A professional, full-stack demonstration of **Residuated Quantale Algebraic Engines** applied to zero-trust security architecture. This project models API rate limit delegation as a mathematical lattice optimization problem.

---

## Technical Domain: API Rate Limit Tiers

In this domain, we move beyond simple "pass/fail" permissions. We treat security as a **measurable resource** (throughput) that can be combined, compared, and delegated.

### 1. The Lattice ($Q, \le$)
We define a finite chain of service tiers:
`blocked < limited < standard < elevated < unlimited`

- **Interpretation**: If $a \le b$, then $b$ is a "superior" permission (more throughput) than $a$.
- **Join ($\bigvee$)**: Combining multiple roles (e.g., User has Role A and Role B) results in the **Least Upper Bound**—the best available tier.

### 2. The Monoid ($Q, \otimes, e$)
- **Operation ($\otimes$)**: We use the **Meet/Min** operation.
- **Meaning**: This models **Policy Intersection** in a service pipeline. If a request passes through a "Standard" gateway but the target microservice is "Limited," the effective rate limit of the whole pipeline is **Limited** (the weakest link).
- **Identity ($e$)**: `unlimited` acts as the identity, as it does not restrict any pipeline it is added to.

### 3. The Right Residual ($\to$) — Safe Delegation
The right residual answers the critical security question:
> "Given I have permission level **$a$**, and the child process I'm launching has a budget cap of **$c$**, what is the maximum permission **$b$** I can safely delegate?"

**Mathematical Adjunction**: $a \otimes b \le c \iff b \le a \to c$

---

## Quick Start

### 1. Requirements
- Python 3.10+
- Node.js 18+

### 2. Run the Application

First, install the backend dependencies:
```bash
pip install -r backend/requirements.txt
```

Then, launch the backend from the root:
```bash
python3 app.py
```

Then, in another terminal:
```bash
cd frontend
npm install
npm run dev
```

---

## 8-Stage Implementation Hierarchy
This project builds the algebraic engine from first principles in `backend/quantale_core.py`:

1. **FiniteSet** — Universe of rate limits.
2. **BinaryRelation** — Reflexive-transitive closure for ordered pairs.
3. **Poset** — Validating the partial order properties.
4. **Lattice** — Computing joins and meets.
5. **CompleteLattice** — Handling arbitrary subsets and $\top/\bot$.
6. **Monoid** — Associativity and identity for $\otimes$.
7. **Quantale** — Verifying the distributivity axiom.
8. **Residuals** — Implementing the Galois Adjunction.

---

## Sample Output & Interpretation

The application GUI (React Flow) provides live algebraic evaluations:

| Scenario | Logic | Result | Meaning |
| :--- | :--- | :--- | :--- |
| **Combined Keys** | `standard ∨ limited` | `standard` | User gets the higher tier of their two roles. |
| **Service Chain** | `elevated ⊗ limited` | `limited` | The pipeline performance is capped by the most restrictive tier. |
| **Delegation** | `elevated → standard` | `standard` | An elevated service can safely give "standard" to a child without overshooting. |
| **Delegation** | `limited → elevated` | `unlimited` | Since the parent is already more restrictive than the budget, any delegated tier is "safe." |

---
**Developed for Quantale Training Submission**
