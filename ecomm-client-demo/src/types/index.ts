export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  description: string;
  highlights: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const CUSTOMER = {
  name: 'Suryansh',
  phone: '+918791234693',
} as const;
