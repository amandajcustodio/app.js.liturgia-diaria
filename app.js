const API_URL = "https://api-nodejs-liturgia-diaria.vercel.app/missallete/today";

const titleElement = document.getElementById("today-title");
const statusElement = document.getElementById("status");
const contentElement = document.getElementById("content");
const installButton = document.getElementById("install-button");

let deferredInstallPrompt = null;

function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

function buildMobilePdfViewerUrl(url) {
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
}

function formatDateBr(dateString) {
  if (!dateString) {
    return "hoje";
  }

  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return "hoje";
  }

  return `${day}/${month}/${year}`;
}

function showError(message) {
  statusElement.classList.add("error");
  statusElement.textContent = message;
  contentElement.hidden = true;
}

function renderPdf(url) {
  const link = document.createElement("a");
  const mobile = isMobileDevice();
  link.href = mobile ? buildMobilePdfViewerUrl(url) : url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "pdf-link";
  link.textContent = "Abrir PDF em nova aba";

  if (mobile) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.open(buildMobilePdfViewerUrl(url), "_blank", "noopener,noreferrer");
    });
  }

  contentElement.appendChild(link);
}

function renderHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.className = "html-content";
  wrapper.innerHTML = html;
  contentElement.appendChild(wrapper);
}

async function loadMissallete() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Nao foi possivel obter o folheto de hoje.");
    }

    const data = await response.json();

    titleElement.textContent = `Liturgia do dia ${formatDateBr(data.date)}`;
    statusElement.textContent = "Conteudo carregado.";
    statusElement.classList.remove("error");

    contentElement.innerHTML = "";

    if (data.type === "pdf") {
      renderPdf(data.content);
    } else if (data.type === "html") {
      renderHtml(data.content);
    } else {
      throw new Error("Tipo de conteudo nao suportado.");
    }

    contentElement.hidden = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar conteudo.";
    showError(message);
  }
}

function setupInstallPrompt() {
  if (!installButton) {
    return;
  }

  installButton.hidden = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
    installButton.disabled = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  installButton.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installButton.hidden = true;
      return;
    }

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
    if (isiOS) {
      alert("No iPhone/iPad: toque em Compartilhar e depois em Adicionar a Tela de Inicio.");
      return;
    }

    alert("A instalacao automatica nao esta disponivel agora. Verifique se o navegador permite instalar este site.");
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (_error) {
    // Ignore registration errors; app content still works without offline support.
  }
}

loadMissallete();
setupInstallPrompt();
registerServiceWorker();
