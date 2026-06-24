import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { PageSeo } from '../components/PageSeo';
import { RelatedTools } from '../components/RelatedTools';
import { ToolUsageTracker } from '../components/ToolUsageTracker';
import { toast } from 'sonner';
import {
  LockKeyhole,
  Download,
  Copy,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  ImagePlus,
  Trash2,
  QrCode,
} from 'lucide-react';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible';

import {
  type QRContentType,
  type URLContent,
  type TextContent,
  type EmailContent,
  type PhoneContent,
  type SMSContent,
  type WiFiContent,
  type VCardContent,
  type EventContent,
  type CustomContent,
  formatURL,
  formatText,
  formatEmail,
  formatPhone,
  formatSMS,
  formatWiFi,
  formatVCard,
  formatEvent,
  formatCustom,
  isValidURL,
  isLowContrast,
  getQRFilename,
} from '../utils/qr/qrHelpers';

import {
  type QRDesignOptions,
  generateQRCode,
  exportQRAsPNG,
  exportQRAsSVG,
  exportQRAsJPEG,
  copyQRToClipboard,
  canCopyToClipboard,
} from '../utils/qr/qrExport';

import { downloadBlobFile } from '../utils/pdf/export';

import type {
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel,
} from 'qr-code-styling';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_TYPES: { value: QRContentType; label: string }[] = [
  { value: 'url', label: 'URL' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'vcard', label: 'vCard' },
  { value: 'event', label: 'Event' },
  { value: 'custom', label: 'Custom' },
];

const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
];

const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
];

const SIZE_PRESETS = [256, 512, 1024];

const ERROR_LEVELS: { value: ErrorCorrectionLevel; label: string; desc: string }[] = [
  { value: 'L', label: 'Low (7%)', desc: 'L' },
  { value: 'M', label: 'Medium (15%)', desc: 'M' },
  { value: 'Q', label: 'Quartile (25%)', desc: 'Q' },
  { value: 'H', label: 'High (30%)', desc: 'H' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QrGenerator = () => {
  // Content state ----------------------------------------------------------
  const [contentType, setContentType] = useState<QRContentType>('url');
  const [urlContent, setUrlContent] = useState<URLContent>({ url: '' });
  const [textContent, setTextContent] = useState<TextContent>({ text: '' });
  const [emailContent, setEmailContent] = useState<EmailContent>({ recipient: '', subject: '', message: '' });
  const [phoneContent, setPhoneContent] = useState<PhoneContent>({ phone: '' });
  const [smsContent, setSmsContent] = useState<SMSContent>({ phone: '', message: '' });
  const [wifiContent, setWifiContent] = useState<WiFiContent>({ ssid: '', password: '', encryption: 'WPA', hidden: false });
  const [vcardContent, setVcardContent] = useState<VCardContent>({ name: '', organisation: '', phone: '', email: '', website: '', address: '' });
  const [eventContent, setEventContent] = useState<EventContent>({ title: '', location: '', startDate: '', endDate: '', description: '' });
  const [customContent, setCustomContent] = useState<CustomContent>({ raw: '' });

  // Design state -----------------------------------------------------------
  const [size, setSize] = useState(512);
  const [customSize, setCustomSize] = useState(false);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('M');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [margin, setMargin] = useState(10);
  const [dotStyle, setDotStyle] = useState<DotType>('square');
  const [cornerSquareStyle, setCornerSquareStyle] = useState<CornerSquareType>('square');
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotType>('square');

  // Logo state -------------------------------------------------------------
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSizePercent, setLogoSizePercent] = useState(25);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // UI state ---------------------------------------------------------------
  const [designOpen, setDesignOpen] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Preview ----------------------------------------------------------------
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the data string from current content state
  const qrData = useMemo((): string => {
    switch (contentType) {
      case 'url': return formatURL(urlContent);
      case 'text': return formatText(textContent);
      case 'email': return formatEmail(emailContent);
      case 'phone': return formatPhone(phoneContent);
      case 'sms': return formatSMS(smsContent);
      case 'wifi': return formatWiFi(wifiContent);
      case 'vcard': return formatVCard(vcardContent);
      case 'event': return formatEvent(eventContent);
      case 'custom': return formatCustom(customContent);
    }
  }, [contentType, urlContent, textContent, emailContent, phoneContent, smsContent, wifiContent, vcardContent, eventContent, customContent]);

  // Assemble full design options
  const designOptions = useMemo((): QRDesignOptions => ({
    data: qrData || 'https://filepilot.com',
    size,
    errorCorrection,
    fgColor,
    bgColor,
    transparentBg,
    margin,
    dotStyle,
    cornerSquareStyle,
    cornerDotStyle,
    logoUrl,
    logoSizeFraction: logoSizePercent / 100,
  }), [qrData, size, errorCorrection, fgColor, bgColor, transparentBg, margin, dotStyle, cornerSquareStyle, cornerDotStyle, logoUrl, logoSizePercent]);

  // Warnings ---------------------------------------------------------------
  const lowContrast = useMemo(
    () => !transparentBg && isLowContrast(fgColor, bgColor),
    [fgColor, bgColor, transparentBg],
  );

  const largeLogoWarning = logoUrl && logoSizePercent > 30;
  const styledWarning = dotStyle !== 'square' || cornerSquareStyle !== 'square' || cornerDotStyle !== 'square';

  // Debounced live preview --------------------------------------------------
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      const container = previewContainerRef.current;
      if (!container) return;

      try {
        // Use smaller size for preview
        const previewOpts: QRDesignOptions = { ...designOptions, size: 300 };
        const qr = await generateQRCode(previewOpts, 'svg');
        container.innerHTML = '';
        qr.append(container);
        // Scale the SVG/canvas to fill the container
        const child = container.firstElementChild;
        if (child instanceof HTMLElement || child instanceof SVGElement) {
          (child as HTMLElement).style.width = '100%';
          (child as HTMLElement).style.height = '100%';
        }
      } catch {
        container.innerHTML = '<p class="text-sm text-muted-foreground">Enter content to generate a QR code</p>';
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [designOptions]);

  // Logo upload handler ----------------------------------------------------
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    // Revoke previous
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(url);
  }, [logoUrl]);

  const handleRemoveLogo = useCallback(() => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  }, [logoUrl]);

  // Export handlers ---------------------------------------------------------
  const handleDownloadPNG = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportQRAsPNG(designOptions);
      downloadBlobFile(blob, getQRFilename(contentType, 'png'));
      toast.success('PNG downloaded');
    } catch (err) {
      toast.error(`PNG export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, [designOptions, contentType]);

  const handleDownloadSVG = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportQRAsSVG(designOptions);
      downloadBlobFile(blob, getQRFilename(contentType, 'svg'));
      toast.success('SVG downloaded');
    } catch (err) {
      toast.error(`SVG export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, [designOptions, contentType]);

  const handleDownloadJPEG = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportQRAsJPEG(designOptions);
      downloadBlobFile(blob, getQRFilename(contentType, 'jpeg'));
      toast.success('JPEG downloaded');
    } catch (err) {
      toast.error(`JPEG export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, [designOptions, contentType]);

  const handleCopy = useCallback(async () => {
    const success = await copyQRToClipboard(designOptions);
    if (success) {
      toast.success('QR code copied to clipboard');
    } else {
      toast.error('Could not copy to clipboard. Your browser may not support this feature.');
    }
  }, [designOptions]);

  const handleReset = useCallback(() => {
    setContentType('url');
    setUrlContent({ url: '' });
    setTextContent({ text: '' });
    setEmailContent({ recipient: '', subject: '', message: '' });
    setPhoneContent({ phone: '' });
    setSmsContent({ phone: '', message: '' });
    setWifiContent({ ssid: '', password: '', encryption: 'WPA', hidden: false });
    setVcardContent({ name: '', organisation: '', phone: '', email: '', website: '', address: '' });
    setEventContent({ title: '', location: '', startDate: '', endDate: '', description: '' });
    setCustomContent({ raw: '' });
    setSize(512);
    setCustomSize(false);
    setErrorCorrection('M');
    setFgColor('#000000');
    setBgColor('#ffffff');
    setTransparentBg(false);
    setMargin(10);
    setDotStyle('square');
    setCornerSquareStyle('square');
    setCornerDotStyle('square');
    handleRemoveLogo();
    setDesignOpen(false);
    setLogoOpen(false);
  }, [handleRemoveLogo]);

  // Cleanup logo URLs on unmount
  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Content forms
  // -----------------------------------------------------------------------

  const renderContentFields = () => {
    switch (contentType) {
      case 'url':
        return (
          <div className="space-y-2">
            <Label htmlFor="qr-url">Website URL</Label>
            <input
              id="qr-url"
              type="url"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://example.com"
              value={urlContent.url}
              onChange={(e) => setUrlContent({ url: e.target.value })}
            />
            {urlContent.url && !isValidURL(urlContent.url) && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> This does not look like a valid URL
              </p>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="qr-text">Plain Text</Label>
            <textarea
              id="qr-text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-y"
              placeholder="Enter your text..."
              value={textContent.text}
              onChange={(e) => setTextContent({ text: e.target.value })}
            />
          </div>
        );

      case 'email':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="qr-email-to">Recipient Email</Label>
              <input
                id="qr-email-to"
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="name@example.com"
                value={emailContent.recipient}
                onChange={(e) => setEmailContent({ ...emailContent, recipient: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-email-subject">Subject</Label>
              <input
                id="qr-email-subject"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Email subject"
                value={emailContent.subject}
                onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-email-body">Message</Label>
              <textarea
                id="qr-email-body"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] resize-y"
                placeholder="Email body..."
                value={emailContent.message}
                onChange={(e) => setEmailContent({ ...emailContent, message: e.target.value })}
              />
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-2">
            <Label htmlFor="qr-phone">Phone Number</Label>
            <input
              id="qr-phone"
              type="tel"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="+1 555-123-4567"
              value={phoneContent.phone}
              onChange={(e) => setPhoneContent({ phone: e.target.value })}
            />
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="qr-sms-phone">Phone Number</Label>
              <input
                id="qr-sms-phone"
                type="tel"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="+1 555-123-4567"
                value={smsContent.phone}
                onChange={(e) => setSmsContent({ ...smsContent, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-sms-message">Message</Label>
              <textarea
                id="qr-sms-message"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] resize-y"
                placeholder="Pre-filled message..."
                value={smsContent.message}
                onChange={(e) => setSmsContent({ ...smsContent, message: e.target.value })}
              />
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="qr-wifi-ssid">Network Name (SSID)</Label>
              <input
                id="qr-wifi-ssid"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="MyWiFiNetwork"
                value={wifiContent.ssid}
                onChange={(e) => setWifiContent({ ...wifiContent, ssid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-wifi-pass">Password</Label>
              <input
                id="qr-wifi-pass"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="WiFi password"
                value={wifiContent.password}
                onChange={(e) => setWifiContent({ ...wifiContent, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Encryption</Label>
              <Select
                value={wifiContent.encryption}
                onValueChange={(v) => setWifiContent({ ...wifiContent, encryption: v as WiFiContent['encryption'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA / WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="qr-wifi-hidden"
                checked={wifiContent.hidden}
                onCheckedChange={(v) => setWifiContent({ ...wifiContent, hidden: v })}
              />
              <Label htmlFor="qr-wifi-hidden">Hidden network</Label>
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div className="space-y-3">
            {([
              { id: 'name', label: 'Full Name', placeholder: 'John Doe', key: 'name' as const },
              { id: 'org', label: 'Organisation', placeholder: 'Acme Corp', key: 'organisation' as const },
              { id: 'vphone', label: 'Phone', placeholder: '+1 555-123-4567', key: 'phone' as const },
              { id: 'vemail', label: 'Email', placeholder: 'john@example.com', key: 'email' as const },
              { id: 'vweb', label: 'Website', placeholder: 'https://example.com', key: 'website' as const },
              { id: 'vaddr', label: 'Address', placeholder: '123 Main St, City', key: 'address' as const },
            ] as const).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={`qr-vcard-${field.id}`}>{field.label}</Label>
                <input
                  id={`qr-vcard-${field.id}`}
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={field.placeholder}
                  value={vcardContent[field.key]}
                  onChange={(e) => setVcardContent({ ...vcardContent, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        );

      case 'event':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="qr-event-title">Event Title</Label>
              <input
                id="qr-event-title"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Team Meeting"
                value={eventContent.title}
                onChange={(e) => setEventContent({ ...eventContent, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-event-location">Location</Label>
              <input
                id="qr-event-location"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Conference Room A"
                value={eventContent.location}
                onChange={(e) => setEventContent({ ...eventContent, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="qr-event-start">Start Date &amp; Time</Label>
                <input
                  id="qr-event-start"
                  type="datetime-local"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={eventContent.startDate}
                  onChange={(e) => setEventContent({ ...eventContent, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-event-end">End Date &amp; Time</Label>
                <input
                  id="qr-event-end"
                  type="datetime-local"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={eventContent.endDate}
                  onChange={(e) => setEventContent({ ...eventContent, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-event-desc">Description</Label>
              <textarea
                id="qr-event-desc"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] resize-y"
                placeholder="Event details..."
                value={eventContent.description}
                onChange={(e) => setEventContent({ ...eventContent, description: e.target.value })}
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-2">
            <Label htmlFor="qr-custom">Raw Content</Label>
            <textarea
              id="qr-custom"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y font-mono"
              placeholder="Enter raw QR code content..."
              value={customContent.raw}
              onChange={(e) => setCustomContent({ raw: e.target.value })}
            />
          </div>
        );
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div>
      <PageSeo
        title="QR Code Generator — FilePilot"
        description="Create custom QR codes for URLs, WiFi, vCards, events, and more. Customize colors, styles, and add logos. Free, private, and runs entirely in your browser."
      />
      <ToolUsageTracker />

      <main className="container max-w-5xl py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            QR Code Generator
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Create custom QR codes for URLs, WiFi networks, contact cards, events, and more.
            Customize colours, dot styles, and add your logo.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <LockKeyhole className="h-4 w-4 text-emerald-600" />
            Your files are processed locally in your browser and are not uploaded.
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ---- LEFT COLUMN: Controls ---- */}
          <div className="space-y-5">
            {/* Content type selector */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-lg font-semibold">Content</h2>
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as QRContentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {renderContentFields()}
            </div>

            {/* Design Options (collapsible) */}
            <Collapsible open={designOpen} onOpenChange={setDesignOpen}>
              <div className="rounded-xl border border-border bg-card p-5">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <h2 className="text-lg font-semibold">Design Options</h2>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${designOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-5">
                  {/* Size */}
                  <div className="space-y-2">
                    <Label>QR Size (px)</Label>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSize(s); setCustomSize(false); }}
                          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                            !customSize && size === s
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        onClick={() => setCustomSize(true)}
                        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                          customSize
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                    {customSize && (
                      <input
                        type="number"
                        min={64}
                        max={4096}
                        className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={size}
                        onChange={(e) => setSize(Math.max(64, Math.min(4096, Number(e.target.value) || 64)))}
                      />
                    )}
                  </div>

                  {/* Error correction */}
                  <div className="space-y-2">
                    <Label>Error Correction</Label>
                    <Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as ErrorCorrectionLevel)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ERROR_LEVELS.map((el) => (
                          <SelectItem key={el.value} value={el.value}>
                            {el.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Colours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qr-fg">Foreground</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="qr-fg"
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-9 h-9 rounded border border-border cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={fgColor}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setFgColor(v);
                          }}
                          className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qr-bg">Background</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="qr-bg"
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          disabled={transparentBg}
                          className="w-9 h-9 rounded border border-border cursor-pointer p-0.5 disabled:opacity-40"
                        />
                        <input
                          type="text"
                          value={transparentBg ? '' : bgColor}
                          disabled={transparentBg}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBgColor(v);
                          }}
                          placeholder="transparent"
                          className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transparent toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="qr-transparent"
                      checked={transparentBg}
                      onCheckedChange={setTransparentBg}
                    />
                    <Label htmlFor="qr-transparent">Transparent background</Label>
                  </div>

                  {/* Margin slider */}
                  <div className="space-y-2">
                    <Label>Margin / Quiet Zone ({margin}px)</Label>
                    <Slider
                      min={0}
                      max={50}
                      step={1}
                      value={[margin]}
                      onValueChange={(v) => setMargin(v[0])}
                    />
                  </div>

                  {/* Dot style */}
                  <div className="space-y-2">
                    <Label>Dot Style</Label>
                    <Select value={dotStyle} onValueChange={(v) => setDotStyle(v as DotType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOT_STYLES.map((ds) => (
                          <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Corner square style */}
                  <div className="space-y-2">
                    <Label>Corner Square Style</Label>
                    <Select value={cornerSquareStyle} onValueChange={(v) => setCornerSquareStyle(v as CornerSquareType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CORNER_SQUARE_STYLES.map((cs) => (
                          <SelectItem key={cs.value} value={cs.value}>{cs.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Corner dot style */}
                  <div className="space-y-2">
                    <Label>Corner Dot Style</Label>
                    <Select value={cornerDotStyle} onValueChange={(v) => setCornerDotStyle(v as CornerDotType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CORNER_DOT_STYLES.map((cd) => (
                          <SelectItem key={cd.value} value={cd.value}>{cd.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Logo section (collapsible) */}
            <Collapsible open={logoOpen} onOpenChange={setLogoOpen}>
              <div className="rounded-xl border border-border bg-card p-5">
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  <h2 className="text-lg font-semibold">Logo</h2>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${logoOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="qr-logo-upload"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {logoUrl && (
                      <button
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  {logoUrl && (
                    <>
                      <div className="flex items-center gap-3">
                        <img src={logoUrl} alt="Logo preview" className="w-10 h-10 rounded border border-border object-contain bg-white" />
                        <span className="text-sm text-muted-foreground">Logo uploaded</span>
                      </div>
                      <div className="space-y-2">
                        <Label>Logo Size ({logoSizePercent}%)</Label>
                        <Slider
                          min={5}
                          max={40}
                          step={1}
                          value={[logoSizePercent]}
                          onValueChange={(v) => setLogoSizePercent(v[0])}
                        />
                      </div>
                    </>
                  )}

                  {largeLogoWarning && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Large logos may reduce scannability. Use High error correction.
                    </p>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>

          {/* ---- RIGHT COLUMN: Preview + Export ---- */}
          <div className="space-y-5">
            {/* Preview card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div
                className="flex items-center justify-center rounded-lg border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4"
                style={{ minHeight: 280 }}
              >
                <div
                  ref={previewContainerRef}
                  className="flex items-center justify-center"
                  style={{ width: 260, height: 260 }}
                />
              </div>
              {!qrData && (
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Enter content above to generate a QR code
                </p>
              )}
            </div>

            {/* Warnings */}
            {(lowContrast || styledWarning) && (
              <div className="space-y-2">
                {lowContrast && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Low contrast between foreground and background colours. The QR code may be difficult or impossible to scan.</span>
                  </div>
                )}
                {styledWarning && (
                  <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Some camera apps may struggle with heavily styled QR codes. Test with multiple devices before printing.</span>
                  </div>
                )}
              </div>
            )}

            {/* Export buttons */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-lg font-semibold">Export</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadPNG}
                  disabled={exporting || !qrData}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  PNG
                </button>
                <button
                  onClick={handleDownloadSVG}
                  disabled={exporting || !qrData}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  SVG
                </button>
                {!transparentBg && (
                  <button
                    onClick={handleDownloadJPEG}
                    disabled={exporting || !qrData}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    JPEG
                  </button>
                )}
                {canCopyToClipboard() && (
                  <button
                    onClick={handleCopy}
                    disabled={exporting || !qrData}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                )}
              </div>
              <button
                onClick={handleReset}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </button>
            </div>
          </div>
        </div>
      </main>

      <RelatedTools />
    </div>
  );
};
