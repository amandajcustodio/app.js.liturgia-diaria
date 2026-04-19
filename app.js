const API_URL = "https://api-nodejs-liturgia-diaria.vercel.app/missallete/today";

const titleElement = document.getElementById("today-title");
const statusElement = document.getElementById("status");
const contentElement = document.getElementById("content");
const installButton = document.getElementById("install-button");

let deferredInstallPrompt = null;

function isRunningStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

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
      throw new Error("Não foi possível obter o folheto de hoje.");
    }

    const data = await response.json();

    titleElement.textContent = `Liturgia do dia ${formatDateBr(data.date)}`;
    statusElement.textContent = "Conteúdo carregado.";
    statusElement.classList.remove("error");

    contentElement.innerHTML = "";

    if (data.type === "pdf") {
      renderPdf(data.content);
    } else if (data.type === "html") {
      renderHtml(data.content);
    } else {
      throw new Error("Tipo de conteúdo não suportado.");
    }

    contentElement.hidden = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar conteúdo.";
    showError(message);
  }
}

function setupInstallPrompt() {
  if (!installButton) {
    return;
  }

  if (isRunningStandalone()) {
    installButton.textContent = "Atalho já adicionado";
    installButton.disabled = true;
    return;
  }

  installButton.hidden = false;
  installButton.disabled = false;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.textContent = "Atalho já adicionado";
    installButton.disabled = true;
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
      alert("No iPhone/iPad: toque em Compartilhar e depois em Adicionar à Tela de Início.");
      return;
    }

    const isSamsungInternet = /SamsungBrowser/i.test(navigator.userAgent || "");
    if (isSamsungInternet) {
      alert("No Samsung Internet: toque no menu (3 linhas) e escolha Adicionar página a > Tela inicial.");
      return;
    }

    alert("A instalação automática não está disponível agora. Abra o menu do navegador e escolha Adicionar à tela inicial.");
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
