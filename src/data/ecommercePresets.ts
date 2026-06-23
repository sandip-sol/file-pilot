export interface EcommercePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  backgroundColor: string;
  maxFileSizeKB?: number;
  description: string;
}

export const ecommercePresets: EcommercePreset[] = [
  {
    id: 'square-product',
    name: 'Square Product Card',
    width: 1000,
    height: 1000,
    aspectRatio: '1:1',
    format: 'image/jpeg',
    backgroundColor: '#ffffff',
    maxFileSizeKB: 500,
    description: 'Standard square product image for web stores',
  },
  {
    id: 'product-gallery',
    name: 'Product Gallery',
    width: 1500,
    height: 1500,
    aspectRatio: '1:1',
    format: 'image/jpeg',
    backgroundColor: '#ffffff',
    maxFileSizeKB: 800,
    description: 'Higher-resolution gallery image with zoom support',
  },
  {
    id: 'product-thumbnail',
    name: 'Product Thumbnail',
    width: 300,
    height: 300,
    aspectRatio: '1:1',
    format: 'image/jpeg',
    backgroundColor: '#ffffff',
    maxFileSizeKB: 100,
    description: 'Small thumbnail for listings and search results',
  },
  {
    id: 'marketplace-main',
    name: 'Marketplace Main Image',
    width: 1600,
    height: 1600,
    aspectRatio: '1:1',
    format: 'image/jpeg',
    backgroundColor: '#ffffff',
    maxFileSizeKB: 1000,
    description: 'Primary listing image for general marketplaces',
  },
  {
    id: 'shopify-product',
    name: 'Shopify Product Image',
    width: 2048,
    height: 2048,
    aspectRatio: '1:1',
    format: 'image/jpeg',
    backgroundColor: '#ffffff',
    maxFileSizeKB: 1500,
    description: 'Recommended starting point for Shopify product images',
  },
  {
    id: 'etsy-listing',
    name: 'Etsy Listing Image',
    width: 2000,
    height: 1500,
    aspectRatio: '4:3',
    format: 'image/jpeg',
    backgroundColor: '#ffffff',
    maxFileSizeKB: 1000,
    description: 'Recommended starting point for Etsy product listings',
  },
  {
    id: 'amazon-main',
    name: 'Amazon-style Main Image',
    width: 2000,
    height: 2000,
    aspectRatio: '1:1',
    format: 'image/jpeg',
    backgroundColor: '#ffffff',
    maxFileSizeKB: 1000,
    description: 'Recommended starting point for Amazon-style main product images. Pure white background expected.',
  },
];
