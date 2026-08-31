from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.genai import types


async def run_agent(
    agent: Agent,
    user_message: str,
    app_name: str = "small_business_manager",
    user_id: str = "user",
) -> str:

    runner = InMemoryRunner(
        agent=agent,
        app_name=app_name,
    )

    session = await runner.session_service.create_session(
        app_name=app_name,
        user_id=user_id,
    )

    content = types.Content(
        role="user",
        parts=[
            types.Part(
                text=user_message
            )
        ],
    )

    final_response = None

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=content,
    ):

        if event.is_final_response():

            if (
                event.content
                and event.content.parts
                and event.content.parts[0].text
            ):
                final_response = event.content.parts[0].text

    if final_response is None:
        raise RuntimeError(
            f"Agent '{agent.name}' did not return a response."
        )

    return final_response

