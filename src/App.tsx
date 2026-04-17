import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Merge = lazy(() => import('./pages/Merge').then((module) => ({ default: module.Merge })));
const Split = lazy(() => import('./pages/Split').then((module) => ({ default: module.Split })));
const ImagesToPdf = lazy(() => import('./pages/ImagesToPdf').then((module) => ({ default: module.ImagesToPdf })));
const ExtractText = lazy(() => import('./pages/ExtractText').then((module) => ({ default: module.ExtractText })));
const Compress = lazy(() => import('./pages/Compress').then((module) => ({ default: module.Compress })));
const ImageRequirements = lazy(() =>
  import('./pages/ImageRequirements').then((module) => ({ default: module.ImageRequirements })),
);
const Privacy = lazy(() => import('./pages/Privacy').then((module) => ({ default: module.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then((module) => ({ default: module.Terms })));

function App() {
  return (
    <Layout>
      <Suspense fallback={<main className="container py-16 text-center text-muted-foreground">Loading...</main>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/merge" element={<Merge />} />
          <Route path="/split" element={<Split />} />
          <Route path="/images-to-pdf" element={<ImagesToPdf />} />
          <Route path="/extract-text" element={<ExtractText />} />
          <Route path="/compress" element={<Compress />} />
          <Route path="/image-requirements" element={<ImageRequirements />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
