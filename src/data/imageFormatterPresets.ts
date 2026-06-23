export interface FormatterPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  format: 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
  maxKB?: number;
  description: string;
}

export const imageFormatterPresets: FormatterPreset[] = [
  {
    id: 'website-image',
    name: 'Website Image',
    width: 1200,
    height: 800,
    format: 'image/webp',
    maxKB: 200,
    description: 'General web content image, optimized for fast loading',
  },
  {
    id: 'website-hero',
    name: 'Website Hero',
    width: 1920,
    height: 1080,
    format: 'image/webp',
    maxKB: 400,
    description: 'Full-width hero banner for landing pages',
  },
  {
    id: 'product-image',
    name: 'Product Image',
    width: 1000,
    height: 1000,
    format: 'image/jpeg',
    maxKB: 500,
    description: 'Square product photo for e-commerce',
  },
  {
    id: 'profile-image',
    name: 'Profile Image',
    width: 400,
    height: 400,
    format: 'image/jpeg',
    maxKB: 150,
    description: 'Profile picture or avatar',
  },
  {
    id: 'social-post',
    name: 'Social Post',
    width: 1080,
    height: 1080,
    format: 'image/jpeg',
    maxKB: 500,
    description: 'Square image for social media feeds',
  },
  {
    id: 'story-vertical',
    name: 'Story / Vertical',
    width: 1080,
    height: 1920,
    format: 'image/jpeg',
    maxKB: 500,
    description: 'Vertical image for stories and reels',
  },
  {
    id: 'email-attachment',
    name: 'Email Attachment',
    width: 800,
    height: 600,
    format: 'image/jpeg',
    maxKB: 200,
    description: 'Lightweight image for email attachments',
  },
];
