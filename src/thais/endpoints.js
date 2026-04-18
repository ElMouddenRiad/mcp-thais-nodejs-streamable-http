import { thaisGet, thaisPost } from "./client.js";

export function getRoomTypes() {
  return thaisGet("/hub/api/partner/hotel/room-types");
}

export function getRooms() {
  return thaisGet("/hub/api/partner/hotel/rooms");
}

export function getAgeRanges() {
  return thaisGet("/hub/api/partner/hotel/age-ranges");
}

export function getRoomUnavailabilities({ from, to }) {
  return thaisGet("/hub/api/partner/hotel/room-unavailabilities", { from, to });
}

export function getAvailabilitiesCurrents(params) {
  return thaisGet("/hub/api/partner/hotel/apr/availabilities/currents", params);
}

export function getPricing(params) {
  return thaisGet("/hub/api/partner/hotel/pricing", params);
}


export function createEbooking(payload) {
  return thaisPost("/hub/api/partner/hotel/ebookings", payload);
}