import { IDataSource } from '../DataSource';
import { Geocache } from '@/types';
import { dbService } from '../../db';

export class ByTodayData implements IDataSource {
  readonly id = 'by_today';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const matchStr = `-${mm}-${dd}`;

    return allCaches.filter(cache => 
      cache.placedDate && cache.placedDate.includes(matchStr)
    );
  }
}
