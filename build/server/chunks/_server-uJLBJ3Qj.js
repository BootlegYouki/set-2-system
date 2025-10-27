import { j as json } from './index-CccDCyu_.js';
import { c as client } from './db-C-gxO138.js';
import bcrypt from 'bcrypt';
import 'mongodb';
import 'dotenv';

async function POST({ request, getClientAddress }) {
  try {
    const { accountNumber, password } = await request.json();
    if (!accountNumber || !password) {
      return json({ error: "Account number and password are required" }, { status: 400 });
    }
    if (typeof accountNumber !== "string" || typeof password !== "string") {
      return json({ error: "Invalid input format" }, { status: 400 });
    }
    const sanitizedAccountNumber = accountNumber.replace(/[^a-zA-Z0-9\-_]/g, "");
    if (sanitizedAccountNumber !== accountNumber || accountNumber.length > 50) {
      return json({ error: "Invalid account number format" }, { status: 400 });
    }
    if (password.length > 200) {
      return json({ error: "Password too long" }, { status: 400 });
    }
    const db = client.db(process.env.MONGODB_DB_NAME || "set-2-system");
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      account_number: sanitizedAccountNumber,
      status: { $ne: "archived" }
      // Simpler condition: not archived = active/null/undefined
    });
    if (!user) {
      return json({ error: "Invalid account number or password" }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return json({ error: "Invalid account number or password" }, { status: 401 });
    }
    const userData = {
      id: user._id,
      name: user.full_name,
      firstName: user.first_name,
      gender: user.gender,
      accountNumber: user.account_number,
      accountType: user.account_type
    };
    const ip_address = getClientAddress();
    const user_agent = request.headers.get("user-agent");
    const activityLogsCollection = db.collection("activity_logs");
    activityLogsCollection.insertOne({
      activity_type: "user_login",
      user_id: user._id,
      user_account_number: user.account_number,
      activity_data: {
        full_name: user.full_name,
        account_type: user.account_type
      },
      ip_address,
      user_agent,
      created_at: /* @__PURE__ */ new Date()
    }).catch((logError) => {
      console.error("Error logging login activity:", logError);
    });
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
//# sourceMappingURL=_server-uJLBJ3Qj.js.map
