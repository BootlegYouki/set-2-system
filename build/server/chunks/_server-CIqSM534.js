import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import bcrypt from 'bcrypt';
import 'pg';
import 'dotenv';

async function POST({ request, getClientAddress }) {
  try {
    const { accountNumber, password } = await request.json();
    if (!accountNumber || !password) {
      return json({ error: "Account number and password are required" }, { status: 400 });
    }
    const userQuery = `
      SELECT 
        u.id,
        u.account_number,
        u.full_name,
        u.first_name,
        u.gender,
        u.account_type,
        u.password_hash,
        u.status
      FROM users u
      WHERE u.account_number = $1 AND (u.status IS NULL OR u.status = 'active')
    `;
    const result = await query(userQuery, [accountNumber]);
    if (result.rows.length === 0) {
      return json({ error: "Invalid account number or password" }, { status: 401 });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return json({ error: "Invalid account number or password" }, { status: 401 });
    }
    const userData = {
      id: user.id,
      name: user.full_name,
      firstName: user.first_name,
      gender: user.gender,
      accountNumber: user.account_number,
      accountType: user.account_type
    };
    try {
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await query(
        "SELECT log_activity($1, $2, $3, $4, $5, $6)",
        [
          "user_login",
          user.id,
          user.account_number,
          JSON.stringify({
            full_name: user.full_name,
            account_type: user.account_type
          }),
          ip_address,
          // Now capturing actual IP address
          user_agent
          // Now capturing actual user agent
        ]
      );
    } catch (logError) {
      console.error("Error logging login activity:", logError);
    }
    return json({
      success: true,
      user: userData,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Authentication error:", error);
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return json({ error: "Database connection failed" }, { status: 503 });
    }
    return json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}

export { POST };
//# sourceMappingURL=_server-CIqSM534.js.map
