import { getRoomTypes, getAvailabilitiesCurrents } from "../thais/endpoints.js";
import { normalizeDate, addDays, nightsBetween } from "../utils/dates.js";

/**
 * Calcule la disponibilité sur une période [checkIn, checkOut)
 * checkOut = date de départ (nuitée checkOut exclue)
 */
export async function computeAvailability({
  checkIn,
  checkOut,
  adults,
  children = 0,
  infants = 0,
}) {
  const checkInIso = normalizeDate(checkIn);
  const checkOutIso = normalizeDate(checkOut);

  const nights = nightsBetween(checkInIso, checkOutIso);
  if (nights <= 0) {
    return {
      ok: false,
      query: { checkIn: checkInIso, checkOut: checkOutIso, adults, children, infants },
      summary: "checkOut doit être après checkIn.",
    };
  }

  // Convention hôtelière: checkOut exclu => dernière nuit = checkOut - 1
  const lastNightDate = addDays(checkOutIso, -1);

  const partySize = Number(adults) + Number(children) + Number(infants);

  // 1) Room types
  const roomTypes = await getRoomTypes();

  const compatible = roomTypes
    .filter((rt) => rt.deleted === false)
    .filter((rt) => rt.public === true)
    .filter((rt) => rt.subject_to_pricing === true)
    .filter((rt) => typeof rt.nb_persons_min === "number" && typeof rt.nb_persons_max === "number")
    // Capacity check sur total personnes
    .filter((rt) => partySize >= rt.nb_persons_min && partySize <= rt.nb_persons_max)
    .map((rt) => ({
      id: rt.id,
      label: rt.label,
      minPersons: rt.nb_persons_min,
      maxPersons: rt.nb_persons_max,
      public: rt.public,
      subject_to_pricing: rt.subject_to_pricing,
    }));

  if (compatible.length === 0) {
    return {
      ok: true,
      query: { checkIn: checkInIso, checkOut: checkOutIso, adults, children, infants, partySize },
      nights,
      availableRoomTypes: [],
      topOptions: [],
      notAvailableRoomTypesCount: 0,
      summary: `Aucun type de chambre ne supporte ${partySize} personne(s) (adults=${adults}, children=${children}, infants=${infants}).`,
      humanReadable: `Je ne trouve aucun type de chambre compatible avec ${partySize} personne(s) (2 adultes + enfants/bébés inclus).`,
      debug: { compatibleRoomTypesCount: 0, availRowsReceived: 0, partySize },
    };
  }

  const compatibleIds = new Set(compatible.map((x) => x.id));

  // 2) Availabilities (sur [checkIn, lastNightDate])
  const avails = await getAvailabilitiesCurrents({ from: checkInIso, to: lastNightDate });

  // min availability par room_type_id sur la période
  const minByType = new Map(); // typeId -> { min, datesCount, minDate }
  for (const row of avails) {
    const typeId = row.room_type_id;
    if (!compatibleIds.has(typeId)) continue;

    const avail = Number(row.availability ?? 0);
    const date = String(row.date ?? "");

    const prev = minByType.get(typeId);
    if (!prev) {
      minByType.set(typeId, { min: avail, datesCount: 1, minDate: date || null });
    } else {
      prev.datesCount += 1;
      if (avail < prev.min) {
        prev.min = avail;
        prev.minDate = date || prev.minDate;
      }
    }
  }

  const availableRoomTypes = compatible
    .map((rt) => {
      const stats = minByType.get(rt.id) ?? { min: 0, datesCount: 0, minDate: null };
      return {
        ...rt,
        minAvailabilityOverPeriod: stats.min,
        samples: stats.datesCount,
        blockingDate: stats.min > 0 ? null : stats.minDate,
        isAvailable: stats.min > 0,
      };
    })
    .filter((x) => x.isAvailable)
    .sort((a, b) => b.minAvailabilityOverPeriod - a.minAvailabilityOverPeriod);

  const notAvailableCount = compatible.length - availableRoomTypes.length;

  // Cherche une date bloquante globale (première trouvée)
  let globalBlockingDate = null;
  for (const rt of compatible) {
    const s = minByType.get(rt.id);
    if (!s) continue;
    if (s.min <= 0 && s.minDate) {
      globalBlockingDate = s.minDate;
      break;
    }
  }

  const summary =
    availableRoomTypes.length > 0
      ? `Oui : ${availableRoomTypes.length} type(s) dispo pour ${partySize} personne(s) du ${checkInIso} au ${lastNightDate} (${nights} nuit(s)).`
      : `Non : aucune disponibilité pour ${partySize} personne(s) du ${checkInIso} au ${lastNightDate} (${nights} nuit(s)).`;

  const humanReadable =
    availableRoomTypes.length > 0
      ? `Oui, il y a de la disponibilité pour ${partySize} personne(s) (adults=${adults}, children=${children}, infants=${infants}) du ${checkInIso} au ${lastNightDate} (${nights} nuit(s)).\n` +
        `Options disponibles :\n` +
        availableRoomTypes
          .slice(0, 3)
        .map(
        (rt) =>
            `- [roomTypeId=${rt.id}] ${rt.label} (capacité ${rt.minPersons}-${rt.maxPersons}, dispo min: ${rt.minAvailabilityOverPeriod})`
        )
          .join("\n")
      : `Non, je ne vois aucune disponibilité pour ${partySize} personne(s) (adults=${adults}, children=${children}, infants=${infants}) du ${checkInIso} au ${lastNightDate} (${nights} nuit(s)).` +
        (globalBlockingDate ? `\nDate bloquante détectée : ${globalBlockingDate}.` : "");

  const topOptions = availableRoomTypes.slice(0, 3).map((rt) => ({
    roomTypeId: rt.id,
    label: rt.label,
    capacity: { min: rt.minPersons, max: rt.maxPersons },
    minAvailabilityOverPeriod: rt.minAvailabilityOverPeriod,
  }));

  return {
    ok: true,
    query: { checkIn: checkInIso, checkOut: checkOutIso, adults, children, infants, partySize },
    nights,
    availableRoomTypes,
    topOptions,
    notAvailableRoomTypesCount: notAvailableCount,
    summary,
    humanReadable,
    debug: {
      partySize,
      compatibleRoomTypesCount: compatible.length,
      availRowsReceived: Array.isArray(avails) ? avails.length : null,
    },
  };
}
