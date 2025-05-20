# 🤖 Learning Buddy – AI-Powered Study Companion

Learning Buddy is an AI-powered education platform that helps students learn smarter by enabling personalized quiz generation, context-based Q&A, and performance tracking — all within a clean, interactive interface.

---

## 🚀 Features

- 🔍 **Ask a Question**  
  Get answers to questions grounded in real learning content using RAG (Retrieval-Augmented Generation).

- 🧠 **Personalized Quiz Generator**  
  Generate topic-specific multiple-choice quizzes using LLMs like Groq or Gemini.

- ⏰ **Nudging System**  
  Sends reminders and practice prompts based on performance and engagement (rule-based logic).

- 📊 **Topic-wise Performance Dashboard**  
  Tracks accuracy, score history, and recommends topics to improve on.

---

## 🛠️ Tech Stack

| Layer                  | Technology                         |
|------------------------|-------------------------------------|
| **Frontend**           | Custom Web UI (HTML/CSS/JS)         |
| **Backend**            | Python                              |
| **LLM APIs**           | Groq API                            |
| **Vector DB (RAG)**    | Pinecone                            |
| **Embeddings**         | OpenAI                              |
| **Database**           | PostgreSQL / Google Sheets          |
| **AI Orchestration**   | LangChain                           |

---

## Folder Structure 

LearningBuddy/
├── __pycache__/               # Cached Python files
├── db/                        # Database-related files
├── docs/                      # Documentation resources (if any)
├── static/                    # Static assets (CSS, JS, icons)
├── templates/                 # HTML templates for frontend rendering
├── tools/                     # Utility scripts and helper modules
│
├── .env.example               # Sample environment variables
├── .gitignore                 # Git ignored files
├── README.md                  # Project documentation
├── requirements.txt           # Python dependencies
│
├── app.py                     # Main application entry point
├── drive_loader.py            # Script to load files from Google Drive
├── google_sheets_tools.py     # Integration logic for Google Sheets
├── question_data.db           # Local database for quiz/question storage
├── rag_tool.py                # Handles RAG-based querying (Pinecone + LLM)
├── tempCodeRunnerFile.py      # Temporary file used during testing

