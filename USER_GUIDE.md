# Kratos User Guide: How to Demonstrate Quantale Logic

This guide will help you show off the mathematical power of your application to your mentor.

---

## Scenario 1: The "Combined Key" (⋁ - Lattice Join)
**Goal**: Show how the app calculates the "best" available permission when a user has multiple roles.

1.  Click **"+ Add Node"** 3 times to create new services.
2.  Set their roles to: `limited`, `standard`, and `elevated`.
3.  Click the **"Evaluate Roles (⋁)"** button at the top.
4.  **The "Wow" Moment**: A modal appears showing `elevated`. 
    -   *Explanation for Mentor*: "The app computed the Least Upper Bound (Join). Even though the user has lower roles, the effective permission is the most capable one."

---

## Scenario 2: The "Pipeline Constraint" (⊗ - Monoid Product)
**Goal**: Show how a request is limited by the "weakest link" in a service chain.

1.  Select the **"GitHub Actions Cloud Push"** template from the dropdown.
2.  Look at the services: `GitHub Runner`, `Build Step`, `Test Step`, `AWS Deploy`.
3.  Click **"Compose Pipeline (⊗)"**.
4.  **The "Wow" Moment**: A modal appears showing the combined tier (usually the minimum of the chain).
    -   *Explanation for Mentor*: "This models Policy Intersection. If an admin service calls a limited service, the resulting token is limited. This is the Monoid Product."

---

## Scenario 3: "Safe Delegation" (→ - Right Residual)
**Goal**: This is the "killer feature." Show the app blocking a security violation using the Galois Adjunction.

1.  Clear your nodes or refresh, then add two nodes: `Parent` and `Child`.
2.  Set `Parent` to **`standard`**.
3.  Set `Child` (your safety budget) to **`limited`**.
4.  **Drag a connection** from Parent to Child.
5.  **The "Wow" Moment**: Watch the **"8-Stage Execution Timeline"** on the right side. It will light up step-by-step as it verifies the math. 
6.  **Try to Break It**:
    -   Set `Parent` to **`standard`**.
    -   Set `Child` to **`blocked`**.
    -   Try to connect them.
    -   **Expected**: A red error modal pops up blocking the connection!
    -   *Explanation for Mentor*: "The app uses the Right Residual check. Since connecting these would violate the security budget, the Galois Adjunction ceiling is hit, and the connection is forbidden."

---

## Final Tip
Show your mentor the **Algebraic Lookup Matrices** on the right. Point out that these aren't just hardcoded tables—they are pre-calculated by the 8-stage engine you built from scratch!
