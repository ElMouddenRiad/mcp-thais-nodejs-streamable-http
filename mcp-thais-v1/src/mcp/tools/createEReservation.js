import { z } from "zod";
import { createEbooking } from "../../thais/endpoints.js";
import { normalizeDate } from "../../utils/dates.js";

export function registerCreateEReservationTool(mcp) {
  mcp.tool(
    "thais_create_e_reservation",
    {
      dryRun: z.boolean().optional().describe("Par défaut true. Si false, crée réellement l'e-booking."),

      checkIn: z.string().describe("YYYY-MM-DD ou DD/MM/YYYY"),
      checkOut: z.string().describe("YYYY-MM-DD ou DD/MM/YYYY"),

      customer_firstname: z.string().min(1),
      customer_lastname: z.string().min(1),
      customer_email: z.string().min(3),

      customer_phone: z.string().optional(),
      customer_mobile: z.string().optional(),
      customer_country: z.string().optional().describe("Ex: FR"),

      room_type_id: z.number().int(),
      rate_id: z.number().int(),
      price: z.number(),

      adults: z.number().int().min(1),
      children: z.number().int().min(0).optional(),
      infants: z.number().int().min(0).optional(),

      comment: z.string().optional(),
      payment_type: z.string().optional().describe("Ex: CB"),
      payment_amount: z.number().optional(),
    },
    async (input) => {
    const dryRun = input.dryRun ?? true;

    console.log("[MCP] thais_create_e_reservation", {
        dryRun,
        room_type_id: input.room_type_id,
        rate_id: input.rate_id,
    });

    const checkin = normalizeDate(input.checkIn);
    const checkout = normalizeDate(input.checkOut);

      const payload = {
        checkin,
        checkout,
        comment: input.comment ?? "",
        customer_firstname: input.customer_firstname,
        customer_lastname: input.customer_lastname,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone ?? "",
        customer_mobile: input.customer_mobile ?? "",
        customer_country: input.customer_country ?? "FR",
        channel_name: "Partner",
        payment_type: input.payment_type ?? "CB",
        payment_amount: input.payment_amount ?? input.price,
        insurance_amount: 0,
        booking_rooms: [
          {
            room_type_id: input.room_type_id,
            rate_id: input.rate_id,
            price: input.price,
            nb_persons: {
              adults: input.adults,
              children: input.children ?? 0,
              infants: input.infants ?? 0,
            },
            extras: [],
          },
        ],
      };

      if (dryRun) {
        return {
          content: [{ type: "text", text: "DRY RUN : payload e-booking préparé (non envoyé)." }],
          data: { ok: true, dryRun: true, payload },
        };
      }

      const res = await createEbooking(payload);
      return {
        content: [{ type: "text", text: "E-booking créé." }],
        data: { ok: true, dryRun: false, response: res },
      };
    }
  );
}
