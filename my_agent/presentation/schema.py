from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class KPI(BaseModel):
    label: str
    value: str
    change: Optional[str] = None
    trend: Optional[Literal["up", "down", "neutral"]] = None


class Insight(BaseModel):
    title: str
    description: str
    severity: Optional[
        Literal["low", "medium", "high", "critical"]
    ] = None


class Recommendation(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[
        Literal["low", "medium", "high"]
    ] = None


class TableRow(BaseModel):
    values: List[str]


class DataTable(BaseModel):
    title: Optional[str] = None
    columns: List[str]
    rows: List[TableRow]


class ResponseSection(BaseModel):
    title: str

    type: Literal[
        "text",
        "insights",
        "table",
        "recommendations"
    ]

    text: Optional[str] = None
    insights: Optional[List[Insight]] = None
    table: Optional[DataTable] = None
    recommendations: Optional[
        List[Recommendation]
    ] = None


class PresentationResponse(BaseModel):
    title: str

    summary: Optional[str] = None

    kpis: List[KPI] = Field(
        default_factory=list
    )

    sections: List[ResponseSection] = Field(
        default_factory=list
    )