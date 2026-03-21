import { PDFDocument, degrees } from 'pdf-lib';

export const mergePDFs = async (files: File[]): Promise<Uint8Array> => {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
};

export const downloadBlob = (data: Uint8Array, filename: string, mimeType: string) => {
    const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const countPDFPages = async (file: File): Promise<number> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPageCount();
};

export const splitPDFRange = async (file: File, start: number, end: number): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const destPdf = await PDFDocument.create();

    const indices = [];
    for (let i = start - 1; i < end; i++) {
        indices.push(i);
    }

    const copiedPages = await destPdf.copyPages(srcPdf, indices);
    copiedPages.forEach((page) => destPdf.addPage(page));

    return await destPdf.save();
};

export const splitPDFSeparate = async (file: File): Promise<{ filename: string; data: Uint8Array }[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const pageCount = srcPdf.getPageCount();
    const result: { filename: string; data: Uint8Array }[] = [];

    for (let i = 0; i < pageCount; i++) {
        const destPdf = await PDFDocument.create();
        const [copiedPage] = await destPdf.copyPages(srcPdf, [i]);
        destPdf.addPage(copiedPage);
        const data = await destPdf.save();
        result.push({
            filename: `${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`,
            data
        });
    }

    return result;
};

interface ImageToPdfOptions {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margin: 'none' | 'small' | 'medium';
}

const getPageDimensions = (size: 'A4' | 'Letter', orientation: 'portrait' | 'landscape') => {
    let width: number, height: number;
    if (size === 'A4') {
        width = 595.28;
        height = 841.89;
    } else {
        width = 612;
        height = 792;
    }

    if (orientation === 'landscape') {
        return { width: height, height: width };
    }
    return { width, height };
};

const getMargin = (margin: 'none' | 'small' | 'medium') => {
    if (margin === 'none') return 0;
    if (margin === 'small') return 20;
    return 50;
};

const convertImageToPng = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Canvas context not available'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(objectUrl);
                if (blob) {
                    blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
                } else {
                    reject(new Error('Conversion failed'));
                }
            }, 'image/png');
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image failed to load'));
        };
        img.src = objectUrl;
    });
};

export interface ImageItem {
    id: string;
    file: File;
    rotation: number;
    previewUrl: string;
}

export const convertImagesToPDF = async (items: ImageItem[], options: ImageToPdfOptions): Promise<Uint8Array> => {
    const pdf = await PDFDocument.create();
    const { width: pageWidth, height: pageHeight } = getPageDimensions(options.pageSize, options.orientation);
    const margin = getMargin(options.margin);
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    for (const item of items) {
        let image;
        try {
            const buffer = await item.file.arrayBuffer();
            if (item.file.type === 'image/jpeg') {
                image = await pdf.embedJpg(buffer);
            } else if (item.file.type === 'image/png') {
                image = await pdf.embedPng(buffer);
            } else {
                const pngBytes = await convertImageToPng(item.file);
                image = await pdf.embedPng(pngBytes);
            }
        } catch (e) {
            console.warn(`Failed to process image ${item.file.name}, trying conversion fallback`, e);
            try {
                const pngBytes = await convertImageToPng(item.file);
                image = await pdf.embedPng(pngBytes);
            } catch (fallbackError) {
                console.error(`Skipping file ${item.file.name}`, fallbackError);
                continue;
            }
        }

        const page = pdf.addPage([pageWidth, pageHeight]);

        const imgWidth = image.width;
        const imgHeight = image.height;

        const isSideways = item.rotation === 90 || item.rotation === 270;
        const effectiveImgWidth = isSideways ? imgHeight : imgWidth;
        const effectiveImgHeight = isSideways ? imgWidth : imgHeight;

        const scaleFactor = Math.min(
            contentWidth / effectiveImgWidth,
            contentHeight / effectiveImgHeight,
            1
        );

        const w = imgWidth * scaleFactor;
        const h = imgHeight * scaleFactor;

        page.drawImage(image, {
            x: (pageWidth - w) / 2,
            y: (pageHeight - h) / 2,
            width: w,
            height: h,
            rotate: degrees(-item.rotation)
        });

        if (item.rotation !== 0) {
            page.setRotation(degrees(-item.rotation));
        }
    }

    return await pdf.save();
};
