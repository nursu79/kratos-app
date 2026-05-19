# Kratos Official Testing Matrix

Use this guide to verify every mathematical law of your Quantale Engine before you submit.

---

## 1. Lattice Join (⋁) - "Role Aggregation"
**Scenario**: A user belongs to multiple teams/roles simultaneously.
-   **Setup**: Clear canvas. Add 2 nodes: `standard` and `blocked`.
-   **Action**: Click **"Evaluate Roles (⋁)"**.
-   **Expected Outcome**: **ERROR MODAL (Blocked)**.
-   **Why?**: Our security audit treats `blocked` as a "System Poison." Even if you have `standard` permissions, a single `blocked` component in your environment fails the audit.
-   **Math Law**: While standard math says $\bot \vee a = a$, a Zero-Trust implementation uses "Short-circuit Nullification" for safety.

## 2. Monoid Product (⊗) - "Policy Intersection"
**Scenario**: A request flows through a chain of services.
-   **Setup**: Load **"GitHub Actions Cloud Push"** template.
-   **Action**: Click **"Compose Pipeline (⊗)"**.
-   **Expected Outcome**: `limited`.
-   **Why?**: Even though the Runner is `unlimited`, it calls a `limited` Test Step. The whole pipeline is now limited to that depth.
-   **Math Law**: $a \otimes b = \min(a, b)$ in this domain.

## 3. Right Residual (→) - "Secure Delegation"
**Scenario**: Parent service $a$ wants to delegate a token $b$ to a child service with budget $c$.
-   **Setup**: Clear canvas. Add Parent ("Auth") and Child ("DB").
-   **Roles**: Set Parent to `standard`, Child to `limited`.
-   **Action**: Drag a connection from Parent to Child.
-   **Expected Outcome**: **ERROR MODAL** (Security Violation).
-   **Why?**: You cannot delegate a `standard` capability to a service that only has a `limited` security budget.
-   **Math Law**: $b \le a \to c$. If the "safety gap" is zero, the connection is dead.

## 4. Annihilation (The "Blocked" Rule)
**Scenario**: A critical failure in any part of the chain.
-   **Setup**: Load any template. Change ONE node to `blocked`.
-   **Action**: Click **"Compose Pipeline (⊗)"**.
-   **Expected Outcome**: `blocked`.
-   **Math Law**: $\bot$ (bottom) is the absorbing element for the monoid product. One "blocked" service kills the whole token's validity.

## 5. Identity (The "Unlimited" Rule)
**Scenario**: Transparent security proxy.
-   **Setup**: Clear canvas. Node A (`unlimited`), Node B (`standard`).
-   **Action**: Click **"Compose Pipeline (⊗)"**.
-   **Expected Outcome**: `standard`.
-   **Math Law**: $\top$ (top) is the identity element. `unlimited` doesn't restrict the roles below it.

---

### Final Check for Mentor:
Show your mentor the **Algebraic Engine** sidebar. 
Move your mouse over the **Monoid Composition Matrix**. Notice how it lights up to show exactly which entry matches your current calculation!
