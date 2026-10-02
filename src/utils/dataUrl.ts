// Decodes a data: URL in memory. fetch(dataUrl) is blocked by the site's CSP
// (connect-src 'self'), so image bytes must never be read that way.
export const dataUrlToBytes = async (url: string): Promise<ArrayBuffer> => {
  if (!url.startsWith('data:')) {
    return fetch(url).then((response) => response.arrayBuffer());
  }

  const commaIndex = url.indexOf(',');
  const meta = url.slice(5, commaIndex);
  const payload = url.slice(commaIndex + 1);

  if (!meta.endsWith(';base64')) {
    return new TextEncoder().encode(decodeURIComponent(payload)).buffer as ArrayBuffer;
  }

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};
