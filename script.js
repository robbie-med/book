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
    // Split the content into sections using headings (# or ##)
    let sections = content.split(/(?=# |## )/);
    let output = "";
    let unlocked = progress;
    
    sections.forEach((section, index) => {
        let lines = section.trim().split("\n");
        let title = lines[0].startsWith("#") ? lines.shift().replace(/#/g, "").trim() : "";
        
        // Find the quiz section marked by %Q%
        let sectionText = lines.join("\n");
        let quizStartIndex = sectionText.indexOf("%Q%");
        
        let regularText = quizStartIndex > -1 ? sectionText.substring(0, quizStartIndex) : sectionText;
        let quizText = quizStartIndex > -1 ? sectionText.substring(quizStartIndex + 3) : "";
        
        // Create the section HTML
        let sectionHTML = `<div class='section ${index > unlocked ? "hidden" : ""}'>`;
        if(title) sectionHTML += `<h3>${title}</h3>`;
        sectionHTML += `<p>${regularText.replace(/\n/g, "<br>")}</p>`;
        
        // If quiz section exists, parse and render it
        if (quizText.trim()) {
            // Parse the quiz questions
            let questionPattern = /(\d+\.\s.*?)(?=\d+\.\s|$)/gs;
            let questionMatches = [...quizText.matchAll(questionPattern)];
            
            if (questionMatches.length === 0) {
                // Try another approach if no matches found
                questionMatches = quizText.split(/(?=\d+\.\s)/).filter(q => q.trim());
            }
            
            questionMatches.forEach((qMatch, qIndex) => {
                let questionBlock = qMatch instanceof Array ? qMatch[0] : qMatch;
                let lines = questionBlock.trim().split("\n");
                let questionText = lines[0].trim();
                
                sectionHTML += `<div class="quiz-question">`;
                sectionHTML += `<p><strong>${questionText}</strong></p>`;
                
                // Process options
                let optionsHTML = "";
                for (let i = 1; i < lines.length; i++) {
                    let line = lines[i].trim();
                    if (line && !line.includes("**정답:**")) {
                        optionsHTML += `<p>${line}</p>`;
                    }
                }
                
                if (optionsHTML) {
                    sectionHTML += `<div class="quiz-options">${optionsHTML}</div>`;
                }
                
                // Render answer input
                let savedAnswer = answers[`${index}-${qIndex}`] || "";
                sectionHTML += `<textarea class='question' data-index='${index}' data-qindex='${qIndex}' placeholder='답변을 입력하세요'>${savedAnswer}</textarea><br>`;
                sectionHTML += `</div>`;
            });
            
            // Add the "Next" button
            if (questionMatches.length > 0) {
                sectionHTML += `<button class='next-btn' data-index='${index}' onclick='saveAnswers(${index})'>다음</button>`;
            }
        }
        
        sectionHTML += `</div>`;
        output += sectionHTML;
    });
    
    document.getElementById("content").innerHTML = output;
    document.getElementById("title").textContent = "Bilingual Markdown Reader";
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
