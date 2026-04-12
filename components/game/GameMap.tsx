"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import * as L from "leaflet";
import { MapPin } from "lucide-react";

export interface GameMapProps {
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number } | null | undefined;
  startName?: string;
  endName?: string;
}

function makeCircleIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:0 2px 8px rgba(0,0,0,0.6);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;color:#0a0e1a;
      font-family:sans-serif;
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

const startIcon = makeCircleIcon("#00d4ff", "S");
const endIcon = makeCircleIcon("#ff6b35", "E");

// Inner component that has access to the map instance via useMap()
function MapInner({
  startPoint,
  endPoint,
  endRevealed,
}: {
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number } | null | undefined;
  endRevealed: boolean;
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (endRevealed && endPoint && !fittedRef.current) {
      fittedRef.current = true;
      map.fitBounds(
        [
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng],
        ],
        { padding: [40, 40] }
      );
    }
  }, [endRevealed, endPoint, map, startPoint]);

  // Reset flag if end is hidden again
  useEffect(() => {
    if (!endRevealed) fittedRef.current = false;
  }, [endRevealed]);

  return (
    <>
      <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon} />
      {endRevealed && endPoint && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon} />
      )}
    </>
  );
}

export default function GameMap({
  startPoint,
  endPoint,
  startName,
  endName,
}: GameMapProps) {
  const [endRevealed, setEndRevealed] = useState(false);

  return (
    <div>
      {/* Map container — Leaflet requires an explicit height */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          height: "clamp(280px, 40vw, 360px)",
          border: "1px solid var(--border-dim)",
        }}
      >
        <MapContainer
          center={[startPoint.lat, startPoint.lng]}
          zoom={14}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapInner
            startPoint={startPoint}
            endPoint={endPoint}
            endRevealed={endRevealed}
          />
        </MapContainer>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {startName ?? "Indulási pont"}
        </p>

        {endPoint && (
          <button
            onClick={() => setEndRevealed((v) => !v)}
            className="btn-ghost flex items-center gap-1 text-xs"
            style={{ color: endRevealed ? "var(--orange)" : "var(--cyan)" }}
          >
            <MapPin size={13} />
            {endRevealed ? "Elrejtés" : "Célpont mutatása"}
          </button>
        )}
      </div>

      {/* End name revealed */}
      {endRevealed && endName && (
        <p
          className="text-xs mt-1 text-right"
          style={{ color: "var(--text-muted)" }}
        >
          Célpont: {endName}
        </p>
      )}
    </div>
  );
}
