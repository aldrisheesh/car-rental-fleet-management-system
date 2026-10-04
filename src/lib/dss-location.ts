export type DssLocationMatch = {
  latitude: number;
  longitude: number;
  label: string;
  query: string;
  provider: string;
  resultType: string;
};
export type DssRoutePoint = DssLocationMatch & {
  kind: "area_reference" | "movement_point";
  confirmedAt: string;
};
export function validDssMatch(value: unknown): value is DssLocationMatch {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.latitude === "number" &&
    Number.isFinite(p.latitude) &&
    p.latitude >= 4 &&
    p.latitude <= 22 &&
    typeof p.longitude === "number" &&
    Number.isFinite(p.longitude) &&
    p.longitude >= 116 &&
    p.longitude <= 127 &&
    ["label", "query", "provider", "resultType"].every(
      (k) =>
        typeof p[k] === "string" &&
        (p[k] as string).length > 0 &&
        (p[k] as string).length <= 500,
    )
  );
}
export function dssMapUrl(p: DssLocationMatch) {
  const bbox = [
    p.longitude - 0.004,
    p.latitude - 0.003,
    p.longitude + 0.004,
    p.latitude + 0.003,
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({ bbox, layer: "mapnik", marker: `${p.latitude},${p.longitude}` })}`;
}
export function routePointNote(
  origin?: DssRoutePoint | null,
  destination?: DssRoutePoint | null,
) {
  if (!origin || !destination)
    return "Confirm a DSS map point for both operational areas in Locations before route and fuel estimates can be assessed.";
  if (origin.kind === "area_reference" || destination.kind === "area_reference")
    return "Route, travel time and fuel are approximate area-reference estimates. Confirm actual vehicle and receiving endpoints before movement; parking capacity is not assessed.";
  return "Route estimates use owner-confirmed parking/handover points. Verify the vehicle's current location and receiving space before movement; these points are not live tracking.";
}
