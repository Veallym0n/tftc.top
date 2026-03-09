
import { Geocache } from '../../types';

export interface IDataSource {
  /**
   * Unique identifier for the strategy (e.g., 'by_published', 'all')
   */
  readonly id: string;

  /**
   * Execute the data fetching/processing logic
   */
  fetch(): Promise<Geocache[]>;
}
