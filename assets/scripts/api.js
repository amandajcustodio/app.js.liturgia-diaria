import { endpoints } from "./config.js";

async function fetchJson(url, errorMessage) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function fetchTodayMissallete() {
  return fetchJson(endpoints.todayMissallete, "Não foi possível obter o folheto de hoje.");
}

export async function fetchSundayMissallete() {
  return fetchJson(endpoints.sundayMissallete, "Não foi possível obter o folheto de domingo.");
}

export async function fetchTomorrowLiturgy() {
  return fetchJson(endpoints.tomorrowLiturgy, "Não foi possível obter a liturgia de domingo.");
}