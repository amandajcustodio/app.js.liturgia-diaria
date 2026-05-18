import { installButton, sundayBookletButton } from "./dom.js";
import { trackEvent } from "./analytics.js";
import { buildMobilePdfViewerUrl, isMobileDevice, isRunningStandalone } from "./platform.js";
import { endpoints, VAPID_PUBLIC_KEY } from "./config.js";

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

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function sendSubscriptionToServer(subscription) {
  try {
    await fetch(endpoints.pushSubscribe, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch {
    // Non-fatal: the app still works without push notifications.
  }
}

async function sendUnsubscribeToServer(endpoint) {
  try {
    await fetch(endpoints.pushUnsubscribe, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Non-fatal.
  }
}

/**
 * Subscribes the user to push notifications.
 * Requests permission if not yet granted and registers the push subscription.
 * Call this in response to a user gesture.
 */
export async function subscribeToPushNotifications() {
  if (!("Notification" in window) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    trackEvent("push_permission_denied");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      trackEvent("push_subscribed");
    }

    await sendSubscriptionToServer(subscription);
  } catch {
    trackEvent("push_subscribe_failed");
  }
}

/**
 * Re-registers an existing push subscription with the server on every page load.
 * This ensures the server always has a valid token, even after browser/SW updates.
 */
export async function syncPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await sendSubscriptionToServer(subscription);
    }
  } catch {
    // Non-fatal.
  }
}