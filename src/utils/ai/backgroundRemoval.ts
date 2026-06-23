import type { AiProgress } from './types';

export async function removeImageBackground(
  imageSource: Blob | File,
  onProgress: (progress: AiProgress) => void,
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');

  onProgress({ stage: 'loading-model', progress: 0, message: 'Downloading AI model (first use may take a moment)...' });

  const result = await removeBackground(imageSource, {
    progress: (key: string, current: number, total: number) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      if (key.includes('fetch') || key.includes('download')) {
        onProgress({ stage: 'loading-model', progress: pct, message: 'Downloading AI model...' });
      } else if (key.includes('compute') || key.includes('inference')) {
        onProgress({ stage: 'processing', progress: pct, message: 'Removing background...' });
      } else {
        onProgress({ stage: 'processing', progress: pct, message: 'Processing...' });
      }
    },
    output: {
      format: 'image/png' as const,
      quality: 1,
    },
  });

  onProgress({ stage: 'complete', progress: 100, message: 'Done' });
  return result;
}
