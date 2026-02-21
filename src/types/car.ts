export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  gearbox: 'Manual' | 'Automatic';
  country: 'Romania' | 'Poland' | 'Bulgaria' | 'Moldova' | string;
  location: string;
  image: string;
  gallery: string[];
  sourcePlatform: 'Autovit' | 'Otomoto' | 'Mobile.bg' | '999.md' | string;
  sourceUrl: string;
  description?: string;
}
