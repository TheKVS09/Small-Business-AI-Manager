from fastapi import APIRouter, HTTPException
import requests
import json
import uuid


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


# ============================================================
# ADK CONFIGURATION
# ============================================================

ADK_URL = "https://small-business-agent-176169442203.asia-south1.run.app"
ADK_APP_NAME = "my_agent"


# ============================================================
# DASHBOARD AI PLANNER
# ============================================================

@router.post("/analyze")
def analyze_dashboard(data: dict):

    # ========================================================
    # INPUT
    # ========================================================

    budget = data.get("budget")
    plan_type = data.get("plan_type", "marketing")

    if budget is None:
        raise HTTPException(
            status_code=400,
            detail="budget is required"
        )

    try:
        budget = float(budget)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="budget must be a number"
        )

    # Only allow the three planner modes
    if plan_type not in {
        "marketing",
        "retention",
        "order"
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "plan_type must be marketing, "
                "retention, or order"
            )
        )

    # ========================================================
    # AUTOMATIC USER / SESSION ID
    # ========================================================

    # React does NOT need to create these.
    # A new session is automatically created for each
    # dashboard analysis request.

    user_id = "dashboard_user"

    session_id = str(
        uuid.uuid4()
    )

    # ========================================================
    # DASHBOARD TAG
    # ========================================================

    if plan_type == "marketing":

        tag = "[DASHBOARD_MARKETING_REQUEST]"

    elif plan_type == "retention":

        tag = "[DASHBOARD_RETENTION_REQUEST]"

    else:

        tag = "[DASHBOARD_RESTOCK_REQUEST]"

    # ========================================================
    # DASHBOARD AI INSTRUCTION
    # ========================================================

    message = f"""
{tag}

[DASHBOARD_AI_PLANNER]

You are responding to the AI Business Planner dashboard.

Plan type:
{plan_type}

Available budget:
₹{budget}

Use the appropriate specialist agent and its available
business data to generate the recommendation.

The dashboard requires ONLY valid JSON.

Do not return markdown.
Do not use ```json.
Do not include explanations outside the JSON.

============================================================
MARKETING RESPONSE
============================================================

If the plan type is marketing, return exactly this structure:

{{
    "type": "marketing",
    "budget": {budget},
    "recommendations": [
        {{
            "name": "platform",
            "amount": 0,
            "percentage": 0,
            "retention": 0,
            "reason": "reason based on actual business data"
        }}
    ]
}}

============================================================
RESTOCK RESPONSE
============================================================

If the plan type is order, return exactly this structure:

{{
    "type": "order",
    "budget": {budget},
    "recommendations": [
        {{
            "product_id": "actual product id",
            "name": "actual product name",
            "category": "actual category",
            "current_stock": 0,
            "quantity": 0,
            "amount": 0,
            "reason": "reason based on actual business data"
        }}
    ]
}}

============================================================
RETENTION RESPONSE
============================================================

If the plan type is retention, return exactly this structure:

{{
    "type": "retention",
    "budget": {budget},
    "recommendations": [
        {{
            "customer_id": "actual customer id",
            "name": "actual customer name",
            "reason": "reason based on actual business data"
        }}
    ]
}}

============================================================
DATA RULES
============================================================

Never invent products, customers, platforms, quantities,
amounts, or identifiers.

Use only information returned by the specialist agents
and their tools.

If there is insufficient data to make a recommendation,
return an empty recommendations array rather than
inventing data.

Return ONLY the JSON object.
"""

    # ========================================================
    # ADK REQUEST
    # ========================================================

    payload = {
        "app_name": ADK_APP_NAME,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": {
            "role": "user",
            "parts": [
                {
                    "text": message
                }
            ]
        }
    }

    print("\n======================================")
    print("DASHBOARD → ADK")
    print("======================================")
    print("Plan type:", plan_type)
    print("Budget:", budget)
    print("User ID:", user_id)
    print("Session ID:", session_id)
    print("Tag:", tag)

    # ========================================================
    # SEND TO ADK
    # ========================================================

    try:

        response = requests.post(
            f"{ADK_URL}/run",
            json=payload,
            timeout=180
        )

    except requests.exceptions.ConnectionError:

        raise HTTPException(
            status_code=503,
            detail=(
                "Cannot connect to ADK server "
                "on port 8080."
            )
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

    # ========================================================
    # CHECK ADK RESPONSE
    # ========================================================

    if response.status_code != 200:

        raise HTTPException(
            status_code=502,
            detail={
                "message": "ADK request failed",
                "status": response.status_code,
                "response": response.text
            }
        )

    # ========================================================
    # PARSE ADK RESPONSE
    # ========================================================

    try:

        adk_data = response.json()

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=502,
            detail="ADK returned invalid JSON."
        )

    # ========================================================
    # EXTRACT FINAL AGENT TEXT
    # ========================================================

    answer = None

    if isinstance(adk_data, list):

        for event in reversed(adk_data):

            if not isinstance(event, dict):
                continue

            content = event.get(
                "content",
                {}
            )

            if not isinstance(content, dict):
                continue

            parts = content.get(
                "parts",
                []
            )

            if not isinstance(parts, list):
                continue

            for part in reversed(parts):

                if not isinstance(part, dict):
                    continue

                text = part.get("text")

                if text:
                    answer = text
                    break

            if answer:
                break

    elif isinstance(adk_data, dict):

        answer = adk_data.get("text")

        # Some ADK responses may contain content directly
        if not answer:

            content = adk_data.get(
                "content",
                {}
            )

            if isinstance(content, dict):

                parts = content.get(
                    "parts",
                    []
                )

                for part in reversed(parts):

                    if isinstance(part, dict):

                        text = part.get("text")

                        if text:
                            answer = text
                            break

    if not answer:

        raise HTTPException(
            status_code=502,
            detail="ADK returned no usable response."
        )

    # ========================================================
    # CLEAN RESPONSE
    # ========================================================

    answer = answer.strip()

    # Remove markdown fences if Gemini accidentally adds them
    if answer.startswith("```"):

        if answer.startswith("```json"):
            answer = answer[7:]

        elif answer.startswith("```"):
            answer = answer[3:]

        if answer.endswith("```"):
            answer = answer[:-3]

        answer = answer.strip()

    # ========================================================
    # PARSE FINAL JSON
    # ========================================================

    try:

        result = json.loads(answer)

    except json.JSONDecodeError:

        print("\n======================================")
        print("INVALID AI JSON")
        print("======================================")
        print(answer)

        raise HTTPException(
            status_code=502,
            detail={
                "message": (
                    "Agent did not return "
                    "valid JSON."
                ),
                "raw_response": answer
            }
        )

    # ========================================================
    # VALIDATE RESPONSE
    # ========================================================

    if not isinstance(result, dict):

        raise HTTPException(
            status_code=502,
            detail=(
                "Agent returned an invalid "
                "response structure."
            )
        )

    if "recommendations" not in result:

        result["recommendations"] = []

    if not isinstance(
        result["recommendations"],
        list
    ):

        result["recommendations"] = []

    # ========================================================
    # RETURN SESSION ID
    # ========================================================

    # React does not need this to make the next request.
    # It is returned only for debugging / traceability.

    result["_session_id"] = session_id

    print("\n======================================")
    print("FINAL DASHBOARD RESPONSE")
    print("======================================")

    print(
        json.dumps(
            result,
            indent=2,
            ensure_ascii=False
        )
    )

    return result
