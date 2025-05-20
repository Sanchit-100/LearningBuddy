from flask import Flask, request, render_template, jsonify, session
import os
import uuid
from dotenv import load_dotenv
from langchain_community.chat_models import ChatOpenAI
from langchain.agents import initialize_agent
from langchain.agents.agent_types import AgentType

from rag_tool import build_rag_tool_from_drive
from tools.practice_tool import create_practice_tool, PracticeSession, active_sessions

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", os.urandom(24).hex())
FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID")

llm = ChatOpenAI(
    model_name="llama3-70b-8192",
    temperature=0.7
)

# Get both the RAG tool and the vectorstore
rag_tool, vectorstore = build_rag_tool_from_drive(FOLDER_ID, return_vectorstore=True)
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
    data = request.json
    user_message = data.get("message")
    mode = data.get("mode", "ask")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        if mode == "practice":
            # Check if answering a question
            if "session:" in user_message.lower():
                # Extract session ID and answer
                session_id = user_message.split("session:")[1].split()[0]
                answer = user_message.split("answer:")[1][0]
                
                if session_id in active_sessions:
                    response = active_sessions[session_id].check_answer(answer)
                    return jsonify({"response": response})
                else:
                    return jsonify({"error": "Session expired or not found"})
                    
            # Starting a new practice session
            else:
                topic = user_message.replace("Generate practice:", "").strip()
                session_id = str(uuid.uuid4())
                
                # Create a new practice session
                session = PracticeSession(
                    session_id=session_id,
                    topic=topic,
                    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
                    llm=llm
                )
                
                # Generate questions
                num_questions = session.generate_questions(5)
                if num_questions == 0:
                    return jsonify({
                        "response": "I couldn't generate practice questions on this topic from the available documents. Please try a different topic."
                    })
                    
                # Store session
                active_sessions[session_id] = session
                
                # Return first question
                first_question = session.get_current_question()
                response = f"Practice session created! To answer, include 'session:{session_id} answer:X' in your response.\n\n{first_question}"
                
                return jsonify({"response": response, "session_id": session_id})
        else:
            # Normal question answering
            response = agent.run(user_message)
            return jsonify({"response": response})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)