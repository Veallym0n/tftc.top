import { IDataSource } from '../DataSource';
import { Geocache } from '@/types';
import { dbService } from '../../db';

export class ByCurrentEventData implements IDataSource {
  readonly id = 'by_current_event';

  string2timestamp(dateStr: string): number {
    try {
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, second).getTime();
    } catch (error) {
      return 0;
    }
  }

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();

    const currentTime = new Date();
    
    const eventTypes = new Set([6, 13, 69]);

    return allCaches.filter(cache => 
      eventTypes.has(cache.geocacheType) 
      && this.string2timestamp(cache.placedDate) > currentTime.getTime()
    );
  }
}
