/**
 * Keywords tracked for the Phase 1 focus tools (Phase 4.3).
 *
 * Extracted from docs/PRIORITY_TOOLS.md so `seoRanks.js` can match them against a
 * Search Console export. Keep the doc and this file in step — the doc explains
 * why each term was chosen; this is the machine-readable half.
 *
 * Track POSITION, not clicks. Clicks lag position by weeks, so at an average
 * position in the 50s the click count is noise and the position trend is signal.
 */

export interface TrackedKeyword {
  route: string;
  primary: string;
  secondary: string[];
}

export const trackedKeywords: TrackedKeyword[] = [
  {
    "route": "/pdf-to-cbz",
    "primary": "pdf to cbz",
    "secondary": [
      "convert pdf to comic book",
      "pdf to cbz converter"
    ]
  },
  {
    "route": "/posterize-pdf",
    "primary": "posterize pdf",
    "secondary": [
      "enlarge pdf to poster",
      "split pdf into poster tiles",
      "pdf poster print"
    ]
  },
  {
    "route": "/n-up-pdf",
    "primary": "n-up pdf",
    "secondary": [
      "2 pages per sheet pdf",
      "multiple pages per sheet",
      "4 up pdf"
    ]
  },
  {
    "route": "/add-page-labels",
    "primary": "add page labels to pdf",
    "secondary": [
      "pdf roman numeral page numbers",
      "pdf page labels"
    ]
  },
  {
    "route": "/image-to-svg",
    "primary": "image to svg",
    "secondary": [
      "png to svg",
      "jpg to svg",
      "raster to vector online"
    ]
  },
  {
    "route": "/combine-single-page",
    "primary": "combine pdf into one page",
    "secondary": [
      "merge pdf pages into single page",
      "stack pdf pages"
    ]
  },
  {
    "route": "/pdf-to-greyscale",
    "primary": "pdf to greyscale",
    "secondary": [
      "convert pdf to black and white",
      "grayscale pdf online"
    ]
  },
  {
    "route": "/remove-image-metadata",
    "primary": "remove image metadata",
    "secondary": [
      "strip exif data online",
      "remove exif from photo",
      "clear image metadata"
    ]
  },
  {
    "route": "/flatten-pdf",
    "primary": "flatten pdf",
    "secondary": [
      "flatten pdf form",
      "flatten pdf layers",
      "flatten pdf annotations"
    ]
  },
  {
    "route": "/json-to-pdf",
    "primary": "json to pdf",
    "secondary": [
      "convert json to pdf",
      "json file to pdf"
    ]
  },
  {
    "route": "/markdown-to-pdf",
    "primary": "markdown to pdf",
    "secondary": [
      "md to pdf",
      "convert markdown to pdf",
      "readme to pdf"
    ]
  },
  {
    "route": "/pdf-to-zip",
    "primary": "pdf to zip",
    "secondary": [
      "split pdf into zip",
      "pdf pages to zip",
      "batch pdf to zip"
    ]
  },
  {
    "route": "/image-requirements",
    "primary": "resize image to exact size",
    "secondary": [
      "resize image to 50kb",
      "resize image to 20kb",
      "image resize in kb",
      "resize photo for form"
    ]
  }
];

export const allTrackedTerms = () =>
  trackedKeywords.flatMap((entry) => [entry.primary, ...entry.secondary]);
