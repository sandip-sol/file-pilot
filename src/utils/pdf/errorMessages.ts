import { PdfPasswordError } from './rendering';

export type PdfErrorContext = 'load' | 'merge' | 'split' | 'compress' | 'extract-text' | 'preview';

const contextFallbacks: Record<PdfErrorContext, string> = {
  load: 'This PDF could not be opened. Try Repair PDF or export a fresh copy, then upload it again.',
  merge: 'These PDFs could not be merged. Check that each file opens normally, then try again.',
  split: 'This PDF could not be split. Try Repair PDF or upload a fresh copy.',
  compress: 'This PDF could not be compressed. Try Repair PDF or upload a smaller copy.',
  'extract-text': 'Text could not be extracted from this PDF. Try another file or use OCR if it is scanned.',
  preview: 'Preview is not available for this PDF, but you can still try processing it.',
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message.toLowerCase();
  return String(error ?? '').toLowerCase();
};

export const isPdfPasswordError = (error: unknown) => {
  const message = getErrorMessage(error);
  return error instanceof PdfPasswordError || message.includes('password') || message.includes('encrypted');
};

export const isBrowserMemoryError = (error: unknown) => {
  const message = getErrorMessage(error);
  return (
    message.includes('memory') ||
    message.includes('allocation') ||
    message.includes('array buffer') ||
    message.includes('too large') ||
    message.includes('out of bounds')
  );
};

export const isMissingTextError = (error: unknown) => {
  const message = getErrorMessage(error);
  return message.includes('no text') || message.includes('empty text') || message.includes('selectable text');
};

export const getPdfRecoveryMessage = (error: unknown, context: PdfErrorContext = 'load') => {
  if (isPdfPasswordError(error)) {
    return 'This PDF is password-protected. Try unlocking it first.';
  }

  if (isBrowserMemoryError(error)) {
    return 'This file is too large for your browser memory. Try a smaller file, close other tabs, or split it first.';
  }

  if (context === 'extract-text' || isMissingTextError(error)) {
    return 'This scanned PDF has no selectable text. Try OCR.';
  }

  return contextFallbacks[context];
};
