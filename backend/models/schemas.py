from pydantic import BaseModel


class CVResponse(BaseModel):
    filename: str
    parsed_data: dict


class CVFixPayload(BaseModel):
    section: str
    fix: str
    why: str = ""
    how: str = ""


class GenerateFixRequest(BaseModel):
    cv_text: str
    fix: CVFixPayload
    output_format: str


class GenerateFixResponse(BaseModel):
    section: str
    format: str
    rewritten_text: str
    notes: str = ""
