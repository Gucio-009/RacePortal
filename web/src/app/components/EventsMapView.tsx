import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Link } from "react-router";
import { eventImage } from "../lib/types";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  href?: string;
}

interface EventsMapViewProps {
  markers: MapMarker[];
  polyline?: [number, number][];
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
}

function FitBounds({ markers, polyline }: { markers: MapMarker[]; polyline?: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      ...markers.map((m) => [m.lat, m.lng] as [number, number]),
      ...(polyline ?? []),
    ];
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, markers, polyline]);

  return null;
}

export function EventsMapView({
  markers,
  polyline,
  center = [52.0, 19.0],
  zoom = 6,
  className = "",
  height = "500px",
}: EventsMapViewProps) {
  return (
    <div className={`rounded-lg overflow-hidden border border-[#2a2a2a] ${className}`} style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds markers={markers} polyline={polyline} />
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold mb-1">{marker.title}</p>
                {marker.subtitle && <p className="text-gray-600 mb-2">{marker.subtitle}</p>}
                {marker.href && (
                  <Link to={marker.href} className="text-[#b8860b] font-semibold hover:underline">
                    Szczegóły
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {polyline && polyline.length > 1 && (
          <Polyline positions={polyline} pathOptions={{ color: "#FFD700", weight: 4, opacity: 0.85 }} />
        )}
      </MapContainer>
    </div>
  );
}

export function eventToMarker(event: {
  id: string;
  name: string;
  track: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
}): MapMarker | null {
  if (event.lat == null || event.lng == null) return null;
  return {
    id: event.id,
    lat: event.lat,
    lng: event.lng,
    title: event.name,
    subtitle: `${event.track}, ${event.city}`,
    href: `/wydarzenia/${event.id}`,
  };
}

export { eventImage };
