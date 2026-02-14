'use client';

import { useEffect, useRef, useState } from 'react';
import { Clinic } from '@/lib/api';

declare global {
  interface Window {
    L: {
      map: (el: HTMLElement) => LeafletMap;
      tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
      marker: (latlng: [number, number]) => LeafletMarker;
      layerGroup: () => LeafletLayerGroup;
    };
  }
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  fitBounds: (bounds: [number, number][], options?: Record<string, unknown>) => void;
}

interface LeafletLayer {
  addTo: (map: LeafletMap) => LeafletLayer;
}

interface LeafletMarker {
  addTo: (layer: LeafletLayerGroup) => LeafletMarker;
  bindPopup: (html: string) => LeafletMarker;
}

interface LeafletLayerGroup {
  addTo: (map: LeafletMap) => LeafletLayerGroup;
  clearLayers: () => void;
}

type GeocodeResult = { lat: number; lon: number } | null;
type GeocodeWithMeta = { coords: GeocodeResult; fromCache: boolean };

interface ClinicMapProps {
  clinics: Clinic[];
  maxPins?: number;
}

const LEAFLET_CSS_ID = 'leaflet-css-cdn';
const LEAFLET_JS_ID = 'leaflet-js-cdn';
const CACHE_KEY = 'clinic_geocode_cache_v1';

function loadLeafletCss(): void {
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement('link');
  link.id = LEAFLET_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

function loadLeafletJs(): Promise<void> {
  if (window.L) return Promise.resolve();
  const existing = document.getElementById(LEAFLET_JS_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Leaflet JS')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = LEAFLET_JS_ID;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet JS'));
    document.body.appendChild(script);
  });
}

function extractPostalCode(address: string): string {
  const match = address.match(/\b(\d{6})\b/);
  return match?.[1] || '';
}

function getCache(): Record<string, GeocodeResult> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, GeocodeResult>;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, GeocodeResult>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors.
  }
}

async function geocodeClinic(clinic: Clinic, cache: Record<string, GeocodeResult>): Promise<GeocodeWithMeta> {
  const address = String(clinic.address || '').trim();
  if (!address) return { coords: null, fromCache: true };

  const postal = extractPostalCode(address);
  const cacheKey = postal || address;
  if (cacheKey in cache) return { coords: cache[cacheKey], fromCache: true };

  try {
    if (postal) {
      const response = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(postal)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
      );
      const data = await response.json() as { results?: Array<{ LATITUDE?: string; LONGITUDE?: string }> };
      const first = data.results?.[0];
      if (first?.LATITUDE && first?.LONGITUDE) {
        const result = { lat: Number(first.LATITUDE), lon: Number(first.LONGITUDE) };
        cache[cacheKey] = result;
        return { coords: result, fromCache: false };
      }
    }

    const fallbackResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${address}, Singapore`)}`
    );
    const fallbackData = await fallbackResponse.json() as Array<{ lat?: string; lon?: string }>;
    if (fallbackData?.[0]?.lat && fallbackData?.[0]?.lon) {
      const result = { lat: Number(fallbackData[0].lat), lon: Number(fallbackData[0].lon) };
      cache[cacheKey] = result;
      return { coords: result, fromCache: false };
    }
  } catch {
    // Ignore geocode errors for single marker.
  }

  cache[cacheKey] = null;
  return { coords: null, fromCache: false };
}

export default function ClinicMap({ clinics, maxPins = 120 }: ClinicMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadingPins, setLoadingPins] = useState(false);
  const [renderedPins, setRenderedPins] = useState(0);

  useEffect(() => {
    let disposed = false;

    const setupMap = async () => {
      if (!containerRef.current) return;

      loadLeafletCss();
      await loadLeafletJs();
      if (disposed || !containerRef.current) return;

      if (!mapRef.current) {
        const map = window.L.map(containerRef.current).setView([1.3521, 103.8198], 11);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapRef.current = map;
        layerRef.current = window.L.layerGroup().addTo(map);
      }

      if (!mapRef.current || !layerRef.current) return;
      layerRef.current.clearLayers();
      setLoadingPins(true);

      const selected = clinics.slice(0, maxPins);
      const cache = getCache();
      const bounds: [number, number][] = [];
      let pinCount = 0;

      for (const clinic of selected) {
        const { coords: geo, fromCache } = await geocodeClinic(clinic, cache);
        if (!geo || disposed || !layerRef.current) continue;

        const name = String(clinic.name || 'Clinic');
        const addr = String(clinic.address || '');
        const vaccine = String(clinic.vaccine || '');
        window.L
          .marker([geo.lat, geo.lon])
          .addTo(layerRef.current)
          .bindPopup(
            `<div style="max-width:320px"><strong>${name}</strong><br/>${addr}<br/><small>${vaccine}</small></div>`
          );

        bounds.push([geo.lat, geo.lon]);
        pinCount += 1;

        // Only throttle when we had to call external geocoding APIs.
        if (!fromCache) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      saveCache(cache);
      setRenderedPins(pinCount);
      setLoadingPins(false);

      if (bounds.length > 1 && mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    };

    setupMap();

    return () => {
      disposed = true;
    };
  }, [clinics, maxPins]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Clinic Map</h3>
        <p className="text-sm text-slate-500">
          {loadingPins ? 'Loading pins...' : `Showing ${renderedPins} mapped clinics`}
        </p>
      </div>
      <div ref={containerRef} className="h-[430px] w-full rounded-lg border border-slate-200" />
      <p className="mt-3 text-xs text-slate-500">
        Pins are geocoded from clinic addresses and cached in your browser for faster reloads.
      </p>
    </div>
  );
}
