import type { OutputFormat } from './imageHelpers';

export interface ImagePreset {
    id: string;
    label: string;
    emoji: string;
    width: number;
    height: number;
    maxKB: number;
    format: OutputFormat;
    description: string;
}

export interface PresetCategory {
    id: string;
    label: string;
    emoji: string;
    presets: ImagePreset[];
}

export const presetCategories: PresetCategory[] = [
    {
        id: 'social',
        label: 'Social Media',
        emoji: '📱',
        presets: [
            {
                id: 'instagram-post',
                label: 'Instagram Post',
                emoji: '📷',
                width: 1080,
                height: 1080,
                maxKB: 500,
                format: 'image/jpeg',
                description: 'Square post for feed',
            },
            {
                id: 'instagram-story',
                label: 'Instagram Story',
                emoji: '📷',
                width: 1080,
                height: 1920,
                maxKB: 500,
                format: 'image/jpeg',
                description: '9:16 vertical story / reel',
            },
            {
                id: 'facebook-cover',
                label: 'Facebook Cover',
                emoji: '📘',
                width: 820,
                height: 312,
                maxKB: 300,
                format: 'image/jpeg',
                description: 'Profile cover photo',
            },
            {
                id: 'twitter-header',
                label: 'Twitter / X Header',
                emoji: '🐦',
                width: 1500,
                height: 500,
                maxKB: 500,
                format: 'image/jpeg',
                description: 'Profile banner image',
            },
        ],
    },
    {
        id: 'professional',
        label: 'Professional',
        emoji: '💼',
        presets: [
            {
                id: 'linkedin-profile',
                label: 'LinkedIn Profile',
                emoji: '💼',
                width: 400,
                height: 400,
                maxKB: 200,
                format: 'image/jpeg',
                description: 'Profile picture',
            },
            {
                id: 'linkedin-banner',
                label: 'LinkedIn Banner',
                emoji: '💼',
                width: 1584,
                height: 396,
                maxKB: 400,
                format: 'image/jpeg',
                description: 'Background cover image',
            },
        ],
    },
    {
        id: 'passport',
        label: 'ID & Passport',
        emoji: '📄',
        presets: [
            {
                id: 'indian-passport',
                label: 'Indian Passport',
                emoji: '🇮🇳',
                width: 600,
                height: 600,
                maxKB: 100,
                format: 'image/jpeg',
                description: '2×2 in — online application',
            },
            {
                id: 'us-visa',
                label: 'US Visa Photo',
                emoji: '🇺🇸',
                width: 600,
                height: 600,
                maxKB: 240,
                format: 'image/jpeg',
                description: '2×2 in — DS-160 application',
            },
            {
                id: 'generic-passport',
                label: 'Generic Passport',
                emoji: '🛂',
                width: 600,
                height: 600,
                maxKB: 200,
                format: 'image/jpeg',
                description: 'ICAO standard 2×2 in',
            },
        ],
    },
    {
        id: 'ecommerce',
        label: 'E-commerce',
        emoji: '🛒',
        presets: [
            {
                id: 'amazon-product',
                label: 'Amazon Product',
                emoji: '🛒',
                width: 2000,
                height: 2000,
                maxKB: 1000,
                format: 'image/jpeg',
                description: 'Main listing image',
            },
            {
                id: 'shopify-product',
                label: 'Shopify Product',
                emoji: '🏪',
                width: 2048,
                height: 2048,
                maxKB: 1000,
                format: 'image/jpeg',
                description: 'Product thumbnail square',
            },
        ],
    },
    {
        id: 'government',
        label: 'Government Portal',
        emoji: '🧾',
        presets: [
            {
                id: 'gov-portal',
                label: 'Gov Portal Upload',
                emoji: '🧾',
                width: 600,
                height: 600,
                maxKB: 100,
                format: 'image/jpeg',
                description: '100 KB, 600×600 — common portal spec',
            },
            {
                id: 'aadhaar-photo',
                label: 'Aadhaar Photo',
                emoji: '🪪',
                width: 350,
                height: 350,
                maxKB: 50,
                format: 'image/jpeg',
                description: '50 KB max — Aadhaar update',
            },
        ],
    },
];
