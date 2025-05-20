import requests
import json
import os
from datetime import datetime
import time
from dotenv import load_dotenv

load_dotenv()

class SlackReporter:
    def __init__(self):
        self.webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        self.bot_token = os.getenv("SLACK_BOT_TOKEN")
        self.default_channel = os.getenv("SLACK_DEFAULT_CHANNEL", "learning-buddy-reports")
    
    def send_report(self, session_data, channel=None):
        """
        Send formatted session report to Slack
        
        Args:
            session_data (dict): Dictionary containing session data
            channel (str): Optional channel override
        
        Returns:
            dict: Response from Slack API
        """
        if not self.webhook_url and not self.bot_token:
            return {"error": "Slack credentials not configured. Please add SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN to .env file"}
        
        # Format the report blocks for Slack
        blocks = self._format_report_blocks(session_data)
        
        # If we have a bot token, use the chat.postMessage API (more features)
        if self.bot_token:
            return self._send_with_bot(blocks, channel or self.default_channel)
        
        # Otherwise fall back to webhook
        return self._send_with_webhook(blocks)
    
    def _send_with_bot(self, blocks, channel):
        """Send message using Slack Bot API"""
        headers = {
            "Authorization": f"Bearer {self.bot_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "channel": channel,
            "text": "Learning Buddy Session Report",
            "blocks": blocks
        }
        
        response = requests.post(
            "https://slack.com/api/chat.postMessage",
            headers=headers,
            data=json.dumps(payload)
        )
        
        return response.json()
    
    def _send_with_webhook(self, blocks):
        """Send message using Slack Webhook"""
        payload = {
            "text": "Learning Buddy Session Report",
            "blocks": blocks
        }
        
        response = requests.post(
            self.webhook_url,
            data=json.dumps(payload),
            headers={'Content-Type': 'application/json'}
        )
        
        return {"status": response.status_code, "text": response.text}
    
    def _format_report_blocks(self, session_data):
        """Format session data into Slack blocks"""
        # Format timestamp
        timestamp = datetime.fromtimestamp(session_data.get("end_time", time.time()))
        formatted_date = timestamp.strftime("%B %d, %Y at %I:%M %p")
        
        # Calculate session duration
        duration_mins = session_data.get("duration_minutes", 0)
        
        # Get quiz data
        total_quizzes = session_data.get("total_quizzes", 0)
        correct_answers = session_data.get("correct_answers", 0)
        total_questions = session_data.get("total_questions", 0)
        accuracy = 0
        if total_questions > 0:
            accuracy = (correct_answers / total_questions) * 100
        
        # Format topic data
        topics = session_data.get("topics", [])
        topic_list = ""
        
        if topics:
            topic_items = []
            for topic in topics:
                topic_name = topic.get("name", "Unknown")
                topic_score = topic.get("score", 0)
                topic_items.append(f"• {topic_name}: {topic_score}% accuracy")
            
            topic_list = "\n".join(topic_items)
        else:
            topic_list = "_No topic data available_"
        
        # Create Slack blocks
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📚 Learning Buddy Session Report",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Session Date:*\n{formatted_date}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Duration:*\n{duration_mins} minutes"
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Quizzes Taken:*\n{total_quizzes}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Overall Score:*\n{correct_answers}/{total_questions} ({accuracy:.1f}%)"
                    }
                ]
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Topic Performance:*"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": topic_list
                }
            }
        ]
        
        # Add footer with user name if available
        if "user_name" in session_data:
            blocks.append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Report for: *{session_data['user_name']}*"
                    }
                ]
            })
        
        return blocks