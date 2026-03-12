/* 动态格言轮播 - Banner subtitle */
(function () {
  var quotes = [
    "频谱是机器的语言，诊断是解读的艺术。",
    "HBRB: 在不确定性中寻找确定性的逻辑。",
    "算法是灵魂，C++ 与 Qt 是其坚实的骨架。",
    "从微弱信号中捕捉系统失效的先兆。",
    "Gemini API: 探索生成式 AI 在垂直领域的落地。",
    "Done is better than perfect. | 持续迭代中"
  ];

  var index = 0;
  var intervalId = null;

  function getTarget() {
    return document.querySelector("#todayCard .todayCard-tips");
  }

  function rotate() {
    var el = getTarget();
    if (!el) return;
    el.style.transition = "opacity 0.4s ease";
    el.style.opacity = "0";
    setTimeout(function () {
      index = (index + 1) % quotes.length;
      el.textContent = quotes[index];
      el.style.opacity = "1";
    }, 400);
  }

  function init() {
    var el = getTarget();
    if (!el) return;
    el.textContent = quotes[0];
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(rotate, 5000);
  }

  // Run on DOMContentLoaded and on pjax
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
  // Also try immediately in case DOM is already loaded
  if (document.readyState !== "loading") init();
})();
