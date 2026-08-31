from google.adk.agents import Agent
from google.adk.tools.google_search_tool import GoogleSearchTool


root_agent = Agent(
    name="trend_test_agent",
    model="gemini-3.5-flash",

    description="Test agent for current market trends.",

    instruction="""
Search Google for current product trends in India.

Return ONLY valid JSON.

Use this structure:

{
    "location": "India",
    "trends": [
        {
            "trend": "description",
            "category": "category",
            "event_date": null,
            "demand_direction": "INCREASE",
            "expected_impact": "HIGH",
            "confidence": 80,
            "trend_status": "CURRENT",
            "affected_products": [],
            "confirmed_facts": [],
            "predictions": [],
            "reason": "reason",
            "sources": []
        }
    ]
}

Do not invent facts, dates, statistics, products, or URLs.
""",

    tools=[
        GoogleSearchTool(
            bypass_multi_tools_limit=True
        )
    ],
)