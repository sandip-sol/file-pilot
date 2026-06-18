import JSZip from 'jszip';

export const downloadBlobFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadBytes = (data: Uint8Array, filename: string, mimeType: string) => {
  const blob = new Blob([data as BlobPart], { type: mimeType });
  downloadBlobFile(blob, filename);
};

export const downloadTextFile = (contents: string, filename: string) => {
  downloadBlobFile(new Blob([contents], { type: 'text/plain;charset=utf-8' }), filename);
};

export const downloadZipFromEntries = async (
  entries: { filename: string; data: Blob | Uint8Array | string }[],
  zipName: string,
) => {
  const zip = new JSZip();
  entries.forEach((entry) => {
    zip.file(entry.filename, entry.data);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlobFile(blob, zipName);
};
