import asyncio

from .runner import run_agent
from .sales_agent import sales_agent
from .presentation.formatter import format_agent_response


async def main():

    user_request = """
Analyze my sales performance for the current period.

Identify important trends, customer behavior,
product performance, inventory risks, and sales opportunities.
"""

    print("\n--- RUNNING SALES AGENT ---\n")

    sales_result = await run_agent(
        sales_agent,
        user_request,
        app_name="sales_test",
        user_id="test_user",
    )

    print("\n--- RAW SALES RESULT ---\n")
    print(sales_result)

    print("\n--- FORMATTING SALES RESULT ---\n")

    formatted_result = await format_agent_response(
        sales_result
    )

    print("\n--- PRESENTATION RESULT ---\n")

    print(
        formatted_result.model_dump_json(
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())