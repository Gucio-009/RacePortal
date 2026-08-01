import { Router } from "express";
import { z } from "zod";
import { formLimiter } from "../middleware/rateLimit.js";

export const mapsRouter = Router();

mapsRouter.post("/route", formLimiter, async (req, res, next) => {
  try {
    const data = z
      .object({
        fromLat: z.number(),
        fromLng: z.number(),
        toLat: z.number(),
        toLng: z.number(),
      })
      .parse(req.body);

    const key = process.env.GOOGLE_MAPS_API_KEY;

    if (key) {
      const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
      url.searchParams.set("origin", `${data.fromLat},${data.fromLng}`);
      url.searchParams.set("destination", `${data.toLat},${data.toLng}`);
      url.searchParams.set("mode", "driving");
      url.searchParams.set("key", key);

      const response = await fetch(url);
      const json = (await response.json()) as any;
      if (json.status !== "OK" || !json.routes?.[0]) {
        return res.status(502).json({ error: "Google Directions niedostępne", details: json.status });
      }

      const route = json.routes[0];
      const leg = route.legs[0];
      const points = decodePolyline(route.overview_polyline.points);

      return res.json({
        provider: "google",
        distanceMeters: leg.distance.value,
        durationSeconds: leg.duration.value,
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        polyline: points,
      });
    }

    const osrm = `https://router.project-osrm.org/route/v1/driving/${data.fromLng},${data.fromLat};${data.toLng},${data.toLat}?overview=full&geometries=geojson`;
    const response = await fetch(osrm);
    const json = (await response.json()) as any;
    if (json.code !== "Ok" || !json.routes?.[0]) {
      return res.status(502).json({ error: "Nie udało się wytyczyć trasy" });
    }

    const route = json.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

    res.json({
      provider: "osrm",
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      distanceText: `${(route.distance / 1000).toFixed(1)} km`,
      durationText: `${Math.round(route.duration / 60)} min`,
      polyline: coords,
    });
  } catch (e) {
    next(e);
  }
});

function decodePolyline(encoded: string): [number, number][] {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}
