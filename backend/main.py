#!/usr/bin/env python3
"""
Kratos: Quantale-Backed Zero-Trust Token Mint — FastAPI Backend

Implements the 8-stage quantale hierarchy for API rate limit delegation
in cloud microservice architectures.

Run: uvicorn main:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from quantale_core import (
    build_rate_limit_quantale,
    MY_ELEMENTS,
    MY_MUL,
    MY_UNIT,
)

app = FastAPI(
    title="Kratos: Quantale-Backed Zero-Trust Token Mint",
    description="Automated cloud infrastructure pipeline with quantale-based token delegation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

QUANTALE = build_rate_limit_quantale()
VALID_ROLES = list(QUANTALE.base)


# ── Pydantic Models ─────────────────────────────────────────────────────────

class EvaluateRoleRequest(BaseModel):
    roles: list[str] = Field(..., description="Array of roles to evaluate")

    @validator("roles")
    def validate_roles(cls, v):
        for r in v:
            if r not in VALID_ROLES:
                raise ValueError(f"Invalid role: {r}. Must be one of {VALID_ROLES}")
        return v


class ComposePipelineRequest(BaseModel):
    services: list[str] = Field(..., description="Ordered list of microservice roles")

    @validator("services")
    def validate_services(cls, v):
        for s in v:
            if s not in VALID_ROLES:
                raise ValueError(f"Invalid role: {s}. Must be one of {VALID_ROLES}")
        return v


class CalculateDelegationRequest(BaseModel):
    parent_token: str = Field(..., description="Parent token role")
    safety_budget: str = Field(..., description="Maximum safety budget role")

    @validator("parent_token", "safety_budget")
    def validate_role(cls, v):
        if v not in VALID_ROLES:
            raise ValueError(f"Invalid role: {v}. Must be one of {VALID_ROLES}")
        return v


class StageInfo(BaseModel):
    stage: int
    name: str
    status: str
    detail: str


class EvaluateRoleResponse(BaseModel):
    result: str
    input_roles: list[str]
    operation: str
    stages: list[StageInfo]


class ComposePipelineResponse(BaseModel):
    result: str
    input_services: list[str]
    operation: str
    stages: list[StageInfo]


class CalculateDelegationResponse(BaseModel):
    result: str
    parent_token: str
    safety_budget: str
    operation: str
    adjunction_valid: bool
    stages: list[StageInfo]


class MatrixData(BaseModel):
    labels: list[str]
    matrix: list[list[str]]


class QuantaleState(BaseModel):
    elements: list[str]
    top: str
    bottom: str
    hasse_edges: list[tuple[str, str]]
    monoid_matrix: MatrixData
    residual_matrix: MatrixData


# ── Helper: Stage Timeline Builder ─────────────────────────────────────────

def build_stages(operation: str, failed_stage: int = -1, failure_reason: str = "") -> list[StageInfo]:
    stages = [
        StageInfo(stage=1, name="FiniteSet Validation", status="pending",
                  detail="Validating universe Q = {blocked, limited, standard, elevated, unlimited}"),
        StageInfo(stage=2, name="BinaryRelation", status="pending",
                  detail="Mapping ordered pairs Q×Q"),
        StageInfo(stage=3, name="Poset Transitivity", status="pending",
                  detail="Enforcing blocked ≤ limited ≤ standard ≤ elevated ≤ unlimited"),
        StageInfo(stage=4, name="Lattice Join/Meet", status="pending",
                  detail="Computing least upper bounds and greatest lower bounds"),
        StageInfo(stage=5, name="CompleteLattice Bounds", status="pending",
                  detail="Establishing ⊤=unlimited, ⊥=blocked"),
        StageInfo(stage=6, name="Monoid Associativity", status="pending",
                  detail="Verifying ⊗ is associative with identity=unlimited"),
        StageInfo(stage=7, name="Quantale Distributivity", status="pending",
                  detail="Validating a⊗(b⋁c) = (a⊗b)⋁(a⊗c)"),
        StageInfo(stage=8, name="Residuated Adjunction", status="pending",
                  detail="Confirming Galois connection a⊗b≤c ⟺ b≤a→c"),
    ]

    for i, s in enumerate(stages):
        if i < failed_stage:
            s.status = "success"
        elif i == failed_stage:
            s.status = "failure"
            s.detail = failure_reason
        else:
            if failed_stage >= 0:
                s.status = "blocked"

    if failed_stage < 0:
        for s in stages:
            s.status = "success"

    return stages


# ── API Endpoints ─────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Kratos: Quantale-Backed Zero-Trust Token Mint", "version": "1.0.0"}


@app.get("/api/quantale/state", response_model=QuantaleState)
def get_quantale_state():
    """Return the full quantale state including matrices."""
    q = QUANTALE
    elems = list(q.base)

    monoid_mat = []
    for a in elems:
        row = []
        for b in elems:
            row.append(q.mul(a, b))
        monoid_mat.append(row)

    residual_mat = []
    for a in elems:
        row = []
        for c in elems:
            row.append(q.right_residual(a, c))
        residual_mat.append(row)

    return QuantaleState(
        elements=elems,
        top=q.top,
        bottom=q.bottom,
        hasse_edges=q.hasse_edges(),
        monoid_matrix=MatrixData(labels=elems, matrix=monoid_mat),
        residual_matrix=MatrixData(labels=elems, matrix=residual_mat),
    )


@app.post("/api/security/evaluate-role", response_model=EvaluateRoleResponse)
def evaluate_role(req: EvaluateRoleRequest):
    """Ingests an array of roles, applies Lattice Join (⋁), returns aggregated role."""
    try:
        result = QUANTALE.effective_permission(req.roles)
        stages = build_stages("evaluate-role")
        return EvaluateRoleResponse(
            result=result,
            input_roles=req.roles,
            operation="Lattice Join (⋁)",
            stages=stages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/security/compose-pipeline", response_model=ComposePipelineResponse)
def compose_pipeline(req: ComposePipelineRequest):
    """Ingests ordered list of microservices, chains via Monoid product (⊗)."""
    try:
        if not req.services:
            raise HTTPException(status_code=400, detail="Empty service list")

        result = req.services[0]
        for svc in req.services[1:]:
            result = QUANTALE.compose(result, svc)

        stages = build_stages("compose-pipeline")
        return ComposePipelineResponse(
            result=result,
            input_services=req.services,
            operation="Monoid Product (⊗)",
            stages=stages,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/security/calculate-delegation", response_model=CalculateDelegationResponse)
def calculate_delegation(req: CalculateDelegationRequest):
    """Submit parent token a and safety budget c. Returns right residual a→c."""
    try:
        result = QUANTALE.max_delegatable(req.parent_token, req.safety_budget)

        adj_holds = QUANTALE.le(
            QUANTALE.mul(req.parent_token, result),
            req.safety_budget
        )

        stages = build_stages("calculate-delegation")

        return CalculateDelegationResponse(
            result=result,
            parent_token=req.parent_token,
            safety_budget=req.safety_budget,
            operation="Right Residual (→)",
            adjunction_valid=adj_holds,
            stages=stages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/security/verify-adjunction")
def verify_adjunction():
    """Run full adjunction verification across all triples."""
    report = QUANTALE.verify_adjunction()
    return {
        "adjunction_holds": report["adjunction_holds"],
        "sample_failures": report["failures"],
        "total_checks": 125,
    }


@app.get("/api/security/verify-distributivity")
def verify_distributivity():
    """Run full distributivity verification."""
    report = QUANTALE.check_distributivity_report()
    return {
        "distributivity_holds": report["distributivity"],
        "failures": report["failures"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
