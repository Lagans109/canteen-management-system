// The shape of a menu item as shown on the public (unauthenticated) menu —
// deliberately smaller than the full MenuItem document: no `active` flag,
// no raw category id (the category is expanded to {id, name}), etc.,
// since students never need those internal fields.
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
