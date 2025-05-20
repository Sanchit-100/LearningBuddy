import uuid
import re
from typing import Dict, List, Any
from langchain.tools import Tool
from db.question_db import QuestionDatabase
from langchain.chains import RetrievalQA

# Global session storage
active_sessions = {}

class PracticeSession:
    def __init__(self, session_id, topic, retriever, llm):
        self.session_id = session_id
        self.topic = topic
        self.questions = []
        self.current_index = 0
        self.db = QuestionDatabase()
        self.retriever = retriever
        self.llm = llm
        
    def generate_questions(self, num_questions=5):
        qa = RetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=self.retriever,
            chain_type="stuff"
        )
        
        prompt = f"""
        Based ONLY on the provided documents, create {num_questions} multiple-choice questions about {self.topic}.
        Each question must:
        1. Be specific to the content in the retrieved documents
        2. Have four options (A, B, C, D)
        3. Include the correct answer and an explanation
        
        Format:
        QUESTION: [question text]
        A. [option A]
        B. [option B]
        C. [option C]
        D. [option D]
        ANSWER: [correct letter]
        EXPLANATION: [brief explanation]
        TOPIC: [specific subtopic]
        """
        
        result = qa.run(prompt)
        question_blocks = re.split(r'QUESTION:', result)
        
        for block in question_blocks[1:]:  # Skip the first empty block
            try:
                # Extract question text
                question_text = block.split('A.')[0].strip()
                
                # Extract options
                options = []
                option_markers = ['A.', 'B.', 'C.', 'D.']
                for i in range(len(option_markers)):
                    marker = option_markers[i]
                    next_marker = option_markers[i+1] if i < len(option_markers)-1 else 'ANSWER:'
                    option = block.split(marker)[1].split(next_marker)[0].strip()
                    options.append(option)
                
                # Extract correct answer
                answer_match = re.search(r'ANSWER:\s*([A-D])', block)
                if not answer_match:
                    continue
                    
                correct_letter = answer_match.group(1)
                correct_index = ord(correct_letter) - ord('A')
                correct_answer = options[correct_index]
                
                # Extract explanation
                explanation_match = re.search(r'EXPLANATION:\s*(.*?)(?:TOPIC:|$)', block, re.DOTALL)
                explanation = explanation_match.group(1).strip() if explanation_match else ""
                
                # Extract topic
                topic_match = re.search(r'TOPIC:\s*(.*?)$', block, re.DOTALL)
                subtopic = topic_match.group(1).strip() if topic_match else self.topic
                
                # Save question to database
                question_id = self.db.add_question(
                    self.session_id,
                    question_text,
                    options,
                    correct_answer,
                    subtopic,
                    explanation
                )
                
                self.questions.append({
                    'id': question_id,
                    'question': question_text,
                    'options': options,
                    'correct_answer': correct_answer,
                    'explanation': explanation,
                    'correct_letter': correct_letter
                })
                
            except Exception as e:
                print(f"Error parsing question: {e}")
                
        return len(self.questions)
        
    def get_current_question(self):
        if self.current_index >= len(self.questions):
            return None
            
        q = self.questions[self.current_index]
        options_text = "\n".join([f"{chr(65+i)}. {opt}" for i, opt in enumerate(q['options'])])
        
        return f"Question {self.current_index+1} of {len(self.questions)}:\n\n{q['question']}\n\n{options_text}"
        
    def check_answer(self, user_answer):
        if self.current_index >= len(self.questions):
            return "No active question to answer."
            
        q = self.questions[self.current_index]
        user_letter = user_answer.strip().upper()[0] if user_answer.strip() else ""
        
        is_correct = user_letter == q['correct_letter']
        
        # Record the answer in database
        self.db.record_answer(q['id'], user_letter, is_correct)
        
        # Prepare feedback message
        if is_correct:
            feedback = f"✅ Correct! {q['explanation']}"
        else:
            feedback = f"❌ Incorrect. The correct answer is {q['correct_letter']}. {q['explanation']}"
            
        # Move to the next question
        self.current_index += 1
        
        # Check if we have more questions
        if self.current_index < len(self.questions):
            next_question = self.get_current_question()
            return feedback + "\n\n" + next_question
        else:
            return feedback + "\n\nYou've completed all the practice questions!"

def create_practice_tool(llm):
    def handle_practice(query):
        # Check if it's an answer to an existing session
        session_match = re.search(r'session:([a-zA-Z0-9-]+)', query)
        answer_match = re.search(r'answer:([A-Da-d])', query)
        
        if session_match and answer_match:
            session_id = session_match.group(1)
            user_answer = answer_match.group(1)
            
            if session_id in active_sessions:
                return active_sessions[session_id].check_answer(user_answer)
            else:
                return "Session not found. Please start a new practice session."
                
        # Otherwise, create a new practice session
        topic_match = re.search(r'topic:(.+)', query)
        if not topic_match:
            return "Please specify a topic to practice, like 'Generate practice: topic:artificial intelligence'"
            
        topic = topic_match.group(1).strip()
        session_id = str(uuid.uuid4())
        
        # We need access to the vectorstore for question generation
        # This will be connected in app.py
        return f"Please use the updated practice tool through the web interface."
        
    return Tool.from_function(
        func=handle_practice,
        name="PracticeTool",
        description="Generates multiple-choice practice questions from documents and checks user answers."
    )