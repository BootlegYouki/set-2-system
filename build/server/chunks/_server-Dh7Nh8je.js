import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-C-gxO138.js';
import { ObjectId } from 'mongodb';
import 'dotenv';

async function GET({ url, request }) {
  try {
    const sectionId = url.searchParams.get("section_id");
    const subjectId = url.searchParams.get("subject_id");
    const gradingPeriodId = url.searchParams.get("grading_period_id");
    const teacherId = url.searchParams.get("teacher_id");
    if (!sectionId || !subjectId || !gradingPeriodId) {
      return json({
        error: "Missing required parameters: section_id, subject_id, grading_period_id"
      }, { status: 400 });
    }
    const db = await connectToDatabase();
    console.log("Grade items API - Query parameters:", {
      section_id: sectionId,
      subject_id: subjectId,
      grading_period_id: gradingPeriodId,
      teacher_id: teacherId
    });
    const existingConfig = await db.collection("grade_configurations").findOne({
      section_id: new ObjectId(sectionId),
      subject_id: new ObjectId(subjectId),
      grading_period_id: parseInt(gradingPeriodId),
      teacher_id: new ObjectId(teacherId)
    });
    console.log("Existing config found:", existingConfig ? "YES" : "NO");
    if (existingConfig) {
      console.log("Config data:", existingConfig.grade_items);
    }
    let gradeItemsByCategory;
    if (existingConfig) {
      gradeItemsByCategory = existingConfig.grade_items;
    } else {
      gradeItemsByCategory = {
        writtenWork: [],
        performanceTasks: [],
        quarterlyAssessment: []
      };
      await db.collection("grade_configurations").insertOne({
        section_id: new ObjectId(sectionId),
        subject_id: new ObjectId(subjectId),
        grading_period_id: parseInt(gradingPeriodId),
        teacher_id: new ObjectId(teacherId),
        grade_items: gradeItemsByCategory,
        created_at: /* @__PURE__ */ new Date(),
        updated_at: /* @__PURE__ */ new Date(),
        status: "active"
      });
    }
    return json({
      success: true,
      data: gradeItemsByCategory
    });
  } catch (error) {
    console.error("Error in grades/grade-items GET:", error);
    return json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
async function POST({ request }) {
  try {
    const { action, ...data } = await request.json();
    const db = await connectToDatabase();
    switch (action) {
      case "create_grade_item":
        const { section_id, subject_id, grading_period_id, teacher_id, category, name, total_score } = data;
        const config = await db.collection("grade_configurations").findOne({
          section_id: new ObjectId(section_id),
          subject_id: new ObjectId(subject_id),
          grading_period_id: parseInt(grading_period_id),
          teacher_id: new ObjectId(teacher_id)
        });
        if (config) {
          const newItem = {
            id: new ObjectId().toString(),
            name,
            totalScore: total_score
          };
          const updatePath = `grade_items.${category}`;
          await db.collection("grade_configurations").updateOne(
            { _id: config._id },
            {
              $push: { [updatePath]: newItem },
              $set: { updated_at: /* @__PURE__ */ new Date() }
            }
          );
          return json({ success: true, data: newItem });
        } else {
          return json({
            success: false,
            error: "Grade configuration not found"
          }, { status: 404 });
        }
      case "update_grade_item":
        const { item_id, new_name, new_total_score } = data;
        const updateResult = await db.collection("grade_configurations").updateOne(
          {
            $or: [
              { "grade_items.writtenWork.id": item_id },
              { "grade_items.performanceTasks.id": item_id },
              { "grade_items.quarterlyAssessment.id": item_id }
            ]
          },
          {
            $set: {
              "grade_items.writtenWork.$[elem].name": new_name,
              "grade_items.writtenWork.$[elem].totalScore": new_total_score,
              "grade_items.performanceTasks.$[elem].name": new_name,
              "grade_items.performanceTasks.$[elem].totalScore": new_total_score,
              "grade_items.quarterlyAssessment.$[elem].name": new_name,
              "grade_items.quarterlyAssessment.$[elem].totalScore": new_total_score,
              updated_at: /* @__PURE__ */ new Date()
            }
          },
          {
            arrayFilters: [{ "elem.id": item_id }]
          }
        );
        return json({ success: true });
      case "delete_grade_item":
      case "remove":
        const gradeItemId = data.delete_item_id || data.grade_item_id;
        if (!gradeItemId) {
          return json({ success: false, error: "Missing grade item id" }, { status: 400 });
        }
        await db.collection("grade_configurations").updateMany(
          {},
          {
            $pull: {
              "grade_items.writtenWork": { id: gradeItemId },
              "grade_items.performanceTasks": { id: gradeItemId },
              "grade_items.quarterlyAssessment": { id: gradeItemId }
            },
            $set: { updated_at: /* @__PURE__ */ new Date() }
          }
        );
        return json({ success: true });
      default:
        return json({
          success: false,
          error: "Invalid action"
        }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in grades/grade-items POST:", error);
    return json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
async function PUT({ request }) {
  try {
    const data = await request.json();
    const db = await connectToDatabase();
    if (data.grade_item_id && (data.name !== void 0 || data.total_score !== void 0)) {
      const { grade_item_id, name, total_score } = data;
      const updateFields = {};
      if (name !== void 0) {
        updateFields["grade_items.writtenWork.$[elem].name"] = name;
        updateFields["grade_items.performanceTasks.$[elem].name"] = name;
        updateFields["grade_items.quarterlyAssessment.$[elem].name"] = name;
      }
      if (total_score !== void 0) {
        updateFields["grade_items.writtenWork.$[elem].totalScore"] = total_score;
        updateFields["grade_items.performanceTasks.$[elem].totalScore"] = total_score;
        updateFields["grade_items.quarterlyAssessment.$[elem].totalScore"] = total_score;
      }
      updateFields["updated_at"] = /* @__PURE__ */ new Date();
      const result2 = await db.collection("grade_configurations").updateOne(
        {
          $or: [
            { "grade_items.writtenWork.id": grade_item_id },
            { "grade_items.performanceTasks.id": grade_item_id },
            { "grade_items.quarterlyAssessment.id": grade_item_id }
          ]
        },
        {
          $set: updateFields
        },
        {
          arrayFilters: [{ "elem.id": grade_item_id }]
        }
      );
      if (result2.matchedCount === 0) {
        return json({
          success: false,
          error: "Grade item not found"
        }, { status: 404 });
      }
      return json({ success: true });
    }
    const { section_id, subject_id, grading_period_id, teacher_id, grade_items } = data;
    const result = await db.collection("grade_configurations").updateOne(
      {
        section_id,
        subject_id,
        grading_period_id: parseInt(grading_period_id),
        teacher_id
      },
      {
        $set: {
          grade_items,
          updated_at: /* @__PURE__ */ new Date()
        },
        $setOnInsert: {
          created_at: /* @__PURE__ */ new Date(),
          status: "active"
        }
      },
      { upsert: true }
    );
    return json({ success: true });
  } catch (error) {
    console.error("Error in grades/grade-items PUT:", error);
    return json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
async function DELETE({ url, request }) {
  try {
    const db = await connectToDatabase();
    let body = {};
    try {
      body = await request.json();
    } catch (err) {
      body = {};
    }
    if (body && body.grade_item_id) {
      const gradeItemId = body.grade_item_id;
      await db.collection("grade_configurations").updateMany(
        {},
        {
          $pull: {
            "grade_items.writtenWork": { id: gradeItemId },
            "grade_items.performanceTasks": { id: gradeItemId },
            "grade_items.quarterlyAssessment": { id: gradeItemId }
          },
          $set: { updated_at: /* @__PURE__ */ new Date() }
        }
      );
      return json({ success: true, message: "Grade item deleted successfully" });
    }
    const sectionId = url.searchParams.get("section_id");
    const subjectId = url.searchParams.get("subject_id");
    const gradingPeriodId = url.searchParams.get("grading_period_id");
    const teacherId = url.searchParams.get("teacher_id");
    if (!sectionId || !subjectId || !gradingPeriodId || !teacherId) {
      return json({
        error: "Missing required parameters"
      }, { status: 400 });
    }
    await db.collection("grade_configurations").deleteOne({
      section_id: new ObjectId(sectionId),
      subject_id: new ObjectId(subjectId),
      grading_period_id: parseInt(gradingPeriodId),
      teacher_id: new ObjectId(teacherId)
    });
    return json({ success: true });
  } catch (error) {
    console.error("Error in grades/grade-items DELETE:", error);
    return json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}

export { DELETE, GET, POST, PUT };
//# sourceMappingURL=_server-Dh7Nh8je.js.map
