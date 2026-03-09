import { IDataSource } from '../DataSource';
import { Geocache } from '../../types';
import { dbService } from '../../db';

export class ByFoundData implements IDataSource {
  readonly id = 'by_found';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    return allCaches.filter(cache => 
      cache.lastFoundDate && cache.lastFoundDate.startsWith(todayStr)
    );
  }
}
