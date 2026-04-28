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
import { registerServiceWorker, setupInstallPrompt, setupSundayBookletButton } from "./pwa.js";

/**
 * @typedef {{ type: "html" | "pdf", date: string, content: string, metadata?: { season: string | null, color: string | null } }} Missallete
 * @typedef {{ id: "saturday" | "sunday", missallete: Missallete }} LiturgyChoice
 * @typedef {Missallete & { choices?: LiturgyChoice[] }} MissalleteResponse
 */

function getSaoPauloWeekdayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short"
  }).format(new Date());
}

function isSaoPauloSaturday() {
  return getSaoPauloWeekdayLabel() === "Sat";
}

function isSaoPauloSunday() {
  return getSaoPauloWeekdayLabel() === "Sun";
}

function shouldHideSundayBookletButton() {
  return isSaoPauloSaturday() || isSaoPauloSunday();
}

async function loadSundayBookletAvailability() {
  if (shouldHideSundayBookletButton()) {
    setSundayBookletVisibility(true);
    return { available: false, data: null };
  }

  setSundayBookletVisibility(true);
  setSundayBookletUnavailable();

  try {
    const data = await fetchSundayMissallete();

    if (data.type !== "pdf" || !data.content) {
      trackEvent("sunday_booklet_unavailable");
      return { available: false, data: null };
    }

    setSundayBookletAvailable(data.content, data.date);
    setSundayBookletVisibility(false);
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

    if (!isSaoPauloSunday()) {
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

loadMissallete();
setupInstallPrompt();
setupSundayBookletButton();
registerServiceWorker();