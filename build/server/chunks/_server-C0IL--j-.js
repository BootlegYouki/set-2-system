import { j as json } from './index-CccDCyu_.js';
import { c as client } from './db-B_8POatj.js';
import 'mongodb';
import 'dotenv';

async function generateAccountNumber(accountType) {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const prefix = accountType === "student" ? "STU" : accountType === "teacher" ? "TCH" : accountType === "admin" ? "ADM" : "ACC";
  try {
    const db = client.db(process.env.MONGODB_DB_NAME);
    const usersCollection = db.collection("users");
    const existingAccounts = await usersCollection.find({
      account_number: { $regex: `^${prefix}-${currentYear}-` },
      status: { $ne: "archived" }
    }).toArray();
    if (existingAccounts.length === 0) {
      return `${prefix}-${currentYear}-0001`;
    }
    const existingNumbers = new Set(
      existingAccounts.map((account) => {
        const parts = account.account_number.split("-");
        return parseInt(parts[2]);
      }).filter((num) => !isNaN(num))
    );
    let nextNumber = 1;
    while (existingNumbers.has(nextNumber)) {
      nextNumber++;
    }
    return `${prefix}-${currentYear}-${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating account number:", error);
    throw error;
  }
}
async function GET({ url }) {
  try {
    const accountType = url.searchParams.get("type");
    if (!accountType) {
      return json({ error: "Account type is required" }, { status: 400 });
    }
    if (!["student", "teacher", "admin"].includes(accountType)) {
      return json({ error: "Invalid account type" }, { status: 400 });
    }
    const nextNumber = await generateAccountNumber(accountType);
    return json({
      accountNumber: nextNumber,
      accountType
    });
  } catch (error) {
    console.error("Error getting next account number:", error);
    return json({ error: "Failed to get next account number" }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-C0IL--j-.js.map
