import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { OperationalContextView } from "./operational-context-panel";

export function AllocationRouteMap({
  context,
}: {
  context: OperationalContextView;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const requestedVisibility = useRef(false);
  const scene = useRef<{ map: LeafletMap; incidents: LayerGroup } | null>(null);
  const data = context.routeMap;
  useEffect(() => {
    if (!data || !element.current) return;
    let disposed = false;
    let map: LeafletMap | undefined;
    let observer: ResizeObserver | undefined;
    setError(false);
    void import("leaflet")
      .then((L) => {
        if (disposed || !element.current) return;
        map = L.map(element.current, {
          scrollWheelZoom: false,
          zoomAnimation: false,
          fadeAnimation: false,
        });
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(map);
        tiles.on("tileerror", () => {
          if (!disposed) setError(true);
        });
        const position = (point: {
          latitude: number;
          longitude: number;
        }): [number, number] => [point.latitude, point.longitude];
        const label = (value: string) => {
          const node = document.createElement("span");
          node.textContent = value;
          return node;
        };
        L.circleMarker(position(data.origin), {
          radius: 8,
          color: "#123f3a",
          fillColor: "#fff",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(label(`Start: ${context.origin.name}`));
        L.circleMarker(position(data.destination), {
          radius: 8,
          color: "#123f3a",
          fillColor: "#123f3a",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(label(`Destination: ${context.destination.name}`));
        const points = data.path?.length
          ? data.path.map(position)
          : [position(data.origin), position(data.destination)];
        if (data.path?.length)
          L.polyline(points, { color: "#123f3a", weight: 5 }).addTo(map);
        const incidents = L.layerGroup();
        scene.current = { map, incidents };
        if (requestedVisibility.current) incidents.addTo(map);
        for (const incident of data.incidents)
          L.circleMarker(position(incident.location), {
            radius: 7,
            color: incident.closed ? "#a53128" : "#9b660e",
            fillOpacity: 0.8,
          })
            .addTo(incidents)
            .bindTooltip(
              label(
                incident.closed
                  ? "Closure reported nearby"
                  : "Traffic incident reported nearby",
              ),
            );
        map.fitBounds(L.latLngBounds(points), {
          padding: [30, 30],
          maxZoom: 15,
        });
        observer = new ResizeObserver(() => {
          map?.invalidateSize({ pan: false });
          map?.fitBounds(L.latLngBounds(points), {
            padding: [30, 30],
            maxZoom: 15,
            animate: false,
          });
        });
        observer.observe(element.current);
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      if (scene.current?.map === map) scene.current = null;
      map?.remove();
    };
  }, [data, context.origin.name, context.destination.name]);
  if (!data)
    return (
      <p>
        Map locations could not be verified. Refresh the travel checks to try
        again.
      </p>
    );
  return (
    <section className="allocation-route-map" aria-label="Transfer route map">
      <h5>Transfer route</h5>
      <div
        ref={element}
        className="allocation-route-map__canvas"
        role="region"
        aria-label={`Map from ${context.origin.name} to ${context.destination.name}`}
      />
      {data.incidents.length > 0 && (
        <label className="allocation-route-map__toggle">
          <input
            type="checkbox"
            checked={showIncidents}
            onChange={(event) => {
              const checked = event.target.checked;
              setShowIncidents(checked);
              requestedVisibility.current = checked;
              const current = scene.current;
              if (current) {
                if (checked) current.incidents.addTo(current.map);
                else current.map.removeLayer(current.incidents);
              }
            }}
          />
          Show nearby traffic reports ({data.incidents.length})
        </label>
      )}
      {showIncidents && data.incidents.length > 0 && (
        <p>Red: reported road closure. Amber: other nearby traffic report.</p>
      )}
      {error && (
        <p role="status">
          Some map tiles could not be loaded. Route estimates and location
          details remain available below.
        </p>
      )}
      <p>
        {data.path?.length
          ? `Route supplied by ${data.provider}.`
          : "Mapped start and destination reference points. The provider did not supply a route line."}{" "}
        Incident markers show nearby reports; they do not establish that the
        route crosses an incident.
      </p>
    </section>
  );
}
