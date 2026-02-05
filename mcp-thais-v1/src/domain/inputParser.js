import { normalizeDate } from "../utils/dates.js";

const MONTHS_FR = new Map([
  ["janvier", 1], ["février", 2], ["fevrier", 2], ["mars", 3], ["avril", 4], ["mai", 5],
  ["juin", 6], ["juillet", 7], ["août", 8], ["aout", 8], ["septembre", 9],
  ["octobre", 10], ["novembre", 11], ["décembre", 12], ["decembre", 12],
]);

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toIso(yyyy, mm, dd) {
  return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
}

function extractOccupancy(text) {
  // Valeurs par défaut : 1 adulte si rien n’est trouvé
  let adults = null, children = 0, infants = 0;

  // Ex: "2 adultes", "1 adulte"
  const mAdults = text.match(/(\d+)\s*(adulte|adultes)\b/i);
  if (mAdults) adults = Number(mAdults[1]);

  // Ex: "1 enfant", "2 enfants"
  const mChildren = text.match(/(\d+)\s*(enfant|enfants)\b/i);
  if (mChildren) children = Number(mChildren[1]);

  // Ex: "1 bébé", "2 bébés", "infant(s)"
  const mInf = text.match(/(\d+)\s*(bébé|bebes|bébés|infant|infants)\b/i);
  if (mInf) infants = Number(mInf[1]);

  // Ex: "2 adultes + 1 enfant" (adultes présents mais pas "adultes" explicite -> déjà couvert)
  // Si pas d’adultes explicitement mais "2 personnes" :
  const mPersons = text.match(/(\d+)\s*(personne|personnes)\b/i);
  if (adults == null && mPersons) adults = Number(mPersons[1]); // fallback simple

  if (adults == null) adults = 1;

  return { adults, children, infants };
}

/**
 * Parse dates depuis une phrase FR:
 * - "2026-02-07", "07/02/2026"
 * - "6 au 12 février 2026" (checkout = 12)
 * - "début février 2026" => 01 au 05 (heuristique)
 */
function extractDates(text, defaultYear) {
  // 1) ISO direct
  const isoMatches = [...text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map(m => m[1]);
  if (isoMatches.length >= 2) {
    return { checkIn: normalizeDate(isoMatches[0]), checkOut: normalizeDate(isoMatches[1]) };
  }

  // 2) FR dd/mm/yyyy
  const frMatches = [...text.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)].map(m => m[1]);
  if (frMatches.length >= 2) {
    return { checkIn: normalizeDate(frMatches[0]), checkOut: normalizeDate(frMatches[1]) };
  }

  // 3) "6 au 12 février 2026" ou "6-12 février"
  //    On suppose checkOut = jour "12" (date départ)
  const range = text.match(/\b(\d{1,2})\s*(?:au|-|à)\s*(\d{1,2})\s*(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\b/i);
  if (range) {
    const d1 = Number(range[1]);
    const d2 = Number(range[2]);
    const monthName = range[3].toLowerCase();
    const mm = MONTHS_FR.get(monthName);
    const yearMatch = text.match(/\b(20\d{2})\b/);
    const yyyy = yearMatch ? Number(yearMatch[1]) : defaultYear;

    return { checkIn: toIso(yyyy, mm, d1), checkOut: toIso(yyyy, mm, d2) };
  }

  // 4) "début février 2026" => 01 au 05 (4 nuits) (heuristique)
  const startMonth = text.match(/\bdébut\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\b/i);
  if (startMonth) {
    const monthName = startMonth[1].toLowerCase();
    const mm = MONTHS_FR.get(monthName);
    const yearMatch = text.match(/\b(20\d{2})\b/);
    const yyyy = yearMatch ? Number(yearMatch[1]) : defaultYear;
    return { checkIn: toIso(yyyy, mm, 1), checkOut: toIso(yyyy, mm, 5) };
  }

  // 5) Si rien trouvé : erreur
  throw new Error("Impossible d'extraire les dates (ex: 'du 7 au 12 février 2026').");
}

export function parseNaturalAvailabilityRequest(requestText, { nowYear = new Date().getUTCFullYear() } = {}) {
  const text = String(requestText ?? "").trim();
  if (!text) throw new Error("request est vide.");

  const { adults, children, infants } = extractOccupancy(text);
  const { checkIn, checkOut } = extractDates(text, nowYear);

  // Normalize si format exotique (au cas où)
  return {
    checkIn: normalizeDate(checkIn),
    checkOut: normalizeDate(checkOut),
    adults,
    children,
    infants,
  };
}
