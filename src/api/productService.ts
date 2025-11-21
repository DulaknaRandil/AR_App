import { supabase } from './supabaseClient';

// Fetches all products with their variants and categories
export const getProducts = async () => {
  const { data, error } = await supabase
   .from('products')
   .select(`
      *,
      categories(*),
      product_variants(*)
    `);

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return data;
};

// Fetches a single product by its ID
export const getProductById = async (productId: string) => {
  const { data, error } = await supabase
   .from('products')
   .select(`
      *,
      categories(*),
      product_variants(*)
    `)
   .eq('id', productId)
   .single();

  if (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
  return data;
};
