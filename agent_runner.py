from langchain_community.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
# from google_sheets_tools import add_employee, get_employee, update_employee
from rag_tool import build_rag_tool

def create_agent():
    # tools = [add_employee, get_employee, update_employee, build_rag_tool()]
    tools=[build_rag_tool()]
    
    llm = ChatOpenAI(
        model_name="llama3-70b-8192",  # or "gpt-4" if using OpenAI
        temperature=0.7
    )

    return initialize_agent(
        tools,
        llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )
