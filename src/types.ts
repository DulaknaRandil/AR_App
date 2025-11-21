export interface Category {
    id: string;
    name: string;
  }
  
  export interface ProductVariant {
    id: string;
    product_id: string;
    color_name: string;
    color_hex: string;
    material_name: string;
  }
  
  export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    dimensions?: {
      width: number;
      height: number;
      depth: number;
    };
    model_url?: string;
    thumbnail_url?: string;
    image_url?: string;
    category_id?: string;
    category?: string;
    categories?: Category;
    product_variants?: ProductVariant[];
    stock?: number;
    material?: string;
    color?: string;
    created_at?: string;
    updated_at?: string;
  }
  