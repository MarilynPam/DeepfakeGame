from pydantic import BaseModel
from typing import Optional

class ResponseCreate(BaseModel):
    user_id: int
    question_id: int
    correct: bool
    response_time_ms: int  # client measures time; send ms
