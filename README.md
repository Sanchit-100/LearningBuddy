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

## 📂 Folder Structure

```text
LearningBuddy/
├── app.py                  # Main Flask application
├── tools/                  # Custom LangChain tools
├── templates/              # HTML templates
├── static/                 # CSS/JS frontend assets
├── db/                     # Local SQLite or question DB
├── rag_tool.py             # RAG vector store logic
├── drive_loader.py         # Google Drive integration (optional)
├── google_sheets_tools.py  # Sheets-based tracking (optional)
├── .env                    # API keys and config (not committed)
└── requirements.txt        # Python dependencies
