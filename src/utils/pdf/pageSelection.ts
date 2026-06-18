export const parsePageSelectionInput = (value: string, pageCount: number): number[] => {
  if (!value.trim()) return [];

  const numbers = new Set<number>();

  value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .forEach((segment) => {
      if (segment.includes('-')) {
        const [startRaw, endRaw] = segment.split('-');
        const start = Number.parseInt(startRaw, 10);
        const end = Number.parseInt(endRaw, 10);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return;
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(pageCount, Math.max(start, end));
        for (let index = min; index <= max; index += 1) {
          numbers.add(index);
        }
        return;
      }

      const page = Number.parseInt(segment, 10);
      if (Number.isFinite(page) && page >= 1 && page <= pageCount) {
        numbers.add(page);
      }
    });

  return Array.from(numbers).sort((a, b) => a - b);
};
