const buttons = [
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "-"],
  ["0", ".", "^", "+"],
  ["(", ")", "%", "="],
];

const buttonClasses = {
  "/": "operator",
  "*": "operator",
  "-": "operator",
  "+": "operator",
  "=": "operator",
  "%": "function",
  "^": "function",
};

const display =
  typeof document !== "undefined" ? document.getElementById("display") : null;
const resultChip =
  typeof document !== "undefined"
    ? document.getElementById("resultChip")
    : null;
const memoryValue =
  typeof document !== "undefined"
    ? document.getElementById("memoryValue")
    : null;
const historyList =
  typeof document !== "undefined"
    ? document.getElementById("historyList")
    : null;
const themeToggle =
  typeof document !== "undefined"
    ? document.getElementById("themeToggle")
    : null;
const themeLabel =
  typeof document !== "undefined"
    ? document.getElementById("themeLabel")
    : null;
const buttonGrid =
  typeof document !== "undefined" ? document.getElementById("buttons") : null;

let memory = 0;
let history = [];
let theme = "dark";

function safeSetDisplay(value) {
  if (display) {
    display.value = value;
  }
}

function safeSetResult(value) {
  if (resultChip) {
    resultChip.textContent = value;
  }
}

function safeSetMemory(value) {
  if (memoryValue) {
    memoryValue.textContent = value;
  }
}

function updateHistory() {
  if (!historyList) {
    return;
  }

  historyList.innerHTML = history.length
    ? history
        .slice(-5)
        .map(
          (entry) =>
            `<li class="history-item" data-entry="${entry}">${entry}</li>`,
        )
        .join("")
    : '<li class="history-item">No recent calculations yet.</li>';
}

function persistState() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("aurora-calculator-theme", theme);
  localStorage.setItem("aurora-calculator-memory", String(memory));
  localStorage.setItem("aurora-calculator-history", JSON.stringify(history));
}

function restoreState() {
  if (typeof window === "undefined") {
    return;
  }

  const storedTheme = localStorage.getItem("aurora-calculator-theme");
  const storedMemory = localStorage.getItem("aurora-calculator-memory");
  const storedHistory = localStorage.getItem("aurora-calculator-history");

  if (storedTheme) {
    theme = storedTheme;
  }

  if (storedMemory) {
    memory = Number(storedMemory);
  }

  if (storedHistory) {
    history = JSON.parse(storedHistory);
  }
}

function applyTheme(nextTheme = theme) {
  if (typeof document === "undefined") {
    return;
  }

  theme = nextTheme;
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  if (themeLabel) {
    themeLabel.textContent = theme === "dark" ? "Dark mode" : "Light mode";
  }
  persistState();
}

function appendToDisplay(input) {
  const current = display ? display.value : "";
  if (input === "=" || input === "Enter") {
    calculate();
    return;
  }

  safeSetDisplay(`${current}${input}`);
  updatePreview();
}

function updatePreview() {
  const current = display ? display.value : "";
  if (!current) {
    safeSetResult("0");
    return;
  }

  const parsed = evaluateExpression(current);
  safeSetResult(parsed === null ? "—" : parsed);
}

function calculate() {
  const current = display ? display.value : "";
  if (!current) {
    safeSetDisplay("");
    safeSetResult("0");
    return;
  }

  const result = evaluateExpression(current);
  if (result === null) {
    safeSetResult("Error");
    return;
  }

  safeSetDisplay(String(result));
  safeSetResult(String(result));
  history = [...history, `${current} = ${result}`].slice(-8);
  updateHistory();
  persistState();
}

function clearDisplay() {
  safeSetDisplay("");
  safeSetResult("0");
}

function backspace() {
  if (!display) {
    return;
  }
  safeSetDisplay(display.value.slice(0, -1));
  updatePreview();
}

function copyResult() {
  const value = resultChip ? resultChip.textContent : "";
  if (typeof navigator !== "undefined" && navigator.clipboard && value) {
    navigator.clipboard.writeText(value);
  }
}

function applyMemory(operation) {
  const current = display ? display.value : "";
  const parsed = evaluateExpression(current);
  if (parsed === null || Number.isNaN(parsed)) {
    return;
  }

  if (operation === "add") {
    memory += parsed;
  } else if (operation === "subtract") {
    memory -= parsed;
  } else if (operation === "clear") {
    memory = 0;
  } else if (operation === "recall") {
    safeSetDisplay(String(memory));
    safeSetResult(String(memory));
    return;
  }

  safeSetMemory(String(memory));
  persistState();
}

function evaluateExpression(expression) {
  if (typeof expression !== "string") {
    return null;
  }

  const normalized = expression.trim();
  if (!normalized) {
    return null;
  }

  if (/of/i.test(normalized)) {
    return null;
  }

  const sanitized = normalized
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\^/g, "**")
    .replace(/%/g, "/100");

  if (!/^[0-9.+\-*/()\s]+$/.test(sanitized)) {
    return null;
  }

  try {
    return Number(Function(`"use strict"; return (${sanitized});`)());
  } catch (error) {
    return null;
  }
}

function renderButtons() {
  if (!buttonGrid) {
    return;
  }

  buttonGrid.innerHTML = buttons
    .flat()
    .map((label) => {
      const className = `btn ${buttonClasses[label] || ""}`.trim();
      return `<button type="button" class="${className}" data-value="${label}">${label}</button>`;
    })
    .join("");
}

function handleButtonPress(event) {
  const target = event.target.closest("button[data-value]");
  if (!target) {
    return;
  }

  const value = target.dataset.value;
  if (value === "=") {
    calculate();
  } else if (value === "%") {
    appendToDisplay("%");
  } else {
    appendToDisplay(value);
  }
}

function init() {
  restoreState();
  renderButtons();
  applyTheme(theme);
  updateHistory();
  safeSetMemory(String(memory));
  safeSetResult("0");

  buttonGrid?.addEventListener("click", handleButtonPress);
  themeToggle?.addEventListener("click", () =>
    applyTheme(theme === "dark" ? "light" : "dark"),
  );

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "backspace") {
        backspace();
      } else if (action === "clear") {
        clearDisplay();
      } else if (action === "copy") {
        copyResult();
      } else if (action === "history-toggle") {
        const isVisible =
          document.querySelector(".history-card")?.style.display !== "none";
        document.querySelector(".history-card").style.display = isVisible
          ? "none"
          : "block";
      } else if (action === "memory-clear") {
        applyMemory("clear");
      } else if (action === "memory-recall") {
        applyMemory("recall");
      } else if (action === "memory-add") {
        applyMemory("add");
      } else if (action === "memory-subtract") {
        applyMemory("subtract");
      }
    });
  });

  display?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      calculate();
    }
    if (event.key === "Escape") {
      clearDisplay();
    }
  });

  historyList?.addEventListener("click", (event) => {
    const item = event.target.closest(".history-item[data-entry]");
    if (!item) {
      return;
    }
    const expression = item.dataset.entry.split(" = ")[0];
    safeSetDisplay(expression);
    updatePreview();
  });
}

if (typeof document !== "undefined") {
  init();
}

module.exports = {
  evaluateExpression,
};
