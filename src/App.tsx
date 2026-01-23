import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Merge } from './pages/Merge';
import { Split } from './pages/Split';
import { ImagesToPdf } from './pages/ImagesToPdf';
import { Compress } from './pages/Compress';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/merge" element={<Merge />} />
        <Route path="/split" element={<Split />} />
        <Route path="/images-to-pdf" element={<ImagesToPdf />} />
        <Route path="/compress" element={<Compress />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </Layout>
  );
}

export default App;
