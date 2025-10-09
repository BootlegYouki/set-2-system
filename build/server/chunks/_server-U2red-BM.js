import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-9uwR-1fD.js';
import { g as getUserFromRequest, l as logActivityWithUser } from './auth-helper-Ct8jEaTQ.js';
import { ObjectId } from 'mongodb';
import 'dotenv';

async function GET({ url }) {
  try {
    const action = url.searchParams.get("action");
    const sectionId = url.searchParams.get("sectionId");
    const schoolYear = url.searchParams.get("schoolYear") || "2024-2025";
    const dayOfWeek = url.searchParams.get("dayOfWeek");
    const scheduleId = url.searchParams.get("scheduleId");
    const db = await connectToDatabase();
    switch (action) {
      case "schedule-details":
        const pipeline = [
          {
            $match: {
              ...sectionId && { section_id: new ObjectId(sectionId) },
              school_year: schoolYear,
              ...dayOfWeek && { day_of_week: dayOfWeek }
            }
          },
          {
            $lookup: {
              from: "sections",
              localField: "section_id",
              foreignField: "_id",
              as: "section"
            }
          },
          {
            $lookup: {
              from: "subjects",
              localField: "subject_id",
              foreignField: "_id",
              as: "subject"
            }
          },
          {
            $lookup: {
              from: "activity_types",
              localField: "activity_type_id",
              foreignField: "_id",
              as: "activity_type"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "teacher_id",
              foreignField: "_id",
              as: "teacher"
            }
          },
          {
            $lookup: {
              from: "rooms",
              localField: "section.room_id",
              foreignField: "_id",
              as: "room"
            }
          },
          {
            $project: {
              id: "$_id",
              section_id: 1,
              section_name: { $arrayElemAt: ["$section.name", 0] },
              grade_level: { $arrayElemAt: ["$section.grade_level", 0] },
              day_of_week: 1,
              start_time: 1,
              end_time: 1,
              schedule_type: 1,
              subject_id: 1,
              subject_name: { $arrayElemAt: ["$subject.name", 0] },
              subject_code: { $arrayElemAt: ["$subject.code", 0] },
              activity_type_id: 1,
              activity_type_name: { $arrayElemAt: ["$activity_type.name", 0] },
              activity_type_icon: { $arrayElemAt: ["$activity_type.icon", 0] },
              teacher_id: 1,
              teacher_name: { $arrayElemAt: ["$teacher.full_name", 0] },
              teacher_account_number: { $arrayElemAt: ["$teacher.account_number", 0] },
              room_name: { $arrayElemAt: ["$room.name", 0] },
              school_year: 1,
              created_at: 1,
              updated_at: 1
            }
          }
        ];
        const scheduleDetails = await db.collection("schedules").aggregate(pipeline).toArray();
        return json({ success: true, data: scheduleDetails });
      case "single-schedule":
        if (!scheduleId) {
          return json({ success: false, error: "Schedule ID is required" }, { status: 400 });
        }
        const singleSchedule = await db.collection("schedules").aggregate([
          { $match: { _id: new ObjectId(scheduleId) } },
          {
            $lookup: {
              from: "sections",
              localField: "section_id",
              foreignField: "_id",
              as: "section"
            }
          },
          {
            $lookup: {
              from: "subjects",
              localField: "subject_id",
              foreignField: "_id",
              as: "subject"
            }
          },
          {
            $lookup: {
              from: "activity_types",
              localField: "activity_type_id",
              foreignField: "_id",
              as: "activity_type"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "teacher_id",
              foreignField: "_id",
              as: "teacher"
            }
          },
          {
            $project: {
              id: "$_id",
              section_id: 1,
              section_name: { $arrayElemAt: ["$section.name", 0] },
              grade_level: { $arrayElemAt: ["$section.grade_level", 0] },
              day_of_week: 1,
              start_time: 1,
              end_time: 1,
              schedule_type: 1,
              subject_id: 1,
              subject_name: { $arrayElemAt: ["$subject.name", 0] },
              subject_code: { $arrayElemAt: ["$subject.code", 0] },
              activity_type_id: 1,
              activity_type_name: { $arrayElemAt: ["$activity_type.name", 0] },
              activity_type_icon: { $arrayElemAt: ["$activity_type.icon", 0] },
              teacher_id: 1,
              teacher_name: { $arrayElemAt: ["$teacher.full_name", 0] },
              teacher_account_number: { $arrayElemAt: ["$teacher.account_number", 0] },
              school_year: 1,
              created_at: 1,
              updated_at: 1
            }
          }
        ]).toArray();
        if (singleSchedule.length === 0) {
          return json({ success: false, error: "Schedule not found" }, { status: 404 });
        }
        return json({ success: true, data: singleSchedule[0] });
      case "section-schedules":
        if (!sectionId) {
          return json({ success: false, error: "Section ID is required" }, { status: 400 });
        }
        const sectionSchedules = await db.collection("schedules").aggregate([
          {
            $match: {
              section_id: new ObjectId(sectionId),
              school_year: schoolYear
            }
          },
          {
            $lookup: {
              from: "sections",
              localField: "section_id",
              foreignField: "_id",
              as: "section"
            }
          },
          {
            $lookup: {
              from: "subjects",
              localField: "subject_id",
              foreignField: "_id",
              as: "subject"
            }
          },
          {
            $lookup: {
              from: "activity_types",
              localField: "activity_type_id",
              foreignField: "_id",
              as: "activity_type"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "teacher_id",
              foreignField: "_id",
              as: "teacher"
            }
          },
          {
            $lookup: {
              from: "rooms",
              localField: "section.room_id",
              foreignField: "_id",
              as: "room"
            }
          },
          {
            $project: {
              id: "$_id",
              section_id: 1,
              section_name: { $arrayElemAt: ["$section.name", 0] },
              grade_level: { $arrayElemAt: ["$section.grade_level", 0] },
              day_of_week: 1,
              start_time: 1,
              end_time: 1,
              schedule_type: 1,
              subject_id: 1,
              subject_name: { $arrayElemAt: ["$subject.name", 0] },
              subject_code: { $arrayElemAt: ["$subject.code", 0] },
              activity_type_id: 1,
              activity_type_name: { $arrayElemAt: ["$activity_type.name", 0] },
              activity_type_icon: { $arrayElemAt: ["$activity_type.icon", 0] },
              teacher_id: 1,
              teacher_name: { $arrayElemAt: ["$teacher.full_name", 0] },
              teacher_account_number: { $arrayElemAt: ["$teacher.account_number", 0] },
              room_name: { $arrayElemAt: ["$room.name", 0] },
              school_year: 1,
              created_at: 1,
              updated_at: 1
            }
          }
        ]).toArray();
        return json({ success: true, data: sectionSchedules });
      case "teacher-schedules":
        const teacherId = url.searchParams.get("teacherId");
        if (!teacherId) {
          return json({ success: false, error: "Teacher ID is required" }, { status: 400 });
        }
        const teacherSchedules = await db.collection("schedules").aggregate([
          {
            $match: {
              teacher_id: new ObjectId(teacherId),
              school_year: schoolYear
            }
          },
          {
            $lookup: {
              from: "sections",
              localField: "section_id",
              foreignField: "_id",
              as: "section"
            }
          },
          {
            $lookup: {
              from: "subjects",
              localField: "subject_id",
              foreignField: "_id",
              as: "subject"
            }
          },
          {
            $lookup: {
              from: "activity_types",
              localField: "activity_type_id",
              foreignField: "_id",
              as: "activity_type"
            }
          },
          {
            $lookup: {
              from: "rooms",
              localField: "section.room_id",
              foreignField: "_id",
              as: "room"
            }
          },
          {
            $project: {
              id: "$_id",
              section_id: 1,
              section_name: { $arrayElemAt: ["$section.name", 0] },
              grade_level: { $arrayElemAt: ["$section.grade_level", 0] },
              day_of_week: 1,
              start_time: 1,
              end_time: 1,
              schedule_type: 1,
              subject_id: 1,
              subject_name: { $arrayElemAt: ["$subject.name", 0] },
              subject_code: { $arrayElemAt: ["$subject.code", 0] },
              activity_type_id: 1,
              activity_type_name: { $arrayElemAt: ["$activity_type.name", 0] },
              room_name: { $arrayElemAt: ["$room.name", 0] },
              school_year: 1
            }
          },
          {
            $sort: {
              day_of_week: 1,
              start_time: 1
            }
          }
        ]).toArray();
        return json({ success: true, data: teacherSchedules });
      case "student-schedules":
        const studentId = url.searchParams.get("studentId");
        if (!studentId) {
          return json({ success: false, error: "Student ID is required" }, { status: 400 });
        }
        const studentSchedules = await db.collection("schedules").aggregate([
          {
            $lookup: {
              from: "section_students",
              localField: "section_id",
              foreignField: "section_id",
              as: "section_student"
            }
          },
          {
            $match: {
              "section_student.student_id": new ObjectId(studentId),
              "section_student.status": "active",
              school_year: schoolYear
            }
          },
          {
            $lookup: {
              from: "sections",
              localField: "section_id",
              foreignField: "_id",
              as: "section"
            }
          },
          {
            $lookup: {
              from: "subjects",
              localField: "subject_id",
              foreignField: "_id",
              as: "subject"
            }
          },
          {
            $lookup: {
              from: "activity_types",
              localField: "activity_type_id",
              foreignField: "_id",
              as: "activity_type"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "teacher_id",
              foreignField: "_id",
              as: "teacher"
            }
          },
          {
            $lookup: {
              from: "rooms",
              localField: "section.room_id",
              foreignField: "_id",
              as: "room"
            }
          },
          {
            $project: {
              id: "$_id",
              section_id: 1,
              section_name: { $arrayElemAt: ["$section.name", 0] },
              grade_level: { $arrayElemAt: ["$section.grade_level", 0] },
              day_of_week: 1,
              start_time: 1,
              end_time: 1,
              schedule_type: 1,
              subject_id: 1,
              subject_name: { $arrayElemAt: ["$subject.name", 0] },
              subject_code: { $arrayElemAt: ["$subject.code", 0] },
              activity_type_id: 1,
              activity_type_name: { $arrayElemAt: ["$activity_type.name", 0] },
              activity_type_icon: { $arrayElemAt: ["$activity_type.icon", 0] },
              teacher_id: 1,
              teacher_name: { $arrayElemAt: ["$teacher.full_name", 0] },
              room_name: { $arrayElemAt: ["$room.name", 0] },
              school_year: 1
            }
          },
          {
            $addFields: {
              day_order: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$day_of_week", "monday"] }, then: 1 },
                    { case: { $eq: ["$day_of_week", "tuesday"] }, then: 2 },
                    { case: { $eq: ["$day_of_week", "wednesday"] }, then: 3 },
                    { case: { $eq: ["$day_of_week", "thursday"] }, then: 4 },
                    { case: { $eq: ["$day_of_week", "friday"] }, then: 5 },
                    { case: { $eq: ["$day_of_week", "saturday"] }, then: 6 },
                    { case: { $eq: ["$day_of_week", "sunday"] }, then: 7 }
                  ],
                  default: 8
                }
              }
            }
          },
          {
            $sort: {
              day_order: 1,
              start_time: 1
            }
          }
        ]).toArray();
        return json({ success: true, data: studentSchedules });
      default:
        const allSchedules = await db.collection("schedules").aggregate([
          {
            $match: {
              ...sectionId && { section_id: new ObjectId(sectionId) },
              school_year: schoolYear,
              ...dayOfWeek && { day_of_week: dayOfWeek }
            }
          },
          {
            $lookup: {
              from: "sections",
              localField: "section_id",
              foreignField: "_id",
              as: "section"
            }
          },
          {
            $lookup: {
              from: "subjects",
              localField: "subject_id",
              foreignField: "_id",
              as: "subject"
            }
          },
          {
            $lookup: {
              from: "activity_types",
              localField: "activity_type_id",
              foreignField: "_id",
              as: "activity_type"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "teacher_id",
              foreignField: "_id",
              as: "teacher"
            }
          },
          {
            $lookup: {
              from: "rooms",
              localField: "section.room_id",
              foreignField: "_id",
              as: "room"
            }
          },
          {
            $project: {
              id: "$_id",
              section_id: 1,
              section_name: { $arrayElemAt: ["$section.name", 0] },
              grade_level: { $arrayElemAt: ["$section.grade_level", 0] },
              day_of_week: 1,
              start_time: 1,
              end_time: 1,
              schedule_type: 1,
              subject_id: 1,
              subject_name: { $arrayElemAt: ["$subject.name", 0] },
              subject_code: { $arrayElemAt: ["$subject.code", 0] },
              activity_type_id: 1,
              activity_type_name: { $arrayElemAt: ["$activity_type.name", 0] },
              activity_type_icon: { $arrayElemAt: ["$activity_type.icon", 0] },
              teacher_id: 1,
              teacher_name: { $arrayElemAt: ["$teacher.full_name", 0] },
              teacher_account_number: { $arrayElemAt: ["$teacher.account_number", 0] },
              room_name: { $arrayElemAt: ["$room.name", 0] },
              school_year: 1,
              created_at: 1,
              updated_at: 1
            }
          }
        ]).toArray();
        return json({ success: true, data: allSchedules });
    }
  } catch (error) {
    console.error("Error fetching schedules data:", error);
    return json({ success: false, error: "Failed to fetch schedules data" }, { status: 500 });
  }
}
async function POST({ request, getClientAddress }) {
  try {
    const data = await request.json();
    console.log("Received schedule data:", data);
    const {
      sectionId,
      dayOfWeek,
      startTime,
      endTime,
      scheduleType,
      subjectId,
      activityTypeId,
      teacherId,
      schoolYear
    } = data;
    console.log("Received schedule data:", {
      sectionId,
      dayOfWeek,
      startTime,
      endTime,
      scheduleType,
      subjectId,
      activityTypeId,
      teacherId,
      schoolYear
    });
    const clientIP = getClientAddress();
    const userAgent = request.headers.get("user-agent");
    if (!sectionId || !dayOfWeek || !startTime || !endTime || !scheduleType || !schoolYear) {
      return json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (scheduleType === "subject" && !subjectId) {
      return json({ success: false, error: "Subject ID is required for subject schedules" }, { status: 400 });
    }
    if (scheduleType === "activity" && !activityTypeId) {
      return json({ success: false, error: "Activity Type ID is required for activity schedules" }, { status: 400 });
    }
    const db = await connectToDatabase();
    const conflictQuery = {
      section_id: new ObjectId(sectionId),
      day_of_week: dayOfWeek,
      school_year: schoolYear,
      $or: [
        {
          $and: [
            { start_time: { $lte: startTime } },
            { end_time: { $gt: startTime } }
          ]
        },
        {
          $and: [
            { start_time: { $lt: endTime } },
            { end_time: { $gte: endTime } }
          ]
        },
        {
          $and: [
            { start_time: { $gte: startTime } },
            { end_time: { $lte: endTime } }
          ]
        }
      ]
    };
    const conflictingSchedule = await db.collection("schedules").findOne(conflictQuery);
    if (conflictingSchedule) {
      return json({
        success: false,
        error: "Time conflict detected with existing schedule in this section",
        conflictingSchedule: {
          id: conflictingSchedule._id,
          start_time: conflictingSchedule.start_time,
          end_time: conflictingSchedule.end_time
        }
      }, { status: 409 });
    }
    if (teacherId) {
      const teacherConflictQuery = {
        teacher_id: new ObjectId(teacherId),
        day_of_week: dayOfWeek,
        school_year: schoolYear,
        section_id: { $ne: new ObjectId(sectionId) },
        $or: [
          {
            $and: [
              { start_time: { $lte: startTime } },
              { end_time: { $gt: startTime } }
            ]
          },
          {
            $and: [
              { start_time: { $lt: endTime } },
              { end_time: { $gte: endTime } }
            ]
          },
          {
            $and: [
              { start_time: { $gte: startTime } },
              { end_time: { $lte: endTime } }
            ]
          }
        ]
      };
      const teacherConflict = await db.collection("schedules").aggregate([
        { $match: teacherConflictQuery },
        {
          $lookup: {
            from: "sections",
            localField: "section_id",
            foreignField: "_id",
            as: "section"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "teacher_id",
            foreignField: "_id",
            as: "teacher"
          }
        },
        {
          $project: {
            id: "$_id",
            start_time: 1,
            end_time: 1,
            section_id: 1,
            section_name: { $arrayElemAt: ["$section.name", 0] },
            grade_level: { $arrayElemAt: ["$section.grade_level", 0] },
            teacher_name: { $arrayElemAt: ["$teacher.full_name", 0] }
          }
        }
      ]).toArray();
      if (teacherConflict.length > 0) {
        const conflict = teacherConflict[0];
        return json({
          success: false,
          error: `Teacher conflict detected: ${conflict.teacher_name} is already scheduled to teach ${conflict.section_name} (Grade ${conflict.grade_level}) from ${conflict.start_time} to ${conflict.end_time} on ${dayOfWeek}`,
          conflictType: "teacher_conflict",
          conflictingSchedule: conflict
        }, { status: 409 });
      }
    }
    try {
      const scheduleDoc = {
        section_id: new ObjectId(sectionId),
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        schedule_type: scheduleType,
        subject_id: subjectId ? new ObjectId(subjectId) : null,
        activity_type_id: activityTypeId ? new ObjectId(activityTypeId) : null,
        teacher_id: teacherId ? new ObjectId(teacherId) : null,
        school_year: schoolYear,
        created_at: /* @__PURE__ */ new Date(),
        updated_at: /* @__PURE__ */ new Date()
      };
      console.log("About to insert schedule document:", scheduleDoc);
      const result = await db.collection("schedules").insertOne(scheduleDoc);
      const newSchedule = {
        id: result.insertedId,
        section_id: scheduleDoc.section_id,
        day_of_week: scheduleDoc.day_of_week,
        start_time: scheduleDoc.start_time,
        end_time: scheduleDoc.end_time,
        schedule_type: scheduleDoc.schedule_type,
        subject_id: scheduleDoc.subject_id,
        activity_type_id: scheduleDoc.activity_type_id,
        teacher_id: scheduleDoc.teacher_id,
        school_year: scheduleDoc.school_year,
        created_at: scheduleDoc.created_at
      };
      try {
        const user = getUserFromRequest(request);
        if (user && user.account_number) {
          await logActivityWithUser(
            "schedule_created",
            user,
            {
              schedule_id: result.insertedId.toString(),
              section_id: scheduleDoc.section_id.toString(),
              day_of_week: scheduleDoc.day_of_week,
              start_time: scheduleDoc.start_time,
              end_time: scheduleDoc.end_time,
              schedule_type: scheduleDoc.schedule_type,
              school_year: scheduleDoc.school_year
            },
            clientIP,
            userAgent
          );
        }
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }
      return json({
        success: true,
        message: "Schedule created successfully",
        data: newSchedule
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error creating schedule:", error);
    console.error("Error stack:", error.stack);
    return json({ success: false, error: "Failed to create schedule", details: error.message }, { status: 500 });
  }
}
async function DELETE({ url, request, getClientAddress }) {
  try {
    const scheduleId = url.searchParams.get("id");
    const clientIP = getClientAddress();
    const userAgent = request.headers.get("user-agent");
    if (!scheduleId) {
      return json({ success: false, error: "Schedule ID is required" }, { status: 400 });
    }
    const db = await connectToDatabase();
    const existingSchedule = await db.collection("schedules").findOne({ _id: new ObjectId(scheduleId) });
    if (!existingSchedule) {
      return json({ success: false, error: "Schedule not found" }, { status: 404 });
    }
    try {
      await db.collection("schedules").deleteOne({ _id: new ObjectId(scheduleId) });
      try {
        const user = getUserFromRequest(request);
        if (user && user.account_number) {
          await logActivityWithUser(
            "schedule_deleted",
            user,
            {
              schedule_id: scheduleId,
              section_id: existingSchedule.section_id.toString(),
              day_of_week: existingSchedule.day_of_week,
              start_time: existingSchedule.start_time,
              end_time: existingSchedule.end_time,
              schedule_type: existingSchedule.schedule_type
            },
            clientIP,
            userAgent
          );
        }
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }
      return json({
        success: true,
        message: "Schedule deleted successfully"
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return json({ success: false, error: "Failed to delete schedule" }, { status: 500 });
  }
}

export { DELETE, GET, POST };
//# sourceMappingURL=_server-U2red-BM.js.map
