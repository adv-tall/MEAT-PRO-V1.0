export const GAS_WEB_APP_URL: string = "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec";
export const GAS_API_KEY = "your_secret_key_here";

/**
 * Service for communicating with Google Apps Script Backend
 */
export class GASService {
  // Helper to deserialize nested objects/arrays from strings
  private static deserializeData(data: any) {
    if (!data) return data;
    const processItem = (item: any) => {
      const deserialized: any = {};
      for (const key in item) {
        const cleanKey = key.trim();
        deserialized[cleanKey] = item[key];
        if (typeof deserialized[cleanKey] === 'string') {
          const str = deserialized[cleanKey].trim();
          if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
             try {
               deserialized[cleanKey] = JSON.parse(str);
             } catch(e) {}
          }
        }
      }
      return deserialized;
    };
    if (Array.isArray(data)) {
      return data.map(processItem);
    }
    return processItem(data);
  }

  /**
   * Generic request function to call Google Apps Script
   */
  static async request(action: string, sheet?: string, data?: any) {
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
      console.warn("GAS_WEB_APP_URL is not configured. Returning mock/empty response.");
      return { status: "success", data: { items: [] } };
    }

    // Intercept DEMO user
    const savedUserStr = localStorage.getItem('user');
    let isDemo = false;
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u.employeeId === 'DEMO') isDemo = true;
      } catch(e) {}
    }

    if (isDemo && ['write', 'update', 'delete', 'sync'].includes(action)) {
      console.log(`GASService DEMO user action '${action}' intercepted:`, sheet, data);
      return { status: "success", message: "Mocked for DEMO", data: { items: [] } };
    }

    const payload = {
      action,
      sheet,
      data,
      apiKey: GAS_API_KEY,
    };

    try {
      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await fetch("/api/gas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: GAS_WEB_APP_URL, payload }),
          });
          if (!response.ok) {
              const text = await response.text().catch(() => "");
              throw new Error(`Server Error: ${response.status} ${response.statusText} - ${text.substring(0, 100)}`);
          }
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
              const text = await response.text().catch(() => "");
              throw new Error(`Invalid Content-Type from API Proxy. Expected JSON but got ${contentType}. Status: ${response.status}. Body preview: ${text.substring(0, 100)}`);
          }
          break;
        } catch (e: any) {
          retries--;
          const msg = e?.message || "";
          if (retries === 0 || (!msg.includes("Failed to fetch") && !msg.includes("NetworkError") && !msg.includes("fetch failed") && !msg.includes("Server Error"))) {
            throw e;
          }
          console.warn(`Fetch to /api/gas failed, retrying in 1.5s (${retries} retries left)...`, e);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (!response) {
         throw new Error("Failed to fetch after retries");
      }

      let result;
      try {
        result = await response.json();
      } catch (err: any) {
         throw new Error(`Invalid JSON response: ${err.message}`);
      }
      
      if (result.status === "error") {
        throw new Error(result.message);
      }
      
      if (action === "read" && result.data && result.data.items) {
          result.data.items = this.deserializeData(result.data.items);
      }

      return result;
    } catch (error) {
      console.error(`GAS API Error [${action}]:`, error);
      throw error;
    }
  }

  /**
   * Read data from a specific sheet
   */
  static async read(sheet: string, limit?: number, offset?: number) {
    return this.request("read", sheet, { limit, offset });
  }

  // Helper to serialize nested objects/arrays
  private static serializeData(data: any) {
    if (!data) return data;
    const processItem = (item: any) => {
      const serialized = { ...item };
      for (const key in serialized) {
        if (serialized[key] !== null && typeof serialized[key] === 'object') {
          serialized[key] = JSON.stringify(serialized[key]);
        }
      }
      return serialized;
    };
    if (Array.isArray(data)) {
      return data.map(processItem);
    }
    return processItem(data);
  }

  /**
   * Overwrite the entire sheet with the provided data
   */
  static async sync(sheet: string, data: any | any[]) {
    return this.request("sync", sheet, this.serializeData(data));
  }

  /**
   * Write one or multiple rows to a specific sheet
   */
  static async write(sheet: string, data: any | any[]) {
    return this.request("write", sheet, this.serializeData(data));
  }

  /**
   * Update one or multiple rows in a specific sheet
   * Note: Data objects MUST include the 'id' field
   */
  static async update(sheet: string, data: any | any[]) {
    return this.request("update", sheet, this.serializeData(data));
  }

  /**
   * Delete one or multiple rows in a specific sheet
   * Note: Data objects MUST include the 'id' field
   */
  static async delete(sheet: string, data: { id: string | number } | { id: string | number }[]) {
    return this.request("delete", sheet, data);
  }

  /**
   * Lookup specific data in a sheet matching the criteria
   */
  static async lookup(sheet: string, criteria: any, matchType: "exact" | "includes" = "exact") {
    return this.request("lookup", sheet, [{ ...criteria, matchType }]);
  }
}
