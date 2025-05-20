from drive_loader import fetch_files_from_drive
from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredWordDocumentLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_community.chat_models import ChatOpenAI
from langchain.tools import Tool

def load_documents(file_paths):
    docs = []
    for path in file_paths:
        if path.endswith(".pdf"):
            docs.extend(PyPDFLoader(path).load())
        elif path.endswith(".txt"):
            docs.extend(TextLoader(path).load())
        elif path.endswith(".docx"):
            docs.extend(UnstructuredWordDocumentLoader(path).load())
    return docs

def build_vectorstore(documents):
    embeddings = HuggingFaceEmbeddings()
    return FAISS.from_documents(documents, embeddings)

def build_rag_tool_from_drive(folder_id: str):
    files = fetch_files_from_drive(folder_id)
    docs = load_documents(files)
    vectordb = build_vectorstore(docs)

    llm = ChatOpenAI(
    model_name="llama3-70b-8192",  # or "llama3-70b-8192"
    temperature=0.7
    )
    
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vectordb.as_retriever(search_kwargs={"k": 3}),
        chain_type="stuff"
    )

    return Tool.from_function(
        func=lambda q: qa.run(q),
        name="DriveRAGTool",
        description="Answers questions from documents in a shared Google Drive folder."
    )
