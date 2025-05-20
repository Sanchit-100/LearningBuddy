from langchain.tools import Tool
from langchain_core.language_models.chat_models import BaseChatModel

def create_practice_tool(llm: BaseChatModel) -> Tool:
    def generate_practice(prompt: str) -> str:
        format_instructions = (
            "Return exactly 5 questions in this format:\n"
            "1. Question text\n"
            "    a) Option 1\n"
            "    b) Option 2\n"
            "    c) Option 3\n"
            "    d) Option 4\n"
            "Answer: b\n"
        )
        final_prompt = (
            f"Generate 5 multiple-choice questions on the topic '{prompt}'.\n"
            f"The questions should be of beginner, intermediate, or advanced level as requested.\n"
            f"{format_instructions}"
        )
        return llm.predict(final_prompt)

    return Tool.from_function(
        func=generate_practice,
        name="PracticeGenerator",
        description="Generates 5 MCQ practice questions based on a given topic and difficulty level. Input should be a short sentence like 'beginner algebra' or 'advanced world history'."
    )
