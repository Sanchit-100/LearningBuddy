function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    if (!message) return;

    const chatBox = document.getElementById("chat-box");
    const mode = document.querySelector('input[name="mode"]:checked').value;

    const userDiv = document.createElement("div");
    userDiv.className = "message user";
    userDiv.textContent = message;
    chatBox.appendChild(userDiv);

    inputField.value = "";

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message bot";
    loadingDiv.textContent = "Thinking...";
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `${mode === 'practice' ? 'Generate practice: ' : ''}${message}` })
    })
    .then(res => res.json())
    .then(data => {
        loadingDiv.textContent = data.response || data.error;
        chatBox.scrollTop = chatBox.scrollHeight;
    })
    .catch(err => {
        loadingDiv.textContent = "Error: " + err.message;
    });
}
