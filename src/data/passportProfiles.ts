export interface PassportProfile {
  id: string;
  name: string;
  country?: string;
  widthPx: number;
  heightPx: number;
  printWidthMm: number;
  printHeightMm: number;
  dpi: number;
  maxFileSizeKB: number;
  minFileSizeKB?: number;
  backgroundColor: string;
  aspectRatio: string;
  format: 'image/jpeg' | 'image/png';
  notes: string;
  lastReviewed: string;
}

export const passportProfiles: PassportProfile[] = [
  {
    id: 'icao-generic',
    name: 'Generic ICAO-style Photo',
    widthPx: 600,
    heightPx: 600,
    printWidthMm: 35,
    printHeightMm: 45,
    dpi: 300,
    maxFileSizeKB: 200,
    backgroundColor: '#ffffff',
    aspectRatio: '35:45',
    format: 'image/jpeg',
    notes: 'Based on ICAO Doc 9303. Photo should have a plain light background, neutral expression, and no head coverings unless religious. Actual acceptance depends on the issuing authority.',
    lastReviewed: '2024-12',
  },
  {
    id: 'india-passport',
    name: 'India Passport Photo',
    country: 'India',
    widthPx: 600,
    heightPx: 600,
    printWidthMm: 51,
    printHeightMm: 51,
    dpi: 300,
    maxFileSizeKB: 300,
    minFileSizeKB: 10,
    backgroundColor: '#ffffff',
    aspectRatio: '1:1',
    format: 'image/jpeg',
    notes: 'Indian passport photos are typically 2×2 inches (51×51 mm) square. Background should be plain white or off-white. Photo must be recent (within 6 months). Check the Passport Seva portal for the latest specifications.',
    lastReviewed: '2024-12',
  },
  {
    id: 'uk-passport',
    name: 'UK Passport Photo',
    country: 'United Kingdom',
    widthPx: 600,
    heightPx: 750,
    printWidthMm: 35,
    printHeightMm: 45,
    dpi: 300,
    maxFileSizeKB: 500,
    backgroundColor: '#f0f0f0',
    aspectRatio: '35:45',
    format: 'image/jpeg',
    notes: 'UK passport photos should be 35×45 mm with a plain light grey or cream background. The face should take up 70–80% of the frame height. Check GOV.UK for the latest digital photo requirements.',
    lastReviewed: '2024-12',
  },
  {
    id: 'us-passport',
    name: 'US Passport Photo',
    country: 'United States',
    widthPx: 600,
    heightPx: 600,
    printWidthMm: 51,
    printHeightMm: 51,
    dpi: 300,
    maxFileSizeKB: 240,
    minFileSizeKB: 10,
    backgroundColor: '#ffffff',
    aspectRatio: '1:1',
    format: 'image/jpeg',
    notes: 'US passport and visa photos are 2×2 inches (51×51 mm). Background must be plain white or off-white. Head must be 1–1⅜ inches (25–35 mm) from bottom of chin to top of head. Check travel.state.gov for the latest requirements.',
    lastReviewed: '2024-12',
  },
];

export interface PassportCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail' | 'unknown';
  detail: string;
}

export function runPassportChecks(
  profile: PassportProfile,
  imgWidth: number,
  imgHeight: number,
  fileSize: number,
  mimeType: string,
  hasMetadata: boolean,
): PassportCheck[] {
  const checks: PassportCheck[] = [];

  const minDim = Math.min(profile.widthPx, profile.heightPx);
  checks.push({
    id: 'dimensions',
    label: 'Image Dimensions',
    status: imgWidth >= minDim && imgHeight >= minDim ? 'pass' : 'warning',
    detail: `${imgWidth} × ${imgHeight} px (recommended: ${profile.widthPx} × ${profile.heightPx} px)`,
  });

  const imgRatio = imgWidth / imgHeight;
  const parts = profile.aspectRatio.split(':').map(Number);
  const targetRatio = parts[0] / parts[1];
  const ratioDiff = Math.abs(imgRatio - targetRatio);
  checks.push({
    id: 'aspect-ratio',
    label: 'Aspect Ratio',
    status: ratioDiff < 0.05 ? 'pass' : ratioDiff < 0.15 ? 'warning' : 'fail',
    detail: `${imgWidth}:${imgHeight} (recommended: ${profile.aspectRatio})`,
  });

  const fileSizeKB = fileSize / 1024;
  const sizeOk =
    fileSizeKB <= profile.maxFileSizeKB &&
    (!profile.minFileSizeKB || fileSizeKB >= profile.minFileSizeKB);
  checks.push({
    id: 'file-size',
    label: 'File Size',
    status: sizeOk ? 'pass' : 'warning',
    detail: `${fileSizeKB.toFixed(0)} KB (limit: ${profile.minFileSizeKB ? `${profile.minFileSizeKB}–` : '≤'}${profile.maxFileSizeKB} KB)`,
  });

  const formatOk =
    mimeType === profile.format ||
    (profile.format === 'image/jpeg' && mimeType === 'image/jpg');
  checks.push({
    id: 'file-type',
    label: 'File Type',
    status: formatOk ? 'pass' : 'warning',
    detail: `${mimeType.split('/')[1]?.toUpperCase() ?? 'Unknown'} (recommended: ${profile.format.split('/')[1]?.toUpperCase()})`,
  });

  const isPortrait = imgHeight >= imgWidth;
  checks.push({
    id: 'orientation',
    label: 'Orientation',
    status: isPortrait || imgWidth === imgHeight ? 'pass' : 'warning',
    detail: imgWidth === imgHeight ? 'Square' : isPortrait ? 'Portrait' : 'Landscape (may need cropping)',
  });

  const isSmall = imgWidth < 400 || imgHeight < 400;
  checks.push({
    id: 'sharpness',
    label: 'Sharpness (estimated)',
    status: isSmall ? 'warning' : 'pass',
    detail: isSmall
      ? 'Image resolution is low — the photo may appear blurry when printed'
      : 'Resolution appears sufficient for printing',
  });

  checks.push({
    id: 'metadata',
    label: 'Metadata',
    status: hasMetadata ? 'warning' : 'pass',
    detail: hasMetadata
      ? 'Image contains metadata (EXIF/GPS). Consider removing it before submission.'
      : 'No significant metadata detected',
  });

  return checks;
}
