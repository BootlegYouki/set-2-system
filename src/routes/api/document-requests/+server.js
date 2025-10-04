import { json } from '@sveltejs/kit';
import { query } from '../../../database/db.js';
import { verifyAuth } from '../helper/auth-helper.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const studentId = url.searchParams.get('student_id');
    const adminView = url.searchParams.get('admin_view') === 'true';
    
    if (!adminView && !studentId) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }

    let documentRequestsQuery;
    let queryParams;

    if (adminView) {
      // Admin view: fetch all document requests with student information
      documentRequestsQuery = `
        SELECT 
          dr.id,
          dr.student_id,
          dr.document_type,
          dr.purpose,
          dr.status,
          dr.admin_note,
          dr.rejection_reason,
          dr.requested_at,
          dr.processed_at,
          dr.completed_at,
          dr.cancelled_at,
          dr.created_at,
          dr.updated_at,
          u.first_name,
          u.last_name,
          u.account_number,
          u.grade_level
        FROM document_requests dr
        JOIN users u ON dr.student_id = u.id
        WHERE u.account_type = 'student'
        ORDER BY dr.created_at DESC
      `;
      queryParams = [];
    } else {
      // Student view: fetch document requests for specific student
      documentRequestsQuery = `
        SELECT 
          id,
          student_id,
          document_type,
          purpose,
          status,
          admin_note,
          rejection_reason,
          requested_at,
          processed_at,
          completed_at,
          cancelled_at,
          created_at,
          updated_at
        FROM document_requests
        WHERE student_id = $1
        ORDER BY created_at DESC
      `;
      queryParams = [studentId];
    }
    
    const result = await query(documentRequestsQuery, queryParams);

    // Format the data to match the component's expected structure
    const formattedRequests = result.rows.map(request => {
      const baseRequest = {
        id: request.id,
        type: formatDocumentType(request.document_type),
        purpose: request.purpose,
        requestedDate: formatDate(request.requested_at || request.created_at),
        completedDate: request.completed_at ? formatDate(request.completed_at) : null,
        cancelledDate: request.cancelled_at ? formatDate(request.cancelled_at) : null,
        estimatedCompletion: request.status === 'processing' && !request.completed_at 
          ? getEstimatedCompletion(request.requested_at || request.created_at) 
          : null,
        rejectionReason: request.rejection_reason,
        adminNote: request.admin_note,
        status: request.status
      };

      // Add student information for admin view
      if (adminView) {
        baseRequest.studentName = `${request.first_name} ${request.last_name}`;
        baseRequest.studentId = request.account_number;
        baseRequest.gradeLevel = `Grade ${request.grade_level}`;
        baseRequest.documentType = formatDocumentType(request.document_type);
        baseRequest.requestDate = formatDate(request.requested_at || request.created_at);
      }

      return baseRequest;
    });

    return json({
      success: true,
      data: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching document requests:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch document requests' 
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const requestBody = await request.json();
    const { id, action } = requestBody;

    if (!id || !action) {
      return json({ 
        error: 'Request ID and action are required' 
      }, { status: 400 });
    }

    if (action === 'cancel') {
      // Update the document request status to cancelled with cancelled_at timestamp
      const updateQuery = `
        UPDATE document_requests 
        SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING *
      `;

      const result = await query(updateQuery, [id]);

      if (result.rows.length === 0) {
        return json({ 
          error: 'Request not found or cannot be cancelled' 
        }, { status: 404 });
      }

      const updatedRequest = result.rows[0];

      // Format the response to match component structure
      const formattedRequest = {
        id: updatedRequest.id,
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

    if (action === 'approve') {
      const { admin_note } = requestBody;
      
      // Update the document request status to processing with admin note
      const updateQuery = `
        UPDATE document_requests 
        SET status = 'processing', admin_note = $2, processed_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING *
      `;

      const result = await query(updateQuery, [id, admin_note || 'Approved']);

      if (result.rows.length === 0) {
        return json({ 
          error: 'Request not found or cannot be approved' 
        }, { status: 404 });
      }

      const updatedRequest = result.rows[0];

      // Format the response to match component structure
      const formattedRequest = {
        id: updatedRequest.id,
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

    if (action === 'reject') {
      const { rejection_reason } = requestBody;
      const rejectionReason = rejection_reason;
      
      if (!rejectionReason || !rejectionReason.trim()) {
        return json({ 
          error: 'Rejection reason is required' 
        }, { status: 400 });
      }

      // Update the document request status to rejected with rejection reason
      const updateQuery = `
        UPDATE document_requests 
        SET status = 'rejected', rejection_reason = $2, updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING *
      `;

      const result = await query(updateQuery, [id, rejectionReason.trim()]);

      if (result.rows.length === 0) {
        return json({ 
          error: 'Request not found or cannot be rejected' 
        }, { status: 404 });
      }

      const updatedRequest = result.rows[0];

      // Format the response to match component structure
      const formattedRequest = {
        id: updatedRequest.id,
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

    if (action === 'complete') {
      // Update the document request status to completed with completion date
      const updateQuery = `
        UPDATE document_requests 
        SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND status = 'processing'
        RETURNING *
      `;

      const result = await query(updateQuery, [id]);

      if (result.rows.length === 0) {
        return json({ 
          error: 'Request not found or cannot be completed (must be in processing status)' 
        }, { status: 404 });
      }

      const updatedRequest = result.rows[0];

      // Format the response to match component structure
      const formattedRequest = {
        id: updatedRequest.id,
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
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating document request:', error);
    return json({ 
      success: false, 
      error: 'Failed to update document request' 
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { student_id, document_type, purpose } = await request.json();

    if (!student_id || !document_type || !purpose) {
      return json({ 
        error: 'Student ID, document type, and purpose are required' 
      }, { status: 400 });
    }

    // Insert new document request
    const insertQuery = `
      INSERT INTO document_requests (
        student_id, 
        document_type, 
        purpose, 
        status, 
        requested_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [
      student_id,
      document_type,
      purpose,
      'pending'
    ]);

    const newRequest = result.rows[0];

    // Format the response to match component structure
    const formattedRequest = {
      id: newRequest.id,
      type: formatDocumentType(newRequest.document_type),
      purpose: newRequest.purpose,
      requestedDate: formatDate(newRequest.requested_at || newRequest.created_at),
      status: newRequest.status
    };

    return json({
      success: true,
      data: formattedRequest
    });

  } catch (error) {
    console.error('Error creating document request:', error);
    return json({ 
      success: false, 
      error: 'Failed to create document request' 
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return json({ 
        error: 'Request ID is required' 
      }, { status: 400 });
    }

    // Delete the document request (only allow deletion of completed or cancelled requests)
    const deleteQuery = `
      DELETE FROM document_requests 
      WHERE id = $1 AND (status = 'completed' OR status = 'cancelled')
      RETURNING id
    `;

    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return json({ 
        error: 'Request not found or cannot be deleted (only completed or cancelled requests can be removed)' 
      }, { status: 404 });
    }

    return json({
      success: true,
      message: 'Document request removed successfully'
    });

  } catch (error) {
    console.error('Error deleting document request:', error);
    return json({ 
      success: false, 
      error: 'Failed to delete document request' 
    }, { status: 500 });
  }
}

// Helper functions
function formatDocumentType(type) {
  const typeMap = {
    'transcript': 'Transcript',
    'enrollment': 'Enrollment Certificate',
    'grade-report': 'Grade Report',
    'diploma': 'Diploma',
    'certificate': 'Certificate'
  };
  return typeMap[type] || type;
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
}

function getEstimatedCompletion(requestedDate) {
  if (!requestedDate) return null;
  const date = new Date(requestedDate);
  date.setDate(date.getDate() + 7); // Add 7 days for estimated completion
  return date.toLocaleDateString('en-US');
}