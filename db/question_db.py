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
        
    def get_topic_performance(self):
        """
        Retrieves user performance data grouped by topics
        Returns a list of dictionaries with topic, correct_count, incorrect_count, and accuracy
        """
        self.cursor.execute("""
            SELECT 
                q.topic, 
                SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) as correct_count,
                SUM(CASE WHEN ua.is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count,
                COUNT(*) as total_count,
                ROUND(SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy
            FROM questions q
            JOIN user_answers ua ON q.id = ua.question_id
            GROUP BY q.topic
            ORDER BY accuracy ASC
        """)
        
        results = []
        for row in self.cursor.fetchall():
            results.append({
                "topic": row[0],
                "correct_count": row[1],
                "incorrect_count": row[2],
                "total_count": row[3],
                "accuracy": row[4]
            })
        
        return results
    
    def close(self):
        self.conn.close()