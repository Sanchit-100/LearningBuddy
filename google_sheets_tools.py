from langchain.tools import tool
import gspread
from google.oauth2.service_account import Credentials

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
creds = Credentials.from_service_account_file("credentials.json", scopes=SCOPES)
sheet = gspread.authorize(creds).open("MySheet").sheet1  # Replace with your sheet name

@tool
def add_employee(name: str, role: str, age: int) -> str:
    """Add a new employee row to the sheet."""
    sheet.append_row([name, role, age])
    return f"Added {name}, {role}, {age}"

@tool
def get_employee(name: str) -> str:
    """Fetch an employee row by name."""
    rows = sheet.get_all_records()
    for row in rows:
        if row["Name"].lower() == name.lower():
            return f"📄 Found: {row}"
    return f"{name} not found."

@tool
def update_employee(name: str, field: str, new_value: str) -> str:
    """Update an employee's field (Name, Role, Age)."""
    rows = sheet.get_all_records()
    for i, row in enumerate(rows):
        if row["Name"].lower() == name.lower():
            col_index = list(row.keys()).index(field) + 1
            sheet.update_cell(i + 2, col_index + 1, new_value)
            return f"🔄 Updated {name}'s {field} to {new_value}"
    return f"❌ {name} not found."
