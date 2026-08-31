import asyncio
import traceback

from google.adk.runners import InMemoryRunner
from google.genai import types

from .presentation.agent import presentation_agent


async def main():

    runner = InMemoryRunner(
        agent=presentation_agent,
        app_name="presentation_test"
    )

    session = await runner.session_service.create_session(
        app_name="presentation_test",
        user_id="test_user"
    )

    content = types.Content(
        role="user",
        parts=[
            types.Part(
                text="""
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
            )
        ]
    )

    print("\n--- Starting Presentation Agent ---\n")

    try:

        async for event in runner.run_async(
            user_id="test_user",
            session_id=session.id,
            new_message=content
        ):

            print("EVENT RECEIVED")

            if event.is_final_response():
                print("\n--- FINAL RESPONSE ---\n")
                response_text = event.content.parts[0].text
                print(response_text)

    except Exception as e:

        print("\n--- ACTUAL ERROR ---\n")
        print(type(e).__name__)
        print(str(e))

        print("\n--- FULL TRACEBACK ---\n")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())