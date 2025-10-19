import { ObjectId } from 'mongodb';

function formatTeacherName(fullName, gender = "unknown") {
  if (!fullName) return "Your teacher";
  let lastName;
  if (fullName.includes(",")) {
    lastName = fullName.split(",")[0].trim();
  } else {
    const nameParts = fullName.trim().split(" ");
    lastName = nameParts[nameParts.length - 1];
  }
  let title = "Teacher";
  if (gender === "female") {
    title = "Ms.";
  } else if (gender === "male") {
    title = "Mr.";
  } else {
    title = "Teacher";
  }
  return `${title} ${lastName}`;
}
async function createGradeVerificationNotification(db, studentId, teacherName, subjectName) {
  try {
    const notificationTitle = `Your grade in ${subjectName} is now available`;
    const notificationMessage = `Your grade in ${subjectName} has been released by ${teacherName}. Check your grade report to see your performance.`;
    const notification = {
      student_id: studentId,
      title: notificationTitle,
      message: notificationMessage,
      type: "grade",
      is_read: false,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date(),
      created_by: null
      // System-generated notification
    };
    await db.collection("notifications").insertOne(notification);
    console.log(`Grade verification notification created for student: ${studentId}`);
  } catch (error) {
    console.error("Error creating grade verification notification:", error);
  }
}
async function createBulkGradeVerificationNotifications(db, studentIds, teacherName, subjectName) {
  try {
    const notificationTitle = `Your grade in ${subjectName} is now available`;
    const notificationMessage = `Your grade in ${subjectName} has been released by ${teacherName}. Check your grade report to see your performance.`;
    const notifications = studentIds.map((studentId) => ({
      student_id: studentId,
      title: notificationTitle,
      message: notificationMessage,
      type: "grade",
      is_read: false,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date(),
      created_by: null
      // System-generated notification
    }));
    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications);
      console.log(`Grade verification notifications created for ${notifications.length} students`);
    }
  } catch (error) {
    console.error("Error creating bulk grade verification notifications:", error);
  }
}
async function createDocumentRequestNotification(db, studentId, documentType, status, adminNote = null, rejectionReason = null, adminUser = null) {
  try {
    let notificationTitle = "";
    let notificationMessage = "";
    let adminName = null;
    if (adminUser && adminUser.id) {
      try {
        const usersCollection = db.collection("users");
        const adminRecord = await usersCollection.findOne(
          { _id: new ObjectId(adminUser.id) },
          { projection: { first_name: 1, last_name: 1, name: 1, username: 1 } }
        );
        if (adminRecord) {
          if (adminRecord.first_name && adminRecord.last_name) {
            adminName = `${adminRecord.first_name} ${adminRecord.last_name}`;
          } else if (adminRecord.name) {
            adminName = adminRecord.name;
          } else if (adminRecord.username) {
            adminName = adminRecord.username;
          } else {
            adminName = "Admin";
          }
          console.log(`Found admin name: ${adminName} for user ID: ${adminUser.id}`);
        } else {
          console.log(`No admin record found for user ID: ${adminUser.id}`);
        }
      } catch (dbError) {
        console.error("Error fetching admin user data:", dbError);
        if (adminUser.first_name && adminUser.last_name) {
          adminName = `${adminUser.first_name} ${adminUser.last_name}`;
        } else if (adminUser.name) {
          adminName = adminUser.name;
        } else if (adminUser.username) {
          adminName = adminUser.username;
        } else {
          adminName = "Admin";
        }
      }
    }
    const documentTypeMap = {
      "transcript": "Transcript",
      "enrollment": "Enrollment Certificate",
      "grade-report": "Grade Report",
      "diploma": "Diploma",
      "certificate": "Certificate"
    };
    const formattedDocType = documentTypeMap[documentType] || documentType;
    switch (status) {
      case "processing":
        notificationTitle = `Document request approved - Now processing`;
        notificationMessage = `Your ${formattedDocType} request has been approved and is now being processed.`;
        break;
      case "rejected":
        notificationTitle = `Document request rejected`;
        notificationMessage = `Your ${formattedDocType} request has been rejected.`;
        break;
      case "completed":
        notificationTitle = `Document request completed`;
        notificationMessage = `Your ${formattedDocType} request has been completed.`;
        break;
      default:
        console.warn(`Unknown document request status: ${status}`);
        return;
    }
    const notification = {
      student_id: studentId,
      title: notificationTitle,
      message: notificationMessage,
      type: "document_request",
      is_read: false,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date(),
      created_by: adminUser ? adminUser.id : null,
      // Store admin note and rejection reason as separate fields
      admin_note: adminNote || null,
      rejection_reason: rejectionReason || null,
      document_type: documentType,
      status,
      // Store admin information
      admin_name: adminName,
      admin_id: adminUser ? adminUser.id : null
    };
    await db.collection("notifications").insertOne(notification);
    console.log(`Document request notification created for student: ${studentId}, status: ${status}`);
  } catch (error) {
    console.error("Error creating document request notification:", error);
  }
}

export { createGradeVerificationNotification as a, createBulkGradeVerificationNotifications as b, createDocumentRequestNotification as c, formatTeacherName as f };
//# sourceMappingURL=notification-helper-3WedpjE4.js.map
