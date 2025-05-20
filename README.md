
# 🤖 Learning Buddy – AI-Powered Educational Assistant

![Learning Buddy Logo](images/logo.png)

Learning Buddy is an interactive AI-powered educational assistant that helps users learn from their own documents. It combines question answering, interactive quizzes, personalized recommendations, and progress tracking in one intuitive interface.

---

## 🚀 Features

- 🔍 **Question Answering** – Ask questions about your document content using RAG (Retrieval-Augmented Generation)
- 🧠 **Interactive Quizzes** – Generate custom practice questions from your documents
- 📊 **Learning Analytics** – Track your performance and get recommendations on areas to improve
- 🤖 **Slack Integration** – Share your learning progress with instructors or teams

![Learning Buddy Interface](images/interface.png)

---

## 📑 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [API Setup](#api-setup)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Folder Structure](#folder-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✅ Prerequisites

- Python 3.8 or higher  
- Access to Google Cloud Console (for Drive API)  
- OpenAI or Groq API key  
- (Optional) Slack workspace admin access for report integration  
- Basic knowledge of command line usage  

---

## 💻 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/learning-buddy.git
cd learning-buddy
```

### 2. Set up a virtual environment

#### For Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

#### For macOS/Linux:

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

## ⚙️ API Setup

### 1. Google Drive API Setup

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project
- Enable **Google Drive API**
- Go to **APIs & Services → Credentials**
- Click **Create Credentials → OAuth Client ID**
  - Application type: **Desktop App**
- Download the credentials as `client_secrets.json`
- Place `client_secrets.json` inside your project root

### 2. OpenAI / Groq API Setup

#### For Groq:

- Visit [https://console.groq.com](https://console.groq.com)
- Generate a new API key

#### For OpenAI:

- Go to [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
- Generate and copy your API key

### 3. (Optional) Slack API Setup

#### Using Webhook:

- Go to [Slack API](https://api.slack.com/apps)
- Create new app → Enable **Incoming Webhooks**
- Add new webhook to workspace → choose a channel
- Copy webhook URL

#### Using Bot Token (Recommended):

- Under **OAuth & Permissions**, add the following scopes:
  - `chat:write`
  - `chat:write.public`
- Click **Install to Workspace**
- Copy the `xoxb-` token

---

## 🧾 Configuration

### 1. Create a `.env` file in your root directory:

```env
# API Keys
OPENAI_API_KEY=your_openai_key_here
GROQ_API_KEY=your_groq_key_here

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here

# Flask
FLASK_SECRET_KEY=your_random_secret_key

# Slack Integration (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_DEFAULT_CHANNEL=learning-buddy-reports
```

### 2. Get your Google Drive folder ID

Example URL:
```
https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i
```

Your folder ID is:
```
1a2b3c4d5e6f7g8h9i
```

---

## 🚀 Usage Guide

### 1. Start the application

```bash
python app.py
```

Then open [http://localhost:5000](http://localhost:5000) in your browser.

### 2. Authenticate Google Drive (first-time only)

- Terminal shows an auth link  
- Open it in browser → login → allow access  
- Copy the code → paste it back into the terminal

### 3. Application Modes

#### 🔍 Ask Questions Mode
- Ask anything about your uploaded docs
- Uses RAG to fetch context-aware answers

#### 🧠 Practice Quiz Mode
- Enter a topic to generate MCQs
- Choose options to get instant feedback

#### 📊 Recommended Mode
- View weakest topics based on past sessions
- Click "Practice" to revisit low scores

#### 📤 Slack Report Mode
- After quiz, click "Send Report to Slack"
- Enter name & optional channel
- View report in Slack

---

## 📂 Folder Structure

```text
LearningBuddy/
├── app.py                  # Main Flask app
├── drive_loader.py         # Loads docs from Google Drive
├── rag_tool.py             # Handles RAG logic & vector DB
├── static/
│   ├── script.js
│   └── styles.css
├── templates/
│   └── index.html
├── tools/
│   └── practice_tool.py
├── utils/
│   └── slack_reporter.py
├── db/
│   └── question_db.py
├── docs/                   # Your uploaded PDFs/TXTs
├── client_secrets.json     # Google auth config
├── .env                    # Environment config
└── requirements.txt        # Python dependencies
```

---

## 🛠 Troubleshooting

- ❌ **Error: No module named 'tf_keras'**  
  → Run `pip install tf-keras`

- ❌ **Drive File Not Found**  
  → Check that the folder ID is correct and shared publicly

- ❌ **Embeddings empty / FAISS crash**  
  → Ensure your Drive folder has valid `.pdf` or `.txt` files

- ❌ **Slack not working**  
  → Re-check webhook URL or bot token scopes

---

## 🤝 Contributing

Pull requests and ideas are welcome!  
Feel free to fork, improve, and submit PRs for enhancements or bug fixes.

---

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using LangChain, Flask, and the power of LLMs.
