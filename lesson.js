const STORAGE_KEY = "c-pool-tutor-unlocked-page";
const PAGE_KEY = "c-pool-tutor-current-page";
const CONTENT_KEY = "c-pool-tutor-content-overrides";
const STATS_KEY = "c-pool-tutor-answer-stats";
const root = document;
const pages = Array.from(root.querySelectorAll(".course-page"));
const menuButton = root.querySelector("#menu-button");
const courseMenu = root.querySelector("#course-menu");
const menuItems = Array.from(root.querySelectorAll(".menu-item"));
const prevPage = root.querySelector("#prev-page");
const nextPage = root.querySelector("#next-page");
const introStartPage = root.querySelector("#intro-start-page");
const pageIndicator = root.querySelector("#page-indicator");
const tip = root.querySelector("#code-tip");
const tipTitle = tip.querySelector(".tip-title");
const tipBody = tip.querySelector(".tip-body");
const tokens = Array.from(root.querySelectorAll(".token"));
const codeWindow = root.querySelector(".code-window");
const practiceStatus = root.querySelector("#practice-status");
const practiceQuestions = Array.from(root.querySelectorAll(".practice-question"));
const reinforcementProgress = root.querySelector("#reinforcement-progress");
const reinforcementQuestions = Array.from(root.querySelectorAll(".reinforcement-question"));
const codeSelects = Array.from(root.querySelectorAll(".code-select"));
const codeBlanks = Array.from(root.querySelectorAll(".code-blank"));
const blankQuestion = root.querySelector("#blank-question");
const blankAnswer = root.querySelector("#blank-answer");
const blankCheck = root.querySelector("#blank-check");
const blankFeedback = root.querySelector("#blank-feedback");
const unlockButtons = Array.from(root.querySelectorAll(".unlock-next"));
const valueOptions = Array.from(root.querySelectorAll(".value-option"));
const valuesOptions = root.querySelector("#values-options");
const valuesAction = root.querySelector("#values-action");
const valueFeedback = root.querySelector("#value-feedback");
const aiCommentInputs = Array.from(root.querySelectorAll(".inline-comment-input"));
const aiCommentAction = root.querySelector("#comment-ai-action");
const aiCommentFeedback = root.querySelector("#ai-comment-feedback");
const commentQuestions = Array.from(root.querySelectorAll(".comment-question"));
const commentQuizProgress = root.querySelector("#comment-quiz-progress");
let unlockedPage = Number(localStorage.getItem(STORAGE_KEY) || "0");
const savedPage = Number(localStorage.getItem(PAGE_KEY) || "0");
let currentPage = Number.isFinite(savedPage) ? Math.min(savedPage, unlockedPage, pages.length - 1) : 0;
let currentPracticeQuestion = 0;
let currentCommentQuestion = 0;
let currentReinforcementQuestion = 0;
let commentWasEdited = false;
let blankQuestionIndex = 0;
let blankQuestionOrder = [];

const valueExplanations = {
  independent: "В проектах прямо сказано, что информацию нужно добывать самостоятельно, проверять и сравнивать источники.",
  p2p: "Peer-to-peer означает обучение через обмен знаниями между участниками.",
  practice: "Обучение строится вокруг проектов и проверок, а не вокруг пересказа теории.",
  honesty: "Тексты проектов отдельно подчеркивают, что списывание разрушает смысл обучения.",
  lectures: "Формат Школы 21 не строится вокруг лекций как главного способа обучения.",
  copying: "В материалах прямо сказано не списывать и разбираться до конца, если пользуешься помощью.",
  marks: "Акцент сделан на процессе понимания, проектах и обратной связи, а не на учебе ради оценки.",
  teacher: "Формат предполагает самостоятельность и peer-to-peer, а не ожидание готового объяснения от преподавателя."
};

function applyContentOverrides() {
  if (!root.body.dataset.allowContentOverrides) return;
  const overrides = JSON.parse(localStorage.getItem(CONTENT_KEY) || "{}");
  root.querySelectorAll("[data-edit-key]").forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(overrides, item.dataset.editKey)) {
      item.textContent = overrides[item.dataset.editKey];
    }
  });
}

function recordAnswer(question, button) {
  const stats = JSON.parse(localStorage.getItem(STATS_KEY) || "[]");
  const answer = {
    time: new Date().toISOString(),
    page: currentPage,
    question: question.querySelector("p").textContent.trim(),
    answer: button.textContent.trim(),
    correct: button.dataset.answer === "right"
  };
  stats.push(answer);
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  if (window.CPoolDb) window.CPoolDb.saveRemoteAnswer(answer).catch(() => {});
}

function placeTip(token) {
  const windowBox = codeWindow.getBoundingClientRect();
  const tokenBox = token.getBoundingClientRect();
  tip.style.left = "12px";
  tip.style.top = "12px";
  const tipBox = tip.getBoundingClientRect();
  let left = tokenBox.left - windowBox.left;
  let top = tokenBox.top - windowBox.top - tipBox.height - 10;
  const viewportPad = 8;
  const minViewportLeft = viewportPad - windowBox.left;
  const maxViewportLeft = window.innerWidth - windowBox.left - tipBox.width - viewportPad;
  const minLeft = Math.max(12, minViewportLeft);
  const maxLeft = Math.min(windowBox.width - tipBox.width - 12, maxViewportLeft);

  if (left > maxLeft) left = maxLeft;
  if (left < minLeft) left = minLeft;
  if (top < 12) top = tokenBox.bottom - windowBox.top + 8;

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideTip() {
  tokens.forEach((item) => item.classList.remove("is-active"));
  tip.classList.remove("is-visible");
}

function showTip(token) {
  token.classList.add("is-read");
  tipTitle.textContent = token.dataset.title;
  tipBody.textContent = token.dataset.body;
  tip.classList.add("is-visible");
  placeTip(token);
}

function saveUnlock(pageIndex) {
  unlockedPage = Math.max(unlockedPage, pageIndex);
  localStorage.setItem(STORAGE_KEY, String(unlockedPage));
  if (window.CPoolDb) window.CPoolDb.saveRemoteProgress(unlockedPage).catch(() => {});
  renderNavigation();
}

function goToPage(pageIndex) {
  if (pageIndex < 0 || pageIndex >= pages.length) return;
  if (pageIndex > unlockedPage) return;
  currentPage = pageIndex;
  localStorage.setItem(PAGE_KEY, String(currentPage));
  pages.forEach((page, index) => page.classList.toggle("is-active", index === currentPage));
  hideTip();
  courseMenu.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  renderNavigation();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function restoreCurrentPage() {
  pages.forEach((page, index) => page.classList.toggle("is-active", index === currentPage));
  localStorage.setItem(PAGE_KEY, String(currentPage));
}

function renderNavigation() {
  menuItems.forEach((item, index) => {
    item.classList.toggle("is-active", index === currentPage);
    item.classList.toggle("is-locked", index > unlockedPage);
    item.disabled = index > unlockedPage;
  });
  prevPage.disabled = currentPage === 0;
  nextPage.disabled = currentPage + 1 >= pages.length || currentPage + 1 > unlockedPage;
  pageIndicator.textContent = `${currentPage} / ${pages.length - 1}`;
  document.body.classList.toggle("is-intro-page", currentPage === 0);
}

function updatePractice() {
  if (!practiceStatus || practiceQuestions.length === 0) return;
  const answered = practiceQuestions.filter((question) => question.classList.contains("is-answered")).length;
  practiceStatus.innerHTML = "";
  practiceQuestions.forEach((question, index) => {
    const dot = document.createElement("span");
    dot.className = "practice-dot";
    dot.classList.toggle("is-current", index === currentPracticeQuestion);
    dot.classList.toggle("is-done", question.classList.contains("is-answered"));
    practiceStatus.appendChild(dot);
  });
  practiceStatus.classList.toggle("is-done", answered === practiceQuestions.length);
  if (answered === practiceQuestions.length) saveUnlock(2);
}

function showPracticeQuestion(index) {
  if (practiceQuestions.length === 0) return;
  currentPracticeQuestion = Math.min(index, practiceQuestions.length - 1);
  practiceQuestions.forEach((question, questionIndex) => {
    question.classList.toggle("is-active", questionIndex === currentPracticeQuestion);
  });
  updatePractice();
}

function updateReinforcement() {
  const answered = reinforcementQuestions.filter((question) => question.classList.contains("is-answered")).length;
  if (reinforcementProgress) {
    reinforcementProgress.innerHTML = "";
    reinforcementQuestions.forEach((question, index) => {
      const dot = document.createElement("span");
      dot.className = "practice-dot";
      dot.classList.toggle("is-current", index === currentReinforcementQuestion);
      dot.classList.toggle("is-done", question.classList.contains("is-answered"));
      reinforcementProgress.appendChild(dot);
    });
  }
  if (answered === reinforcementQuestions.length && reinforcementQuestions.length > 0) saveUnlock(3);
}

function showReinforcementQuestion(index) {
  if (reinforcementQuestions.length === 0) return;
  currentReinforcementQuestion = Math.min(index, reinforcementQuestions.length - 1);
  reinforcementQuestions.forEach((question, questionIndex) => {
    question.classList.toggle("is-active", questionIndex === currentReinforcementQuestion);
  });
  updateReinforcement();
}

function updateCommentUnlock() {
  if (commentQuestions.length === 0) return;
  const answered = commentQuestions.filter((question) => question.classList.contains("is-answered")).length;
  if (commentQuizProgress) {
    commentQuizProgress.innerHTML = "";
    commentQuestions.forEach((question, index) => {
      const dot = document.createElement("span");
      dot.className = "practice-dot";
      dot.classList.toggle("is-current", index === currentCommentQuestion);
      dot.classList.toggle("is-done", question.classList.contains("is-answered"));
      commentQuizProgress.appendChild(dot);
    });
  }
  if (answered === commentQuestions.length) saveUnlock(3);
}

function showCommentQuestion(index) {
  if (commentQuestions.length === 0) return;
  currentCommentQuestion = Math.min(index, commentQuestions.length - 1);
  commentQuestions.forEach((question, questionIndex) => {
    question.classList.toggle("is-active", questionIndex === currentCommentQuestion);
  });
  updateCommentUnlock();
}

function updateFirstPageUnlock() {
  const firstPageSelects = Array.from(root.querySelectorAll('.course-page[data-page="1"] .code-select'));
  if (firstPageSelects.length === 0) return;
  const allCorrect = firstPageSelects.every((select) => select.value && select.value === select.dataset.correct);
  if (allCorrect) saveUnlock(2);
}

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function normalizeAnswer(value) {
  return value.trim().toLowerCase();
}

function showBlankQuestion() {
  if (!blankQuestion || !blankAnswer || !blankCheck || !blankFeedback || blankQuestionOrder.length === 0) return;
  const blank = blankQuestionOrder[blankQuestionIndex];
  if (!blank) {
    blankQuestion.textContent = "Все пропуски заполнены.";
    blankFeedback.textContent = "Готово, программа восстановлена.";
    blankAnswer.value = "";
    blankAnswer.disabled = true;
    blankCheck.disabled = true;
    return;
  }

  blankQuestion.textContent = blank.dataset.question;
  blankFeedback.textContent = "";
  blankAnswer.value = "";
  blankAnswer.disabled = false;
  blankCheck.disabled = false;
  if (blankAnswer.closest(".course-page")?.classList.contains("is-active")) blankAnswer.focus();
}

function checkBlankAnswer() {
  const blank = blankQuestionOrder[blankQuestionIndex];
  if (!blank || !blankAnswer || !blankFeedback) return;
  const answer = blankAnswer.value;
  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(blank.dataset.answer);

  if (!isCorrect) {
    blankFeedback.textContent = "Пока не то. Проверь смысл строки и попробуй еще раз.";
    return;
  }

  blank.textContent = blank.dataset.answer;
  blank.classList.add("is-filled");
  blankFeedback.textContent = "Верно.";
  blankQuestionIndex += 1;
  window.setTimeout(showBlankQuestion, 450);
}

function recordValuesTask(resultText, correct) {
  const stats = JSON.parse(localStorage.getItem(STATS_KEY) || "[]");
  const answer = {
    time: new Date().toISOString(),
    page: currentPage,
    question: "Выбери, какие ценности стоят за Школой 21",
    answer: resultText,
    correct
  };
  stats.push(answer);
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  if (window.CPoolDb) window.CPoolDb.saveRemoteAnswer(answer).catch(() => {});
}

function renderValueExplanation(selected, missedCorrect, selectedWrong, forceFullAnswer) {
  const fragments = valueOptions.map((option) => {
    const isCorrect = option.dataset.correct === "true";
    const needsBold = forceFullAnswer || selectedWrong.includes(option) || missedCorrect.includes(option);
    const verdict = isCorrect ? valueExplanations[option.dataset.value] : valueExplanations[option.dataset.value];
    const name = option.textContent.trim();
    const prefix = needsBold ? `<strong>${name}</strong>` : name;
    return `${prefix} — ${verdict}`;
  });

  valueFeedback.innerHTML = "";
  valueFeedback.classList.remove("is-hidden");
  fragments.forEach((text) => {
    const item = document.createElement("p");
    item.className = "value-explanation";
    item.innerHTML = text;
    valueFeedback.appendChild(item);
  });
}

function fillValuesCorrectly() {
  valueOptions.forEach((option) => {
    option.classList.remove("is-selected", "is-wrong", "is-missed");
    option.classList.toggle("is-correct", option.dataset.correct === "true");
  });
}

function showValuesFeedback(forceFullAnswer = false) {
  const selected = valueOptions.filter((option) => option.classList.contains("is-selected"));
  const selectedCorrect = selected.filter((option) => option.dataset.correct === "true");
  const selectedWrong = selected.filter((option) => option.dataset.correct === "false");
  const missedCorrect = valueOptions.filter(
    (option) => option.dataset.correct === "true" && !option.classList.contains("is-selected")
  );
  const allCorrectSelected = selectedWrong.length === 0 && missedCorrect.length === 0;

  valueOptions.forEach((option) => {
    option.classList.remove("is-correct", "is-wrong", "is-missed");
  });
  fillValuesCorrectly();
  renderValueExplanation(selected, missedCorrect, selectedWrong, forceFullAnswer);
  valuesAction.classList.add("is-hidden");

  recordValuesTask(selected.map((option) => option.textContent.trim()).join(", "), allCorrectSelected);
}

tokens.forEach((token) => {
  token.addEventListener("click", (event) => {
    event.stopPropagation();
    if (token.classList.contains("is-active")) {
      hideTip();
      return;
    }
    tokens.forEach((item) => item.classList.remove("is-active"));
    token.classList.add("is-active");
    showTip(token);
  });
});

codeSelects.forEach((select) => {
  select.addEventListener("change", () => {
    select.classList.remove("is-correct", "is-wrong");
    select.style.width = select.value ? `${select.value.length + 3}ch` : "";
    if (!select.value) return;
    select.classList.toggle("is-correct", select.value === select.dataset.correct);
    select.classList.toggle("is-wrong", select.value !== select.dataset.correct);
    updateFirstPageUnlock();
  });
});

if (blankCheck) {
  blankCheck.addEventListener("click", checkBlankAnswer);
}

if (blankAnswer) {
  blankAnswer.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    checkBlankAnswer();
  });
}

practiceQuestions.forEach((question) => {
  question.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (question.classList.contains("is-answered")) return;
    const buttons = Array.from(question.querySelectorAll("button"));
    buttons.forEach((item) => item.classList.remove("is-correct", "is-wrong"));
    question.classList.add("is-answered");
    recordAnswer(question, button);
    if (button.dataset.answer === "right") {
      button.classList.add("is-correct");
    } else {
      button.classList.add("is-wrong");
      const rightButton = buttons.find((item) => item.dataset.answer === "right");
      if (rightButton) rightButton.classList.add("is-correct");
    }
    updatePractice();
    window.setTimeout(() => {
      const nextUnanswered = practiceQuestions.findIndex((item) => !item.classList.contains("is-answered"));
      if (nextUnanswered !== -1) showPracticeQuestion(nextUnanswered);
    }, 850);
  });
});

reinforcementQuestions.forEach((question) => {
  question.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || question.classList.contains("is-answered")) return;
    const buttons = Array.from(question.querySelectorAll("button"));
    buttons.forEach((item) => item.classList.remove("is-correct", "is-wrong"));
    question.classList.add("is-answered");
    recordAnswer(question, button);
    if (button.dataset.answer === "right") {
      button.classList.add("is-correct");
    } else {
      button.classList.add("is-wrong");
      const rightButton = buttons.find((item) => item.dataset.answer === "right");
      if (rightButton) rightButton.classList.add("is-correct");
    }
    updateReinforcement();
    window.setTimeout(() => {
      const nextUnanswered = reinforcementQuestions.findIndex((item) => !item.classList.contains("is-answered"));
      if (nextUnanswered !== -1) showReinforcementQuestion(nextUnanswered);
    }, 850);
  });
});

const commentAnswers = {
  program: "/* Программа выводит на экран текст Hello, AI!. */"
};

const commentChecks = {
  program: (text) =>
    text.includes("/*") &&
    text.includes("*/") &&
    (text.includes("hello") || text.includes("текст") || text.includes("строк")) &&
    (text.includes("вывод") || text.includes("печата") || text.includes("экран"))
};

function setAiComments() {
  aiCommentInputs.forEach((input) => {
    input.textContent = commentAnswers[input.dataset.kind] || "";
    input.classList.toggle("is-empty", input.textContent.trim().length === 0);
  });
}

function syncAiCommentAction() {
  commentWasEdited = aiCommentInputs.some((input) => input.textContent.trim().length > 0);
  if (aiCommentAction) aiCommentAction.textContent = commentWasEdited ? "проверить" : "увидеть ответ";
}

function checkAiComment(forceAnswer = false) {
  if (aiCommentInputs.length === 0 || !aiCommentFeedback) return;
  if (forceAnswer) {
    setAiComments();
    syncAiCommentAction();
    aiCommentFeedback.innerHTML = "<strong>Пройдено.</strong> Это пример блочного комментария: он стоит перед программой и коротко описывает ее общий результат.";
    return;
  }

  const missing = aiCommentInputs.filter((input) => {
    const value = input.textContent.trim().toLowerCase();
    const check = commentChecks[input.dataset.kind];
    return !value || (check && !check(value));
  });

  if (missing.length === 0) {
    aiCommentFeedback.innerHTML = "<strong>Пройдено.</strong> Комментарий оформлен как блочный и объясняет, что программа выводит текст на экран.";
  } else {
    aiCommentFeedback.innerHTML = "<strong>Не пройдено.</strong> Проверь, что комментарий начинается с /*, заканчивается */, и по смыслу говорит, что программа выводит текст на экран.";
  }
}

aiCommentInputs.forEach((input) => {
  input.addEventListener("focus", () => {
    input.classList.add("is-focused");
  });

  input.addEventListener("blur", () => {
    input.classList.remove("is-focused");
    input.classList.toggle("is-empty", input.textContent.trim().length === 0);
    syncAiCommentAction();
  });

  input.addEventListener("input", () => {
    input.classList.toggle("is-empty", input.textContent.trim().length === 0);
    syncAiCommentAction();
  });
});

if (aiCommentAction) {
  aiCommentAction.addEventListener("click", () => {
    checkAiComment(!commentWasEdited);
    if (!commentWasEdited) {
      syncAiCommentAction();
    }
  });
}

commentQuestions.forEach((question) => {
  question.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || question.classList.contains("is-answered")) return;
    const buttons = Array.from(question.querySelectorAll("button"));
    buttons.forEach((item) => item.classList.remove("is-correct", "is-wrong"));
    question.classList.add("is-answered");
    recordAnswer(question, button);
    if (button.dataset.answer === "right") {
      button.classList.add("is-correct");
    } else {
      button.classList.add("is-wrong");
      const rightButton = buttons.find((item) => item.dataset.answer === "right");
      if (rightButton) rightButton.classList.add("is-correct");
    }
    updateCommentUnlock();
    window.setTimeout(() => {
      const nextUnanswered = commentQuestions.findIndex((item) => !item.classList.contains("is-answered"));
      if (nextUnanswered !== -1) showCommentQuestion(nextUnanswered);
    }, 850);
  });
});

valueOptions.forEach((option) => {
  option.addEventListener("click", () => {
    option.classList.toggle("is-selected");
    option.classList.remove("is-correct", "is-wrong", "is-missed");
    valuesAction.textContent = valueOptions.some((item) => item.classList.contains("is-selected"))
      ? "проверить"
      : "показать ответ";
  });
});

valuesAction.addEventListener("click", () => {
  const hasSelection = valueOptions.some((item) => item.classList.contains("is-selected"));
  if (hasSelection) {
    showValuesFeedback(false);
  } else {
    valueOptions.forEach((option) => option.classList.remove("is-selected"));
    showValuesFeedback(true);
  }
});

unlockButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.id === "intro-start-page") return;
    const nextIndex = Number(button.dataset.unlockTo);
    saveUnlock(nextIndex);
    button.textContent = "Следующая тема открыта";
    button.disabled = true;
  });
});

menuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = !courseMenu.classList.contains("is-open");
  courseMenu.classList.toggle("is-open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

menuItems.forEach((item) => {
  item.addEventListener("click", () => goToPage(Number(item.dataset.targetPage)));
});

prevPage.addEventListener("click", () => goToPage(currentPage - 1));
nextPage.addEventListener("click", () => goToPage(currentPage + 1));
introStartPage.addEventListener("click", () => {
  saveUnlock(1);
  goToPage(1);
});
tip.addEventListener("click", (event) => event.stopPropagation());
courseMenu.addEventListener("click", (event) => event.stopPropagation());

document.addEventListener("click", () => {
  hideTip();
  courseMenu.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
});

window.addEventListener("resize", () => {
  const active = root.querySelector(".token.is-active");
  if (active) placeTip(active);
});

applyContentOverrides();
restoreCurrentPage();
renderNavigation();
showPracticeQuestion(0);
showCommentQuestion(0);
showReinforcementQuestion(0);
blankQuestionOrder = shuffleItems(codeBlanks);
showBlankQuestion();
