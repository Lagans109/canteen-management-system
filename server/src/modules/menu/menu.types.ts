export interface PublicMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  variantLabel?: string;
  imageUrl?: string;
  category: {
    id: string;
    name: string;
  };
}
