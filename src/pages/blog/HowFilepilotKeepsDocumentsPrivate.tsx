import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageSeo } from '../../components/PageSeo';

export const HowFilepilotKeepsDocumentsPrivate = () => {
    return (
        <div className="min-h-[calc(100vh-200px)]">
            <PageSeo
                title="How FilePilot Keeps Your Documents Private — FilePilot Blog"
                description="A deep dive into FilePilot's privacy architecture: WebAssembly with pdf-lib, Canvas API rendering, ONNX Runtime for AI features, PWA offline support, and zero server involvement."
                canonicalPath="/blog/how-filepilot-keeps-documents-private"
            />

            <div className="container max-w-3xl py-10 pb-16">
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blog
                </Link>

                <article className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-xs text-muted-foreground mb-2">June 26, 2026 &middot; 5 min read</p>
                    <h1>How FilePilot Keeps Your Documents Private</h1>

                    <p>
                        Privacy claims are easy to make. Every file processing tool on the internet says it takes
                        privacy seriously. Few explain exactly how their architecture enforces that claim. This article
                        describes, in concrete technical detail, how FilePilot processes your files without ever
                        transmitting them to a server.
                    </p>
                    <p>
                        The core principle is simple: if your data never leaves your device, there is nothing to breach,
                        nothing to subpoena, and nothing to misuse. FilePilot is built around that principle at every
                        layer of its architecture.
                    </p>

                    <h2>No Server. Period.</h2>

                    <p>
                        FilePilot is a static web application. It consists of HTML, CSS, JavaScript, and WebAssembly
                        files that are downloaded to your browser when you visit the site. Once loaded, the application
                        runs entirely on your device. There is no backend server processing file operations, no API
                        endpoints receiving your documents, and no database storing your uploads.
                    </p>
                    <p>
                        When you select a file in FilePilot, it is read into your browser's memory using the
                        File API. It stays in memory during processing and is provided back to you as a download via
                        a Blob URL. At no point does the file, or any part of it, leave your browser's sandbox.
                    </p>
                    <p>
                        You can verify this yourself. Open your browser's developer tools, switch to the Network tab,
                        and process any file. You will not see a single outbound request carrying file data. The only
                        network requests are for static application assets like JavaScript bundles and fonts.
                    </p>

                    <h2>WebAssembly and pdf-lib for PDF Processing</h2>

                    <p>
                        PDF operations, such as merging, splitting, compressing, adding watermarks, extracting text,
                        and editing metadata, are handled by pdf-lib, a JavaScript library that manipulates PDF
                        structures directly. For operations that require lower-level processing, FilePilot uses
                        WebAssembly modules compiled from established open-source libraries.
                    </p>
                    <p>
                        WebAssembly runs in a sandboxed environment within the browser. It cannot access the file
                        system, the network, or other browser tabs. It operates only on the data explicitly passed
                        to it by the application. This means that even if a WebAssembly module contained malicious
                        code, it would be confined to the data you provided and could not exfiltrate it.
                    </p>
                    <p>
                        The result is server-grade PDF processing running at near-native speed, entirely within the
                        security boundary of your browser. Merge a hundred-page document, compress a 50 MB file, or
                        redact sensitive text, and the operation completes locally in seconds.
                    </p>

                    <h2>Canvas API for Rendering and Image Operations</h2>

                    <p>
                        When FilePilot needs to render PDF pages as images, convert between image formats, crop,
                        resize, or apply visual transformations, it uses the browser's Canvas API. The Canvas API
                        provides a programmable drawing surface backed by GPU acceleration on most devices.
                    </p>
                    <p>
                        Image data rendered to a canvas stays in browser memory. Converting a PDF page to a PNG,
                        for example, involves rendering the page to an offscreen canvas and then exporting the pixel
                        data as an image file. The entire pipeline, from PDF parsing to pixel rendering to file
                        encoding, happens without any network involvement.
                    </p>
                    <p>
                        This approach also powers FilePilot's image editing tools: cropping, watermarking, format
                        conversion, compression, and background removal all operate on canvas pixel data that never
                        leaves your device.
                    </p>

                    <h2>ONNX Runtime for AI Features</h2>

                    <p>
                        FilePilot includes AI-powered features such as background removal, image upscaling, and
                        document analysis. These features use machine learning models that run locally in your
                        browser via ONNX Runtime Web.
                    </p>
                    <p>
                        ONNX Runtime Web executes neural network models using WebAssembly and, where available,
                        WebGL or WebGPU for hardware acceleration. The models are downloaded as static files when
                        you first use an AI feature and are cached by your browser for future use. Inference runs
                        entirely on your device.
                    </p>
                    <p>
                        This is a critical distinction. Many tools that advertise "AI-powered" features send your
                        files to a cloud-based AI service for processing. Your document is transmitted to a remote
                        GPU, processed, and the result is returned. FilePilot's approach eliminates this round trip.
                        The AI model runs on your hardware, and your data stays on your device.
                    </p>

                    <h2>PWA and Offline Support</h2>

                    <p>
                        FilePilot is a Progressive Web App (PWA). You can install it on your device and use it
                        without an internet connection. Once installed, the application code, WebAssembly modules,
                        and AI models are cached locally. You can process files on an airplane, in a secure facility
                        with no network access, or anywhere else where connectivity is unavailable or untrusted.
                    </p>
                    <p>
                        Offline capability is not just a convenience feature. It is proof of architecture. A tool
                        that works without the internet, by definition, cannot be sending your files to a server.
                        If FilePilot required a network connection to process files, it would mean data was leaving
                        your device. The fact that it works offline is a verifiable guarantee that processing is local.
                    </p>

                    <h2>No Analytics That Track File Content</h2>

                    <p>
                        FilePilot does not use analytics services that track what you do with your files. There is
                        no logging of file names, file sizes, page counts, or content. There are no session
                        recordings, no heatmaps, and no behavioral tracking tied to your document processing activity.
                    </p>
                    <p>
                        Many online tools embed analytics scripts that record detailed user interactions, including
                        which files are processed, how large they are, and how often the tool is used. Even when
                        analytics do not capture file content directly, the metadata they collect can reveal sensitive
                        information about user behavior and document types. FilePilot avoids this entirely.
                    </p>

                    <h2>No Accounts</h2>

                    <p>
                        FilePilot does not require you to create an account. There is no sign-up form, no email
                        collection, no OAuth flow, and no user database. You visit the site and use the tools.
                    </p>
                    <p>
                        Accounts exist to associate data with identity. When a tool requires an account, it can
                        link your processing history, your files, and your usage patterns to a persistent identity.
                        FilePilot has no reason to identify you because it has no server-side data to associate
                        with an identity. Every session is stateless from the application's perspective.
                    </p>

                    <h2>Transparency by Design</h2>

                    <p>
                        The architecture described in this article is not a set of policies that FilePilot promises
                        to follow. It is a set of technical constraints that make privacy violations structurally
                        impossible. There is no server to breach because there is no server. There is no data to
                        retain because no data is collected. There is no third-party access because no third parties
                        are involved in processing.
                    </p>
                    <p>
                        If you want to learn more about FilePilot's privacy commitments, visit the{' '}
                        <Link to="/privacy" className="text-primary hover:underline">
                            privacy policy
                        </Link>
                        . If you want to verify the claims in this article, open your browser's developer tools and
                        see for yourself. The Network tab does not lie.
                    </p>
                </article>
            </div>
        </div>
    );
};
