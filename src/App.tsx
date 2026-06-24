import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';

// ─── Core pages ─────────────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// ─── Organize & Manage ───────────────────────────────────────────────────────
const Merge = lazy(() => import('./pages/Merge').then(m => ({ default: m.Merge })));
const Split = lazy(() => import('./pages/Split').then(m => ({ default: m.Split })));
const OrganizePdf = lazy(() => import('./pages/OrganizePdf').then(m => ({ default: m.OrganizePdf })));
const RotatePdf = lazy(() => import('./pages/RotatePdf').then(m => ({ default: m.RotatePdf })));
const DeletePages = lazy(() => import('./pages/DeletePages').then(m => ({ default: m.DeletePages })));
const ExtractPages = lazy(() => import('./pages/ExtractPages').then(m => ({ default: m.ExtractPages })));
const ReversePdf = lazy(() => import('./pages/ReversePdf').then(m => ({ default: m.ReversePdf })));
const AddBlankPage = lazy(() => import('./pages/AddBlankPage').then(m => ({ default: m.AddBlankPage })));
const AlternateMerge = lazy(() => import('./pages/AlternateMerge').then(m => ({ default: m.AlternateMerge })));
const NUpPdf = lazy(() => import('./pages/NUpPdf').then(m => ({ default: m.NUpPdf })));
const OverlayPdf = lazy(() => import('./pages/OverlayPdf').then(m => ({ default: m.OverlayPdf })));
const DividePages = lazy(() => import('./pages/DividePages').then(m => ({ default: m.DividePages })));
const CombineSinglePage = lazy(() => import('./pages/CombineSinglePage').then(m => ({ default: m.CombineSinglePage })));
const GridCombine = lazy(() => import('./pages/GridCombine').then(m => ({ default: m.GridCombine })));
const PosterizePdf = lazy(() => import('./pages/PosterizePdf').then(m => ({ default: m.PosterizePdf })));
const AddPageLabels = lazy(() => import('./pages/AddPageLabels').then(m => ({ default: m.AddPageLabels })));
const PdfMetadata = lazy(() => import('./pages/PdfMetadata').then(m => ({ default: m.PdfMetadata })));
const PdfToZip = lazy(() => import('./pages/PdfToZip').then(m => ({ default: m.PdfToZip })));
const PdfBooklet = lazy(() => import('./pages/PdfBooklet').then(m => ({ default: m.PdfBooklet })));
const PageDimensions = lazy(() => import('./pages/PageDimensions').then(m => ({ default: m.PageDimensions })));

// ─── Edit & Annotate ────────────────────────────────────────────────────────
const AnnotatePdf = lazy(() => import('./pages/AnnotatePdf').then(m => ({ default: m.AnnotatePdf })));
const WatermarkPdf = lazy(() => import('./pages/WatermarkPdf').then(m => ({ default: m.WatermarkPdf })));
const RedactPdf = lazy(() => import('./pages/RedactPdf').then(m => ({ default: m.RedactPdf })));
const SignPdf = lazy(() => import('./pages/SignPdf').then(m => ({ default: m.SignPdf })));
const ComparePdf = lazy(() => import('./pages/ComparePdf').then(m => ({ default: m.ComparePdf })));
const Bookmark = lazy(() => import('./pages/Bookmark').then(m => ({ default: m.Bookmark })));
const TableOfContents = lazy(() => import('./pages/TableOfContents').then(m => ({ default: m.TableOfContents })));
const PageNumbers = lazy(() => import('./pages/PageNumbers').then(m => ({ default: m.PageNumbers })));
const HeaderFooter = lazy(() => import('./pages/HeaderFooter').then(m => ({ default: m.HeaderFooter })));
const BackgroundColor = lazy(() => import('./pages/BackgroundColor').then(m => ({ default: m.BackgroundColor })));
const AddStamp = lazy(() => import('./pages/AddStamp').then(m => ({ default: m.AddStamp })));
const RemoveAnnotations = lazy(() => import('./pages/RemoveAnnotations').then(m => ({ default: m.RemoveAnnotations })));
const FormFiller = lazy(() => import('./pages/FormFiller').then(m => ({ default: m.FormFiller })));
const FormCreator = lazy(() => import('./pages/FormCreator').then(m => ({ default: m.FormCreator })));
const RemoveBlankPages = lazy(() => import('./pages/RemoveBlankPages').then(m => ({ default: m.RemoveBlankPages })));
const CropPdf = lazy(() => import('./pages/CropPdf').then(m => ({ default: m.CropPdf })));

// ─── Convert TO PDF ─────────────────────────────────────────────────────────
const ImagesToPdf = lazy(() => import('./pages/ImagesToPdf').then(m => ({ default: m.ImagesToPdf })));
const TextToPdf = lazy(() => import('./pages/TextToPdf').then(m => ({ default: m.TextToPdf })));
const JsonToPdf = lazy(() => import('./pages/JsonToPdf').then(m => ({ default: m.JsonToPdf })));
const MarkdownToPdf = lazy(() => import('./pages/MarkdownToPdf').then(m => ({ default: m.MarkdownToPdf })));

// ─── Convert FROM PDF ────────────────────────────────────────────────────────
const PdfToImages = lazy(() => import('./pages/PdfToImages').then(m => ({ default: m.PdfToImages })));
const PdfToSvg = lazy(() => import('./pages/PdfToBmpSvg').then(m => ({ default: m.PdfToSvg })));
const PdfToCbz = lazy(() => import('./pages/PdfToCbz').then(m => ({ default: m.PdfToCbz })));
const PdfToGreyscale = lazy(() => import('./pages/PdfToGreyscale').then(m => ({ default: m.PdfToGreyscale })));
const PdfToJson = lazy(() => import('./pages/PdfToJson').then(m => ({ default: m.PdfToJson })));
const PdfToMarkdown = lazy(() => import('./pages/PdfToMarkdown').then(m => ({ default: m.PdfToMarkdown })));
const ExtractText = lazy(() => import('./pages/ExtractText').then(m => ({ default: m.ExtractText })));
const ExtractImages = lazy(() => import('./pages/ExtractImages').then(m => ({ default: m.ExtractImages })));

// ─── Optimize & Repair ───────────────────────────────────────────────────────
const Compress = lazy(() => import('./pages/Compress').then(m => ({ default: m.Compress })));
const RepairPdf = lazy(() => import('./pages/RepairPdf').then(m => ({ default: m.RepairPdf })));
const FixPageSize = lazy(() => import('./pages/FixPageSize').then(m => ({ default: m.FixPageSize })));
const DeskewPdf = lazy(() => import('./pages/DeskewPdf').then(m => ({ default: m.DeskewPdf })));

// ─── Secure PDF ─────────────────────────────────────────────────────────────
const PdfSecurity = lazy(() => import('./pages/PdfSecurity').then(m => ({ default: m.PdfSecurity })));
const SanitizePdf = lazy(() => import('./pages/SanitizePdf').then(m => ({ default: m.SanitizePdf })));
const FindAndRedact = lazy(() => import('./pages/FindAndRedact').then(m => ({ default: m.FindAndRedactPage })));
const FlattenPdf = lazy(() => import('./pages/FlattenPdf').then(m => ({ default: m.FlattenPdf })));
const PdfMeta = lazy(() => import('./pages/PdfMetadata').then(m => ({ default: m.PdfMetadata })));

// ─── Image Workflow Tools ────────────────────────────────────────────────────
const ImageFormatter = lazy(() => import('./pages/ImageFormatter').then(m => ({ default: m.ImageFormatter })));
const PassportPhotoValidator = lazy(() => import('./pages/PassportPhotoValidator').then(m => ({ default: m.PassportPhotoValidator })));
const SocialMediaResizer = lazy(() => import('./pages/SocialMediaResizer').then(m => ({ default: m.SocialMediaResizer })));
const EcommerceImageFormatter = lazy(() => import('./pages/EcommerceImageFormatter').then(m => ({ default: m.EcommerceImageFormatter })));
const ScanImagesToPdf = lazy(() => import('./pages/ScanImagesToPdf').then(m => ({ default: m.ScanImagesToPdf })));
const FaviconGenerator = lazy(() => import('./pages/FaviconGenerator').then(m => ({ default: m.FaviconGenerator })));
const ImageToSvg = lazy(() => import('./pages/ImageToSvg').then(m => ({ default: m.ImageToSvg })));
const ColorPicker = lazy(() => import('./pages/ColorPicker').then(m => ({ default: m.ColorPicker })));
const QrGenerator = lazy(() => import('./pages/QrGenerator').then(m => ({ default: m.QrGenerator })));

// ─── Image Optimise Tools ────────────────────────────────────────────────────
const CompressImage = lazy(() => import('./pages/CompressImage').then(m => ({ default: m.CompressImage })));
const ResizeImage = lazy(() => import('./pages/ResizeImage').then(m => ({ default: m.ResizeImage })));
const ConvertImage = lazy(() => import('./pages/ConvertImage').then(m => ({ default: m.ConvertImage })));
const WebsiteImageOptimiser = lazy(() => import('./pages/WebsiteImageOptimiser').then(m => ({ default: m.WebsiteImageOptimiser })));
const ImageQualityAnalyzer = lazy(() => import('./pages/ImageQualityAnalyzer').then(m => ({ default: m.ImageQualityAnalyzer })));

// ─── Image Edit Tools ────────────────────────────────────────────────────────
const CropImage = lazy(() => import('./pages/CropImage').then(m => ({ default: m.CropImage })));
const RotateImage = lazy(() => import('./pages/RotateImage').then(m => ({ default: m.RotateImage })));
const WatermarkImage = lazy(() => import('./pages/WatermarkImage').then(m => ({ default: m.WatermarkImage })));
const PhotoEditor = lazy(() => import('./pages/PhotoEditor').then(m => ({ default: m.PhotoEditor })));
const RemoveImageMetadata = lazy(() => import('./pages/RemoveImageMetadata').then(m => ({ default: m.RemoveImageMetadata })));
const BlurFace = lazy(() => import('./pages/BlurFace').then(m => ({ default: m.BlurFace })));

// ─── AI Image Tools ─────────────────────────────────────────────────────────
const RemoveBackground = lazy(() => import('./pages/RemoveBackground').then(m => ({ default: m.RemoveBackground })));
const ChangeBackground = lazy(() => import('./pages/ChangeBackground').then(m => ({ default: m.ChangeBackground })));
const UpscaleImage = lazy(() => import('./pages/UpscaleImage').then(m => ({ default: m.UpscaleImage })));
const AiEnhanceImage = lazy(() => import('./pages/AiEnhanceImage').then(m => ({ default: m.AiEnhanceImage })));
const ObjectRemover = lazy(() => import('./pages/ObjectRemover').then(m => ({ default: m.ObjectRemover })));

// ─── Loading fallback ────────────────────────────────────────────────────────
const Loader = () => (
  <main className="container py-16 text-center text-muted-foreground">
    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p>Loading…</p>
  </main>
);

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [pathname, search, hash]);

  return null;
};

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Core */}
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Organize & Manage */}
          <Route path="/merge" element={<Merge />} />
          <Route path="/split" element={<Split />} />
          <Route path="/organize-pdf" element={<OrganizePdf />} />
          <Route path="/rotate-pdf" element={<RotatePdf />} />
          <Route path="/delete-pages" element={<DeletePages />} />
          <Route path="/extract-pages" element={<ExtractPages />} />
          <Route path="/reverse-pdf" element={<ReversePdf />} />
          <Route path="/add-blank-page" element={<AddBlankPage />} />
          <Route path="/alternate-merge" element={<AlternateMerge />} />
          <Route path="/n-up-pdf" element={<NUpPdf />} />
          <Route path="/overlay-pdf" element={<OverlayPdf />} />
          <Route path="/divide-pages" element={<DividePages />} />
          <Route path="/combine-single-page" element={<CombineSinglePage />} />
          <Route path="/grid-combine" element={<GridCombine />} />
          <Route path="/posterize-pdf" element={<PosterizePdf />} />
          <Route path="/add-page-labels" element={<AddPageLabels />} />
          <Route path="/pdf-metadata" element={<PdfMetadata />} />
          <Route path="/pdf-to-zip" element={<PdfToZip />} />
          <Route path="/pdf-booklet" element={<PdfBooklet />} />
          <Route path="/page-dimensions" element={<PageDimensions />} />

          {/* Edit & Annotate */}
          <Route path="/annotate-pdf" element={<AnnotatePdf />} />
          <Route path="/watermark-pdf" element={<WatermarkPdf />} />
          <Route path="/redact-pdf" element={<RedactPdf />} />
          <Route path="/sign-pdf" element={<SignPdf />} />
          <Route path="/compare-pdf" element={<ComparePdf />} />
          <Route path="/bookmark" element={<Bookmark />} />
          <Route path="/table-of-contents" element={<TableOfContents />} />
          <Route path="/page-numbers" element={<PageNumbers />} />
          <Route path="/header-footer" element={<HeaderFooter />} />
          <Route path="/background-color" element={<BackgroundColor />} />
          <Route path="/add-stamp" element={<AddStamp />} />
          <Route path="/remove-annotations" element={<RemoveAnnotations />} />
          <Route path="/form-filler" element={<FormFiller />} />
          <Route path="/form-creator" element={<FormCreator />} />
          <Route path="/remove-blank-pages" element={<RemoveBlankPages />} />
          <Route path="/crop-pdf" element={<CropPdf />} />

          {/* Convert TO PDF */}
          <Route path="/images-to-pdf" element={<ImagesToPdf />} />
          <Route path="/jpg-to-pdf" element={<ImagesToPdf />} />
          <Route path="/png-to-pdf" element={<ImagesToPdf />} />
          <Route path="/webp-to-pdf" element={<ImagesToPdf />} />
          <Route path="/svg-to-pdf" element={<ImagesToPdf />} />
          <Route path="/bmp-to-pdf" element={<ImagesToPdf />} />
          <Route path="/heic-to-pdf" element={<ImagesToPdf />} />
          <Route path="/tiff-to-pdf" element={<ImagesToPdf />} />
          <Route path="/text-to-pdf" element={<TextToPdf />} />
          <Route path="/json-to-pdf" element={<JsonToPdf />} />
          <Route path="/markdown-to-pdf" element={<MarkdownToPdf />} />

          {/* Convert FROM PDF */}
          <Route path="/pdf-to-images" element={<PdfToImages />} />
          <Route path="/pdf-to-jpg" element={<PdfToImages />} />
          <Route path="/pdf-to-png" element={<PdfToImages />} />
          <Route path="/pdf-to-webp" element={<PdfToImages />} />
          <Route path="/pdf-to-bmp" element={<PdfToImages />} />
          <Route path="/pdf-to-svg" element={<PdfToSvg />} />
          <Route path="/pdf-to-tiff" element={<PdfToImages />} />
          <Route path="/pdf-to-cbz" element={<PdfToCbz />} />
          <Route path="/pdf-to-greyscale" element={<PdfToGreyscale />} />
          <Route path="/pdf-to-json" element={<PdfToJson />} />
          <Route path="/pdf-to-markdown" element={<PdfToMarkdown />} />
          <Route path="/extract-text" element={<ExtractText />} />
          <Route path="/extract-images" element={<ExtractImages />} />
          <Route path="/rasterize-pdf" element={<PdfToImages />} />
          <Route path="/pdf-to-docx" element={<ExtractText />} />
          <Route path="/pdf-to-pptx" element={<ExtractText />} />
          <Route path="/pdf-to-excel" element={<ExtractText />} />

          {/* Optimize & Repair */}
          <Route path="/compress" element={<Compress />} />
          <Route path="/repair-pdf" element={<RepairPdf />} />
          <Route path="/fix-page-size" element={<FixPageSize />} />
          <Route path="/deskew-pdf" element={<DeskewPdf />} />

          {/* Secure PDF */}
          <Route path="/pdf-security" element={<PdfSecurity />} />
          <Route path="/encrypt-decrypt-pdf" element={<PdfSecurity />} />
          <Route path="/sanitize-pdf" element={<SanitizePdf />} />
          <Route path="/find-and-redact" element={<FindAndRedact />} />
          <Route path="/flatten-pdf" element={<FlattenPdf />} />
          <Route path="/remove-metadata" element={<PdfMeta />} />

          {/* Image Workflow Tools */}
          <Route path="/image-formatter" element={<ImageFormatter />} />
          <Route path="/image-requirements" element={<ImageFormatter />} />
          <Route path="/passport-photo-validator" element={<PassportPhotoValidator />} />
          <Route path="/social-media-resizer" element={<SocialMediaResizer />} />
          <Route path="/ecommerce-image-formatter" element={<EcommerceImageFormatter />} />
          <Route path="/scan-images-to-pdf" element={<ScanImagesToPdf />} />
          <Route path="/favicon-generator" element={<FaviconGenerator />} />
          <Route path="/image-to-svg" element={<ImageToSvg />} />
          <Route path="/color-picker" element={<ColorPicker />} />
          <Route path="/qr-generator" element={<QrGenerator />} />

          {/* Image Optimise Tools */}
          <Route path="/compress-image" element={<CompressImage />} />
          <Route path="/resize-image" element={<ResizeImage />} />
          <Route path="/convert-image" element={<ConvertImage />} />
          <Route path="/website-image-optimiser" element={<WebsiteImageOptimiser />} />
          <Route path="/image-quality-analyzer" element={<ImageQualityAnalyzer />} />

          {/* Image Edit Tools */}
          <Route path="/crop-image" element={<CropImage />} />
          <Route path="/rotate-image" element={<RotateImage />} />
          <Route path="/watermark-image" element={<WatermarkImage />} />
          <Route path="/photo-editor" element={<PhotoEditor />} />
          <Route path="/remove-image-metadata" element={<RemoveImageMetadata />} />
          <Route path="/blur-face" element={<BlurFace />} />

          {/* AI Image Tools */}
          <Route path="/remove-background" element={<RemoveBackground />} />
          <Route path="/change-background" element={<ChangeBackground />} />
          <Route path="/upscale-image" element={<UpscaleImage />} />
          <Route path="/ai-enhance-image" element={<AiEnhanceImage />} />
          <Route path="/object-remover" element={<ObjectRemover />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
