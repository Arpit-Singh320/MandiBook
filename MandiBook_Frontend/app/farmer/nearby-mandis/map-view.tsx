"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Mandi {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: string;
  slotsToday: number;
}

interface MapViewProps {
  mandis: Mandi[];
  selectedMandi: string | null;
  onSelectMandi: (id: string) => void;
  userLocation: { lat: number; lng: number } | null;
}

const mandiIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView({ mandis, onSelectMandi, userLocation }: MapViewProps) {
  const center = userLocation ?? { lat: 28.6139, lng: 77.209 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Location Marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-sm">Your Location</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Mandi Markers */}
      {mandis.map((mandi) => (
        <Marker
          key={mandi.id}
          position={[mandi.lat, mandi.lng]}
          icon={mandiIcon}
          eventHandlers={{
            click: () => onSelectMandi(mandi.id),
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-bold text-sm mb-1">{mandi.name}</p>
              <p className="text-xs text-neutral-500 mb-1">{mandi.address}</p>
              <p className="text-xs text-green-700 font-medium mb-2">
                {mandi.slotsToday} slots available · {mandi.distance}
              </p>
              <a
                href="/farmer/book-slot"
                className="inline-block px-3 py-1 rounded bg-green-700 text-white text-xs font-medium no-underline hover:bg-green-800"
              >
                Book Slot →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
