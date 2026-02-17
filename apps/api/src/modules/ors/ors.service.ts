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
  private readonly apiKey: string;
  private readonly profile: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('ORS_BASE_URL', 'https://api.openrouteservice.org');
    this.apiKey = this.configService.get<string>('ORS_API_KEY', '');
    this.profile = this.configService.get<string>('ORS_PROFILE', 'driving-hgv');
  }

  /**
   * Call ORS directions API with given coordinates.
   * Coordinates are in [longitude, latitude] format (GeoJSON convention).
   */
  async getDirections(coordinates: [number, number][]): Promise<OrsDirectionsResponse | null> {
    if (!this.apiKey) {
      this.logger.warn('ORS_API_KEY is not set, skipping route geometry');
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<OrsDirectionsResponse>(
          `${this.baseUrl}/v2/directions/${this.profile}/geojson`,
          { coordinates },
          {
            headers: {
              Authorization: this.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `ORS directions request failed: ${error.response?.data?.error?.message || error.message}`,
      );
      return null;
    }
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
    // Track which indices in coordinates array are actual stops (for segment splitting)
    const stopIndices: number[] = [];

    for (let i = 0; i < stops.length; i++) {
      stopIndices.push(coordinates.length);
      coordinates.push([stops[i].longitude, stops[i].latitude]);

      // Add waypoints for segment i → i+1
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

    // Calculate per-segment (stop-to-stop) distances/durations from ORS segments.
    // ORS returns one segment per consecutive coordinate pair in the request.
    // We need to aggregate segments between stop indices.
    const segments = feature.properties.segments;
    const segmentDistances: number[] = [];
    const segmentDurations: number[] = [];

    // ORS segments correspond to consecutive waypoint pairs.
    // We need to group them by stop-to-stop segments.
    let orsSegIdx = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const coordsBetween = stopIndices[i + 1] - stopIndices[i]; // number of ORS sub-segments
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
