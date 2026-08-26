from google.adk.agents import Agent
from .tools.get_website_analytics import get_website_analytics

marketing_agent = Agent(
    name="marketing_agent",
    model="gemini-3.5-flash",
    description="Analyzes marketing performance, customer acquisition, campaigns, and conversion opportunities.",
    instruction="""
You are the Marketing Specialist of a small Business AI Manager.
Your responsibility is to analyze website traffic,
conversion performance, acquisition sources, devices,
and product interest.

Use get_website_analytics to retrieve factual data.
Do not invent metrics.

Identify marketing opportunities and problems.
Return concise findings to the parent agent.
""",    
    tools=[get_website_analytics],
)