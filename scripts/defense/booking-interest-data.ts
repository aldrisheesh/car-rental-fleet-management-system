/** Researcher-designed demo patterns; these are not observed customer statistics. */
import { createHash } from "node:crypto";
import { categoryValue } from "../../src/lib/booking-categories.ts";

type TripContext = {
  id: string;
  pickup: string;
  returnAt: string;
  branch: string;
  seats: number;
};
const choose = (seed: string, options: Array<[string, number]>) => {
  const total = options.reduce((sum, [, weight]) => sum + weight, 0);
  let pick = createHash("sha256").update(seed).digest().readUInt32BE(0) % total;
  for (const [value, weight] of options) {
    if (pick < weight) return value;
    pick -= weight;
  }
  throw new Error("Empty trip distribution");
};
export function syntheticBookingInterest(trip: TripContext) {
  const days = Math.max(
    1,
    Math.ceil((Date.parse(trip.returnAt) - Date.parse(trip.pickup)) / 86400000),
  );
  const weekday = new Date(Date.parse(trip.pickup) + 8 * 3600000).getUTCDay();
  const weekend = weekday === 5 || weekday === 6 || weekday === 0;
  const family = trip.seats >= 7;
  const purposeCode = choose(trip.id + ":purpose-v1", [
    ["purpose.family", family ? 36 : 18],
    ["purpose.leisure", weekend ? 34 : 14],
    ["purpose.business", weekend ? 9 : 30],
    ["purpose.airport", 20],
    ["purpose.event", weekend ? 12 : 6],
    ["purpose.replacement", days >= 5 ? 9 : 2],
    ["purpose.other", 5],
  ]);
  const local = trip.branch.includes("Antipolo")
    ? "destination.rizal"
    : "destination.ncr";
  const destinations: Record<string, Array<[string, number]>> = {
    "purpose.family": [
      [local, 35],
      ["destination.laguna", 25],
      ["destination.cavite", 18],
      ["destination.batangas", 14],
      ["destination.bulacan", 8],
    ],
    "purpose.leisure": [
      ["destination.cavite", 35],
      ["destination.batangas", 28],
      ["destination.laguna", 17],
      ["destination.rizal", 10],
      [days >= 3 ? "destination.benguet" : "destination.cavite", 6],
      [days >= 3 ? "destination.zambales" : "destination.batangas", 4],
    ],
    "purpose.business": [
      [local, 55],
      ["destination.ncr", 20],
      ["destination.laguna", 15],
      ["destination.cavite", 10],
    ],
    "purpose.airport": [["destination.ncr", 100]],
    "purpose.event": [
      [local, 55],
      ["destination.rizal", 25],
      ["destination.cavite", 20],
    ],
    "purpose.replacement": [[local, 100]],
    "purpose.other": [
      [local, 70],
      ["destination.laguna", 20],
      ["destination.cavite", 10],
    ],
  };
  const destinationCode = choose(
    trip.id + ":destination-v1",
    destinations[purposeCode],
  );
  const place: Record<string, string> = {
    "destination.ncr":
      purposeCode === "purpose.airport"
        ? "NAIA, Pasay"
        : "Quezon City / Manila",
    "destination.rizal": "Antipolo / Taytay",
    "destination.cavite": "Tagaytay",
    "destination.laguna": "Calamba / Los Baños",
    "destination.batangas": "Lipa / beach trip",
    "destination.bulacan": "Malolos",
    "destination.benguet": "Baguio",
    "destination.zambales": "Subic",
  };
  const reason: Record<string, string> = {
    "purpose.family": "Visiting relatives",
    "purpose.leisure": "Holiday / weekend trip",
    "purpose.business": "Meetings / work errands",
    "purpose.airport": "Airport pickup / drop-off",
    "purpose.event": "Family celebration",
    "purpose.replacement": "Transport while the usual vehicle is unavailable",
    "purpose.other": "Personal errands",
  };
  return {
    purpose: categoryValue(
      "purpose",
      purposeCode,
      `SYNTHETIC DEMO — ${reason[purposeCode]}`,
    ),
    destination: categoryValue(
      "destination",
      destinationCode,
      `SYNTHETIC DEMO — ${place[destinationCode]}`,
    ),
  };
}
