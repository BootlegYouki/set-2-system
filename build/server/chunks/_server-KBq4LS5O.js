import { j as json } from './index-CccDCyu_.js';
import { q as query } from './db--iX-5Jmg.js';
import { g as getUserFromRequest, l as logActivityWithUser } from './auth-helper-VQdrszph.js';
import 'pg';
import 'dotenv';

async function GET({ url }) {
  try {
    const searchTerm = url.searchParams.get("search") || "";
    const building = url.searchParams.get("building");
    const status = url.searchParams.get("status");
    let sqlQuery = `
      SELECT 
        r.id,
        r.name,
        r.building,
        r.floor,
        r.status,
        r.assigned_to,
        r.created_at,
        r.updated_at,
        s.id as section_id,
        s.name as section_name,
        s.grade_level,
        s.school_year
      FROM rooms r
      LEFT JOIN sections s ON r.id = s.room_id AND s.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;
    let whereAdded = false;
    if (searchTerm) {
      sqlQuery += ` WHERE (LOWER(r.name) LIKE $${paramIndex} OR LOWER(r.building) LIKE $${paramIndex} OR LOWER(r.floor) LIKE $${paramIndex})`;
      params.push(`%${searchTerm.toLowerCase()}%`);
      paramIndex++;
      whereAdded = true;
    }
    if (building && building !== "") {
      sqlQuery += whereAdded ? ` AND LOWER(r.building) = $${paramIndex}` : ` WHERE LOWER(r.building) = $${paramIndex}`;
      params.push(building.toLowerCase());
      paramIndex++;
      whereAdded = true;
    }
    if (status && status !== "") {
      sqlQuery += whereAdded ? ` AND r.status = $${paramIndex}` : ` WHERE r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    sqlQuery += " ORDER BY r.created_at DESC";
    const result = await query(sqlQuery, params);
    const roomsMap = /* @__PURE__ */ new Map();
    result.rows.forEach((row) => {
      const roomId = row.id;
      if (!roomsMap.has(roomId)) {
        roomsMap.set(roomId, {
          id: row.id,
          name: row.name,
          building: row.building,
          floor: row.floor,
          status: row.status,
          assignedTo: row.assigned_to,
          createdDate: new Date(row.created_at).toLocaleDateString("en-US"),
          updatedDate: new Date(row.updated_at).toLocaleDateString("en-US"),
          assignedSections: []
        });
      }
      if (row.section_id) {
        roomsMap.get(roomId).assignedSections.push({
          id: row.section_id,
          name: row.section_name,
          gradeLevel: row.grade_level,
          schoolYear: row.school_year
        });
      }
    });
    const rooms = Array.from(roomsMap.values());
    return json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return json({
      success: false,
      message: "Failed to fetch rooms: " + error.message
    }, { status: 500 });
  }
}
async function POST({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { name, building, floor } = data;
    if (!name || !building || !floor) {
      return json({
        success: false,
        message: "Name, building, and floor are required"
      }, { status: 400 });
    }
    const existingRoom = await query(
      "SELECT id FROM rooms WHERE LOWER(name) = $1 AND LOWER(building) = $2 AND LOWER(floor) = $3",
      [name.toLowerCase(), building.toLowerCase(), floor.toLowerCase()]
    );
    if (existingRoom.rows.length > 0) {
      return json({
        success: false,
        message: "A room with this name already exists in the same building and floor"
      }, { status: 409 });
    }
    const result = await query(
      `INSERT INTO rooms (name, building, floor) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, building, floor, status, assigned_to, created_at, updated_at`,
      [name, building, floor]
    );
    const newRoom = result.rows[0];
    try {
      const user = await getUserFromRequest(request);
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await logActivityWithUser(
        "room_created",
        user,
        {
          room_name: newRoom.name,
          building: newRoom.building,
          floor: newRoom.floor
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error("Error logging room creation activity:", logError);
    }
    const formattedRoom = {
      id: newRoom.id,
      name: newRoom.name,
      building: newRoom.building,
      floor: newRoom.floor,
      status: newRoom.status,
      assignedTo: newRoom.assigned_to,
      createdDate: new Date(newRoom.created_at).toLocaleDateString("en-US"),
      updatedDate: new Date(newRoom.updated_at).toLocaleDateString("en-US"),
      assignedSections: []
    };
    return json({
      success: true,
      message: `Room "${name}" created successfully`,
      data: formattedRoom
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return json({
      success: false,
      message: "Failed to create room: " + error.message
    }, { status: 500 });
  }
}
async function PATCH({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { roomId, sectionIds, action } = data;
    if (!roomId || !action) {
      return json({
        success: false,
        message: "Room ID and action are required"
      }, { status: 400 });
    }
    if (action === "assign" && (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0)) {
      return json({
        success: false,
        message: "Section IDs are required for assignment"
      }, { status: 400 });
    }
    const roomCheck = await query("SELECT id, name FROM rooms WHERE id = $1", [roomId]);
    if (roomCheck.rows.length === 0) {
      return json({
        success: false,
        message: "Room not found"
      }, { status: 404 });
    }
    const room = roomCheck.rows[0];
    if (action === "assign") {
      const sectionCheck = await query(
        "SELECT id, name, room_id FROM sections WHERE id = ANY($1) AND status = $2",
        [sectionIds, "active"]
      );
      if (sectionCheck.rows.length !== sectionIds.length) {
        return json({
          success: false,
          message: "One or more sections not found or inactive"
        }, { status: 404 });
      }
      const conflictingSections = sectionCheck.rows.filter(
        (section) => section.room_id && section.room_id !== roomId
      );
      if (conflictingSections.length > 0) {
        return json({
          success: false,
          message: `Some sections are already assigned to other rooms: ${conflictingSections.map((s) => s.name).join(", ")}`
        }, { status: 409 });
      }
      await query(
        "UPDATE sections SET room_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)",
        [roomId, sectionIds]
      );
      await query(
        "UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        ["assigned", roomId]
      );
      try {
        const user = await getUserFromRequest(request);
        const ip_address = getClientAddress();
        const user_agent = request.headers.get("user-agent");
        await logActivityWithUser(
          "room_sections_assigned",
          user,
          {
            room_id: roomId,
            room_name: room.name,
            section_ids: sectionIds,
            section_names: sectionCheck.rows.map((s) => s.name)
          },
          ip_address,
          user_agent
        );
      } catch (logError) {
        console.error("Error logging room assignment activity:", logError);
      }
      return json({
        success: true,
        message: `Sections assigned to room "${room.name}" successfully`
      });
    } else if (action === "unassign") {
      const unassignResult = await query(
        "UPDATE sections SET room_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE room_id = $1 RETURNING id, name",
        [roomId]
      );
      await query(
        "UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        ["available", roomId]
      );
      try {
        const user = await getUserFromRequest(request);
        const ip_address = getClientAddress();
        const user_agent = request.headers.get("user-agent");
        await logActivityWithUser(
          "room_sections_unassigned",
          user,
          {
            room_id: roomId,
            room_name: room.name,
            unassigned_sections: unassignResult.rows.map((s) => ({ id: s.id, name: s.name }))
          },
          ip_address,
          user_agent
        );
      } catch (logError) {
        console.error("Error logging room unassignment activity:", logError);
      }
      return json({
        success: true,
        message: `All sections unassigned from room "${room.name}" successfully`
      });
    } else {
      return json({
        success: false,
        message: 'Invalid action. Use "assign" or "unassign"'
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error managing room-section assignment:", error);
    return json({
      success: false,
      message: "Failed to manage room-section assignment: " + error.message
    }, { status: 500 });
  }
}
async function PUT({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { id, name, building, floor, status, assignedTo } = data;
    if (!id || !name || !building || !floor) {
      return json({
        success: false,
        message: "ID, name, building, and floor are required"
      }, { status: 400 });
    }
    const existingRoom = await query(
      "SELECT id, name FROM rooms WHERE id = $1",
      [id]
    );
    if (existingRoom.rows.length === 0) {
      return json({
        success: false,
        message: "Room not found"
      }, { status: 404 });
    }
    const nameConflict = await query(
      "SELECT id FROM rooms WHERE LOWER(name) = $1 AND LOWER(building) = $2 AND LOWER(floor) = $3 AND id != $4",
      [name.toLowerCase(), building.toLowerCase(), floor.toLowerCase(), id]
    );
    if (nameConflict.rows.length > 0) {
      return json({
        success: false,
        message: "A room with this name already exists in the same building and floor"
      }, { status: 409 });
    }
    const result = await query(
      `UPDATE rooms 
       SET name = $1, building = $2, floor = $3, status = $4, assigned_to = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, building, floor, status, assigned_to, created_at, updated_at`,
      [name, building, floor, status || "available", assignedTo || null, id]
    );
    const updatedRoom = result.rows[0];
    try {
      const user = await getUserFromRequest(request);
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await logActivityWithUser(
        "room_updated",
        user,
        {
          room_id: id,
          name: updatedRoom.name,
          building: updatedRoom.building,
          floor: updatedRoom.floor,
          status: updatedRoom.status,
          assigned_to: updatedRoom.assigned_to
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error("Error logging room update activity:", logError);
    }
    const formattedRoom = {
      id: updatedRoom.id,
      name: updatedRoom.name,
      building: updatedRoom.building,
      floor: updatedRoom.floor,
      status: updatedRoom.status,
      assignedTo: updatedRoom.assigned_to,
      createdDate: new Date(updatedRoom.created_at).toLocaleDateString("en-US"),
      updatedDate: new Date(updatedRoom.updated_at).toLocaleDateString("en-US")
    };
    return json({
      success: true,
      message: `Room "${name}" updated successfully`,
      data: formattedRoom
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return json({
      success: false,
      message: "Failed to update room: " + error.message
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
        message: "Room ID is required"
      }, { status: 400 });
    }
    const existingRoom = await query(
      "SELECT id, name, building, floor FROM rooms WHERE id = $1",
      [id]
    );
    if (existingRoom.rows.length === 0) {
      return json({
        success: false,
        message: "Room not found"
      }, { status: 404 });
    }
    await query(
      "DELETE FROM rooms WHERE id = $1",
      [id]
    );
    try {
      const user = await getUserFromRequest(request);
      const ip_address = getClientAddress();
      const user_agent = request.headers.get("user-agent");
      await logActivityWithUser(
        "room_deleted",
        user,
        {
          room_name: existingRoom.rows[0].name,
          building: existingRoom.rows[0].building,
          floor: existingRoom.rows[0].floor,
          room_id: id
        },
        ip_address,
        user_agent
      );
    } catch (logError) {
      console.error("Error logging room deletion activity:", logError);
    }
    return json({
      success: true,
      message: `Room "${existingRoom.rows[0].name}" has been removed successfully`
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return json({
      success: false,
      message: "Failed to delete room: " + error.message
    }, { status: 500 });
  }
}

export { DELETE, GET, PATCH, POST, PUT };
//# sourceMappingURL=_server-KBq4LS5O.js.map
