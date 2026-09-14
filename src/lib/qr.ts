// Real, scannable QR codes via the `qrcode` library. Replaces the prototype's
// decorative position-hash SVG. Tickets encode the opaque `ticketCode`, which
// the check-in endpoint validates.

import QRCode from "qrcode";

export interface QrOptions {
  size?: number;
  margin?: number;
  dark?: string;
  light?: string;
}

/** Render `text` to a PNG data URL (for <img src>). */
export async function qrDataUrl(text: string, opts: QrOptions = {}): Promise<string> {
  const { size = 320, margin = 1, dark = "#0f172a", light = "#ffffff" } = opts;
  return QRCode.toDataURL(text, {
    width: size,
    margin,
    errorCorrectionLevel: "M",
    color: { dark, light },
  });
}

/** Render `text` as crisp inline SVG markup (scales without blur). */
export async function qrSvg(text: string, opts: QrOptions = {}): Promise<string> {
  const { margin = 1, dark = "#0f172a", light = "#ffffff" } = opts;
  return QRCode.toString(text, {
    type: "svg",
    margin,
    errorCorrectionLevel: "M",
    color: { dark, light },
  });
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Generate a high-resolution PNG for `text` and download it. */
export async function downloadQrPng(text: string, filename: string): Promise<void> {
  const dataUrl = await qrDataUrl(text, { size: 1024, margin: 2 });
  triggerDownload(dataUrl, filename.endsWith(".png") ? filename : `${filename}.png`);
}
