import { fetchSundayMissallete, fetchTodayMissallete } from "./api.js";
import { trackEvent } from "./analytics.js";
import { isSundayDate } from "./formatters.js";
import {
  renderLiturgyChoices,
  setSundayBookletAvailable,
  setSundayBookletUnavailable,
  setSundayBookletVisibility,
  showError,
  showReadyState
} from "./render.js";
import { registerServiceWorker, setupInstallPrompt, setupSundayBookletButton } from "./pwa.js";

/**
 * @typedef {{ type: "html" | "pdf", date: string, content: string, metadata?: { season: string | null, color: string | null } }} Missallete
 * @typedef {{ id: "saturday" | "sunday", missallete: Missallete }} LiturgyChoice
 * @typedef {Missallete & { choices?: LiturgyChoice[] }} MissalleteResponse
 */

async function loadSundayBookletAvailability() {
  setSundayBookletUnavailable();

  try {
    const data = await fetchSundayMissallete();

    if (data.type !== "pdf" || !data.content) {
      return;
    }

    setSundayBookletAvailable(data.content, data.date);
    trackEvent("sunday_booklet_available", { date: data.date });
  } catch {
    setSundayBookletUnavailable();
    trackEvent("sunday_booklet_unavailable");
  }
}

async function loadMissallete() {
  try {
    /** @type {MissalleteResponse} */
    const data = await fetchTodayMissallete();
    const hasSaturdayChoices = Array.isArray(data.choices) && data.choices.length >= 2;
    const isSunday = isSundayDate(data.date);

    setSundayBookletVisibility(hasSaturdayChoices || isSunday);
    showReadyState();
    renderLiturgyChoices(data);
    trackEvent("missallete_loaded", {
      date: data.date,
      type: data.type,
      hasSaturdayChoices,
      isSunday
    });

    if (!hasSaturdayChoices && !isSunday) {
      await loadSundayBookletAvailability();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar conteúdo.";
    showError(message);
    trackEvent("missallete_load_error", { message });
  }
}

loadMissallete();
setupInstallPrompt();
setupSundayBookletButton();
registerServiceWorker();