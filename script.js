const CONFIG = {
  // Cole aqui a URL /exec do seu Google Apps Script.
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxbxfXODfzDb1BnbENvLIRCye6BKYUaD13-WwAPar7FtmCYD-TgjghwVyF8Os6uBxMgrQ/exec"
};

const entryScreen = document.getElementById("entryScreen");
const enterBtn = document.getElementById("enterBtn");
const music = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const musicText = document.getElementById("musicText");
const musicIcon = document.getElementById("musicIcon");
const form = document.getElementById("applicationForm");
const statusEl = document.getElementById("formStatus");

const characterOpenBtn = document.getElementById("characterOpenBtn");
const characterCloseBtn = document.getElementById("characterCloseBtn");
const characterPanel = document.getElementById("characterPanel");
const characterList = document.getElementById("characterList");
const characterInput = document.getElementById("character");
const selectedCharacter = document.getElementById("selectedCharacter");
const characterEmpty = document.getElementById("characterEmpty");

// Todos os personagens ficam disponíveis nesta versão para permitir testes.
// Os personagens que antes estavam ocupados também foram recolocados na lista.
const PRETAKEN_CHARACTERS = new Set();

// Alunos/personagens principais de Ever After High.
const CHARACTERS = [
  "Alistair Wonderland",
  "Apple White",
  "Ashlynn Ella",
  "Briar Beauty",
  "Blondie Lockes",
  "Brooke Page",
  "Bunny Blanc",
  "C.A. Cupid",
  "Cedar Wood",
  "Cerise Hood",
  "Chase Redford",
  "Courtly Jester",
  "Darling Charming",
  "Daring Charming",
  "Dexter Charming",
  "Duchess Swan",
  "Farrah Goodfairy",
  "Faybelle Thorn",
  "Ginger Breadhouse",
  "Gus Crumb",
  "Helga Crumb",
  "Holly O'Hair",
  "Hopper Croakington II",
  "Humphrey Dumpty",
  "Hunter Huntsman",
  "Jackie Frost",
  "Jillian Beanstalk",
  "Justine Dancer",
  "Kitty Cheshire",
  "Lizzie Hearts",
  "Madeline Hatter",
  "Meeshell Mermaid",
  "Melody Piper",
  "Mira Shards",
  "Nina Thumbell",
  "Northwind",
  "Poppy O'Hair",
  "Ramona Badwolf",
  "Raven Queen",
  "Rosabella Beauty",
  "Sparrow Hood",
  "Tiny"
];

const uniqueCharacters = [...new Set(CHARACTERS)];
let takenCharacters = new Set(PRETAKEN_CHARACTERS);

function isBackendConfigured() {
  return CONFIG.GOOGLE_SCRIPT_URL && !CONFIG.GOOGLE_SCRIPT_URL.includes("COLE_AQUI");
}

async function startMusic() {
  try {
    await music.play();
    musicText.textContent = "Som ligado";
    musicIcon.textContent = "♫";
  } catch (e) {
    musicText.textContent = "Ativar música";
    musicIcon.textContent = "♪";
  }
}

enterBtn.addEventListener("click", async () => {
  await startMusic();
  entryScreen.classList.add("hidden");
});

musicToggle.addEventListener("click", async () => {
  if (music.paused) await startMusic();
  else {
    music.pause();
    musicText.textContent = "Som desligado";
    musicIcon.textContent = "×";
  }
});

async function openCharacterPanel() {
  characterPanel.hidden = false;
  characterOpenBtn.setAttribute("aria-expanded", "true");
  renderCharacters();
  await loadTakenCharactersFromGoogle();
  renderCharacters();
}

function closeCharacterPanel() {
  characterPanel.hidden = true;
  characterOpenBtn.setAttribute("aria-expanded", "false");
}

characterOpenBtn.addEventListener("click", () => characterPanel.hidden ? openCharacterPanel() : closeCharacterPanel());
characterCloseBtn.addEventListener("click", closeCharacterPanel);

function normalizeCharacterName(name) {
  return String(name || "").trim().toLowerCase().replace(/\\s+/g, " ");
}

function getAvailableCharacters() {
  const takenNormalized = new Set([...takenCharacters].map(normalizeCharacterName));
  return uniqueCharacters.filter(name => !takenNormalized.has(normalizeCharacterName(name)));
}

function renderCharacters() {
  characterList.innerHTML = "";
  const available = getAvailableCharacters();
  characterEmpty.hidden = available.length !== 0;

  available.forEach((name, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-choice";
    button.dataset.character = name;
    const number = String(index + 1).padStart(2, "0");
    button.innerHTML = `<span class="character-number">${number}</span><span class="character-name"></span><span class="character-arrow">→</span>`;
    button.querySelector(".character-name").textContent = name;
    button.addEventListener("click", () => chooseCharacter(name));
    characterList.appendChild(button);
  });
}

function chooseCharacter(name) {
  if (getAvailableCharacters().every(item => normalizeCharacterName(item) !== normalizeCharacterName(name))) {
    setStatus("Esse personagem já foi escolhido. Atualize a lista e escolha outro.", "error");
    loadTakenCharactersFromGoogle();
    return;
  }
  characterInput.value = name;
  selectedCharacter.innerHTML = "✓ <strong></strong> escolhido(a) para sua candidatura.";
  selectedCharacter.querySelector("strong").textContent = name;
  selectedCharacter.classList.add("has-selection");
  closeCharacterPanel();
}

function saveTakenCharacters() {
  localStorage.setItem("everAfterCoffeeTakenCharacters", JSON.stringify([...takenCharacters]));
}

function loadLocalTakenCharacters() {
  try {
    const saved = JSON.parse(localStorage.getItem("everAfterCoffeeTakenCharacters") || "[]");
    if (Array.isArray(saved)) saved.forEach(name => takenCharacters.add(String(name)));
  } catch (e) {}
}

// Consulta as inscrições reais na planilha através do doGet/JSONP do Apps Script.
function loadTakenCharactersFromGoogle() {
  if (!isBackendConfigured()) return Promise.resolve();

  return new Promise(resolve => {
    const callbackName = "eacCharactersCallback_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, 8000);

    function cleanup() {
      clearTimeout(timeout);
      script.remove();
      try { delete window[callbackName]; } catch (e) {}
    }

    window[callbackName] = data => {
      if (data && Array.isArray(data.taken)) {
        takenCharacters = new Set(data.taken.map(name => String(name).trim()).filter(Boolean));
        saveTakenCharacters();
        renderCharacters();
      }
      cleanup();
      resolve();
    };

    script.onerror = () => {
      cleanup();
      resolve();
    };

    const separator = CONFIG.GOOGLE_SCRIPT_URL.includes("?") ? "&" : "?";
    script.src = CONFIG.GOOGLE_SCRIPT_URL + separator +
      "callback=" + encodeURIComponent(callbackName) + "&t=" + Date.now();

    document.body.appendChild(script);
  });
}
function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = "form-status " + (type || "");
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!characterInput.value.trim()) {
    setStatus("Escolha um personagem antes de enviar sua candidatura.", "error");
    openCharacterPanel();
    characterOpenBtn.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (takenCharacters.has(characterInput.value)) {
    setStatus("Esse personagem acabou de ser escolhido por outra pessoa. Escolha outro.", "error");
    characterInput.value = "";
    selectedCharacter.textContent = "";
    openCharacterPanel();
    return;
  }

  if (!isBackendConfigured()) {
    setStatus("O formulário está pronto, mas o destino das inscrições ainda não foi configurado. Veja o arquivo GUIA-INSTALACAO.", "error");
    return;
  }

  const submit = form.querySelector(".submit-btn");
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.enviado_em = new Date().toLocaleString("pt-BR");
  const chosenCharacter = characterInput.value;

  submit.disabled = true;
  submit.querySelector("span").textContent = "Enviando...";
  setStatus("", "");

  try {
    await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams(payload).toString()
    });

    // Reserva imediatamente neste navegador; o Apps Script também bloqueia duplicatas.
    takenCharacters.add(chosenCharacter);
    saveTakenCharacters();
    form.reset();
    characterInput.value = "";
    selectedCharacter.textContent = "";
    selectedCharacter.classList.remove("has-selection");
    renderCharacters();
    setStatus("✓ Sua candidatura foi enviada! O personagem escolhido saiu da lista e ficou reservado para sua inscrição.", "success");
  } catch (error) {
    setStatus("Não foi possível enviar agora. Confira sua conexão e tente novamente.", "error");
  } finally {
    submit.disabled = false;
    submit.querySelector("span").textContent = "Enviar candidatura";
  }
});

loadLocalTakenCharacters();
renderCharacters();
loadTakenCharactersFromGoogle();
