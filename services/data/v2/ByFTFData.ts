import { IDataSource } from '../DataSource';
import { Geocache } from '../../types';
import { dbService } from '../../db';

export class ByFTFData implements IDataSource {
  readonly id = 'by_ftf';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();

    return allCaches.filter(cache => 
      !cache.lastFoundDate || cache.lastFoundDate.startsWith('1970')
    );
  }
}
