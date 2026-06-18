import type { DiffToken, PdfComparePageResult, PdfCompareResult } from './types';

const tokenize = (text: string) => (text.match(/\S+|\s+/g) ?? []).filter(Boolean);

const buildDiff = (left: string, right: string): DiffToken[] => {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const rows = leftTokens.length + 1;
  const cols = rightTokens.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      table[i][j] =
        leftTokens[i - 1] === rightTokens[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = leftTokens.length;
  let j = rightTokens.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftTokens[i - 1] === rightTokens[j - 1]) {
      tokens.unshift({ value: leftTokens[i - 1], type: 'equal' });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      tokens.unshift({ value: rightTokens[j - 1], type: 'added' });
      j -= 1;
    } else if (i > 0) {
      tokens.unshift({ value: leftTokens[i - 1], type: 'removed' });
      i -= 1;
    }
  }

  return tokens;
};

const summarizePageDiff = (pageNumber: number, leftText: string, rightText: string): PdfComparePageResult => {
  const diffTokens = buildDiff(leftText, rightText);
  const additions = diffTokens.filter((token) => token.type === 'added' && token.value.trim()).length;
  const removals = diffTokens.filter((token) => token.type === 'removed' && token.value.trim()).length;

  return {
    pageNumber,
    leftText,
    rightText,
    changed: additions > 0 || removals > 0 || leftText !== rightText,
    additions,
    removals,
    diffTokens,
  };
};

export const buildPdfCompareResult = (leftPages: string[], rightPages: string[]): PdfCompareResult => {
  const maxPages = Math.max(leftPages.length, rightPages.length);
  const pages = Array.from({ length: maxPages }, (_, index) =>
    summarizePageDiff(index + 1, leftPages[index] ?? '', rightPages[index] ?? ''),
  );

  return {
    leftPageCount: leftPages.length,
    rightPageCount: rightPages.length,
    changedPages: pages.filter((page) => page.changed).map((page) => page.pageNumber),
    pages,
  };
};
