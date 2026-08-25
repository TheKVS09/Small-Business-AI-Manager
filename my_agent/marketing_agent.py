from google.adk.agents import Agent
from .business_data import get_business_data

marketing_agent = Agent(
    name="marketing_agent",
    model="gemini-3.5-flash",
    description="Analyzes marketing performance, customer acquisition, campaigns, and conversion opportunities.",
    instruction="""
You are the Marketing Specialist for a Small Business AI Manager.

When asked to analyze marketing performance, ALWAYS use the marketing section of 
get_business_data tool before making your analysis.

Focus on:
- Lead generation
- Campaign performance
- Customer acquisition
- Conversion
- Customer engagement
- Retention opportunities

Separate confirmed facts from assumptions.
Never invent data.

Return concise, actionable findings to the manager agent.
""",    
    tools=[get_business_data],
)