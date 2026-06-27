# Bing Webmaster Setup for FilePilot

Production canonical origin: `https://www.filepilot.space/`

FilePilot is a private browser-based PDF, image, QR, and file-processing toolkit. The SEO setup preserves that message: supported tools process files locally in the browser and avoid server uploads.

## 1. Import From Google Search Console

1. Open Bing Webmaster Tools.
2. Choose **Import**.
3. Sign in with the Google account that owns the existing Google Search Console property, if available.
4. Select the `https://www.filepilot.space/` property.
5. Confirm the imported sitemap and ownership details.
6. If import is not available or fails, add the site manually and use one of the verification options below.

## 2. Meta Tag Verification With Netlify

FilePilot supports this environment variable:

`BING_SITE_VERIFICATION`

When set during a production Netlify build, the prerendered HTML includes:

```html
<meta name="msvalidate.01" content="BING_SITE_VERIFICATION_VALUE" />
```

Netlify steps:

1. In Bing Webmaster Tools, choose the HTML meta tag verification method.
2. Copy only the `content` value from Bing.
3. In Netlify, open the FilePilot site.
4. Go to **Site configuration** > **Environment variables**.
5. Add `BING_SITE_VERIFICATION` with the copied Bing value.
6. Scope it to **Production**.
7. Trigger a production deploy.
8. View source on `https://www.filepilot.space/` and confirm the meta tag appears in the initial HTML.
9. Return to Bing Webmaster Tools and click **Verify**.

The tag is not rendered for localhost or preview deployments unless `ALLOW_BING_VERIFICATION_IN_NON_PRODUCTION=true` is explicitly set.

## 3. XML File Verification

Bing may provide an XML file such as `BingSiteAuth.xml`.

Steps:

1. Download the exact verification XML file from Bing Webmaster Tools.
2. Place it in FilePilot's `public/` directory.
3. Do not rename it unless Bing instructs you to.
4. Deploy to Netlify.
5. Confirm it is reachable at the exact root URL Bing requests, for example `https://www.filepilot.space/BingSiteAuth.xml`.
6. Return to Bing Webmaster Tools and click **Verify**.

Do not create a fake Bing verification XML file. Use only the file issued by Bing for this property.

## 4. DNS Verification Fallback

If meta tag or XML verification is not suitable:

1. In Bing Webmaster Tools, choose DNS verification.
2. Copy the TXT record Bing provides.
3. Add the TXT record at the DNS provider for `filepilot.space`.
4. Wait for DNS propagation.
5. Verify the TXT record with a DNS lookup tool.
6. Return to Bing Webmaster Tools and click **Verify**.

## 5. Sitemap And Robots

Submit this sitemap in Bing Webmaster Tools:

`https://www.filepilot.space/sitemap.xml`

`robots.txt` is generated at:

`https://www.filepilot.space/robots.txt`

It allows public pages and assets and points Bingbot to the canonical sitemap.

## 6. IndexNow Setup

IndexNow notifies participating search engines about changed URLs. It does not guarantee rankings or indexing.

### Generate A Key

1. Generate a random IndexNow key from the official IndexNow key generator or create a secure 8-128 character URL-safe random string.
2. In Netlify, add `INDEXNOW_KEY` under **Site configuration** > **Environment variables**.
3. Scope it to **Production**.
4. Deploy FilePilot.
5. Confirm the key file is public at `https://www.filepilot.space/[INDEXNOW_KEY].txt`.

The key file is intentionally public because IndexNow requires public ownership validation.

### Initial Priority Submission

After the first successful production deployment with `INDEXNOW_KEY`:

```bash
npm run indexnow:submit:priority -- --dry-run
npm run indexnow:submit:priority
```

This submits only the priority launch URLs, not the whole sitemap.

### Future Changed URL Submission

Submit only new, materially updated, moved, or deleted canonical URLs:

```bash
npm run indexnow:submit -- --dry-run https://www.filepilot.space/merge/
npm run indexnow:submit -- https://www.filepilot.space/merge/
```

Do not submit every sitemap URL on every deployment.

## 7. Content Roadmap

1. How to merge PDF files securely in a browser: link to `/merge/`, `/split/`, and `/privacy/`.
2. Best image dimensions for Instagram posts, Stories, and Reels: link to `/social-media-resizer/`, `/resize-image/`, and `/image-formatter/`.
3. How to compress images without losing visible quality: link to `/compress-image/`, `/resize-image/`, and `/convert-image/`.
4. Convert JPG to PDF on Windows, Mac, and mobile: link to `/jpg-to-pdf/`, `/images-to-pdf/`, and `/merge/`.
5. How to remove PDF metadata before sharing a document: link to `/sanitize-pdf/`, `/pdf-metadata/`, and `/privacy/`.
6. PDF to JPG vs PNG: which export should you choose: link to `/pdf-to-jpg/`, `/pdf-to-images/`, and `/compress-image/`.
7. How to split a PDF into chapters, invoices, or single pages: link to `/split/`, `/extract-pages/`, and `/delete-pages/`.
8. How to resize images for ecommerce marketplaces: link to `/ecommerce-image-formatter/`, `/resize-image/`, and `/compress-image/`.
9. How browser-based PDF tools protect confidential files: link to `/privacy/`, `/blog/how-filepilot-keeps-documents-private/`, and `/pdf-tools/`.
10. How to make a favicon from a logo or image: link to `/favicon-generator/`, `/crop-image/`, and `/image-to-svg/`.
11. How to prepare a passport photo before uploading to an application: link to `/passport-photo-validator/`, `/crop-image/`, and `/image-formatter/`.
12. How to turn scanned images into a PDF packet: link to `/scan-images-to-pdf/`, `/jpg-to-pdf/`, and `/compress/`.

## After Deployment

1. Open Bing Webmaster Tools.
2. Import the verified Google Search Console property, or add FilePilot manually.
3. Verify ownership using the preferred option.
4. Submit the production sitemap.
5. Use Bing URL Inspection for:
   - homepage
   - Merge PDF
   - Compress PDF
   - JPG to PDF
   - Compress Image
   - Resize Image
6. Confirm Bingbot can access the live HTML, metadata, canonical URL, and robots directives.
7. Run the IndexNow priority submission once.
8. Monitor Bing Webmaster Tools weekly for crawl issues, sitemap errors, index coverage, broken links, and search performance.
9. Submit new or materially updated URLs through IndexNow after future deployments.
