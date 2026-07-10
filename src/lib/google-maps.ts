import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

// Maps JS API のロードは一度だけ行い、以降は同じ Promise を使い回す
export function loadPlacesLibrary() {
  if (!placesLibraryPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return Promise.reject(
        new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が設定されていません"),
      );
    }
    setOptions({ key: apiKey, v: "weekly" });
    placesLibraryPromise = importLibrary("places");
  }
  return placesLibraryPromise;
}
