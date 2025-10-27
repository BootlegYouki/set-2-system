import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-C-gxO138.js';
import { ObjectId } from 'mongodb';
import { v as verifyAuth, l as logActivityWithUser } from './auth-helper-DQ9N_pzD.js';
import 'dotenv';

async function GET({ url, request }) {
  try {
    const authResult = await verifyAuth(request, ["admin", "teacher"]);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: 401 });
    }
    const db = await connectToDatabase();
    const action = url.searchParams.get("action");
    switch (action) {
      case "all":
        const status = url.searchParams.get("status");
        const documentType = url.searchParams.get("documentType");
        const gradeLevel = url.searchParams.get("gradeLevel");
        const searchTerm = url.searchParams.get("search");
        let query = {};
        if (status) {
          query.status = status;
        }
        if (documentType) {
          query.document_type = documentType;
        }
        if (gradeLevel) {
          query.grade_level = gradeLevel.toString();
        }
        if (searchTerm) {
          query.$or = [
            { full_name: { $regex: searchTerm, $options: "i" } },
            { account_number: { $regex: searchTerm, $options: "i" } },
            { request_id: { $regex: searchTerm, $options: "i" } },
            { document_type: { $regex: searchTerm, $options: "i" } }
          ];
        }
        const requests = await db.collection("document_requests").find(query).sort({ submitted_date: -1 }).toArray();
        const formattedRequests = requests.map((req) => ({
          id: req._id.toString(),
          studentId: req.account_number,
          gradeLevel: `Grade ${req.grade_level}`,
          section: req.section,
          studentName: req.full_name,
          documentType: req.document_type,
          requestId: req.request_id,
          submittedDate: formatDate(req.submitted_date),
          payment: `₱${req.payment_amount}`,
          paymentStatus: req.payment_status,
          status: req.status,
          tentativeDate: req.tentative_date ? formatDateForInput(req.tentative_date) : null,
          isUrgent: req.is_urgent || false,
          purpose: req.purpose,
          dateOfBirth: formatDateDisplay(req.birthdate),
          processedBy: req.processed_by,
          processedById: req.processed_by_id
        }));
        return json({ success: true, data: formattedRequests });
      case "stats":
        const stats = await db.collection("document_requests").aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]).toArray();
        const statsObj = {
          on_hold: 0,
          verifying: 0,
          processing: 0,
          for_pickup: 0,
          released: 0
        };
        stats.forEach((stat) => {
          if (statsObj.hasOwnProperty(stat._id)) {
            statsObj[stat._id] = stat.count;
          }
        });
        return json({ success: true, data: statsObj });
      case "single":
        const requestId = url.searchParams.get("requestId");
        if (!requestId) {
          return json({ error: "Request ID is required" }, { status: 400 });
        }
        const request2 = await db.collection("document_requests").findOne({ request_id: requestId });
        if (!request2) {
          return json({ error: "Request not found" }, { status: 404 });
        }
        const formattedRequest = {
          id: request2._id.toString(),
          studentId: request2.account_number,
          gradeLevel: `Grade ${request2.grade_level}`,
          section: request2.section,
          studentName: request2.full_name,
          documentType: request2.document_type,
          requestId: request2.request_id,
          submittedDate: formatDate(request2.submitted_date),
          payment: `₱${request2.payment_amount}`,
          paymentStatus: request2.payment_status,
          status: request2.status,
          tentativeDate: request2.tentative_date ? formatDateForInput(request2.tentative_date) : null,
          isUrgent: request2.is_urgent || false,
          purpose: request2.purpose,
          dateOfBirth: formatDateDisplay(request2.birthdate),
          processedBy: request2.processed_by,
          processedById: request2.processed_by_id
        };
        return json({ success: true, data: formattedRequest });
      default:
        return json({ error: "Invalid action parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/document-requests GET:", error);
    return json({ error: "Failed to fetch document requests" }, { status: 500 });
  }
}
async function POST({ request }) {
  try {
    const authResult = await verifyAuth(request, ["admin", "teacher", "student"]);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;
    const db = await connectToDatabase();
    const data = await request.json();
    const { action } = data;
    switch (action) {
      case "create":
        if (user.account_type === "student") {
          const student = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
          if (!student) {
            return json({ error: "Student not found" }, { status: 404 });
          }
          const lastRequest = await db.collection("document_requests").find().sort({ request_id: -1 }).limit(1).toArray();
          let nextRequestNumber = 1;
          if (lastRequest.length > 0) {
            const lastId = lastRequest[0].request_id;
            const match = lastId.match(/REQ-(\d+)-(\d+)/);
            if (match) {
              nextRequestNumber = parseInt(match[2]) + 1;
            }
          }
          const requestId2 = `REQ-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(nextRequestNumber).padStart(4, "0")}`;
          const sectionStudent = await db.collection("section_students").findOne({ student_id: new ObjectId(user.id), status: "active" });
          let sectionName = "N/A";
          if (sectionStudent) {
            const section = await db.collection("sections").findOne({ _id: sectionStudent.section_id });
            if (section) {
              sectionName = section.name;
            }
          }
          const newRequest = {
            student_id: student._id.toString(),
            account_number: student.account_number,
            full_name: student.full_name,
            grade_level: student.grade_level,
            section: sectionName,
            birthdate: student.birthdate,
            document_type: data.documentType,
            request_id: requestId2,
            submitted_date: /* @__PURE__ */ new Date(),
            payment_amount: data.paymentAmount || 120,
            payment_status: "pending",
            status: "on_hold",
            tentative_date: null,
            is_urgent: data.isUrgent || false,
            purpose: data.purpose,
            processed_by: null,
            processed_by_id: null,
            created_at: /* @__PURE__ */ new Date(),
            updated_at: /* @__PURE__ */ new Date()
          };
          const result = await db.collection("document_requests").insertOne(newRequest);
          await logActivityWithUser(
            "document_request_created",
            `Document request ${requestId2} created for ${data.documentType}`,
            user
          );
          return json({
            success: true,
            message: "Document request created successfully",
            data: { ...newRequest, id: result.insertedId.toString() }
          });
        } else {
          return json({ error: "Only students can create requests" }, { status: 403 });
        }
      case "update":
        if (user.account_type !== "admin" && user.account_type !== "teacher") {
          return json({ error: "Permission denied" }, { status: 403 });
        }
        const { requestId, status, tentativeDate, paymentStatus } = data;
        if (!requestId) {
          return json({ error: "Request ID is required" }, { status: 400 });
        }
        const updateData = {
          updated_at: /* @__PURE__ */ new Date()
        };
        if (status) {
          updateData.status = status;
          if (status !== "processing") {
            updateData.tentative_date = null;
          }
        }
        if (tentativeDate !== void 0) {
          updateData.tentative_date = tentativeDate ? new Date(tentativeDate) : null;
        }
        if (paymentStatus) {
          updateData.payment_status = paymentStatus;
        }
        const existingRequest = await db.collection("document_requests").findOne({ request_id: requestId });
        if (existingRequest && !existingRequest.processed_by) {
          updateData.processed_by = user.name;
          updateData.processed_by_id = user.id;
        }
        const updateResult = await db.collection("document_requests").updateOne({ request_id: requestId }, { $set: updateData });
        if (updateResult.matchedCount === 0) {
          return json({ error: "Request not found" }, { status: 404 });
        }
        await logActivityWithUser(
          "document_request_updated",
          `Document request ${requestId} updated`,
          user
        );
        return json({ success: true, message: "Request updated successfully" });
      case "reject":
        if (user.account_type !== "admin" && user.account_type !== "teacher") {
          return json({ error: "Permission denied" }, { status: 403 });
        }
        const rejectRequestId = data.requestId;
        if (!rejectRequestId) {
          return json({ error: "Request ID is required" }, { status: 400 });
        }
        const rejectResult = await db.collection("document_requests").updateOne(
          { request_id: rejectRequestId },
          {
            $set: {
              status: "rejected",
              tentative_date: null,
              processed_by: user.name,
              processed_by_id: user.id,
              updated_at: /* @__PURE__ */ new Date()
            }
          }
        );
        if (rejectResult.matchedCount === 0) {
          return json({ error: "Request not found" }, { status: 404 });
        }
        await logActivityWithUser(
          "document_request_rejected",
          `Document request ${rejectRequestId} rejected`,
          user
        );
        return json({ success: true, message: "Request rejected successfully" });
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/document-requests POST:", error);
    return json({ error: "Failed to process request" }, { status: 500 });
  }
}
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}
function formatDateForInput(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDateDisplay(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

export { GET, POST };
//# sourceMappingURL=_server-CxssPff-.js.map
