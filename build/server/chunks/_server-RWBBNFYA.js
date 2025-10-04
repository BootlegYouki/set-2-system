import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import { v as verifyAuth } from './auth-helper-VQdrszph.js';
import 'pg';
import 'dotenv';

async function GET({ request }) {
  try {
    const authResult = await verifyAuth(request, ["admin"]);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status });
    }
    const result = await query(
      "SELECT setting_key, setting_value, setting_type FROM admin_settings ORDER BY setting_key"
    );
    const settings = {};
    result.rows.forEach((row) => {
      let value = row.setting_value;
      if (row.setting_type === "number" && value !== null) {
        value = parseFloat(value);
      } else if (row.setting_type === "boolean" && value !== null) {
        value = value === "true";
      } else if (row.setting_type === "date" && value !== null) {
        value = value;
      } else if (row.setting_type === "json" && value !== null) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error("Failed to parse JSON setting:", row.setting_key, e);
        }
      }
      settings[row.setting_key] = value;
    });
    return json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return json(
      { error: "Failed to fetch admin settings" },
      { status: 500 }
    );
  }
}
async function PUT({ request, getClientAddress }) {
  try {
    const authResult = await verifyAuth(request, ["admin"]);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status });
    }
    const body = await request.json();
    const { settings } = body;
    if (!settings || typeof settings !== "object") {
      return json(
        { error: "Invalid settings data provided" },
        { status: 400 }
      );
    }
    await query("BEGIN");
    try {
      for (const [key, value] of Object.entries(settings)) {
        let stringValue = value;
        if (typeof value === "object" && value !== null) {
          stringValue = JSON.stringify(value);
        } else if (value !== null) {
          stringValue = String(value);
        }
        if (key.includes("date") && value !== null && value !== "") {
          const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/;
          if (!dateRegex.test(value)) {
            throw new Error(`Invalid date format for ${key}. Expected MM-DD-YYYY format.`);
          }
          const [month, day, year] = value.split("-");
          const date = new Date(year, month - 1, day);
          if (isNaN(date.getTime()) || date.getFullYear() != year || date.getMonth() != month - 1 || date.getDate() != day) {
            throw new Error(`Invalid date value for ${key}: ${value}`);
          }
        }
        await query(
          `UPDATE admin_settings 
					 SET setting_value = $1, updated_at = CURRENT_TIMESTAMP 
					 WHERE setting_key = $2`,
          [stringValue, key]
        );
      }
      const ip_address = getClientAddress();
      await query(
        `SELECT log_activity($1, $2, $3, $4, $5, $6)`,
        [
          "admin_settings_updated",
          authResult.user.id,
          authResult.user.account_number,
          JSON.stringify({ updated_settings: Object.keys(settings) }),
          ip_address,
          request.headers.get("user-agent")
        ]
      );
      await query("COMMIT");
      return json({
        success: true,
        message: "Admin settings updated successfully"
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return json(
      { error: "Failed to update admin settings" },
      { status: 500 }
    );
  }
}

export { GET, PUT };
//# sourceMappingURL=_server-RWBBNFYA.js.map
