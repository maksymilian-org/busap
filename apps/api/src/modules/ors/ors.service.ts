import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { RoutePreviewResult } from '@busap/shared';

interface OrsDirectionsResponse {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number][];
    };
    properties: {
      segments: Array<{
        distance: number;
        duration: number;
      }>;
      summary: {
        distance: number;
        duration: number;
      };
    };
  }>;
}

@Injectable()
export class OrsService {
  private readonly logger = new Logger(OrsService.name);
  private readonly baseUrl: string;
  private readonly fallbackUrl: string;
  private readonly apiKey: string;
  private readonly profile: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('ORS_BASE_URL', 'https://api.openrouteservice.org');
    this.fallbackUrl = this.configService.get<string>('ORS_FALLBACK_URL', '');
    this.apiKey = this.configService.get<string>('ORS_API_KEY', '');
    this.profile = this.configService.get<string>('ORS_PROFILE', 'driving-hgv');
  }

  /**
   * Call ORS directions API. Tries primary URL first, falls back to secondary.
   * Coordinates are in [longitude, latitude] format (GeoJSON convention).
   */
  async getDirections(coordinates: [number, number][]): Promise<OrsDirectionsResponse | null> {
    // Try primary (local ORS)
    const primary = await this.callOrs(this.baseUrl, coordinates);
    if (primary) return primary;

    // Try fallback (public ORS) if configured
    if (this.fallbackUrl) {
      this.logger.warn('Primary ORS failed, trying fallback');
      return this.callOrs(this.fallbackUrl, coordinates);
    }

    return null;
  }

  private async callOrs(
    baseUrl: string,
    coordinates: [number, number][],
  ): Promise<OrsDirectionsResponse | null> {
    const isPublicApi = baseUrl.includes('openrouteservice.org');

    // Public API requires key; local ORS does not
    if (isPublicApi && !this.apiKey) {
      this.logger.warn('ORS_API_KEY not set, cannot use public ORS API');
      return null;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isPublicApi && this.apiKey) {
        headers['Authorization'] = this.apiKey;
      }

      const response = await firstValueFrom(
        this.httpService.post<OrsDirectionsResponse>(
          `${baseUrl}/v2/directions/${this.profile}/geojson`,
          { coordinates },
          { headers, timeout: 30000 },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `ORS request to ${baseUrl} failed: ${error.response?.data?.error?.message || error.message}`,
      );
      return null;
    }
  }

  /**
   * Check if ORS is reachable.
   */
  async healthCheck(): Promise<{ primary: boolean; fallback: boolean }> {
    const checkUrl = async (url: string): Promise<boolean> => {
      try {
        await firstValueFrom(
          this.httpService.get(`${url}/v2/health`, { timeout: 5000 }),
        );
        return true;
      } catch {
        return false;
      }
    };

    return {
      primary: await checkUrl(this.baseUrl),
      fallback: this.fallbackUrl ? await checkUrl(this.fallbackUrl) : false,
    };
  }

  /**
   * Compute full route geometry from ordered stops with optional waypoints per segment.
   * Stops are in [latitude, longitude] format.
   * Waypoints: { "0": [[lat,lng], ...], "1": [[lat,lng], ...] } — keyed by segment index.
   */
  async computeRouteGeometry(
    stops: Array<{ latitude: number; longitude: number }>,
    waypointsBySegment: Record<string, [number, number][]> = {},
  ): Promise<RoutePreviewResult | null> {
    if (stops.length < 2) return null;

    // Build coordinate list: for each segment stop[i] → stop[i+1],
    // insert any waypoints between them.
    // ORS expects [lng, lat] order.
    const coordinates: [number, number][] = [];
    const stopIndices: number[] = [];

    for (let i = 0; i < stops.length; i++) {
      stopIndices.push(coordinates.length);
      coordinates.push([stops[i].longitude, stops[i].latitude]);

      const segWaypoints = waypointsBySegment[String(i)];
      if (segWaypoints && i < stops.length - 1) {
        for (const wp of segWaypoints) {
          coordinates.push([wp[1], wp[0]]); // [lng, lat]
        }
      }
    }

    const result = await this.getDirections(coordinates);
    if (!result?.features?.[0]) return null;

    const feature = result.features[0];
    const geometry = {
      type: 'LineString' as const,
      coordinates: feature.geometry.coordinates,
    };

    const segments = feature.properties.segments;
    const segmentDistances: number[] = [];
    const segmentDurations: number[] = [];

    let orsSegIdx = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const coordsBetween = stopIndices[i + 1] - stopIndices[i];
      let dist = 0;
      let dur = 0;
      for (let j = 0; j < coordsBetween && orsSegIdx < segments.length; j++, orsSegIdx++) {
        dist += segments[orsSegIdx].distance;
        dur += segments[orsSegIdx].duration;
      }
      segmentDistances.push(dist);
      segmentDurations.push(dur);
    }

    return {
      geometry,
      totalDistance: feature.properties.summary.distance,
      totalDuration: feature.properties.summary.duration,
      segmentDistances,
      segmentDurations,
    };
  }
}
