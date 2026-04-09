import { IDataSource } from '../DataSource';
import { Geocache } from '@/types';
import { dbService } from '../../db';

export class ByAllEventData implements IDataSource {
  readonly id = 'by_event';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    
    const eventTypes = new Set([6, 13, 69]);

    return allCaches.filter(cache => 
      eventTypes.has(cache.geocacheType)
    );
  }
}
