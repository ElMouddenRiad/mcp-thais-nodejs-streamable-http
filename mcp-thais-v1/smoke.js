import { thaisGet } from "./thais.js";

const roomTypes = await thaisGet("/hub/api/partner/hotel/room-types");
console.log("room types:", roomTypes.length);

const avails = await thaisGet("/hub/api/partner/hotel/apr/availabilities/currents", {
  from: "2021-03-15",
  to: "2021-03-17",
});
console.log("avails:", avails.length);
