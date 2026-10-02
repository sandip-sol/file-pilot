import { PDFDocument, type PDFPage, type PDFRadioGroup } from 'pdf-lib';

export type FormFieldKind = 'text' | 'checkbox' | 'dropdown' | 'radio';

export interface FormFieldItem {
  id: string;
  kind: FormFieldKind;
  pageNumber: number;
  /** Position relative to the displayed (rotated) page, 0–1 from the top-left. */
  rect: { x: number; y: number; width: number; height: number };
  /** Field name; for radio buttons this is the option value. */
  name: string;
  /** Radio group name (radio only). */
  group: string;
  /** Comma-separated choices (dropdown only). */
  options: string;
}

export const parseOptions = (options: string) =>
  options.split(',').map((option) => option.trim()).filter(Boolean);

/** Maps a display-space relative rect to PDF user space, honouring crop box and /Rotate. */
const toPdfRect = (page: PDFPage, rect: FormFieldItem['rect']) => {
  const crop = page.getCropBox();
  const W = crop.width;
  const H = crop.height;
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  const { x: rx, y: ry, width: rw, height: rh } = rect;

  let box: { x: number; y: number; width: number; height: number };
  switch (rotation) {
    case 90:
      box = { x: ry * W, y: rx * H, width: rh * W, height: rw * H };
      break;
    case 180:
      box = { x: W - (rx + rw) * W, y: ry * H, width: rw * W, height: rh * H };
      break;
    case 270:
      box = { x: W - (ry + rh) * W, y: H - (rx + rw) * H, width: rh * W, height: rw * H };
      break;
    default:
      box = { x: rx * W, y: H - (ry + rh) * H, width: rw * W, height: rh * H };
  }

  return { ...box, x: box.x + crop.x, y: box.y + crop.y };
};

/** Returns a list of problems that would make the export fail, empty when valid. */
export const validateFormFields = (fields: FormFieldItem[]): string[] => {
  const problems: string[] = [];
  const names = new Set<string>();
  const radioValues = new Map<string, Set<string>>();

  for (const field of fields) {
    const label = field.name.trim() || '(unnamed)';
    if (!field.name.trim()) problems.push(`A ${field.kind} field on page ${field.pageNumber} has no name.`);

    if (field.kind === 'radio') {
      const group = field.group.trim();
      if (!group) {
        problems.push(`Radio button "${label}" has no group name.`);
        continue;
      }
      const values = radioValues.get(group) ?? new Set<string>();
      if (values.has(field.name.trim())) problems.push(`Radio group "${group}" has two options named "${label}".`);
      values.add(field.name.trim());
      radioValues.set(group, values);
      if (names.has(group)) problems.push(`"${group}" is used both as a radio group and a field name.`);
      continue;
    }

    if (names.has(field.name.trim()) || radioValues.has(field.name.trim())) problems.push(`Field name "${label}" is used more than once.`);
    names.add(field.name.trim());
    if (field.kind === 'dropdown' && parseOptions(field.options).length === 0) {
      problems.push(`Dropdown "${label}" needs at least one option.`);
    }
  }

  return problems;
};

export const createFillablePdf = async (source: File | Uint8Array, fields: FormFieldItem[]): Promise<Uint8Array> => {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(await source.arrayBuffer());
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const pages = pdf.getPages();
  const radioGroups = new Map<string, PDFRadioGroup>();

  for (const field of fields) {
    const page = pages[field.pageNumber - 1];
    if (!page) continue;
    const box = toPdfRect(page, field.rect);
    const name = field.name.trim();

    switch (field.kind) {
      case 'text':
        form.createTextField(name).addToPage(page, box);
        break;
      case 'checkbox':
        form.createCheckBox(name).addToPage(page, box);
        break;
      case 'dropdown': {
        const dropdown = form.createDropdown(name);
        dropdown.addOptions(parseOptions(field.options));
        dropdown.addToPage(page, box);
        break;
      }
      case 'radio': {
        const groupName = field.group.trim();
        let group = radioGroups.get(groupName);
        if (!group) {
          group = form.createRadioGroup(groupName);
          radioGroups.set(groupName, group);
        }
        group.addOptionToPage(name, page, box);
        break;
      }
    }
  }

  return pdf.save();
};

export const createBlankA4Pdf = async (): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  pdf.addPage([595.28, 841.89]);
  return pdf.save();
};
