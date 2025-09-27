import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';

// GET /api/rooms - Fetch all rooms with optional filtering
export async function GET({ url }) {
  try {
    const searchTerm = url.searchParams.get('search') || '';
    const building = url.searchParams.get('building');
    const status = url.searchParams.get('status');
    
    let sqlQuery = `
      SELECT 
        id,
        name,
        building,
        floor,
        status,
        assigned_to,
        created_at,
        updated_at
      FROM rooms
    `;
    
    const params = [];
    let paramIndex = 1;
    let whereAdded = false;
    
    // Add search filter
    if (searchTerm) {
      sqlQuery += ` WHERE (LOWER(name) LIKE $${paramIndex} OR LOWER(building) LIKE $${paramIndex} OR LOWER(floor) LIKE $${paramIndex})`;
      params.push(`%${searchTerm.toLowerCase()}%`);
      paramIndex++;
      whereAdded = true;
    }
    
    // Add building filter
    if (building && building !== '') {
      sqlQuery += whereAdded ? ` AND LOWER(building) = $${paramIndex}` : ` WHERE LOWER(building) = $${paramIndex}`;
      params.push(building.toLowerCase());
      paramIndex++;
      whereAdded = true;
    }
    
    // Add status filter
    if (status && status !== '') {
      sqlQuery += whereAdded ? ` AND status = $${paramIndex}` : ` WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sqlQuery += ' ORDER BY created_at DESC';
    
    const result = await query(sqlQuery, params);
    
    // Format the data to match the component's expected structure
    const rooms = result.rows.map(room => ({
      id: room.id,
      name: room.name,
      building: room.building,
      floor: room.floor,
      status: room.status,
      assignedTo: room.assigned_to,
      createdDate: new Date(room.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(room.updated_at).toLocaleDateString('en-US')
    }));
    
    return json({
      success: true,
      data: rooms
    });
    
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return json({
      success: false,
      message: 'Failed to fetch rooms: ' + error.message
    }, { status: 500 });
  }
}

// POST /api/rooms - Create a new room
export async function POST({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { name, building, floor } = data;
    
    // Validation
    if (!name || !building || !floor) {
      return json({
        success: false,
        message: 'Name, building, and floor are required'
      }, { status: 400 });
    }
    
    // Check if room with same name in same building and floor already exists
    const existingRoom = await query(
      'SELECT id FROM rooms WHERE LOWER(name) = $1 AND LOWER(building) = $2 AND LOWER(floor) = $3',
      [name.toLowerCase(), building.toLowerCase(), floor.toLowerCase()]
    );
    
    if (existingRoom.rows.length > 0) {
      return json({
        success: false,
        message: 'A room with this name already exists in the same building and floor'
      }, { status: 409 });
    }
    
    // Insert new room
    const result = await query(
      `INSERT INTO rooms (name, building, floor) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, building, floor, status, assigned_to, created_at, updated_at`,
      [name, building, floor]
    );
    
    const newRoom = result.rows[0];
    
    // Log the room creation activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'room_created',
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
      console.error('Error logging room creation activity:', logError);
      // Don't fail the room creation if logging fails
    }
    
    // Format response to match component structure
    const formattedRoom = {
      id: newRoom.id,
      name: newRoom.name,
      building: newRoom.building,
      floor: newRoom.floor,
      status: newRoom.status,
      assignedTo: newRoom.assigned_to,
      createdDate: new Date(newRoom.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(newRoom.updated_at).toLocaleDateString('en-US')
    };
    
    return json({
      success: true,
      message: `Room "${name}" created successfully`,
      data: formattedRoom
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating room:', error);
    return json({
      success: false,
      message: 'Failed to create room: ' + error.message
    }, { status: 500 });
  }
}

// PUT /api/rooms - Update an existing room
export async function PUT({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { id, name, building, floor, status, assignedTo } = data;
    
    // Validation
    if (!id || !name || !building || !floor) {
      return json({
        success: false,
        message: 'ID, name, building, and floor are required'
      }, { status: 400 });
    }
    
    // Check if room exists
    const existingRoom = await query(
      'SELECT id, name FROM rooms WHERE id = $1',
      [id]
    );
    
    if (existingRoom.rows.length === 0) {
      return json({
        success: false,
        message: 'Room not found'
      }, { status: 404 });
    }
    
    // Check if new name/building/floor conflicts with another room
    const nameConflict = await query(
      'SELECT id FROM rooms WHERE LOWER(name) = $1 AND LOWER(building) = $2 AND LOWER(floor) = $3 AND id != $4',
      [name.toLowerCase(), building.toLowerCase(), floor.toLowerCase(), id]
    );
    
    if (nameConflict.rows.length > 0) {
      return json({
        success: false,
        message: 'A room with this name already exists in the same building and floor'
      }, { status: 409 });
    }
    
    // Update room
    const result = await query(
      `UPDATE rooms 
       SET name = $1, building = $2, floor = $3, status = $4, assigned_to = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, building, floor, status, assigned_to, created_at, updated_at`,
      [name, building, floor, status || 'available', assignedTo || null, id]
    );
    
    const updatedRoom = result.rows[0];
    
    // Log the room update activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'room_updated',
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
      console.error('Error logging room update activity:', logError);
      // Don't fail the update if logging fails
    }
    
    // Format response to match component structure
    const formattedRoom = {
      id: updatedRoom.id,
      name: updatedRoom.name,
      building: updatedRoom.building,
      floor: updatedRoom.floor,
      status: updatedRoom.status,
      assignedTo: updatedRoom.assigned_to,
      createdDate: new Date(updatedRoom.created_at).toLocaleDateString('en-US'),
      updatedDate: new Date(updatedRoom.updated_at).toLocaleDateString('en-US')
    };
    
    return json({
      success: true,
      message: `Room "${name}" updated successfully`,
      data: formattedRoom
    });
    
  } catch (error) {
    console.error('Error updating room:', error);
    return json({
      success: false,
      message: 'Failed to update room: ' + error.message
    }, { status: 500 });
  }
}

// DELETE /api/rooms - Delete a room
export async function DELETE({ request, getClientAddress }) {
  try {
    const data = await request.json();
    const { id } = data;
    
    if (!id) {
      return json({
        success: false,
        message: 'Room ID is required'
      }, { status: 400 });
    }
    
    // Check if room exists and get its details
    const existingRoom = await query(
      'SELECT id, name, building, floor FROM rooms WHERE id = $1',
      [id]
    );
    
    if (existingRoom.rows.length === 0) {
      return json({
        success: false,
        message: 'Room not found'
      }, { status: 404 });
    }
    
    // Delete the room
    await query(
      'DELETE FROM rooms WHERE id = $1',
      [id]
    );
    
    // Log the room deletion activity
    try {
      // Get user info from request headers
      const user = await getUserFromRequest(request);
      
      // Get client IP and user agent
      const ip_address = getClientAddress();
      const user_agent = request.headers.get('user-agent');
      
      await logActivityWithUser(
        'room_deleted',
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
      console.error('Error logging room deletion activity:', logError);
      // Don't fail the deletion if logging fails
    }
    
    return json({
      success: true,
      message: `Room "${existingRoom.rows[0].name}" has been removed successfully`
    });
    
  } catch (error) {
    console.error('Error deleting room:', error);
    return json({
      success: false,
      message: 'Failed to delete room: ' + error.message
    }, { status: 500 });
  }
}