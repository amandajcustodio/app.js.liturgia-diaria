import { installButton, sundayBookletButton } from "./dom.js";
import { trackEvent } from "./analytics.js";
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
    trackEvent("pwa_install_prompt_available");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    installButton.disabled = false;
    trackEvent("pwa_installed");
  });

  installButton.addEventListener("click", async () => {
    trackEvent("install_button_clicked", {
      hasDeferredPrompt: Boolean(deferredInstallPrompt)
    });

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      trackEvent("pwa_install_prompt_result", {
        outcome: choice?.outcome ?? "unknown"
      });
      deferredInstallPrompt = null;
      installButton.hidden = true;
      return;
    }

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
    if (isiOS) {
      trackEvent("install_manual_instructions_shown", { platform: "ios" });
      alert("No iPhone/iPad: toque em Compartilhar e depois em Adicionar à Tela de Início.");
      return;
    }

    const isSamsungInternet = /SamsungBrowser/i.test(navigator.userAgent || "");
    if (isSamsungInternet) {
      trackEvent("install_manual_instructions_shown", { platform: "samsung_internet" });
      alert("No Samsung Internet: toque no menu (3 linhas) e escolha Adicionar página a > Tela inicial.");
      return;
    }

    trackEvent("install_manual_instructions_shown", { platform: "generic" });
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
      trackEvent("sunday_booklet_click_blocked", {
        hasUrl: Boolean(targetUrl),
        disabled: sundayBookletButton.disabled
      });
      return;
    }

    const isMobile = isMobileDevice();
    const urlToOpen = isMobile ? buildMobilePdfViewerUrl(targetUrl) : targetUrl;
    trackEvent("sunday_booklet_button_clicked", {
      mobile: isMobile
    });
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