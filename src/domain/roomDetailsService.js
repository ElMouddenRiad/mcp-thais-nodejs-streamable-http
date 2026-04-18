import { getRoomTypes, getRooms } from "../thais/endpoints.js";

export async function getRoomTypeDetails({ roomTypeId, includeRooms = true }) {
  const [roomTypes, rooms] = await Promise.all([getRoomTypes(), includeRooms ? getRooms() : Promise.resolve([])]);

  const rt = roomTypes.find((x) => Number(x.id) === Number(roomTypeId));
  if (!rt) {
    return { ok: false, summary: `Room type ${roomTypeId} introuvable.` };
  }

  const relatedRooms = includeRooms
    ? rooms.filter((r) => Number(r.room_type_id) === Number(roomTypeId) && r.deleted === false)
    : [];

  return {
    ok: true,
    roomType: {
      id: rt.id,
      label: rt.label,
      public: rt.public,
      subject_to_pricing: rt.subject_to_pricing,
      minPersons: rt.nb_persons_min,
      maxPersons: rt.nb_persons_max,
      description: rt.description ?? "",
      color: rt.color ?? null,
      deleted: rt.deleted ?? false,
    },
    rooms: relatedRooms.map((r) => ({
      id: r.id,
      label: r.label,
      nbPersonsMax: r.nb_persons_max,
      visible: r.visible,
      real: r.real,
      icons: r.icons ?? [],
      pictures: r.pictures ?? [],
      picture_url: r.picture_url ?? "",
    })),
  };
}
