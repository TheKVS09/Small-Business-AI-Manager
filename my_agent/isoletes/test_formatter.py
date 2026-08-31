import asyncio

from .presentation.formatter import format_agent_response


async def main():

    raw_response = """
Current 30-day revenue: ₹668,450

Previous 30-day revenue: ₹1,371,306

Revenue change: -51.44%

Total orders: 405

Top selling product:
Product P001

The business is experiencing a significant decline in revenue.

Recommended actions:
1. Review underperforming products.
2. Launch targeted promotions.
3. Focus on high-value customers.
"""

    print("\n--- Formatting Response ---\n")

    result = await format_agent_response(raw_response)

    print("Title:", result.title)
    print("Summary:", result.summary)

    print("\nKPIs:")

    for kpi in result.kpis:
        print(
            f"- {kpi.label}: "
            f"{kpi.value} "
            f"({kpi.change or 'N/A'})"
        )

    print("\nSections:")

    for section in result.sections:
        print(f"- {section.title} [{section.type}]")


if __name__ == "__main__":
    asyncio.run(main())