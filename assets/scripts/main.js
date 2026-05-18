import { fetchSundayMissallete, fetchTodayMissallete, fetchTomorrowLiturgy } from "./api.js";
import { trackEvent } from "./analytics.js";
import {
  clearContent,
  renderLiturgyChoices,
  renderSaturdayChoicesWithSundayNotice,
  setSundayBookletAvailable,
  setSundayBookletUnavailable,
  setSundayBookletVisibility,
  showError,
  showNotice,
  showReadyState
} from "./render.js";
import { registerServiceWorker, setupInstallPrompt, setupSundayBookletButton, subscribeToPushNotifications, syncPushSubscription } from "./pwa.js";

/**
 * @typedef {{ type: "html" | "pdf", date: string, content: string, metadata?: { season: string | null, color: string | null } }} Missallete
 * @typedef {{ id: "saturday" | "sunday", missallete: Missallete }} LiturgyChoice
 * @typedef {Missallete & { choices?: LiturgyChoice[] }} MissalleteResponse
 */

function getSaoPauloWeekdayNumber() {
  const saoPauloNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  return saoPauloNow.getDay();
}

function isSaoPauloSaturday() {
  return getSaoPauloWeekdayNumber() === 6;
}

function isSaoPauloSunday() {
  return getSaoPauloWeekdayNumber() === 0;
}

function shouldHideSundayBookletButton() {
  return isSaoPauloSaturday() || isSaoPauloSunday();
}

function getIsoDateWeekdayNumber(isoDate) {
  const [year, month, day] = String(isoDate || "").split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function shouldHideSundayBookletButtonForDate(isoDate) {
  const weekday = getIsoDateWeekdayNumber(isoDate);
  return weekday === 0 || weekday === 6;
}

async function loadSundayBookletAvailability() {
  if (shouldHideSundayBookletButton()) {
    setSundayBookletVisibility(true);
    return { available: false, data: null };
  }

  setSundayBookletUnavailable();
  setSundayBookletVisibility(false);

  try {
    const data = await fetchSundayMissallete();

    if (data.type !== "pdf" || !data.content) {
      trackEvent("sunday_booklet_unavailable");
      return { available: false, data: null };
    }

    setSundayBookletAvailable(data.content, data.date);
    trackEvent("sunday_booklet_available", { date: data.date });
    return { available: true, data };
  } catch {
    setSundayBookletUnavailable();
    trackEvent("sunday_booklet_unavailable");
    return { available: false, data: null };
  }
}

async function loadMissallete() {
  try {
    /** @type {MissalleteResponse} */
    const data = await fetchTodayMissallete();
    const hasSaturdayChoices = Array.isArray(data.choices) && data.choices.length >= 2;
    const isSaturday = isSaoPauloSaturday();
    const shouldHideByDataDate = shouldHideSundayBookletButtonForDate(data?.date);

    if (shouldHideByDataDate) {
      setSundayBookletVisibility(true);
    }

    if (isSaturday && !hasSaturdayChoices) {
      const sundayBooklet = await loadSundayBookletAvailability();
      let sundayLiturgy = null;

      if (!sundayBooklet.available) {
        try {
          sundayLiturgy = await fetchTomorrowLiturgy();
        } catch {
          trackEvent("sunday_liturgy_unavailable");
        }
      }

      const sundayMessage = sundayBooklet.available
        ? ""
        : "Folheto de domingo ainda não disponível.";

      showReadyState();
      renderSaturdayChoicesWithSundayNotice(data, sundayLiturgy ?? sundayBooklet.data, sundayMessage);

      if (!sundayBooklet.available) {
        trackEvent("sunday_choice_unavailable");
      }

      return;
    }

    showReadyState();
    renderLiturgyChoices(data);
    trackEvent("missallete_loaded", {
      date: data.date,
      type: data.type,
      hasSaturdayChoices
    });

    if (!isSaoPauloSunday() && !shouldHideByDataDate) {
      await loadSundayBookletAvailability();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar conteúdo.";
    
    if (isSaoPauloSunday()) {
      clearContent();
      setSundayBookletVisibility(true);
      showNotice("Folheto de domingo ainda não disponível.");
      trackEvent("sunday_download_only_unavailable");
      return;
    }

    showError(message);
    trackEvent("missallete_load_error", { message });
  }
}

if (shouldHideSundayBookletButton()) {
  setSundayBookletVisibility(true);
}

loadMissallete();
setupInstallPrompt();
setupSundayBookletButton();
registerServiceWorker();

// Subscribe to push notifications after installing (user gesture via appinstalled event)
window.addEventListener("appinstalled", () => {
  subscribeToPushNotifications();
});

// Re-sync existing subscription with the server on every load
syncPushSubscription();