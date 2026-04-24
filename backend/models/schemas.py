from pydantic import BaseModel

class CVResponse(BaseModel):
    filename: str
    parsed_data: dict
