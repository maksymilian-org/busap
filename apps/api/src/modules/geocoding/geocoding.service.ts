import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.module';

export interface GeocodingResult {
  address?: string;
  city?: string;
  county?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  formattedAddress?: string;
}

const CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const MIN_REQUEST_INTERVAL = 1100; // ms — Nominatim rate limit
const RATE_LIMIT_KEY = 'geocode:last_request';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const roundedLat = lat.toFixed(4);
    const roundedLng = lng.toFixed(4);
    const cacheKey = `geocode:${roundedLat}:${roundedLng}`;

    try {
      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Rate limiting
      await this.enforceRateLimit();

      const response = await firstValueFrom(
        this.httpService.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            lat: roundedLat,
            lon: roundedLng,
            format: 'json',
            addressdetails: 1,
            'accept-language': 'pl,en',
          },
          headers: {
            'User-Agent': 'Busap/1.0 (bus transport platform)',
          },
          timeout: 10000,
        }),
      );

      const data = response.data;
      if (!data || data.error) {
        this.logger.warn(`Nominatim returned error for ${roundedLat},${roundedLng}: ${data?.error}`);
        return null;
      }

      const addr = data.address || {};
      const result: GeocodingResult = {
        address: [addr.road, addr.house_number].filter(Boolean).join(' ') || undefined,
        city: addr.city || addr.town || addr.village || addr.hamlet || undefined,
        county: addr.county || undefined,
        region: addr.state || undefined,
        postalCode: addr.postcode || undefined,
        country: addr.country || undefined,
        countryCode: addr.country_code?.toUpperCase() || undefined,
        formattedAddress: data.display_name || undefined,
      };

      // Cache the result
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      this.logger.error(`Reverse geocoding failed for ${roundedLat},${roundedLng}`, error);
      return null;
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const lastRequest = await this.redis.get(RATE_LIMIT_KEY);

    if (lastRequest) {
      const elapsed = now - parseInt(lastRequest, 10);
      if (elapsed < MIN_REQUEST_INTERVAL) {
        await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed));
      }
    }

    await this.redis.set(RATE_LIMIT_KEY, Date.now().toString());
  }
}
