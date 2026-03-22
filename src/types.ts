export interface PriceSourceStrategy {
  readonly sourceName: string;

  supports(itemType: 'medicine' | 'input'): boolean;

  fetchPrices(params: {
    itemName: string;
    dosage?: string;
    measurementUnit?: string;
  }): Promise<number[]>;
}

export interface PriceSearchResult {
  averagePrice: number | null;
  source: string;
  lastUpdated: Date;
}
