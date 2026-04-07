// Wordeul (Wordle-like) - simple, sans API externe.
// Règles: 6 essais, mot de 5 lettres, couleurs: vert/jaune/gris.

const WORD_LENGTH = 5;
const MAX_TRIES = 6;

// Petit dictionnaire (tu peux le remplacer par ta liste)
const WORDS = [
  "pomme","salut","route","plier","plage","grand","verre","louer","train","fleur",
  "nager","bravo","bague","singe","piano","table","chaud","frois","blanc","noire",
].map(w => w.toLowerCase());

let answer = "";
let currentRow = 0;
let currentCol = 0;
let grid = []; // [row][col] => lettre
let gameOver = false;

const gridEl = document.getElementById("grid");
const msgEl = document.getElementById("message");
const btnNew = document.getElementById("btnNew");

// ---------- UI init ----------
function buildGrid() {
  gridEl.innerHTML = "";
  gridEl.style.setProperty("--cols", WORD_LENGTH);
  grid = Array.from({ length: MAX_TRIES }, () => Array.from({ length: WORD_LENGTH }, () => ""));

  for (let r = 0; r < MAX_TRIES; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    rowEl.dataset.row = r;

    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = r;
      tile.dataset.col = c;
      tile.textContent = "";
      rowEl.appendChild(tile);
    }
    gridEl.appendChild(rowEl);
  }
}

const KEYBOARD = [
  ["A","Z","E","R","T","Y","U","I","O","P"],
  ["Q","S","D","F","G","H","J","K","L","M"],
  ["ENTER","W","X","C","V","B","N","BACK"]
];

function buildKeyboard() {
  for (let i = 0; i < 3; i++) {
    const rowEl = document.querySelector(`.kb-row[data-row="${i+1}"]`);
    rowEl.innerHTML = "";
    for (const key of KEYBOARD[i]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key" + ((key === "ENTER" || key === "BACK") ? " wide" : "");
      btn.dataset.key = key;
      btn.textContent = key === "BACK" ? "⌫" : key;
      btn.addEventListener("click", () => handleKey(key));
      rowEl.appendChild(btn);
    }
  }
}

// ---------- Game logic ----------
function pickAnswer() {
  // on filtre pour garder seulement les mots de 5 lettres
  const candidates = WORDS.filter(w => w.length === WORD_LENGTH);
  answer = candidates[Math.floor(Math.random() * candidates.length)];
}

function setMessage(text) {
  msgEl.textContent = text || "";
}

function getTileEl(r, c) {
  return gridEl.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
}

function paintTile(r, c, letter, filled = true) {
  const tile = getTileEl(r, c);
  tile.textContent = letter ? letter.toUpperCase() : "";
  tile.classList.toggle("filled", filled && !!letter);
}

function setKeyState(letter, state) {
  // state: correct > present > absent (priorité)
  const keyEl = document.querySelector(`.key[data-key="${letter.toUpperCase()}"]`);
  if (!keyEl) return;

  const priority = { correct: 3, present: 2, absent: 1, "": 0 };
  const cur =
    keyEl.classList.contains("correct") ? "correct" :
    keyEl.classList.contains("present") ? "present" :
    keyEl.classList.contains("absent") ? "absent" : "";

  if (priority[state] <= priority[cur]) return;

  keyEl.classList.remove("correct","present","absent");
  keyEl.classList.add(state);
}

function evaluateGuess(guess, ans) {
  // renvoie un tableau d'états: "correct" | "present" | "absent"
  const states = Array(WORD_LENGTH).fill("absent");
  const ansArr = ans.split("");
  const used = Array(WORD_LENGTH).fill(false);

  // verts
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === ansArr[i]) {
      states[i] = "correct";
      used[i] = true;
    }
  }

  // jaunes
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (states[i] === "correct") continue;
    const ch = guess[i];
    let found = -1;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && ansArr[j] === ch) {
        found = j;
        break;
      }
    }
    if (found !== -1) {
      states[i] = "present";
      used[found] = true;
    }
  }

  return states;
}

function commitRow() {
  const guess = grid[currentRow].join("").toLowerCase();

  if (guess.length !== WORD_LENGTH || grid[currentRow].some(ch => !ch)) {
    setMessage(`Entre un mot de ${WORD_LENGTH} lettres.`);
    return;
  }
  if (!WORDS.includes(guess)) {
    setMessage("Mot inconnu (pas dans la liste).");
    return;
  }

  const states = evaluateGuess(guess, answer);

  // apply to tiles + keyboard
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTileEl(currentRow, c);
    tile.classList.add(states[c]);
    setKeyState(guess[c], states[c]);
  }

  if (guess === answer) {
    setMessage("Bravo ! Tu as trouvé.");
    gameOver = true;
    return;
  }

  currentRow++;
  currentCol = 0;
  setMessage("");

  if (currentRow >= MAX_TRIES) {
    setMessage(`Perdu. Réponse: ${answer.toUpperCase()}`);
    gameOver = true;
  }
}

function backspace() {
  if (currentCol === 0) return;
  currentCol--;
  grid[currentRow][currentCol] = "";
  paintTile(currentRow, currentCol, "");
  setMessage("");
}

function addLetter(letter) {
  if (currentCol >= WORD_LENGTH) return;
  grid[currentRow][currentCol] = letter.toLowerCase();
  paintTile(currentRow, currentCol, letter);
  currentCol++;
  setMessage("");
}

function handleKey(key) {
  if (gameOver) return;

  if (key === "ENTER") return commitRow();
  if (key === "BACK") return backspace();

  // lettre A-Z
  if (/^[A-Z]$/.test(key)) addLetter(key);
}

function handlePhysicalKey(e) {
  if (gameOver) return;

  if (e.key === "Enter") {
    e.preventDefault();
    commitRow();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    backspace();
  } else {
    const k = e.key.toUpperCase();
    if (/^[A-Z]$/.test(k)) addLetter(k);
  }
}

function reset() {
  gameOver = false;
  currentRow = 0;
  currentCol = 0;
  setMessage("");
  buildGrid();
  buildKeyboard();

  // reset keyboard states
  document.querySelectorAll(".key").forEach(k => k.classList.remove("correct","present","absent"));

  pickAnswer();
  // console.log("ANSWER:", answer); // debug
}

// init
btnNew.addEventListener("click", reset);
window.addEventListener("keydown", handlePhysicalKey);
reset();