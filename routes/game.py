from fastapi import APIRouter
from pydantic import BaseModel
from db import get_connection
from db import update_leaderboard
import db

router = APIRouter()

class SubmitRequest(BaseModel):
    user_id: int
    question_id: int
    selected_id: int
    correct_id: int
    score_earned: int
    response_time_ms: int #for analytics

@router.post("/submit")
def submit_answer(data: SubmitRequest):
    is_correct = int(data.selected_id == data.correct_id)
    # 1) Store this attempt in the ML logging table
    db.record_response(
        user_id=data.user_id,
        question_id=data.question_id,
        correct=is_correct,
        response_time_ms=data.response_time_ms
    )

    # 2) Update leaderboard score
    update_leaderboard(data.user_id, data.score_earned)

    # 3) Recompute user ML tiers (small project = OK to do per submit)
    tiers = db.recompute_difficulty()
    user_tier = tiers.get(data.user_id, "Unrated")

    return {
        "message": "Answer submitted.",
        "earned": data.score_earned,
        "correct": bool(is_correct),
        "tier": user_tier,
    }



@router.get("/random")
def get_random_question():
    conn = get_connection()
    cursor = conn.cursor()

    # Get a random question
    cursor.execute("SELECT * FROM Questions ORDER BY RANDOM() LIMIT 1")
    question = cursor.fetchone()

    if question is None: 
        return {"Error": "No questions found"}

    question_id, question_type, question_text = question

    # Get all associated answers
    cursor.execute("SELECT AnswerID, Correct, AnswerString, Feedback FROM Answers WHERE QuestionID=?", (question_id,))
    answers = cursor.fetchall()

    return {
        "question_id": question_id,
        "question_type": question_type,
        "question_text": question_text,
        "answers": [{"id": aid, "correct":c, "text":atext, "feedback":f} for (aid,c, atext,f) in answers]
    }
