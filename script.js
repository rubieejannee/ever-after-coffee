const CONFIG = {
  // Cole aqui a URL do seu Google Apps Script depois de publicar a planilha.
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzJ4PCAv53yzXUcgCuVhwA0AOniqV7jFyf5hFB_57ZcD3-5JfZhxf7lEJfzP-aijnqa0Q/exec"
};

const entryScreen = document.getElementById("entryScreen");
const enterBtn = document.getElementById("enterBtn");
const music = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const musicText = document.getElementById("musicText");
const musicIcon = document.getElementById("musicIcon");
const form = document.getElementById("applicationForm");
const statusEl = document.getElementById("formStatus");
const characterInput = document.getElementById("characterInput");

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
  if (music.paused) {
    await startMusic();
  } else {
    music.pause();
    musicText.textContent = "Som desligado";
    musicIcon.textContent = "×";
  }
});

document.querySelectorAll(".character-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".character-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    characterInput.value = card.dataset.character;
    characterInput.focus();
    document.getElementById("inscricao").scrollIntoView({behavior:"smooth", block:"start"});
  });
});

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = "form-status " + type;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (CONFIG.GOOGLE_SCRIPT_URL.includes("COLE_AQUI")) {
    setStatus("O formulário está pronto, mas o destino das inscrições ainda não foi configurado. Veja o arquivo GUIA-INSTALACAO.", "error");
    return;
  }

  const submit = form.querySelector(".submit-btn");
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.enviado_em = new Date().toLocaleString("pt-BR");

  submit.disabled = true;
  submit.querySelector("span").textContent = "Enviando...";
  setStatus("", "");

  try {
    // no-cors é intencional: o Google Apps Script recebe os dados mesmo sem expor a resposta ao navegador.
    await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
      body: new URLSearchParams(payload).toString()
    });

    form.reset();
    document.querySelectorAll(".character-card").forEach(c => c.classList.remove("selected"));
    setStatus("✓ Sua candidatura foi enviada! A equipe do Ever After Coffee entrará em contato pelo Telegram informado.", "success");
  } catch (error) {
    setStatus("Não foi possível enviar agora. Confira sua conexão e tente novamente.", "error");
  } finally {
    submit.disabled = false;
    submit.querySelector("span").textContent = "Enviar candidatura";
  }
});
