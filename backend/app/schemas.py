from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    rows: int = Field(ge=2, le=80, default=20)
    cols: int = Field(ge=2, le=80, default=30)
    walls: list[list[int]] = Field(default_factory=list)
    start: list[int] = Field(min_length=2, max_length=2, default_factory=lambda: [10, 5])
    end: list[int] = Field(min_length=2, max_length=2, default_factory=lambda: [10, 24])
    algorithm: str = "astar"
