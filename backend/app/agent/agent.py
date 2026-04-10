from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.agent.callbacks import StructlogCallbackHandler
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import get_agent_tools


async def run_agent(session: AsyncSession, user_message: str, history: list = None) -> str:
    """Run the LangChain agent with the given user message and return the response."""
    llm = ChatOpenAI(
        model="gpt-4o",
        api_key=settings.openai_api_key,
        callbacks=[StructlogCallbackHandler()],
    )

    tools = get_agent_tools(session)
    llm_with_tools = llm.bind_tools(tools)

    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    if history:
        messages.extend(history)
    messages.append(("human", user_message))

    # Agent loop: keep calling tools until the LLM gives a final text response
    while True:
        response = await llm_with_tools.ainvoke(messages)
        messages.append(response)

        if not response.tool_calls:
            return response.content

        # Execute all tool calls
        for tool_call in response.tool_calls:
            tool_fn = next(t for t in tools if t.name == tool_call["name"])
            tool_result = await tool_fn.ainvoke(tool_call["args"])
            messages.append({
                "role": "tool",
                "content": str(tool_result),
                "tool_call_id": tool_call["id"],
            })
