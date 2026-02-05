import { getPricing } from "../thais/endpoints.js";
import { normalizeDate } from "../utils/dates.js";

export async function computePricingSummary({
  checkIn,
  checkOut,
  roomTypeId,
  rateId,
  adults,
  children = 0,
  infants = 0,
}) {
  const from = normalizeDate(checkIn);
  const to = normalizeDate(checkOut);

  let payload;
try {
  payload = await getPricing({
    
    from,
    to,
    room_type_id: roomTypeId,
    rate_id: rateId,
    adults,
    children,
    infants,
  });
} catch (e) {
  return {
    ok: false,
    roomTypeId,
    rateId,
    totalPrice: null,
    touristTax: null,
    messages: { ERROR: e?.message ?? "pricing request failed" },
    nights: null,
    extras: null,
    raw: null,
  };
}

  // Thaïs renvoie souvent: status, total_price, tourist_tax, nights{date:price|null}, messages...
  return {
    ok: Boolean(payload?.status),
    roomTypeId,
    rateId,
    totalPrice: payload?.total_price ?? null,
    touristTax: payload?.tourist_tax ?? null,
    stopSell: payload?.stop_sell ?? null,
    minStay: payload?.min_stay ?? null,
    maxStay: payload?.max_stay ?? null,
    messages: payload?.messages ?? null,
    nights: payload?.nights ?? null,
    extras: payload?.extras ?? null,
    raw: payload, // garde le brut pour debug si besoin
  };
}
