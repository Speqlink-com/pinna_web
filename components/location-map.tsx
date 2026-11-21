"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot, type Root } from "react-dom/client";
import { Building2, Pill, Ambulance, Leaf, FlaskConical } from "lucide-react";
import type { Provider } from "@/lib/types";
import { PremiumIcon } from "./premium-icon";

export type Point = { lat: number; lng: number };
const noProviders: Provider[] = [];
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
type Place = {
  id: string;
  geometry: { coordinates: [number, number] };
  properties: { full_address?: string; name: string; place_formatted?: string };
};
type Props = {
  providers?: Provider[];
  point?: Point | null;
  picking?: boolean;
  disabled?: boolean;
  onPick?: (point: Point, address?: string) => void;
  onProvider?: (provider: Provider) => void;
  onSearchArea?: (point: Point) => void;
};

export function LocationMap({
  providers = noProviders,
  point,
  picking = false,
  disabled = false,
  onPick,
  onProvider,
  onSearchArea,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const callbacks = useRef({
    onPick,
    onProvider,
    onSearchArea,
    disabled,
    picking,
  });
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    callbacks.current = { onPick, onProvider, onSearchArea, disabled, picking };
  }, [onPick, onProvider, onSearchArea, disabled, picking]);
  useEffect(() => {
    if (!container.current || !token) return;
    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: container.current,
        accessToken: token,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [36.8219, -1.2921],
        zoom: 11,
      });
    } catch {
      queueMicrotask(() =>
        setError(
          "The map could not load. Use the address and coordinate fields or provider list.",
        ),
      );
      return;
    }
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl(), "bottom-left");
    const locate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    });
    map.addControl(locate, "top-right");
    locate.on("geolocate", (event: GeolocationPosition) => {
      const p = { lat: event.coords.latitude, lng: event.coords.longitude };
      if (callbacks.current.picking && !callbacks.current.disabled)
        callbacks.current.onPick?.(p);
      else if (!callbacks.current.picking) callbacks.current.onSearchArea?.(p);
    });
    map.on("click", (e) => {
      if (callbacks.current.picking && !callbacks.current.disabled)
        callbacks.current.onPick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    map.on("error", () =>
      setError(
        "Some map content could not load. Check your connection or use the list and location fields.",
      ),
    );
    const resize = new ResizeObserver(() => map.resize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: mapboxgl.Marker[] = [];
    const roots: Root[] = [];
    const bounds = new mapboxgl.LngLatBounds();
    for (const provider of providers) {
      if (provider.latitude == null || provider.longitude == null) continue;
      const element = document.createElement("button");
      element.type = "button";
      element.className = `location-marker ${provider.is_open === false ? "closed" : ""}`;
      element.setAttribute(
        "aria-label",
        `${provider.name}, ${provider.category}. View details`,
      );
      const Icon = provider.category.includes("Pharmacy")
        ? Pill
        : provider.category.includes("Ambulance")
          ? Ambulance
          : /Agrovet|Veterinary/.test(provider.category)
            ? Leaf
            : provider.category.includes("Laboratory")
              ? FlaskConical
              : Building2;
      const root = createRoot(element);
      roots.push(root);
      root.render(
        provider.category.includes("Pharmacy") ? (
          <PremiumIcon name="business" size={28} />
        ) : (
          <Icon size={20} />
        ),
      );
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.current.onProvider?.(provider);
      });
      markers.push(
        new mapboxgl.Marker({ element })
          .setLngLat([provider.longitude, provider.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 22 }).setText(
              `${provider.name} · ${provider.address}`,
            ),
          )
          .addTo(map),
      );
      bounds.extend([provider.longitude, provider.latitude]);
    }
    if (point) {
      const element = document.createElement("div");
      element.className = "location-selected-marker";
      const root = createRoot(element);
      roots.push(root);
      root.render(<PremiumIcon name="location" size={42} />);
      markers.push(
        new mapboxgl.Marker({
          element,
          anchor: "bottom",
          draggable: picking && !disabled,
        })
          .setLngLat([point.lng, point.lat])
          .addTo(map)
          .on("dragend", (event) => {
            const p = event.target.getLngLat();
            callbacks.current.onPick?.({ lat: p.lat, lng: p.lng });
          }),
      );
      bounds.extend([point.lng, point.lat]);
    }
    if (!bounds.isEmpty())
      map.fitBounds(bounds, {
        padding: 65,
        maxZoom: picking ? 15 : 13,
        duration: 400,
      });
    return () => {
      markers.forEach((m) => m.remove());
      roots.forEach((root) => root.unmount());
    };
  }, [providers, point, picking, disabled]);
  useEffect(() => {
    if (query.trim().length < 3 || !token || disabled) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          access_token: token,
          limit: "5",
          autocomplete: "true",
          country: "ke",
          permanent: picking ? "true" : "false",
        });
        const center = mapRef.current?.getCenter();
        if (center) params.set("proximity", `${center.lng},${center.lat}`);
        const response = await fetch(
          `https://api.mapbox.com/search/geocode/v6/forward?${params}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (!controller.signal.aborted) setPlaces(result.features ?? []);
      } catch {
        if (!controller.signal.aborted)
          setError(
            "Place search is unavailable. You can still move the map or enter coordinates.",
          );
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, picking, disabled]);
  if (!token)
    return (
      <div className="notice">
        {picking
          ? "The map is currently unavailable. Enter the address and coordinates to set this business location."
          : "The map is currently unavailable. Use provider search and ‘Use my location’ to find nearby services."}
      </div>
    );
  return (
    <section
      className="location-map"
      aria-label={picking ? "Business location picker" : "Nearby provider map"}
    >
      <div className="map-search">
        <label>
          <PremiumIcon name="location" size={24} />
          <input
            aria-label="Search places on map"
            placeholder="Search an address, town or area"
            maxLength={256}
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setPlaces([]);
              setSearching(false);
            }}
          />
        </label>
        {searching && <small role="status">Searching places…</small>}
        {!disabled && query.trim().length >= 3 && places.length > 0 && (
          <ul aria-label="Place search results">
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => {
                    const [lng, lat] = place.geometry.coordinates;
                    const p = { lat, lng };
                    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });
                    if (picking)
                      onPick?.(
                        p,
                        place.properties.full_address ??
                          [
                            place.properties.name,
                            place.properties.place_formatted,
                          ]
                            .filter(Boolean)
                            .join(", "),
                      );
                    else onSearchArea?.(p);
                    setQuery("");
                    setPlaces([]);
                  }}
                >
                  {place.properties.full_address ??
                    `${place.properties.name}, ${place.properties.place_formatted ?? ""}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={container} className="map-canvas" />
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="map-caption">
        {picking
          ? "Search, click the map or drag the pin to set this business location."
          : "Select a category icon for provider details. Blue pin: your search location."}
        {!picking && onSearchArea && (
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              const p = mapRef.current?.getCenter();
              if (p) onSearchArea({ lat: p.lat, lng: p.lng });
            }}
          >
            Search this area
          </button>
        )}
      </div>
    </section>
  );
}
