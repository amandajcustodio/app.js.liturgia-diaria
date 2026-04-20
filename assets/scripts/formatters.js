function capitalizeFirstLetter(value) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseIsoDate(dateString) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return { year, month, day };
}

export function formatLongDatePtBr(isoDate) {
  const parsed = parseIsoDate(isoDate);

  if (!parsed) {
    return "data não informada";
  }

  const localDate = new Date(parsed.year, parsed.month - 1, parsed.day);
  const month = capitalizeFirstLetter(
    new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(localDate)
  );

  return `${parsed.day} de ${month} de ${parsed.year}`;
}

export function formatWeekdayPtBr(isoDate) {
  const parsed = parseIsoDate(isoDate);

  if (!parsed) {
    return "Dia não informado";
  }

  const localDate = new Date(parsed.year, parsed.month - 1, parsed.day);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(localDate);
  return capitalizeFirstLetter(weekday);
}

export function formatDateDdMmYy(dateString) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day || year.length !== 4) {
    return "";
  }

  return `${day}.${month}.${year.slice(2)}`;
}

export function isSundayDate(isoDate) {
  const parsed = parseIsoDate(isoDate);

  if (!parsed) {
    return false;
  }

  return new Date(parsed.year, parsed.month - 1, parsed.day).getDay() === 0;
}