import { installButton, sundayBookletButton } from "./dom.js";
import { buildMobilePdfViewerUrl, isMobileDevice, isRunningStandalone } from "./platform.js";

let deferredInstallPrompt = null;

export function setupInstallPrompt() {
  if (!installButton) {
    return;
  }

  if (isRunningStandalone()) {
    installButton.hidden = true;
    return;
  }

  installButton.hidden = false;
  installButton.disabled = false;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    installButton.disabled = false;
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

export function setupSundayBookletButton() {
  if (!sundayBookletButton) {
    return;
  }

  sundayBookletButton.addEventListener("click", () => {
    const targetUrl = sundayBookletButton.dataset.url;

    if (!targetUrl || sundayBookletButton.disabled) {
      return;
    }

    const urlToOpen = isMobileDevice() ? buildMobilePdfViewerUrl(targetUrl) : targetUrl;
    window.open(urlToOpen, "_blank", "noopener,noreferrer");
  });
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (_error) {
    // Ignore registration errors; app content still works without offline support.
  }
}