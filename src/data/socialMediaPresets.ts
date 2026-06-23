export interface SocialMediaPreset {
  id: string;
  platform: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface SocialMediaPlatform {
  id: string;
  name: string;
  presets: SocialMediaPreset[];
}

export const socialMediaPlatforms: SocialMediaPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    presets: [
      { id: 'ig-post-square', platform: 'Instagram', name: 'Post (Square)', width: 1080, height: 1080, aspectRatio: '1:1', format: 'image/jpeg' },
      { id: 'ig-post-portrait', platform: 'Instagram', name: 'Post (Portrait)', width: 1080, height: 1350, aspectRatio: '4:5', format: 'image/jpeg' },
      { id: 'ig-post-landscape', platform: 'Instagram', name: 'Post (Landscape)', width: 1080, height: 566, aspectRatio: '1.91:1', format: 'image/jpeg' },
      { id: 'ig-story', platform: 'Instagram', name: 'Story / Reel', width: 1080, height: 1920, aspectRatio: '9:16', format: 'image/jpeg' },
      { id: 'ig-profile', platform: 'Instagram', name: 'Profile Picture', width: 320, height: 320, aspectRatio: '1:1', format: 'image/jpeg' },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    presets: [
      { id: 'fb-post', platform: 'Facebook', name: 'Post Image', width: 1200, height: 630, aspectRatio: '1.91:1', format: 'image/jpeg' },
      { id: 'fb-cover', platform: 'Facebook', name: 'Cover Photo', width: 820, height: 312, aspectRatio: '2.63:1', format: 'image/jpeg' },
      { id: 'fb-profile', platform: 'Facebook', name: 'Profile Picture', width: 170, height: 170, aspectRatio: '1:1', format: 'image/jpeg' },
      { id: 'fb-story', platform: 'Facebook', name: 'Story', width: 1080, height: 1920, aspectRatio: '9:16', format: 'image/jpeg' },
      { id: 'fb-event', platform: 'Facebook', name: 'Event Cover', width: 1920, height: 1005, aspectRatio: '1.91:1', format: 'image/jpeg' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    presets: [
      { id: 'li-post', platform: 'LinkedIn', name: 'Post Image', width: 1200, height: 627, aspectRatio: '1.91:1', format: 'image/jpeg' },
      { id: 'li-profile', platform: 'LinkedIn', name: 'Profile Picture', width: 400, height: 400, aspectRatio: '1:1', format: 'image/jpeg' },
      { id: 'li-banner', platform: 'LinkedIn', name: 'Banner', width: 1584, height: 396, aspectRatio: '4:1', format: 'image/jpeg' },
      { id: 'li-company-logo', platform: 'LinkedIn', name: 'Company Logo', width: 300, height: 300, aspectRatio: '1:1', format: 'image/png' },
    ],
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    presets: [
      { id: 'tw-post', platform: 'X / Twitter', name: 'Post Image', width: 1200, height: 675, aspectRatio: '16:9', format: 'image/jpeg' },
      { id: 'tw-header', platform: 'X / Twitter', name: 'Header / Banner', width: 1500, height: 500, aspectRatio: '3:1', format: 'image/jpeg' },
      { id: 'tw-profile', platform: 'X / Twitter', name: 'Profile Picture', width: 400, height: 400, aspectRatio: '1:1', format: 'image/jpeg' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    presets: [
      { id: 'yt-thumbnail', platform: 'YouTube', name: 'Thumbnail', width: 1280, height: 720, aspectRatio: '16:9', format: 'image/jpeg' },
      { id: 'yt-banner', platform: 'YouTube', name: 'Channel Banner', width: 2560, height: 1440, aspectRatio: '16:9', format: 'image/jpeg' },
      { id: 'yt-profile', platform: 'YouTube', name: 'Profile Picture', width: 800, height: 800, aspectRatio: '1:1', format: 'image/jpeg' },
    ],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    presets: [
      { id: 'pin-standard', platform: 'Pinterest', name: 'Standard Pin', width: 1000, height: 1500, aspectRatio: '2:3', format: 'image/jpeg' },
      { id: 'pin-long', platform: 'Pinterest', name: 'Long Pin', width: 1000, height: 2100, aspectRatio: '1:2.1', format: 'image/jpeg' },
      { id: 'pin-square', platform: 'Pinterest', name: 'Square Pin', width: 1000, height: 1000, aspectRatio: '1:1', format: 'image/jpeg' },
      { id: 'pin-profile', platform: 'Pinterest', name: 'Profile Picture', width: 165, height: 165, aspectRatio: '1:1', format: 'image/jpeg' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    presets: [
      { id: 'tt-video-cover', platform: 'TikTok', name: 'Video Cover', width: 1080, height: 1920, aspectRatio: '9:16', format: 'image/jpeg' },
      { id: 'tt-profile', platform: 'TikTok', name: 'Profile Picture', width: 200, height: 200, aspectRatio: '1:1', format: 'image/jpeg' },
    ],
  },
];

export const allSocialPresets: SocialMediaPreset[] = socialMediaPlatforms.flatMap(p => p.presets);
