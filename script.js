let progress = parseInt(localStorage.getItem("progress")) || 0;
let content = "";
let answers = JSON.parse(localStorage.getItem("answers")) || {};

document.addEventListener("DOMContentLoaded", function() {
    if(localStorage.getItem("user")) {
        document.getElementById("loginContainer").classList.add("hidden");
        document.getElementById("appContainer").classList.remove("hidden");
        loadMarkdown();
    }
});

function login() {
    let user = document.getElementById("username").value;
    if(user) {
        localStorage.setItem("user", user);
        document.getElementById("loginContainer").classList.add("hidden");
        document.getElementById("appContainer").classList.remove("hidden");
        loadMarkdown();
    }
}

function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("progress");
    localStorage.removeItem("answers");
    location.reload();
}

function loadMarkdown() {
    fetch("content.md")
        .then(response => response.text())
        .then(text => {
            content = text;
            renderMarkdown();
        });
}

function renderMarkdown() {
    let sections = content.split(/(?=## )/);
    let output = "";
    let unlocked = progress;
    
    sections.forEach((section, index) => {
        let lines = section.trim().split("\n");
        let title = lines[0].startsWith("#") ? lines.shift().replace("#", "").trim() : "";
        let text = lines.join("<br>");
        let questions = text.match(/%Q%(.*?)\n(.*?)\n/g);
        let sectionHTML = `<div class='section ${index > unlocked ? "hidden" : ""}'>`;
        if(title) sectionHTML += `<h3>${title}</h3>`;
        sectionHTML += `<p>${text.replace(/%Q%(.*?)\n(.*?)\n/g, "")}</p>`;
        
        if (questions) {
            questions.forEach((q, qIndex) => {
                let questionText = q.match(/%Q%\n(.*?)\n/)[1].trim();
                let savedAnswer = answers[`${index}-${qIndex}`] || "";
                sectionHTML += `<p><strong>${questionText}</strong></p>`;
                sectionHTML += `<textarea class='question' data-index='${index}' data-qindex='${qIndex}' placeholder='답변을 입력하세요'>${savedAnswer}</textarea><br>`;
            });
            sectionHTML += `<button class='next-btn' data-index='${index}' onclick='saveAnswers(${index})'>다음</button>`;
        }
        sectionHTML += `</div>`;
        output += sectionHTML;
    });
    
    document.getElementById("content").innerHTML = output;
}

function saveAnswers(index) {
    let inputs = document.querySelectorAll(`.section:nth-child(${index+1}) .question`);
    inputs.forEach(input => {
        let qIndex = input.dataset.qindex;
        answers[`${index}-${qIndex}`] = input.value.trim();
    });
    localStorage.setItem("answers", JSON.stringify(answers));
    progress++;
    localStorage.setItem("progress", progress);
    let nextSection = document.querySelectorAll(".section")[progress];
    if (nextSection) nextSection.classList.remove("hidden");
    document.querySelector(`.section:nth-child(${index+1}) .next-btn`).disabled = true;
}
