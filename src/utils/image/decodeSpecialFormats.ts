// TIFF and HEIC are not decodable by <img>/canvas in Chrome or Firefox, so they
// are decoded in JS here. Both decoders are lazy-loaded to keep them out of the
// main bundle.

export const isTiffFile = (file: File) =>
    file.type === 'image/tiff' || /\.tiff?$/i.test(file.name);

export const isHeicFile = (file: File) =>
    /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

export const needsSpecialDecoder = (file: File) => isTiffFile(file) || isHeicFile(file);

const rgbaToPng = (rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.reject(new Error('Canvas context not available'));
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('PNG encoding failed'));
            blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
        }, 'image/png');
    });
};

/** Decodes a TIFF (every page) or HEIC file into PNG bytes, one entry per image. */
export const decodeToPngPages = async (file: File): Promise<Uint8Array[]> => {
    if (isTiffFile(file)) {
        // utif is CommonJS: depending on interop its API is on the namespace or on `default`.
        const mod = await import('utif');
        const UTIF = ('default' in mod && mod.default ? mod.default : mod) as typeof mod;
        const buffer = await file.arrayBuffer();
        const pages: Uint8Array[] = [];

        for (const ifd of UTIF.decode(buffer)) {
            UTIF.decodeImage(buffer, ifd);
            if (!ifd.width || !ifd.height) continue;
            pages.push(await rgbaToPng(UTIF.toRGBA8(ifd), ifd.width, ifd.height));
        }

        if (pages.length === 0) throw new Error(`No readable image found in ${file.name}`);
        return pages;
    }

    if (isHeicFile(file)) {
        // The /csp build avoids eval, which the site's Content-Security-Policy blocks.
        const { heicTo } = await import('heic-to/csp');
        const png = await heicTo({ blob: file, type: 'image/png' });
        return [new Uint8Array(await png.arrayBuffer())];
    }

    throw new Error(`${file.name} is not a TIFF or HEIC image`);
};
