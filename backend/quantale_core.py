"""
quantale_core.py — API Rate Limit Tiers Quantale
Domain: Cloud API gateway rate limiting for microservice architectures

Q = {blocked, limited, standard, elevated, unlimited}
Order: blocked ≤ limited ≤ standard ≤ elevated ≤ unlimited
⊗ = meet (min) — combining two tiers gives the more restrictive one
Unit = unlimited (top element, least restrictive)
Residual = max safe delegation without exceeding budget cap
"""

from __future__ import annotations
from typing import TypeVar, Generic, FrozenSet, Callable, Optional, List, Dict, Any
from itertools import product as cartesian

T = TypeVar("T")

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1 — FiniteSet
# ─────────────────────────────────────────────────────────────────────────────

class FiniteSet(Generic[T]):
    def __init__(self, elements: list[T]) -> None:
        seen = []
        for e in elements:
            if e not in seen:
                seen.append(e)
        self._elements: list[T] = seen

    def __contains__(self, x: object) -> bool:
        return x in self._elements

    def __iter__(self):
        return iter(self._elements)

    def __len__(self) -> int:
        return len(self._elements)

    def __repr__(self) -> str:
        return "{" + ", ".join(str(e) for e in self._elements) + "}"

    def is_subset_of(self, other: "FiniteSet[T]") -> bool:
        return all(e in other for e in self)

    def power_set(self) -> list[FrozenSet[T]]:
        elems = list(self._elements)
        result = []
        for mask in range(1 << len(elems)):
            result.append(frozenset(elems[i] for i in range(len(elems)) if mask & (1 << i)))
        return result

    def cartesian_product(self) -> list[tuple[T, T]]:
        return list(cartesian(self._elements, repeat=2))

    def check_no_duplicates(self) -> bool:
        return len(self._elements) == len(set(str(e) for e in self._elements))

    def to_list(self) -> list[T]:
        return self._elements.copy()


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2 — BinaryRelation
# ─────────────────────────────────────────────────────────────────────────────

class BinaryRelation(Generic[T]):
    def __init__(self, base: FiniteSet[T], pairs: list[tuple[T, T]]) -> None:
        self.base = base
        for a, b in pairs:
            assert a in base and b in base, f"Pair ({a},{b}) outside base set"
        self._pairs: FrozenSet[tuple[T, T]] = frozenset(pairs)

    def __contains__(self, pair: tuple[T, T]) -> bool:
        return pair in self._pairs

    def holds(self, a: T, b: T) -> bool:
        return (a, b) in self._pairs

    def is_reflexive(self) -> bool:
        return all(self.holds(a, a) for a in self.base)

    def is_symmetric(self) -> bool:
        return all(self.holds(b, a) for (a, b) in self._pairs)

    def is_antisymmetric(self) -> bool:
        for (a, b) in self._pairs:
            if a != b and self.holds(b, a):
                return False
        return True

    def is_transitive(self) -> bool:
        for (a, b) in self._pairs:
            for c in self.base:
                if self.holds(b, c) and not self.holds(a, c):
                    return False
        return True

    def closure(self) -> "BinaryRelation[T]":
        elems = list(self.base)
        reach = {(a, b): self.holds(a, b) for a in elems for b in elems}
        for e in elems:
            reach[(e, e)] = True
        for k in elems:
            for a in elems:
                for b in elems:
                    if reach[(a, k)] and reach[(k, b)]:
                        reach[(a, b)] = True
        pairs = [(a, b) for (a, b), v in reach.items() if v]
        return BinaryRelation(self.base, pairs)

    def __repr__(self) -> str:
        pairs = sorted(str(p) for p in self._pairs)
        return f"Relation({', '.join(pairs)})"


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3 — Poset
# ─────────────────────────────────────────────────────────────────────────────

class Poset(Generic[T]):
    def __init__(self, base: FiniteSet[T], leq: BinaryRelation[T]) -> None:
        self.base = base
        self.leq = leq
        self._validate()

    def _validate(self) -> None:
        assert self.leq.is_reflexive(),     "≤ must be reflexive"
        assert self.leq.is_antisymmetric(), "≤ must be antisymmetric"
        assert self.leq.is_transitive(),    "≤ must be transitive"

    def le(self, a: T, b: T) -> bool:
        return self.leq.holds(a, b)

    def lt(self, a: T, b: T) -> bool:
        return self.le(a, b) and a != b

    def comparable(self, a: T, b: T) -> bool:
        return self.le(a, b) or self.le(b, a)

    def upper_bounds(self, subset: list[T]) -> list[T]:
        return [c for c in self.base if all(self.le(x, c) for x in subset)]

    def lower_bounds(self, subset: list[T]) -> list[T]:
        return [c for c in self.base if all(self.le(c, x) for x in subset)]

    def hasse_edges(self) -> list[tuple[T, T]]:
        edges = []
        for a in self.base:
            for b in self.base:
                if self.lt(a, b):
                    between = [c for c in self.base
                               if c != a and c != b
                               and self.lt(a, c) and self.lt(c, b)]
                    if not between:
                        edges.append((a, b))
        return edges

    def __repr__(self) -> str:
        edges = self.hasse_edges()
        return f"Poset({self.base}, covers={edges})"


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4 — Lattice
# ─────────────────────────────────────────────────────────────────────────────

class Lattice(Poset[T]):
    def __init__(self, base: FiniteSet[T], leq: BinaryRelation[T]) -> None:
        super().__init__(base, leq)
        self._validate_lattice()

    def _validate_lattice(self) -> None:
        for a in self.base:
            for b in self.base:
                assert self._find_join(a, b) is not None, f"No join for ({a}, {b})"
                assert self._find_meet(a, b) is not None, f"No meet for ({a}, {b})"

    def _find_join(self, a: T, b: T) -> Optional[T]:
        ubs = self.upper_bounds([a, b])
        candidates = [c for c in ubs if all(self.le(c, d) for d in ubs)]
        return candidates[0] if candidates else None

    def _find_meet(self, a: T, b: T) -> Optional[T]:
        lbs = self.lower_bounds([a, b])
        candidates = [c for c in lbs if all(self.le(d, c) for d in lbs)]
        return candidates[0] if candidates else None

    def join(self, a: T, b: T) -> T:
        result = self._find_join(a, b)
        assert result is not None
        return result

    def meet(self, a: T, b: T) -> T:
        result = self._find_meet(a, b)
        assert result is not None
        return result


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 5 — CompleteLattice
# ─────────────────────────────────────────────────────────────────────────────

class CompleteLattice(Lattice[T]):
    @property
    def top(self) -> T:
        return self.big_join(list(self.base))

    @property
    def bottom(self) -> T:
        return self.big_meet(list(self.base))

    def big_join(self, subset: list[T]) -> T:
        if not subset:
            return self.big_meet(list(self.base))
        result = subset[0]
        for x in subset[1:]:
            result = self.join(result, x)
        return result

    def big_meet(self, subset: list[T]) -> T:
        if not subset:
            candidates = [c for c in self.base
                          if all(self.le(x, c) for x in self.base)]
            assert candidates
            return candidates[0]
        result = subset[0]
        for x in subset[1:]:
            result = self.meet(result, x)
        return result


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 6 — Monoid
# ─────────────────────────────────────────────────────────────────────────────

class MonoidMixin(Generic[T]):
    def __init__(self, mul_fn: Callable[[T, T], T], unit: T) -> None:
        self._mul_fn = mul_fn
        self._unit = unit

    def mul(self, a: T, b: T) -> T:
        return self._mul_fn(a, b)

    @property
    def unit(self) -> T:
        return self._unit

    def check_monoid(self, base: FiniteSet[T]) -> dict:
        elems = list(base)
        result = {"closure": True, "associativity": True, "identity": True,
                  "counterexamples": []}

        for a in elems:
            for b in elems:
                if self.mul(a, b) not in base:
                    result["closure"] = False
                    result["counterexamples"].append(
                        f"closure: {a}⊗{b}={self.mul(a,b)} ∉ Q")

        for a in elems:
            for b in elems:
                for c in elems:
                    lhs = self.mul(self.mul(a, b), c)
                    rhs = self.mul(a, self.mul(b, c))
                    if lhs != rhs:
                        result["associativity"] = False
                        result["counterexamples"].append(
                            f"assoc: ({a}⊗{b})⊗{c}={lhs} ≠ {a}⊗({b}⊗{c})={rhs}")

        for a in elems:
            if self.mul(self._unit, a) != a or self.mul(a, self._unit) != a:
                result["identity"] = False
                result["counterexamples"].append(
                    f"identity: unit⊗{a}={self.mul(self._unit, a)}")

        return result


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 7 — Quantale
# ─────────────────────────────────────────────────────────────────────────────

class Quantale(CompleteLattice[T], MonoidMixin[T]):
    def __init__(
        self,
        base: FiniteSet[T],
        leq: BinaryRelation[T],
        mul_fn: Callable[[T, T], T],
        unit: T,
    ) -> None:
        CompleteLattice.__init__(self, base, leq)
        MonoidMixin.__init__(self, mul_fn, unit)
        self._validate_quantale()

    def _validate_quantale(self) -> None:
        elems = list(self.base)
        for a in elems:
            for b in elems:
                for c in elems:
                    join_bc = self.join(b, c)
                    lhs = self.mul(a, join_bc)
                    rhs = self.join(self.mul(a, b), self.mul(a, c))
                    assert lhs == rhs, (
                        f"Left distributivity fails: {a}⊗({b}⋁{c})={lhs} ≠ ({a}⊗{b})⋁({a}⊗{c})={rhs}"
                    )
                    lhs2 = self.mul(join_bc, a)
                    rhs2 = self.join(self.mul(b, a), self.mul(c, a))
                    assert lhs2 == rhs2, (
                        f"Right distributivity fails: ({b}⋁{c})⊗{a}={lhs2} ≠ ({b}⊗{a})⋁({c}⊗{a})={rhs2}"
                    )

    def check_distributivity_report(self) -> dict:
        elems = list(self.base)
        failures = []
        for a in elems:
            for b in elems:
                for c in elems:
                    jbc = self.join(b, c)
                    if self.mul(a, jbc) != self.join(self.mul(a, b), self.mul(a, c)):
                        failures.append(f"left: {a}⊗({b}⋁{c})")
                    if self.mul(jbc, a) != self.join(self.mul(b, a), self.mul(c, a)):
                        failures.append(f"right: ({b}⋁{c})⊗{a}")
        return {"distributivity": len(failures) == 0, "failures": failures}


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 8 — ResiduatedQuantale
# ─────────────────────────────────────────────────────────────────────────────

class ResiduatedQuantale(Quantale[T]):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._rr_cache: dict[tuple, T] = {}
        self._lr_cache: dict[tuple, T] = {}

    def right_residual(self, a: T, c: T) -> T:
        key = (a, c)
        if key not in self._rr_cache:
            feasible = [b for b in self.base if self.le(self.mul(a, b), c)]
            self._rr_cache[key] = self.big_join(feasible) if feasible else self.bottom
        return self._rr_cache[key]

    def left_residual(self, c: T, b: T) -> T:
        key = (c, b)
        if key not in self._lr_cache:
            feasible = [a for a in self.base if self.le(self.mul(a, b), c)]
            self._lr_cache[key] = self.big_join(feasible) if feasible else self.bottom
        return self._lr_cache[key]

    def verify_adjunction(self) -> dict:
        failures = []
        elems = list(self.base)
        for a in elems:
            for b in elems:
                for c in elems:
                    lhs  = self.le(self.mul(a, b), c)
                    mid  = self.le(b, self.right_residual(a, c))
                    rhs  = self.le(a, self.left_residual(c, b))
                    if not (lhs == mid == rhs):
                        failures.append(
                            f"({a},{b},{c}): a⊗b≤c={lhs}, b≤a→c={mid}, a≤c←b={rhs}"
                        )
        return {"adjunction_holds": len(failures) == 0, "failures": failures[:5]}

    def can_do(self, role: T, required: T) -> bool:
        return self.le(role, required)

    def effective_permission(self, roles: list[T]) -> T:
        return self.big_join(roles)

    def max_delegatable(self, own_permission: T, cap: T) -> T:
        return self.right_residual(own_permission, cap)

    def compose(self, perm_a: T, perm_b: T) -> T:
        return self.mul(perm_a, perm_b)


# ═════════════════════════════════════════════════════════════════════════════
# DOMAIN CONFIGURATION — API Rate Limit Tiers
# ═════════════════════════════════════════════════════════════════════════════

MY_ELEMENTS = ["blocked", "limited", "standard", "elevated", "unlimited"]

MY_DIRECT_EDGES = [
    ("blocked", "limited"),
    ("limited", "standard"),
    ("standard", "elevated"),
    ("elevated", "unlimited"),
]

def MY_MUL(a: str, b: str) -> str:
    """Monoid multiplication: meet (min) on the chain.
    Combining two rate limit tiers gives the more restrictive one."""
    order = {"blocked": 0, "limited": 1, "standard": 2, "elevated": 3, "unlimited": 4}
    idx_a = order[a]
    idx_b = order[b]
    result_idx = min(idx_a, idx_b)
    reverse_order = {v: k for k, v in order.items()}
    return reverse_order[result_idx]

MY_UNIT = "unlimited"


def build_rate_limit_quantale() -> ResiduatedQuantale:
    """Build the API Rate Limit Tiers quantale."""
    Q = FiniteSet(MY_ELEMENTS)
    direct = BinaryRelation(Q, MY_DIRECT_EDGES)
    leq = direct.closure()
    Q_obj = ResiduatedQuantale(Q, leq, MY_MUL, unit=MY_UNIT)
    return Q_obj
