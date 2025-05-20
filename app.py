from flask import Flask, request, render_template, jsonify
import os
from dotenv import load_dotenv
from langchain_community.chat_models import ChatOpenAI
from langchain.agents import initialize_agent
from langchain.agents.agent_types import AgentType

from rag_tool import build_rag_tool_from_drive
from tools.practice_tool import create_practice_tool

load_dotenv()
app = Flask(__name__)
FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID")

llm = ChatOpenAI(
    model_name="llama3-70b-8192",  # or "llama3-70b-8192"
    temperature=0.7
)

rag_tool = build_rag_tool_from_drive(FOLDER_ID)
practice_tool = create_practice_tool(llm)
tools = [rag_tool, practice_tool]
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        answer = agent.run(user_message)
        return jsonify({"response": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
