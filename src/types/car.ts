export interface Car {
  id: string;
  brand: string;
  model: string;
  title?: string;
  year: number;
  price_eur: number;
  mileage: number;
  fuel: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  gearbox: 'Manual' | 'Automatic';
  country: 'Romania' | 'Poland' | 'Bulgaria' | 'Moldova' | string;
  location: string;
  images: string[];
  gallery?: string[]; // Deprecated, use images instead
  sourcePlatform: 'Autovit' | 'Otomoto' | 'Mobile.bg' | '999.md' | string;
  sourceUrl: string;
  description?: string;
}
