import json

import config.db as db


def create_interaction_log(
    interaction_id,
    question_redacted,
    question_hash,
    retrieval_chunks,
    best_score,
    latency_ms,
    fallback,
    fallback_reason,
):
    return db.execute(
        """
        insert into rag_interaction_logs (
            interaction_id,
            question_redacted,
            question_hash,
            retrieval_chunks,
            best_score,
            latency_ms,
            fallback,
            fallback_reason
        )
        values (%s, %s, %s, %s::jsonb, %s, %s, %s, %s)
        returning interaction_id, created_at
        """,
        (
            interaction_id,
            question_redacted,
            question_hash,
            json.dumps(retrieval_chunks, ensure_ascii=False),
            best_score,
            latency_ms,
            fallback,
            fallback_reason,
        ),
        fetch_one_result=True,
    )


def save_feedback(interaction_id, helpful, reason):
    return db.execute(
        """
        update rag_interaction_logs
        set helpful = %s,
            feedback_reason = %s,
            feedback_at = now()
        where interaction_id = %s
        returning interaction_id, helpful, feedback_reason, feedback_at
        """,
        (helpful, reason, interaction_id),
        fetch_one_result=True,
    )
