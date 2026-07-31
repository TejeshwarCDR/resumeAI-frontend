export function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeKey(value: string) {
  return normalizeText(value).toLowerCase();
}

export function isValidUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function isValidYear(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^(19|20)\d{2}$/.test(trimmed);
}

export function isValidDoi(value: string) {
  const trimmed = value.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  if (!trimmed) return true;
  return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(trimmed);
}

export function isValidArxivUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return /(^|\.)arxiv\.org$/i.test(url.hostname) && /^\/(abs|pdf)\/\d{4}\.\d{4,5}(v\d+)?(\.pdf)?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function isValidEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string) {
  if (!value.trim()) return true;
  return /^[+()\-\s\d]{7,20}$/.test(value.trim());
}

export function hasDuplicate(values: string[], nextValue: string) {
  const key = normalizeKey(nextValue);
  return values.some((value) => normalizeKey(value) === key);
}

export function yearRangeError(startYear?: string, endYear?: string, isCurrent?: boolean) {
  if (!startYear?.trim() || isCurrent || !endYear?.trim()) return "";
  const start = Number(startYear);
  const end = Number(endYear);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Use a valid year.";
  if (end < start) return "End year must be after start year.";
  return "";
}

export function readableList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
