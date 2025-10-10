import { j as json } from './index-CccDCyu_.js';
<<<<<<< HEAD
<<<<<<<< HEAD:build/server/chunks/_server-hEnWSObN.js
=======
<<<<<<<< HEAD:build/server/chunks/_server-3YiRus9D.js
<<<<<<< HEAD
<<<<<<< HEAD:build/server/chunks/_server-BDTGGGjq.js
=======
<<<<<<<< HEAD:build/server/chunks/_server-hEnWSObN.js
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling)
>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection)
<<<<<<<< HEAD:build/server/chunks/_server-BDTGGGjq.js
import { a as connectToDatabase } from './db-B_8POatj.js';
========
import { c as client } from './db-9uwR-1fD.js';
>>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection):build/server/chunks/_server-hEnWSObN.js
<<<<<<< HEAD
========
import { a as connectToDatabase } from './db-9uwR-1fD.js';
>>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling):build/server/chunks/_server-3YiRus9D.js
=======
<<<<<<< HEAD
=======
import { a as connectToDatabase } from './db-9uwR-1fD.js';
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling):build/server/chunks/_server-3YiRus9D.js
=======
========
import { a as connectToDatabase } from './db-9uwR-1fD.js';
>>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling):build/server/chunks/_server-3YiRus9D.js
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling)
========
import { c as client } from './db-9uwR-1fD.js';
>>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection):build/server/chunks/_server-hEnWSObN.js
>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection)
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
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: "active" }
      ]
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
    try {
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      const activityLogsCollection = db.collection("activity_logs");
      await activityLogsCollection.insertOne({
        activity_type: "user_login",
        user_id: user._id,
        account_number: user.account_number,
        details: {
          full_name: user.full_name,
          account_type: user.account_type
        },
        ip_address,
        user_agent,
        timestamp: /* @__PURE__ */ new Date()
      });
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
<<<<<<< HEAD
<<<<<<<< HEAD:build/server/chunks/_server-hEnWSObN.js
=======
<<<<<<<< HEAD:build/server/chunks/_server-3YiRus9D.js
<<<<<<< HEAD
<<<<<<< HEAD:build/server/chunks/_server-BDTGGGjq.js
=======
<<<<<<<< HEAD:build/server/chunks/_server-hEnWSObN.js
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling)
>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection)
<<<<<<<< HEAD:build/server/chunks/_server-BDTGGGjq.js
//# sourceMappingURL=_server-BDTGGGjq.js.map
========
//# sourceMappingURL=_server-hEnWSObN.js.map
>>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection):build/server/chunks/_server-hEnWSObN.js
<<<<<<< HEAD
========
//# sourceMappingURL=_server-3YiRus9D.js.map
>>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling):build/server/chunks/_server-3YiRus9D.js
=======
<<<<<<< HEAD
=======
//# sourceMappingURL=_server-3YiRus9D.js.map
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling):build/server/chunks/_server-3YiRus9D.js
=======
========
//# sourceMappingURL=_server-3YiRus9D.js.map
>>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling):build/server/chunks/_server-3YiRus9D.js
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling)
========
//# sourceMappingURL=_server-hEnWSObN.js.map
>>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection):build/server/chunks/_server-hEnWSObN.js
>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection)
