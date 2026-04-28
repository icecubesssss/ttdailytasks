// === TT Focus Guard - Blocked Page Logic ===

const QUOTES = [
  "\"Kỷ luật là cầu nối giữa mục tiêu và thành tựu.\" — Jim Rohn",
  "\"Sự tập trung là vũ khí bí mật của người thành công.\"",
  "\"Ê! Quay lại làm việc đi! Mạng xã hội đợi bạn sau! 😤\"",
  "\"Đừng để 5 phút lướt web biến thành 2 tiếng mất tập trung.\"",
  "\"Bạn đang làm rất tốt! Đừng phá hỏng nó bằng sự phân tâm.\"",
  "\"Thành công là tổng của những nỗ lực nhỏ, lặp đi lặp lại mỗi ngày.\"",
  "\"Tương lai thuộc về những ai tin vào vẻ đẹp của ước mơ mình.\" — Eleanor Roosevelt",
  "\"Mỗi phút tập trung hôm nay là một bước tiến cho ngày mai.\"",
  "\"Người chiến thắng không phải người giỏi nhất, mà là người kiên trì nhất.\"",
  "\"Tập trung vào điều quan trọng. Mọi thứ khác đều có thể đợi. 🎯\"",
  "\"Đây không phải lúc để lướt feed. Hãy hoàn thành công việc trước! 💪\"",
  "\"Bạn đã hứa với bản thân sẽ tập trung. Hãy giữ lời hứa đó!\"",
];

document.addEventListener("DOMContentLoaded", async () => {
  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain") || "unknown";
  const label = params.get("label") || domain;

  // Show blocked domain
  document.getElementById("blockedDomain").textContent = `🚫 ${domain}`;

  // Show random quote
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById("quote").textContent = randomQuote;

  // Get focus status
  try {
    const data = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
    
    if (data.focusStartTime) {
      startTimer(data.focusStartTime);
    }
    
    if (data.taskTitle) {
      document.getElementById("taskName").textContent = `📌 ${data.taskTitle}`;
    }
  } catch (e) {
    console.log("Could not get focus status");
  }

  // Back button
  document.getElementById("btnBack").addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  });

  // Rotate quotes
  setInterval(() => {
    const quoteEl = document.getElementById("quote");
    quoteEl.style.opacity = "0";
    quoteEl.style.transform = "translateY(10px)";
    quoteEl.style.transition = "all 0.3s ease";
    
    setTimeout(() => {
      const newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      quoteEl.textContent = newQuote;
      quoteEl.style.opacity = "1";
      quoteEl.style.transform = "translateY(0)";
    }, 300);
  }, 8000);
});

function startTimer(startTime) {
  const update = () => {
    const elapsed = Date.now() - startTime;
    const h = Math.floor(elapsed / 3600000);
    const m = Math.floor((elapsed % 3600000) / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);

    document.getElementById("timer").textContent = 
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  update();
  setInterval(update, 1000);
}
