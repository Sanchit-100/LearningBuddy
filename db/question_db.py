import sqlite3
import os

class QuestionDatabase:
    def __init__(self, db_path="question_data.db"):
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
            
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self.create_tables()
    
    def create_tables(self):
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            question_text TEXT,
            options TEXT,
            correct_answer TEXT,
            topic TEXT,
            explanation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            user_answer TEXT,
            is_correct BOOLEAN,
            answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (question_id) REFERENCES questions (id)
        )
        ''')
        self.conn.commit()
    
    def add_question(self, session_id, question, options, correct_answer, topic, explanation=""):
        options_str = "|".join(options)
        self.cursor.execute(
            """INSERT INTO questions 
               (session_id, question_text, options, correct_answer, topic, explanation) 
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, question, options_str, correct_answer, topic, explanation)
        )
        self.conn.commit()
        return self.cursor.lastrowid
        
    def record_answer(self, question_id, user_answer, is_correct):
        self.cursor.execute(
            "INSERT INTO user_answers (question_id, user_answer, is_correct) VALUES (?, ?, ?)",
            (question_id, user_answer, is_correct)
        )
        self.conn.commit()
    
    def close(self):
        self.conn.close()