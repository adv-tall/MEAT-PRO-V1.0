export const GAS_WEB_APP_URL: string = "https://script.google.com/macros/s/AKfycbwzDBGifeikgQvjKcBedrpaqqwhyai5Lr0ytKVzsahpJcU3O5GPL31p9OQnfovo5OXJ/exec";
export const GAS_API_KEY = "your_secret_key_here";

/**
 * Service for communicating with Google Apps Script Backend
 */
export class GASService {
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

    if (isDemo && ['write', 'update', 'delete'].includes(action)) {
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
      const response = await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", // text/plain is used to avoid CORS preflight issues with GAS
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.status === "error") {
        throw new Error(result.message);
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

  /**
   * Write one or multiple rows to a specific sheet
   */
  static async write(sheet: string, data: any | any[]) {
    return this.request("write", sheet, data);
  }

  /**
   * Update one or multiple rows in a specific sheet
   * Note: Data objects MUST include the 'id' field
   */
  static async update(sheet: string, data: any | any[]) {
    return this.request("update", sheet, data);
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
