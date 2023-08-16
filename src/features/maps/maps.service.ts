import { Injectable } from '@nestjs/common';
import { MapsConfigService } from 'src/config/maps/config.service';
import { Client } from '@googlemaps/google-maps-services-js';
import { DateTime } from 'luxon';

@Injectable()
export class MapsService {
  constructor(private config: MapsConfigService) {}

  async placeIdToTimezone(placeId: string): Promise<string> {
    const client = new Client({});
    return client
      .placeDetails({ params: { key: this.config.key, place_id: placeId } })
      .then((details) => {
        if (details.data.result.geometry) {
          return client.timezone({
            params: {
              key: this.config.key,
              timestamp: DateTime.now().toJSDate(),
              location: details.data.result.geometry.location,
            },
          });
        }
      })
      .then((result) => {
        return result?.data.timeZoneId ?? '';
      });
  }
}
