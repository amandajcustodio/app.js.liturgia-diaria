import {
  contentElement,
  liturgyColorElement,
  liturgySeasonElement,
  liturgyTitleElement,
  statusElement,
  sundayBookletButton
} from "./dom.js";
import { formatDateDdMmYy, formatLongDatePtBr, formatWeekdayPtBr } from "./formatters.js";
import { buildMobilePdfViewerUrl, isMobileDevice } from "./platform.js";

function createPdfLink(url) {
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

  return link;
}

export function showError(message) {
  statusElement.classList.add("error");
  statusElement.textContent = message;
  statusElement.hidden = false;
  contentElement.hidden = true;
}

export function showReadyState() {
  statusElement.textContent = "";
  statusElement.classList.remove("error");
  statusElement.hidden = true;
  contentElement.hidden = false;
}

export function renderLiturgyHeader(missallete) {
  if (!liturgyTitleElement || !liturgySeasonElement || !liturgyColorElement) {
    return;
  }

  const longDate = formatLongDatePtBr(missallete?.date);
  const weekday = formatWeekdayPtBr(missallete?.date);
  const metadata = missallete?.metadata;

  liturgyTitleElement.textContent = `Liturgia Diária - ${weekday}, ${longDate}`;
  liturgySeasonElement.textContent = metadata?.season ?? "Tempo litúrgico não informado.";
  liturgyColorElement.textContent = `Cor Litúrgica: ${metadata?.color ?? "não informada"}`;
}

export function setSundayBookletUnavailable() {
  if (!sundayBookletButton) {
    return;
  }

  sundayBookletButton.disabled = true;
  sundayBookletButton.dataset.url = "";
  sundayBookletButton.textContent = "Folheto de domingo ainda não disponível";
}

export function setSundayBookletVisibility(hidden) {
  if (!sundayBookletButton) {
    return;
  }

  sundayBookletButton.hidden = hidden;
}

export function setSundayBookletAvailable(pdfUrl, isoDate) {
  if (!sundayBookletButton) {
    return;
  }

  const dateForLabel = formatDateDdMmYy(isoDate);
  sundayBookletButton.disabled = false;
  sundayBookletButton.dataset.url = pdfUrl;
  sundayBookletButton.textContent = dateForLabel
    ? `Baixar folheto de domingo - ${dateForLabel}`
    : "Baixar folheto de domingo";
}

export function renderMissalleteContent(missallete, mountElement = contentElement) {
  mountElement.innerHTML = "";

  if (missallete.type === "pdf") {
    mountElement.appendChild(createPdfLink(missallete.content));
    return;
  }

  if (missallete.type === "html") {
    const wrapper = document.createElement("div");
    wrapper.className = "html-content";
    wrapper.innerHTML = missallete.content;
    mountElement.appendChild(wrapper);
    return;
  }

  throw new Error("Tipo de conteúdo não suportado.");
}

function getChoiceLabel(choiceId) {
  return choiceId === "sunday" ? "Domingo" : "Sábado";
}

export function renderLiturgyChoices(data) {
  const choices = Array.isArray(data.choices) ? data.choices : [];
  contentElement.innerHTML = "";

  if (choices.length < 2) {
    renderLiturgyHeader(data);
    renderMissalleteContent(data, contentElement);
    return;
  }

  const choicesContainer = document.createElement("div");
  choicesContainer.className = "liturgy-choices";

  const choicesTitle = document.createElement("p");
  choicesTitle.className = "liturgy-choices-title";
  choicesTitle.textContent = "Escolha a liturgia para leitura:";

  const choicesButtons = document.createElement("div");
  choicesButtons.className = "liturgy-choices-buttons";

  const contentMount = document.createElement("div");

  contentElement.appendChild(choicesContainer);
  choicesContainer.appendChild(choicesTitle);
  choicesContainer.appendChild(choicesButtons);
  contentElement.appendChild(contentMount);

  const buttonsByChoiceId = new Map();

  const selectChoice = (choice) => {
    renderLiturgyHeader(choice.missallete);
    renderMissalleteContent(choice.missallete, contentMount);

    for (const [choiceId, button] of buttonsByChoiceId.entries()) {
      button.classList.toggle("active", choiceId === choice.id);
    }
  };

  for (const choice of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "liturgy-choice-button";
    button.textContent = getChoiceLabel(choice.id);
    button.addEventListener("click", () => {
      selectChoice(choice);
    });
    choicesButtons.appendChild(button);
    buttonsByChoiceId.set(choice.id, button);
  }

  const defaultChoice = choices.find((choice) => choice.id === "saturday") ?? choices[0];
  if (defaultChoice) {
    selectChoice(defaultChoice);
  }
}