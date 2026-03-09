
import { IDataSource } from '../DataSource';
import { Geocache } from '../../../types';
import { CONFIG } from '../../../constants';
import { fetchWithRetry, processStandardResponse } from './fetchUtils';

export class ByPublishedData implements IDataSource {
  readonly id = 'by_published';
  private url: string;

  constructor() {
    this.url = `${CONFIG.apiBase}/caches/${CONFIG.endpoints.by_published}`;
  }

  async fetch(): Promise<Geocache[]> {
    const data = await fetchWithRetry(this.url);
    return processStandardResponse(data);
  }
}
