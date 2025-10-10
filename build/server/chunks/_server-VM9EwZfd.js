import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-9uwR-1fD.js';
import { g as getUserFromRequest, l as logActivityWithUser } from './auth-helper-Ct8jEaTQ.js';
import { ObjectId } from 'mongodb';
import 'dotenv';

async function GET({ url, request }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection("document_requests");
    const usersCollection = db.collection("users");
    const studentId = url.searchParams.get("student_id");
    const adminView = url.searchParams.get("admin_view") === "true";
    if (adminView && user.account_type !== "admin") {
      return json({ error: "Admin access required" }, { status: 403 });
    }
    if (!adminView && !studentId) {
      return json({ error: "Student ID is required" }, { status: 400 });
    }
    let documentRequests;
    if (adminView) {
      documentRequests = await documentRequestsCollection.aggregate([
        {
          $addFields: {
            student_id_obj: { $toObjectId: "$student_id" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "student_id_obj",
            foreignField: "_id",
            as: "student"
          }
        },
        {
          $unwind: "$student"
        },
        {
          $match: {
            "student.account_type": "student"
          }
        },
        {
          $sort: { created_at: -1 }
        }
      ]).toArray();
    } else {
      documentRequests = await documentRequestsCollection.find({
        student_id: studentId
      }).sort({ created_at: -1 }).toArray();
    }
    const formattedRequests = documentRequests.map((request2) => {
      const baseRequest = {
        id: request2.id || request2._id.toString(),
        type: formatDocumentType(request2.document_type),
        purpose: request2.purpose,
        requestedDate: formatDate(request2.requested_at || request2.created_at),
        completedDate: request2.completed_at ? formatDate(request2.completed_at) : null,
        cancelledDate: request2.cancelled_at ? formatDate(request2.cancelled_at) : null,
        estimatedCompletion: request2.status === "processing" && !request2.completed_at ? getEstimatedCompletion(request2.requested_at || request2.created_at) : null,
        rejectionReason: request2.rejection_reason,
        adminNote: request2.admin_note,
        status: request2.status
      };
      if (adminView && request2.student) {
        baseRequest.studentName = `${request2.student.first_name} ${request2.student.last_name}`;
        baseRequest.studentId = request2.student.account_number;
        baseRequest.gradeLevel = `Grade ${request2.student.grade_level}`;
        baseRequest.documentType = formatDocumentType(request2.document_type);
        baseRequest.requestDate = formatDate(request2.requested_at || request2.created_at);
      }
      return baseRequest;
    });
    return json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error("Error fetching document requests:", error);
    return json({
      success: false,
      error: "Failed to fetch document requests"
    }, { status: 500 });
  }
}
async function PATCH({ request }) {
  try {
    console.log("PATCH request received for document requests");
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection("document_requests");
    const requestBody = await request.json();
    console.log("Request body:", requestBody);
    const { id, action } = requestBody;
    if (!id || !action) {
      console.log("Missing required fields - id:", id, "action:", action);
      return json({
        error: "Request ID and action are required"
      }, { status: 400 });
    }
    console.log("Processing action:", action, "for request ID:", id);
    const requestId = ObjectId.isValid(id) ? new ObjectId(id) : id;
    if (action === "cancel") {
      let query = {
        $or: [{ _id: requestId }, { id }],
        status: "pending"
      };
      if (user.account_type !== "admin") {
        query.student_id = user.id;
      }
      const result = await documentRequestsCollection.updateOne(
        query,
        {
          $set: {
            status: "cancelled",
            cancelled_at: /* @__PURE__ */ new Date(),
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      if (result.matchedCount === 0) {
        return json({
          error: "Request not found or cannot be cancelled"
        }, { status: 404 });
      }
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id }]
      });
      await logActivityWithUser(user, "Document Request Cancelled", `Cancelled document request: ${updatedRequest.document_type}`);
      const formattedRequest = {
        id: updatedRequest.id || updatedRequest._id.toString(),
        type: formatDocumentType(updatedRequest.document_type),
        purpose: updatedRequest.purpose,
        requestedDate: formatDate(updatedRequest.requested_at || updatedRequest.created_at),
        cancelledDate: formatDate(updatedRequest.cancelled_at),
        status: updatedRequest.status
      };
      return json({
        success: true,
        data: formattedRequest
      });
    }
    if (action === "approve") {
      if (user.account_type !== "admin") {
        return json({ error: "Admin access required" }, { status: 403 });
      }
      console.log("Processing approve action");
      const { admin_note } = requestBody;
      console.log("Admin note:", admin_note);
      const result = await documentRequestsCollection.updateOne(
        {
          $or: [{ _id: requestId }, { id }],
          status: "pending"
        },
        {
          $set: {
            status: "processing",
            admin_note: admin_note || "Approved",
            processed_at: /* @__PURE__ */ new Date(),
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      console.log("Approve query result:", result.matchedCount, "documents matched");
      if (result.matchedCount === 0) {
        return json({
          error: "Request not found or cannot be approved"
        }, { status: 404 });
      }
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id }]
      });
      await logActivityWithUser(user, "Document Request Approved", `Approved document request: ${updatedRequest.document_type}`);
      const formattedRequest = {
        id: updatedRequest.id || updatedRequest._id.toString(),
        type: formatDocumentType(updatedRequest.document_type),
        purpose: updatedRequest.purpose,
        requestedDate: formatDate(updatedRequest.requested_at || updatedRequest.created_at),
        processedDate: formatDate(updatedRequest.processed_at),
        adminNote: updatedRequest.admin_note,
        status: updatedRequest.status
      };
      return json({
        success: true,
        data: formattedRequest
      });
    }
    if (action === "reject") {
      if (user.account_type !== "admin") {
        return json({ error: "Admin access required" }, { status: 403 });
      }
      console.log("Processing reject action");
      const { rejection_reason } = requestBody;
      const rejectionReason = rejection_reason;
      console.log("Rejection reason:", rejectionReason);
      if (!rejectionReason || !rejectionReason.trim()) {
        console.log("Rejection reason validation failed");
        return json({
          error: "Rejection reason is required"
        }, { status: 400 });
      }
      const result = await documentRequestsCollection.updateOne(
        {
          $or: [{ _id: requestId }, { id }],
          status: "pending"
        },
        {
          $set: {
            status: "rejected",
            rejection_reason: rejectionReason.trim(),
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      console.log("Reject query result:", result.matchedCount, "documents matched");
      if (result.matchedCount === 0) {
        return json({
          error: "Request not found or cannot be rejected"
        }, { status: 404 });
      }
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id }]
      });
      await logActivityWithUser(user, "Document Request Rejected", `Rejected document request: ${updatedRequest.document_type} - Reason: ${rejectionReason.trim()}`);
      const formattedRequest = {
        id: updatedRequest.id || updatedRequest._id.toString(),
        type: formatDocumentType(updatedRequest.document_type),
        purpose: updatedRequest.purpose,
        requestedDate: formatDate(updatedRequest.requested_at || updatedRequest.created_at),
        rejectionReason: updatedRequest.rejection_reason,
        status: updatedRequest.status
      };
      return json({
        success: true,
        data: formattedRequest
      });
    }
    if (action === "complete") {
      if (user.account_type !== "admin") {
        return json({ error: "Admin access required" }, { status: 403 });
      }
      const result = await documentRequestsCollection.updateOne(
        {
          $or: [{ _id: requestId }, { id }],
          status: "processing"
        },
        {
          $set: {
            status: "completed",
            completed_at: /* @__PURE__ */ new Date(),
            updated_at: /* @__PURE__ */ new Date()
          }
        }
      );
      if (result.matchedCount === 0) {
        return json({
          error: "Request not found or cannot be completed (must be in processing status)"
        }, { status: 404 });
      }
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id }]
      });
      await logActivityWithUser(user, "Document Request Completed", `Completed document request: ${updatedRequest.document_type}`);
      const formattedRequest = {
        id: updatedRequest.id || updatedRequest._id.toString(),
        type: formatDocumentType(updatedRequest.document_type),
        purpose: updatedRequest.purpose,
        requestedDate: formatDate(updatedRequest.requested_at || updatedRequest.created_at),
        processedDate: formatDate(updatedRequest.processed_at),
        completedDate: formatDate(updatedRequest.completed_at),
        adminNote: updatedRequest.admin_note,
        status: updatedRequest.status
      };
      return json({
        success: true,
        data: formattedRequest
      });
    }
    return json({
      error: "Invalid action"
    }, { status: 400 });
  } catch (error) {
    console.error("Error updating document request:", error);
    return json({
      success: false,
      error: "Failed to update document request"
    }, { status: 500 });
  }
}
async function POST({ request }) {
  try {
    console.log("POST request received for document requests");
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection("document_requests");
    const requestBody = await request.json();
    console.log("Request body:", requestBody);
    const { student_id, document_type, purpose } = requestBody;
    if (!student_id || !document_type || !purpose) {
      console.log("Missing required fields - student_id:", student_id, "document_type:", document_type, "purpose:", purpose);
      return json({
        error: "Student ID, document type, and purpose are required"
      }, { status: 400 });
    }
    if (user.account_type === "student" && user.id !== student_id) {
      return json({ error: "Students can only create requests for themselves" }, { status: 403 });
    }
    console.log("Creating document request for student:", student_id);
    const requestId = new ObjectId().toString();
    const newRequest = {
      id: requestId,
      student_id,
      document_type,
      purpose: purpose.trim(),
      status: "pending",
      requested_at: /* @__PURE__ */ new Date(),
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
    const result = await documentRequestsCollection.insertOne(newRequest);
    if (!result.insertedId) {
      return json({
        error: "Failed to create document request"
      }, { status: 500 });
    }
    await logActivityWithUser(user, "Document Request Created", `Created document request: ${document_type} for student ${student_id}`);
    const formattedRequest = {
      id: newRequest.id,
      type: formatDocumentType(newRequest.document_type),
      purpose: newRequest.purpose,
      requestedDate: formatDate(newRequest.requested_at),
      estimatedCompletion: getEstimatedCompletion(newRequest.document_type),
      status: newRequest.status
    };
    return json({
      success: true,
      data: formattedRequest
    });
  } catch (error) {
    console.error("Error creating document request:", error);
    return json({
      success: false,
      error: "Failed to create document request"
    }, { status: 500 });
  }
}
async function DELETE({ request }) {
  try {
    console.log("DELETE request received for document requests");
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection("document_requests");
    const requestBody = await request.json();
    console.log("Request body:", requestBody);
    const { id } = requestBody;
    if (!id) {
      console.log("Missing required field - id:", id);
      return json({
        error: "Request ID is required"
      }, { status: 400 });
    }
    console.log("Deleting document request with ID:", id);
    const requestId = ObjectId.isValid(id) ? new ObjectId(id) : id;
    const existingRequest = await documentRequestsCollection.findOne({
      $or: [{ _id: requestId }, { id }]
    });
    if (!existingRequest) {
      return json({
        error: "Document request not found"
      }, { status: 404 });
    }
    if (user.account_type === "student" && user.id !== existingRequest.student_id) {
      return json({ error: "Students can only delete their own requests" }, { status: 403 });
    }
    if (!["completed", "cancelled"].includes(existingRequest.status)) {
      return json({
        error: "Only completed or cancelled requests can be deleted"
      }, { status: 400 });
    }
    const result = await documentRequestsCollection.deleteOne({
      $or: [{ _id: requestId }, { id }],
      status: { $in: ["completed", "cancelled"] }
    });
    if (result.deletedCount === 0) {
      return json({
        error: "Request not found or cannot be deleted"
      }, { status: 404 });
    }
    await logActivityWithUser(user, "Document Request Deleted", `Deleted document request: ${existingRequest.document_type} (ID: ${id})`);
    return json({
      success: true,
      message: "Document request deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting document request:", error);
    return json({
      success: false,
      error: "Failed to delete document request"
    }, { status: 500 });
  }
}
function formatDocumentType(type) {
  const typeMap = {
    "transcript": "Transcript",
    "enrollment": "Enrollment Certificate",
    "grade-report": "Grade Report",
    "diploma": "Diploma",
    "certificate": "Certificate"
  };
  return typeMap[type] || type;
}
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US");
}
function getEstimatedCompletion(requestedDate) {
  if (!requestedDate) return null;
  const date = new Date(requestedDate);
  date.setDate(date.getDate() + 7);
  return date.toLocaleDateString("en-US");
}

export { DELETE, GET, PATCH, POST };
//# sourceMappingURL=_server-VM9EwZfd.js.map
