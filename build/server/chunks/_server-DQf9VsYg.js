import { j as json } from './index-CccDCyu_.js';
import { a as connectToDatabase } from './db-9uwR-1fD.js';
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
    const existingConfig = await db.collection("grade_configurations").findOne({
      section_id: sectionId,
      subject_id: subjectId,
      grading_period_id: parseInt(gradingPeriodId),
      teacher_id: teacherId
    });
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
        section_id: sectionId,
        subject_id: subjectId,
        grading_period_id: parseInt(gradingPeriodId),
        teacher_id: teacherId,
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
          section_id,
          subject_id,
          grading_period_id: parseInt(grading_period_id),
          teacher_id
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
        const { delete_item_id } = data;
        await db.collection("grade_configurations").updateMany(
          {},
          {
            $pull: {
              "grade_items.writtenWork": { id: delete_item_id },
              "grade_items.performanceTasks": { id: delete_item_id },
              "grade_items.quarterlyAssessment": { id: delete_item_id }
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
async function DELETE({ url }) {
  try {
    const sectionId = url.searchParams.get("section_id");
    const subjectId = url.searchParams.get("subject_id");
    const gradingPeriodId = url.searchParams.get("grading_period_id");
    const teacherId = url.searchParams.get("teacher_id");
    if (!sectionId || !subjectId || !gradingPeriodId || !teacherId) {
      return json({
        error: "Missing required parameters"
      }, { status: 400 });
    }
    const db = await connectToDatabase();
    await db.collection("grade_configurations").deleteOne({
      section_id: sectionId,
      subject_id: subjectId,
      grading_period_id: parseInt(gradingPeriodId),
      teacher_id: teacherId
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
//# sourceMappingURL=_server-DQf9VsYg.js.map
