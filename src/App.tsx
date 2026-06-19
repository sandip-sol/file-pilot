import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

// ─── Core pages ─────────────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const ImageRequirements = lazy(() => import('./pages/ImageRequirements').then(m => ({ default: m.ImageRequirements })));
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
const JpgToPdf = lazy(() => import('./pages/JpgToPdf').then(m => ({ default: m.JpgToPdf })));
const PngToPdf = lazy(() => import('./pages/PngToPdf').then(m => ({ default: m.PngToPdf })));
const WebpToPdf = lazy(() => import('./pages/WebpToPdf').then(m => ({ default: m.WebpToPdf })));
const SvgToPdf = lazy(() => import('./pages/SvgToPdf').then(m => ({ default: m.SvgToPdf })));
const BmpToPdf = lazy(() => import('./pages/BmpToPdf').then(m => ({ default: m.BmpToPdf })));
const HeicToPdf = lazy(() => import('./pages/HeicToPdf').then(m => ({ default: m.HeicToPdf })));
const TiffToPdf = lazy(() => import('./pages/TiffToPdf').then(m => ({ default: m.TiffToPdf })));
const TextToPdf = lazy(() => import('./pages/TextToPdf').then(m => ({ default: m.TextToPdf })));
const JsonToPdf = lazy(() => import('./pages/JsonToPdf').then(m => ({ default: m.JsonToPdf })));
const MarkdownToPdf = lazy(() => import('./pages/MarkdownToPdf').then(m => ({ default: m.MarkdownToPdf })));

// ─── Convert FROM PDF ────────────────────────────────────────────────────────
const PdfToImages = lazy(() => import('./pages/PdfToImages').then(m => ({ default: m.PdfToImages })));
const PdfToJpg = lazy(() => import('./pages/PdfToJpg').then(m => ({ default: m.PdfToJpg })));
const PdfToPng = lazy(() => import('./pages/PdfToPng').then(m => ({ default: m.PdfToPng })));
const PdfToWebp = lazy(() => import('./pages/PdfToWebp').then(m => ({ default: m.PdfToWebp })));
const PdfToBmp = lazy(() => import('./pages/PdfToBmpSvg').then(m => ({ default: m.PdfToBmp })));
const PdfToSvg = lazy(() => import('./pages/PdfToBmpSvg').then(m => ({ default: m.PdfToSvg })));
const PdfToTiff = lazy(() => import('./pages/PdfToTiff').then(m => ({ default: m.PdfToTiff })));
const PdfToCbz = lazy(() => import('./pages/PdfToCbz').then(m => ({ default: m.PdfToCbz })));
const PdfToGreyscale = lazy(() => import('./pages/PdfToGreyscale').then(m => ({ default: m.PdfToGreyscale })));
const PdfToJson = lazy(() => import('./pages/PdfToJson').then(m => ({ default: m.PdfToJson })));
const PdfToMarkdown = lazy(() => import('./pages/PdfToMarkdown').then(m => ({ default: m.PdfToMarkdown })));
const ExtractText = lazy(() => import('./pages/ExtractText').then(m => ({ default: m.ExtractText })));
const ExtractImages = lazy(() => import('./pages/ExtractImages').then(m => ({ default: m.ExtractImages })));
const RasterizePdf = lazy(() => import('./pages/RasterizePdf').then(m => ({ default: m.RasterizePdf })));
const PdfToDocx = lazy(() => import('./pages/PdfToDocx').then(m => ({ default: m.PdfToDocx })));
const PdfToPptx = lazy(() => import('./pages/PdfToPptx').then(m => ({ default: m.PdfToPptx })));
const PdfToExcel = lazy(() => import('./pages/PdfToExcel').then(m => ({ default: m.PdfToExcel })));

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

// ─── Loading fallback ────────────────────────────────────────────────────────
const Loader = () => (
  <main className="container py-16 text-center text-muted-foreground">
    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p>Loading…</p>
  </main>
);

function App() {
  return (
    <Layout>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Core */}
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/image-requirements" element={<ImageRequirements />} />

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
          <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
          <Route path="/png-to-pdf" element={<PngToPdf />} />
          <Route path="/webp-to-pdf" element={<WebpToPdf />} />
          <Route path="/svg-to-pdf" element={<SvgToPdf />} />
          <Route path="/bmp-to-pdf" element={<BmpToPdf />} />
          <Route path="/heic-to-pdf" element={<HeicToPdf />} />
          <Route path="/tiff-to-pdf" element={<TiffToPdf />} />
          <Route path="/text-to-pdf" element={<TextToPdf />} />
          <Route path="/json-to-pdf" element={<JsonToPdf />} />
          <Route path="/markdown-to-pdf" element={<MarkdownToPdf />} />

          {/* Convert FROM PDF */}
          <Route path="/pdf-to-images" element={<PdfToImages />} />
          <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
          <Route path="/pdf-to-png" element={<PdfToPng />} />
          <Route path="/pdf-to-webp" element={<PdfToWebp />} />
          <Route path="/pdf-to-bmp" element={<PdfToBmp />} />
          <Route path="/pdf-to-svg" element={<PdfToSvg />} />
          <Route path="/pdf-to-tiff" element={<PdfToTiff />} />
          <Route path="/pdf-to-cbz" element={<PdfToCbz />} />
          <Route path="/pdf-to-greyscale" element={<PdfToGreyscale />} />
          <Route path="/pdf-to-json" element={<PdfToJson />} />
          <Route path="/pdf-to-markdown" element={<PdfToMarkdown />} />
          <Route path="/extract-text" element={<ExtractText />} />
          <Route path="/extract-images" element={<ExtractImages />} />
          <Route path="/rasterize-pdf" element={<RasterizePdf />} />
          <Route path="/pdf-to-docx" element={<PdfToDocx />} />
          <Route path="/pdf-to-pptx" element={<PdfToPptx />} />
          <Route path="/pdf-to-excel" element={<PdfToExcel />} />

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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
