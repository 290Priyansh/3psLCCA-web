from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.adapters.web_to_core import AdapterValidationError, calculate_project, validate_project


class LccaRequest(BaseModel):
    project: dict[str, Any] = Field(default_factory=dict)
    analysis_period_years: int = 50
    debug: bool = False


app = FastAPI(title="3psLCCA Web Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/lcca/validate")
def validate_lcca(payload: LccaRequest) -> dict[str, Any]:
    validation = validate_project(payload.project, payload.analysis_period_years)
    return {
        "status": "success" if not validation["errors"] else "error",
        "results": {},
        "computed": {},
        "validation": validation,
    }


@app.post("/api/lcca/calculate")
def calculate_lcca(payload: LccaRequest) -> dict[str, Any]:
    try:
        calculation = calculate_project(
            payload.project,
            payload.analysis_period_years,
            debug=payload.debug,
        )
        return {
            "status": "success",
            **calculation,
        }
    except AdapterValidationError as exc:
        return {
            "status": "error",
            "results": {},
            "computed": {},
            "validation": {
                "errors": exc.errors,
                "warnings": exc.warnings,
            },
        }
    except Exception as exc:
        return {
            "status": "error",
            "results": {},
            "computed": {},
            "validation": {
                "errors": [str(exc)],
                "warnings": [],
            },
        }
