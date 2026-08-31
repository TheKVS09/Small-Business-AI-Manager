from fastapi import APIRouter, HTTPException
import requests


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"]
)


ADK_URL ="https://small-business-api-176169442203.asia-south1.run.app";
ADK_APP_NAME = "my_agent"


@router.post("/run")
def run_ai(data: dict):

    user_id = data.get("user_id", "frontend-user")
    session_id = data.get("session_id")
    new_message = data.get("new_message")

    if not session_id:
        raise HTTPException(
            status_code=400,
            detail="session_id is required"
        )

    if not new_message:
        raise HTTPException(
            status_code=400,
            detail="new_message is required"
        )

    payload = {
        "app_name": ADK_APP_NAME,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": new_message,
    }

    try:

        response = requests.post(
            f"{ADK_URL}/run",
            json=payload,
            timeout=180
        )

    except requests.exceptions.ConnectionError:

        raise HTTPException(
            status_code=503,
            detail="Cannot connect to ADK on port 8080."
        )

    except requests.exceptions.Timeout:

        raise HTTPException(
            status_code=504,
            detail="ADK request timed out."
        )

    except requests.exceptions.RequestException as e:

        raise HTTPException(
            status_code=502,
            detail=f"ADK request failed: {str(e)}"
        )

    if not response.ok:

        raise HTTPException(
            status_code=502,
            detail={
                "message": "ADK request failed",
                "status": response.status_code,
                "response": response.text
            }
        )

    try:
        return response.json()

    except ValueError:

        raise HTTPException(
            status_code=502,
            detail="ADK returned invalid JSON."
        )