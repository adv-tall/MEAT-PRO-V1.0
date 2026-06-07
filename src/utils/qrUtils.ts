/**
 * Utility functions for QR Code generation and metadata representation for production job items.
 */

export interface QrLabelPayload {
  id: string;
  name: string;
  sku: string;
  targetCount: number;
  qty?: number;
  customer?: string;
  createdAt?: string;
  status?: string;
}

/**
 * Generates a structured scan string or JSON payload containing production item metadata.
 * This can be parsed by the camera scan emulator to dynamically capture the full metadata context.
 */
export function generateProductionQrPayload(item: QrLabelPayload): string {
  if (!item) return '';
  
  // Return a standardized, structured JSON string containing tracking parameters
  return JSON.stringify({
    schema: "MEAT-PRO-BATCH-V1",
    id: item.id,
    sku: item.sku,
    name: item.name,
    qty: item.targetCount || item.qty || 0,
    customer: item.customer || "GENERAL",
    created: item.createdAt || new Date().toISOString(),
    status: item.status || "PENDING"
  });
}

/**
 * Parses scanned QR code text into structured production tracking info (if applicable).
 */
export function parseProductionQrPayload(scannedText: string): Partial<QrLabelPayload> | null {
  try {
    const data = JSON.parse(scannedText);
    if (data && data.schema === "MEAT-PRO-BATCH-V1") {
      return {
        id: data.id,
        sku: data.sku,
        name: data.name,
        targetCount: data.qty,
        customer: data.customer,
        status: data.status
      };
    }
  } catch (e) {
    // If scanning a plain ID directly (legacy compatibility fallback)
  }
  return { id: scannedText };
}

/**
 * Formats date into Thai locale for industrial print-out tags
 */
export function formatTagPrintDate(dateStr?: string): string {
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  return dateObj.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }) + " น.";
}
