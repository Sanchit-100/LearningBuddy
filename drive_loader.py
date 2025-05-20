from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive
import os

def fetch_files_from_drive(folder_id: str, download_dir: str = "docs"):
    gauth = GoogleAuth()
    gauth.CommandLineAuth()  # 🔄 Use this instead of LocalWebserverAuth
    drive = GoogleDrive(gauth)

    os.makedirs(download_dir, exist_ok=True)

    file_list = drive.ListFile({'q': f"'{folder_id}' in parents and trashed=false"}).GetList()
    downloaded_files = []

    for file in file_list:
        if file['title'].endswith((".pdf", ".txt", ".docx")):
            file_path = os.path.join(download_dir, file['title'])
            file.GetContentFile(file_path)
            downloaded_files.append(file_path)

    return downloaded_files
