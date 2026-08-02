import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

const POLAND_CENTER: [number, number] = [52.1, 19.4];

function ClickToSetPin({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

function FlyToPin({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { duration: 0.6 });
  }, [map, lat, lng]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

/** Clickable / draggable pin map for event location. */
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
