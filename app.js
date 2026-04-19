const API_URL = "http://localhost:3000/missallete/today";

const titleElement = document.getElementById("today-title");
const statusElement = document.getElementById("status");
const contentElement = document.getElementById("content");

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
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "pdf-link";
  link.textContent = "Abrir PDF em nova aba";

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

loadMissallete();
