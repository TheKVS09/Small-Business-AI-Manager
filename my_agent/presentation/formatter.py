import json

from google.adk.runners import InMemoryRunner
from google.genai import types

from .agent import presentation_agent
from .schema import PresentationResponse


async def format_agent_response(
    raw_response: str
) -> PresentationResponse:

    runner = InMemoryRunner(
        agent=presentation_agent,
        app_name="presentation_formatter"
    )

    session = await runner.session_service.create_session(
        app_name="presentation_formatter",
        user_id="system"
    )

    content = types.Content(
        role="user",
        parts=[
            types.Part(
                text=raw_response
            )
        ]
    )

    final_response = None

    async for event in runner.run_async(
        user_id="system",
        session_id=session.id,
        new_message=content
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
            "Presentation Agent did not return a response."
        )

    try:
        data = json.loads(final_response)

    except json.JSONDecodeError as e:
        raise RuntimeError(
            "Presentation Agent returned invalid JSON."
        ) from e

    return PresentationResponse.model_validate(data)