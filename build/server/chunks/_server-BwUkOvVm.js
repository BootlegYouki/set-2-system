import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import { g as getUserFromRequest, l as logActivityWithUser } from './auth-helper-VQdrszph.js';
import 'pg';
import 'dotenv';

function getRandomColor() {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
async function GET({ url }) {
  try {
    const searchTerm = url.searchParams.get("search") || "";
    let sqlQuery = `
      SELECT 
        id,
        name,
        code,
        color,
        icon,
        created_at,
        updated_at
      FROM activity_types
    `;
    const params = [];
    let paramIndex = 1;
    if (searchTerm) {
      sqlQuery += ` WHERE (LOWER(name) LIKE $${paramIndex} OR LOWER(code) LIKE $${paramIndex})`;
      params.push(`%${searchTerm.toLowerCase()}%`);
      paramIndex++;
    }
    sqlQuery += " ORDER BY created_at DESC";
    const result = await query(sqlQuery, params);
    const activityTypes = result.rows.map((activity) => ({
      id: activity.id,
      name: activity.name,
      code: activity.code,
      color: activity.color,
      icon: activity.icon,
      createdAt: activity.created_at,
      createdDate: new Date(activity.created_at).toLocaleDateString("en-US"),
      updatedDate: new Date(activity.updated_at).toLocaleDateString("en-US")
    }));
    return json({
      success: true,
      data: activityTypes
    });
  } catch (error) {
    console.error("Error fetching activity types:", error);
    return json({
      success: false,
      message: "Failed to fetch activity types: " + error.message
    }, { status: 500 });
  }
}
async function POST({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { name, code, icon } = data;
    if (!name || !code) {
      return json({
        success: false,
        message: "Name and code are required"
      }, { status: 400 });
    }
    const existingActivity = await query(
      "SELECT id FROM activity_types WHERE code = $1",
      [code]
    );
    if (existingActivity.rows.length > 0) {
      return json({
        success: false,
        message: "Activity type code already exists"
      }, { status: 409 });
    }
    const randomColor = getRandomColor();
    const result = await query(
      `INSERT INTO activity_types (name, code, color, icon) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, code, color, icon, created_at, updated_at`,
      [name, code, randomColor, icon || "event"]
    );
    const newActivity = result.rows[0];
    try {
      const user = await getUserFromRequest(request);
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await logActivityWithUser(
        "activity_type_created",
        user,
        {
          name: newActivity.name,
          code: newActivity.code,
          color: newActivity.color,
          icon: newActivity.icon
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error("Error logging activity type creation activity:", logError);
    }
    const formattedActivity = {
      id: newActivity.id,
      name: newActivity.name,
      code: newActivity.code,
      color: newActivity.color,
      icon: newActivity.icon,
      createdAt: newActivity.created_at,
      createdDate: new Date(newActivity.created_at).toLocaleDateString("en-US"),
      updatedDate: new Date(newActivity.updated_at).toLocaleDateString("en-US")
    };
    return json({
      success: true,
      message: "Activity type created successfully",
      data: formattedActivity
    });
  } catch (error) {
    console.error("Error creating activity type:", error);
    return json({
      success: false,
      message: "Failed to create activity type: " + error.message
    }, { status: 500 });
  }
}
async function PUT({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { id, name, code, icon } = data;
    if (!id || !name || !code) {
      return json({
        success: false,
        message: "ID, name, and code are required"
      }, { status: 400 });
    }
    const existingActivity = await query(
      "SELECT * FROM activity_types WHERE id = $1",
      [id]
    );
    if (existingActivity.rows.length === 0) {
      return json({
        success: false,
        message: "Activity type not found"
      }, { status: 404 });
    }
    if (existingActivity.rows[0].code !== code) {
      const codeExists = await query(
        "SELECT id FROM activity_types WHERE code = $1 AND id != $2",
        [code, id]
      );
      if (codeExists.rows.length > 0) {
        return json({
          success: false,
          message: "Activity type code already exists"
        }, { status: 409 });
      }
    }
    const result = await query(
      `UPDATE activity_types 
       SET name = $1, code = $2, icon = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, code, color, icon, created_at, updated_at`,
      [name, code, icon || "event", id]
    );
    const updatedActivity = result.rows[0];
    try {
      const user = await getUserFromRequest(request);
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await logActivityWithUser(
        "activity_type_updated",
        user,
        {
          id: updatedActivity.id,
          name: updatedActivity.name,
          code: updatedActivity.code,
          previous_name: existingActivity.rows[0].name,
          previous_code: existingActivity.rows[0].code
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error("Error logging activity type update activity:", logError);
    }
    const formattedActivity = {
      id: updatedActivity.id,
      name: updatedActivity.name,
      code: updatedActivity.code,
      color: updatedActivity.color,
      icon: updatedActivity.icon,
      createdAt: updatedActivity.created_at,
      createdDate: new Date(updatedActivity.created_at).toLocaleDateString("en-US"),
      updatedDate: new Date(updatedActivity.updated_at).toLocaleDateString("en-US")
    };
    return json({
      success: true,
      message: "Activity type updated successfully",
      data: formattedActivity
    });
  } catch (error) {
    console.error("Error updating activity type:", error);
    return json({
      success: false,
      message: "Failed to update activity type: " + error.message
    }, { status: 500 });
  }
}
async function DELETE({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) {
      return json({
        success: false,
        message: "Activity type ID is required"
      }, { status: 400 });
    }
    const existingActivity = await query(
      "SELECT * FROM activity_types WHERE id = $1",
      [id]
    );
    if (existingActivity.rows.length === 0) {
      return json({
        success: false,
        message: "Activity type not found"
      }, { status: 404 });
    }
    await query("DELETE FROM activity_types WHERE id = $1", [id]);
    try {
      const user = await getUserFromRequest(request);
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await logActivityWithUser(
        "activity_type_deleted",
        user,
        {
          id: existingActivity.rows[0].id,
          name: existingActivity.rows[0].name,
          code: existingActivity.rows[0].code
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error("Error logging activity type deletion activity:", logError);
    }
    return json({
      success: true,
      message: "Activity type deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting activity type:", error);
    return json({
      success: false,
      message: "Failed to delete activity type: " + error.message
    }, { status: 500 });
  }
}

export { DELETE, GET, POST, PUT };
//# sourceMappingURL=_server-BwUkOvVm.js.map
