
import { IDataSource } from '../DataSource';
import { Geocache } from '../../../types';
import { fetchWithRetry, processStandardResponse } from './fetchUtils';

export class ByPublishedData implements IDataSource {
  readonly id = 'by_published';
  private url: string;

  constructor() {
    //this.url = `${CONFIG.apiBase}/caches/${CONFIG.endpoints.by_published}`;
    this.url = 'https://kevinaudio.bjcnc.scs.sohucs.com/geocaches_newpublish.gz';
  }

  async fetch(): Promise<Geocache[]> {
    const data = await fetchWithRetry(this.url);
    return processStandardResponse(data);
  }
}
