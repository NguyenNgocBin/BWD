import re
import time
import uuid

import flask

import services.chat_service as chat_service
import services.rag_analytics_service as rag_analytics_service


def _request_id():
    supplied = str(flask.request.headers.get("X-Request-ID") or "").strip()
    if supplied and len(supplied) <= 64 and re.fullmatch(r"[A-Za-z0-9._-]+", supplied):
        return supplied
    return str(uuid.uuid4())


def _chat_response(payload, status_code, request_id):
    response = flask.jsonify(payload)
    response.headers["X-Request-ID"] = request_id
    return response, status_code


def handle_chat_error(error, request_id=None):
    trace_id = error.request_id or request_id or str(uuid.uuid4())
    return _chat_response(
        {
            "message": error.message,
            "error_code": error.error_code,
            "request_id": trace_id,
        },
        error.status_code,
        trace_id,
    )


def ask():
    request_id = _request_id()
    started_at = time.perf_counter()
    try:
        data = flask.request.get_json(silent=True) or {}
        result = chat_service.ask_chatbot(data, request_id=request_id)
        return _chat_response(result, 200, request_id)
    except chat_service.ChatError as error:
        return handle_chat_error(error, request_id=request_id)
    except Exception as error:
        latency_ms = max(0, int((time.perf_counter() - started_at) * 1000))
        flask.current_app.logger.exception(
            "chat_technical_error code=internal_error provider=backend latency_ms=%s request_id=%s detail=%s",
            latency_ms,
            request_id,
            error,
        )
        return _chat_response(
            {
                "message": "Chatbot đang gặp lỗi kỹ thuật. Vui lòng thử lại sau.",
                "error_code": "chat_temporarily_unavailable",
                "request_id": request_id,
            },
            500,
            request_id,
        )


def feedback():
    request_id = _request_id()
    started_at = time.perf_counter()
    try:
        data = flask.request.get_json(silent=True) or {}
        result = rag_analytics_service.record_feedback(data)
        return _chat_response({**result, "request_id": request_id}, 200, request_id)
    except rag_analytics_service.RagFeedbackError as error:
        if error.status_code >= 500:
            flask.current_app.logger.warning(
                "chat_technical_error code=feedback_error provider=database latency_ms=%s request_id=%s detail=%s",
                max(0, int((time.perf_counter() - started_at) * 1000)),
                request_id,
                error.message,
            )
        return _chat_response(
            {
                "message": error.message,
                "error_code": "invalid_feedback"
                if error.status_code < 500
                else "feedback_temporarily_unavailable",
                "request_id": request_id,
            },
            error.status_code,
            request_id,
        )
    except Exception as error:
        flask.current_app.logger.exception(
            "chat_technical_error code=feedback_error provider=database latency_ms=%s request_id=%s detail=%s",
            max(0, int((time.perf_counter() - started_at) * 1000)),
            request_id,
            error,
        )
        return _chat_response(
            {
                "message": "Chưa thể ghi nhận phản hồi lúc này.",
                "error_code": "feedback_temporarily_unavailable",
                "request_id": request_id,
            },
            500,
            request_id,
        )


def status():
    request_id = _request_id()
    started_at = time.perf_counter()
    try:
        result = chat_service.get_chat_status(check_source=True)
        return _chat_response(
            {**result, "request_id": request_id},
            200 if result.get("ready") else 503,
            request_id,
        )
    except Exception as error:
        flask.current_app.logger.exception(
            "chat_technical_error code=status_error provider=rag latency_ms=%s request_id=%s detail=%s",
            max(0, int((time.perf_counter() - started_at) * 1000)),
            request_id,
            error,
        )
        return _chat_response(
            {
                "message": "Không đọc được trạng thái chatbot.",
                "error_code": "status_temporarily_unavailable",
                "request_id": request_id,
            },
            500,
            request_id,
        )
