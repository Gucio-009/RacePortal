/**
 * LocationMapPicker — klikalna / przeciągalna pinezka lokalizacji wydarzenia.
 *
 * Użycie: dialog organizatora (`OrganizerEventFormDialog`) — wybór lat/lng.
 * Leaflet + react-leaflet; ikony bundlowane przez Vite (jak w EventsMapView).
 *
 * InvalidateSize: mapa w Dialogu ma początkowo zerowy rozmiar kontenera —
 * po ~120 ms wywołujemy `map.invalidateSize()`, żeby kafelki się przeliczyły.
 * FlyToPin: po zmianie współrzędnych (preset toru) płynnie dolatuje do pinezki.
 * ClickToSetPin: klik mapy ustawia lat/lng (6 miejsc po przecinku).
 *
 * Domyślny widok bez pinezki: `POLAND_CENTER` [52.1, 19.4] zoom 6.
 *
 * Pomysł (alt): geokodowanie adresu (Nominatim) zamiast samego kliknięcia mapy.
 */

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite: bez mergeOptions pinezki Leaflet są „zepsute” (404 na ikonach).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
};

/** Centrum Polski — startowy widok gdy brak wybranej lokalizacji. */
const POLAND_CENTER: [number, number] = [52.1, 19.4];

/** Klik w mapę → zapis współrzędnych (6 miejsc dziesiętnych ≈ ~0.1 m). */
function ClickToSetPin({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

/** Po zmianie lat/lng (np. wybór presetu toru) — flyTo na pinezkę. */
function FlyToPin({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { duration: 0.6 });
  }, [map, lat, lng]);
  return null;
}

/**
 * Po otwarciu dialogu kontener mapy często ma 0×0 — invalidateSize naprawia kafelki.
 * Timeout 120 ms: dialog Radix kończy animację / layout.
 */
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

/** Mapa z klikalną / przeciągalną pinezką lokalizacji wydarzenia. */
export function LocationMapPicker({ lat, lng, onChange, height = "260px", className = "" }: Props) {
  const hasPin = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const center: [number, number] = hasPin ? [lat, lng] : POLAND_CENTER;

  return (
    <div className={`rounded-lg overflow-hidden border border-[#2a2a2a] ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={hasPin ? 12 : 6}
        scrollWheelZoom
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <InvalidateSize />
        <ClickToSetPin onChange={onChange} />
        <FlyToPin lat={lat} lng={lng} />
        {hasPin && (
          <Marker
            position={[lat, lng]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const p = m.getLatLng();
                onChange(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
