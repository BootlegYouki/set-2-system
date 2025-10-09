import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-B_8POatj.js';
import { g as getUserFromRequest, l as logActivityWithUser } from './auth-helper-B9ttazRJ.js';
import { ObjectId } from 'mongodb';
import 'dotenv';

async function GET({ url }) {
  try {
    const db = await connectToDatabase();
    const action = url.searchParams.get("action");
    const gradeLevel = url.searchParams.get("gradeLevel");
    const schoolYear = url.searchParams.get("schoolYear") || "2024-2025";
    const sectionId = url.searchParams.get("sectionId");
    switch (action) {
      case "available-sections":
        const sections = await db.collection("sections").find({
          status: "active"
        }).sort({ grade_level: 1, name: 1 }).toArray();
        return json({ success: true, data: sections });
      case "available-rooms":
        const rooms = await db.collection("rooms").aggregate([
          {
            $lookup: {
              from: "sections",
              localField: "_id",
              foreignField: "room_id",
              as: "assigned_sections",
              pipeline: [{ $match: { status: "active" } }]
            }
          },
          {
            $addFields: {
              available: { $eq: [{ $size: "$assigned_sections" }, 0] }
            }
          },
          {
            $project: {
              id: "$_id",
              name: 1,
              building: 1,
              floor: 1,
              status: 1,
              available: 1
            }
          },
          {
            $sort: { building: 1, floor: 1, name: 1 }
          }
        ]).toArray();
        return json({ success: true, data: rooms });
      case "available-teachers":
        const teacherGradeLevel = url.searchParams.get("teacherGradeLevel");
        const availableTeachers = await db.collection("users").aggregate([
          {
            $match: {
              account_type: "teacher",
              status: "active"
            }
          },
          {
            $lookup: {
              from: "sections",
              localField: "_id",
              foreignField: "adviser_id",
              as: "advised_sections",
              pipeline: [
                {
                  $match: {
                    status: "active",
                    school_year: schoolYear,
                    ...teacherGradeLevel && { grade_level: parseInt(teacherGradeLevel) }
                  }
                }
              ]
            }
          },
          {
            $match: {
              advised_sections: { $size: 0 }
            }
          },
          {
            $project: {
              id: "$_id",
              account_number: 1,
              first_name: 1,
              last_name: 1,
              full_name: 1,
              email: 1
            }
          }
        ]).toArray();
        return json({ success: true, data: availableTeachers });
      case "available-students":
        if (!gradeLevel) {
          return json({ success: false, error: "Grade level is required" }, { status: 400 });
        }
        const availableStudents = await db.collection("users").aggregate([
          {
            $match: {
              account_type: "student",
              status: "active",
              grade_level: gradeLevel.toString()
            }
          },
          {
            $lookup: {
              from: "section_students",
              localField: "_id",
              foreignField: "student_id",
              as: "enrollments",
              pipeline: [
                {
                  $lookup: {
                    from: "sections",
                    localField: "section_id",
                    foreignField: "_id",
                    as: "section"
                  }
                },
                {
                  $match: {
                    status: "active",
                    "section.status": "active",
                    "section.school_year": schoolYear
                  }
                }
              ]
            }
          },
          {
            $match: {
              enrollments: { $size: 0 }
            }
          },
          {
            $project: {
              id: "$_id",
              account_number: 1,
              first_name: 1,
              last_name: 1,
              full_name: 1,
              email: 1,
              grade_level: 1,
              age: 1,
              guardian: 1
            }
          }
        ]).toArray();
        return json({ success: true, data: availableStudents });
      case "section-details":
        if (!sectionId) {
          return json({ success: false, error: "Section ID is required" }, { status: 400 });
        }
        const sectionDetails = await db.collection("sections").aggregate([
          {
            $match: { _id: new ObjectId(sectionId) }
          },
          {
            $lookup: {
              from: "users",
              localField: "adviser_id",
              foreignField: "_id",
              as: "adviser"
            }
          },
          {
            $lookup: {
              from: "rooms",
              localField: "room_id",
              foreignField: "_id",
              as: "room"
            }
          },
          {
            $lookup: {
              from: "section_students",
              localField: "_id",
              foreignField: "section_id",
              as: "students",
              pipeline: [
                { $match: { status: "active" } },
                {
                  $lookup: {
                    from: "users",
                    localField: "student_id",
                    foreignField: "_id",
                    as: "student_info"
                  }
                },
                { $unwind: "$student_info" }
              ]
            }
          },
          {
            $addFields: {
              id: "$_id",
              adviser_name: { $arrayElemAt: ["$adviser.full_name", 0] },
              room_name: { $arrayElemAt: ["$room.name", 0] },
              student_count: { $size: "$students" }
            }
          }
        ]).toArray();
        return json({ success: true, data: sectionDetails[0] || null });
      case "section-students":
        if (!sectionId) {
          return json({ success: false, error: "Section ID is required" }, { status: 400 });
        }
        const sectionStudents = await db.collection("section_students").aggregate([
          {
            $match: {
              section_id: new ObjectId(sectionId),
              status: "active"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "student_id",
              foreignField: "_id",
              as: "student"
            }
          },
          {
            $unwind: "$student"
          },
          {
            $project: {
              id: "$student._id",
              account_number: "$student.account_number",
              first_name: "$student.first_name",
              last_name: "$student.last_name",
              full_name: "$student.full_name",
              email: "$student.email",
              grade_level: "$student.grade_level",
              age: "$student.age",
              guardian: "$student.guardian",
              enrolled_at: "$enrolled_at",
              enrollment_status: "$status"
            }
          },
          {
            $sort: { full_name: 1 }
          }
        ]).toArray();
        return json({ success: true, data: sectionStudents });
      default:
        const allSections = await db.collection("sections").aggregate([
          {
            $match: {
              school_year: schoolYear,
              status: "active"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "adviser_id",
              foreignField: "_id",
              as: "adviser"
            }
          },
          {
            $lookup: {
              from: "rooms",
              localField: "room_id",
              foreignField: "_id",
              as: "room"
            }
          },
          {
            $lookup: {
              from: "section_students",
              localField: "_id",
              foreignField: "section_id",
              as: "students",
              pipeline: [{ $match: { status: "active" } }]
            }
          },
          {
            $addFields: {
              id: "$_id",
              adviser_name: { $arrayElemAt: ["$adviser.full_name", 0] },
              room_name: { $arrayElemAt: ["$room.name", 0] },
              student_count: { $size: "$students" }
            }
          },
          {
            $sort: { grade_level: 1, name: 1 }
          }
        ]).toArray();
        return json({ success: true, data: allSections });
    }
  } catch (error) {
    console.error("Error fetching sections data:", error);
    return json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}
async function POST({ request, getClientAddress }) {
  try {
    const db = await connectToDatabase();
    const requestBody = await request.json();
    const {
      sectionName,
      gradeLevel,
      schoolYear,
      adviserId: adviserId_raw,
      studentIds,
      roomId
    } = requestBody;
    const adviserId = adviserId_raw || requestBody.adviser_id;
    const clientIP = getClientAddress();
    const userAgent = request.headers.get("user-agent");
    const user = await getUserFromRequest(request);
    console.log("User authentication result:", user ? "SUCCESS" : "FAILED");
    console.log("User details:", user ? { id: user._id, account_type: user.account_type } : "No user");
    if (!user) {
      return json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (!sectionName || !gradeLevel || !schoolYear) {
      return json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    const existingSection = await db.collection("sections").findOne({
      name: sectionName,
      grade_level: parseInt(gradeLevel),
      school_year: schoolYear,
      status: "active"
    });
    if (existingSection) {
      return json({
        success: false,
        error: "A section with this name already exists for the specified grade level and school year"
      }, { status: 400 });
    }
    if (adviserId) {
      const adviser = await db.collection("users").findOne({
        _id: new ObjectId(adviserId),
        account_type: "teacher",
        status: "active"
      });
      if (!adviser) {
        return json({
          success: false,
          error: "Invalid adviser selected"
        }, { status: 400 });
      }
      const existingAdviserSection = await db.collection("sections").findOne({
        adviser_id: new ObjectId(adviserId),
        school_year: schoolYear,
        status: "active"
      });
      if (existingAdviserSection) {
        return json({
          success: false,
          error: "This teacher is already assigned as an adviser to another section"
        }, { status: 400 });
      }
    }
    if (roomId) {
      const room = await db.collection("rooms").findOne({
        _id: new ObjectId(roomId),
        status: "active"
      });
      if (!room) {
        return json({
          success: false,
          error: "Invalid room selected"
        }, { status: 400 });
      }
      const existingRoomSection = await db.collection("sections").findOne({
        room_id: new ObjectId(roomId),
        status: "active"
      });
      if (existingRoomSection) {
        return json({
          success: false,
          error: "This room is already assigned to another section"
        }, { status: 400 });
      }
    }
    const sectionData = {
      name: sectionName,
      grade_level: parseInt(gradeLevel),
      school_year: schoolYear,
      status: "active",
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
    if (adviserId) {
      sectionData.adviser_id = new ObjectId(adviserId);
    }
    if (roomId) {
      sectionData.room_id = new ObjectId(roomId);
    }
    const sectionResult = await db.collection("sections").insertOne(sectionData);
    const newSectionId = sectionResult.insertedId;
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      const students = await db.collection("users").find({
        _id: { $in: studentIds.map((id) => new ObjectId(id)) },
        account_type: "student",
        status: "active",
        grade_level: gradeLevel.toString()
      }).toArray();
      if (students.length !== studentIds.length) {
        return json({
          success: false,
          error: "Some selected students are invalid or not available"
        }, { status: 400 });
      }
      const existingEnrollments = await db.collection("section_students").find({
        student_id: { $in: studentIds.map((id) => new ObjectId(id)) },
        status: "active"
      }).toArray();
      if (existingEnrollments.length > 0) {
        return json({
          success: false,
          error: "Some students are already enrolled in other sections"
        }, { status: 400 });
      }
      const enrollmentData = studentIds.map((studentId) => ({
        section_id: newSectionId,
        student_id: new ObjectId(studentId),
        enrolled_at: /* @__PURE__ */ new Date(),
        status: "active"
      }));
      await db.collection("section_students").insertMany(enrollmentData);
    }
    try {
      await logActivityWithUser(
        "section_created",
        user,
        {
          section_id: newSectionId,
          section_name: sectionName,
          grade_level: parseInt(gradeLevel),
          school_year: schoolYear,
          adviser_id: adviserId,
          student_count: studentIds ? studentIds.length : 0,
          room_id: roomId
        },
        clientIP,
        userAgent
      );
      if (studentIds && studentIds.length > 0) {
        for (const studentId of studentIds) {
          const student = await db.collection("users").findOne({ _id: new ObjectId(studentId) });
          await logActivityWithUser(
            "student_enrolled_to_section",
            user,
            {
              section_id: newSectionId,
              section_name: sectionName,
              grade_level: parseInt(gradeLevel),
              school_year: schoolYear,
              student: {
                id: student?._id,
                name: student?.full_name,
                account_number: student?.account_number,
                grade_level: student?.grade_level
              },
              action: "enrolled"
            },
            clientIP,
            userAgent
          );
        }
      }
    } catch (logError) {
      console.error("Error logging section creation activity:", logError);
    }
    const sectionDetails = await db.collection("sections").aggregate([
      {
        $match: { _id: newSectionId }
      },
      {
        $lookup: {
          from: "users",
          localField: "adviser_id",
          foreignField: "_id",
          as: "adviser"
        }
      },
      {
        $lookup: {
          from: "rooms",
          localField: "room_id",
          foreignField: "_id",
          as: "room"
        }
      },
      {
        $lookup: {
          from: "section_students",
          localField: "_id",
          foreignField: "section_id",
          as: "students",
          pipeline: [{ $match: { status: "active" } }]
        }
      },
      {
        $addFields: {
          id: "$_id",
          adviser_name: { $arrayElemAt: ["$adviser.full_name", 0] },
          room_name: { $arrayElemAt: ["$room.name", 0] },
          student_count: { $size: "$students" }
        }
      }
    ]).toArray();
    return json({
      success: true,
      data: sectionDetails[0],
      message: `Section ${sectionName} created successfully with ${studentIds ? studentIds.length : 0} students`
    });
  } catch (error) {
    console.error("Error creating section:", error);
    return json({ success: false, error: "Failed to create section" }, { status: 500 });
  }
}
async function PUT({ request, getClientAddress }) {
  console.log("=== PUT REQUEST STARTED ===");
  try {
    const db = await connectToDatabase();
    console.log("Database connected successfully");
    const requestBody = await request.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    const sectionId = requestBody.sectionId || requestBody.section_id;
    const updates = requestBody.updates || {
      name: requestBody.sectionName,
      adviserId: requestBody.adviserId,
      studentIds: requestBody.studentIds,
      roomId: requestBody.roomId
    };
    console.log("Parsed sectionId:", sectionId);
    console.log("Parsed updates:", JSON.stringify(updates, null, 2));
    const clientIP = getClientAddress();
    const userAgent = request.headers.get("user-agent");
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log("Authentication failed - returning 401");
      return json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (!sectionId) {
      console.log("Section ID missing - returning 400");
      return json({ success: false, error: "Section ID is required" }, { status: 400 });
    }
    console.log("Starting database operations...");
    const currentSection = await db.collection("sections").findOne({
      _id: new ObjectId(sectionId),
      status: "active"
    });
    console.log("Current section found:", currentSection ? "YES" : "NO");
    console.log("Current section data:", currentSection);
    if (!currentSection) {
      return json({ success: false, error: "Section not found" }, { status: 404 });
    }
    const updateData = {
      $set: { updated_at: /* @__PURE__ */ new Date() }
    };
    const changes = [];
    if (updates.name && updates.name !== currentSection.name) {
      const existingSection = await db.collection("sections").findOne({
        name: updates.name,
        grade_level: currentSection.grade_level,
        school_year: currentSection.school_year,
        status: "active",
        _id: { $ne: new ObjectId(sectionId) }
      });
      if (existingSection) {
        return json({
          success: false,
          error: "A section with this name already exists for the same grade level and school year"
        }, { status: 400 });
      }
      updateData.$set.name = updates.name;
      changes.push(`Name changed from "${currentSection.name}" to "${updates.name}"`);
    }
    if (updates.adviserId !== void 0) {
      if (updates.adviserId && updates.adviserId !== currentSection.adviser_id?.toString()) {
        const adviser = await db.collection("users").findOne({
          _id: new ObjectId(updates.adviserId),
          account_type: "teacher",
          status: "active"
        });
        if (!adviser) {
          return json({
            success: false,
            error: "Invalid adviser selected"
          }, { status: 400 });
        }
        const existingAdviserSection = await db.collection("sections").findOne({
          adviser_id: new ObjectId(updates.adviserId),
          school_year: currentSection.school_year,
          status: "active",
          _id: { $ne: new ObjectId(sectionId) }
        });
        if (existingAdviserSection) {
          return json({
            success: false,
            error: "This teacher is already assigned as an adviser to another section"
          }, { status: 400 });
        }
        updateData.$set.adviser_id = new ObjectId(updates.adviserId);
        changes.push(`Adviser assigned: ${adviser.full_name}`);
      } else if (!updates.adviserId && currentSection.adviser_id) {
        updateData.$unset = { adviser_id: "" };
        changes.push("Adviser removed");
      }
    }
    if (updates.roomId !== void 0) {
      if (updates.roomId && updates.roomId !== currentSection.room_id?.toString()) {
        const room = await db.collection("rooms").findOne({
          _id: new ObjectId(updates.roomId),
          status: "active"
        });
        if (!room) {
          return json({
            success: false,
            error: "Invalid room selected"
          }, { status: 400 });
        }
        const existingRoomSection = await db.collection("sections").findOne({
          room_id: new ObjectId(updates.roomId),
          status: "active",
          _id: { $ne: new ObjectId(sectionId) }
        });
        if (existingRoomSection) {
          return json({
            success: false,
            error: "This room is already assigned to another section"
          }, { status: 400 });
        }
        updateData.$set.room_id = new ObjectId(updates.roomId);
        changes.push(`Room assigned: ${room.name}`);
      } else if (!updates.roomId && currentSection.room_id) {
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.room_id = "";
        changes.push("Room removed");
      }
    }
    if (updates.studentIds !== void 0) {
      const newStudentIds = updates.studentIds || [];
      const currentStudents = await db.collection("section_students").find({
        section_id: new ObjectId(sectionId),
        status: "active"
      }).toArray();
      const currentStudentIds = currentStudents.map((s) => s.student_id.toString());
      const newStudentIdStrings = newStudentIds.map((id) => id.toString());
      const studentsToAdd = newStudentIds.filter((id) => !currentStudentIds.includes(id.toString()));
      const studentsToRemove = currentStudentIds.filter((id) => !newStudentIdStrings.includes(id));
      if (studentsToAdd.length > 0) {
        const validStudentIds = studentsToAdd.filter((id) => {
          try {
            return id && ObjectId.isValid(id);
          } catch (e) {
            return false;
          }
        });
        if (validStudentIds.length === 0) {
          return json({
            success: false,
            error: "No valid student IDs provided"
          }, { status: 400 });
        }
        const students = await db.collection("users").find({
          _id: { $in: validStudentIds.map((id) => new ObjectId(id)) },
          account_type: "student",
          status: "active",
          grade_level: currentSection.grade_level.toString()
        }).toArray();
        if (students.length !== validStudentIds.length) {
          return json({
            success: false,
            error: "Some selected students are invalid or not available"
          }, { status: 400 });
        }
        const existingEnrollments = await db.collection("section_students").find({
          student_id: { $in: validStudentIds.map((id) => new ObjectId(id)) },
          status: "active"
        }).toArray();
        if (existingEnrollments.length > 0) {
          return json({
            success: false,
            error: "Some students are already enrolled in other sections"
          }, { status: 400 });
        }
        const enrollmentData = validStudentIds.map((studentId) => ({
          section_id: new ObjectId(sectionId),
          student_id: new ObjectId(studentId),
          enrolled_at: /* @__PURE__ */ new Date(),
          status: "active"
        }));
        await db.collection("section_students").insertMany(enrollmentData);
        changes.push(`Added ${validStudentIds.length} students`);
        for (const student of students) {
          await logActivityWithUser(
            "student_enrolled",
            user,
            {
              section_id: new ObjectId(sectionId),
              section_name: currentSection.name,
              student: {
                id: student._id,
                name: student.full_name,
                account_number: student.account_number,
                grade_level: student.grade_level
              }
            },
            clientIP,
            userAgent
          );
        }
      }
      if (studentsToRemove.length > 0) {
        const validRemoveIds = studentsToRemove.filter((id) => {
          try {
            return id && ObjectId.isValid(id);
          } catch (e) {
            return false;
          }
        });
        if (validRemoveIds.length > 0) {
          await db.collection("section_students").updateMany(
            {
              section_id: new ObjectId(sectionId),
              student_id: { $in: validRemoveIds.map((id) => new ObjectId(id)) },
              status: "active"
            },
            {
              $set: {
                status: "inactive",
                removed_at: /* @__PURE__ */ new Date()
              }
            }
          );
          changes.push(`Removed ${validRemoveIds.length} students`);
          const removedStudents = await db.collection("users").find({
            _id: { $in: validRemoveIds.map((id) => new ObjectId(id)) }
          }).toArray();
          for (const student of removedStudents) {
            await logActivityWithUser(
              "student_unenrolled",
              user,
              {
                section_id: new ObjectId(sectionId),
                section_name: currentSection.name,
                student: {
                  id: student._id,
                  name: student.full_name,
                  account_number: student.account_number,
                  grade_level: student.grade_level
                }
              },
              clientIP,
              userAgent
            );
          }
        }
      }
    }
    if (Object.keys(updateData.$set).length > 1 || updateData.$unset) {
      console.log("Updating section with data:", JSON.stringify(updateData, null, 2));
      await db.collection("sections").updateOne(
        { _id: new ObjectId(sectionId) },
        updateData
      );
    }
    if (changes.length > 0) {
      await logActivityWithUser(
        "section_updated",
        user,
        {
          section_id: new ObjectId(sectionId),
          section_name: currentSection.name,
          changes
        },
        clientIP,
        userAgent
      );
    }
    const updatedSection = await db.collection("sections").aggregate([
      {
        $match: { _id: new ObjectId(sectionId) }
      },
      {
        $lookup: {
          from: "users",
          localField: "adviser_id",
          foreignField: "_id",
          as: "adviser"
        }
      },
      {
        $lookup: {
          from: "rooms",
          localField: "room_id",
          foreignField: "_id",
          as: "room"
        }
      },
      {
        $lookup: {
          from: "section_students",
          localField: "_id",
          foreignField: "section_id",
          as: "students",
          pipeline: [{ $match: { status: "active" } }]
        }
      },
      {
        $addFields: {
          id: "$_id",
          adviser_name: { $arrayElemAt: ["$adviser.full_name", 0] },
          room_name: { $arrayElemAt: ["$room.name", 0] },
          student_count: { $size: "$students" }
        }
      }
    ]).toArray();
    return json({
      success: true,
      data: updatedSection[0],
      message: changes.length > 0 ? `Section updated: ${changes.join(", ")}` : "No changes made"
    });
  } catch (error) {
    console.error("Error updating section:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    return json({ success: false, error: "Failed to update section" }, { status: 500 });
  }
}
async function DELETE({ request, getClientAddress, url }) {
  try {
    const db = await connectToDatabase();
    const sectionId = url.searchParams.get("sectionId");
    const clientIP = getClientAddress();
    const userAgent = request.headers.get("user-agent");
    const user = getUserFromRequest(request);
    if (!user) {
      return json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (!sectionId) {
      return json({ success: false, error: "Section ID is required" }, { status: 400 });
    }
    const section = await db.collection("sections").findOne({
      _id: new ObjectId(sectionId),
      status: "active"
    });
    if (!section) {
      return json({ success: false, error: "Section not found" }, { status: 404 });
    }
    const studentCount = await db.collection("section_students").countDocuments({
      section_id: new ObjectId(sectionId),
      status: "active"
    });
    if (section.room_id) {
      await db.collection("rooms").updateOne(
        { _id: section.room_id },
        {
          $set: {
            status: "available",
            updated_at: /* @__PURE__ */ new Date()
          },
          $unset: { assigned_to: "" }
        }
      );
    }
    await db.collection("section_students").updateMany(
      {
        section_id: new ObjectId(sectionId),
        status: "active"
      },
      {
        $set: {
          status: "inactive",
          removed_at: /* @__PURE__ */ new Date()
        }
      }
    );
    await db.collection("sections").updateOne(
      { _id: new ObjectId(sectionId) },
      {
        $set: {
          status: "inactive",
          deleted_at: /* @__PURE__ */ new Date()
        }
      }
    );
    try {
      await logActivityWithUser(
        "section_deleted",
        user,
        {
          section_id: new ObjectId(sectionId),
          section_name: section.name,
          grade_level: section.grade_level,
          school_year: section.school_year,
          student_count: studentCount,
          room_freed: section.room_id ? true : false
        },
        clientIP,
        userAgent
      );
    } catch (logError) {
      console.error("Error logging section deletion activity:", logError);
    }
    return json({
      success: true,
      message: `Section ${section.name} has been deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    return json({ success: false, error: "Failed to delete section" }, { status: 500 });
  }
}

export { DELETE, GET, POST, PUT };
//# sourceMappingURL=_server-DMfYXixH.js.map
