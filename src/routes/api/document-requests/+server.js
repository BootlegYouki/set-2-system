import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { getUserFromRequest, logActivityWithUser } from '../helper/auth-helper.js';
import { createDocumentRequestNotification } from '../helper/notification-helper.js';
import { ObjectId } from 'mongodb';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, request }) {
  try {
    // Verify authentication and get user
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection('document_requests');
    const usersCollection = db.collection('users');

    const studentId = url.searchParams.get('student_id');
    const adminView = url.searchParams.get('admin_view') === 'true';
    
    // Check authorization
    if (adminView && user.account_type !== 'admin') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!adminView && !studentId) {
      return json({ error: 'Student ID is required' }, { status: 400 });
    }

    let documentRequests;

    if (adminView) {
      // Admin view: fetch all document requests with student information using aggregation
      documentRequests = await documentRequestsCollection.aggregate([
        {
          $addFields: {
            student_id_obj: { $toObjectId: "$student_id" }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'student_id_obj',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $unwind: '$student'
        },
        {
          $match: {
            'student.account_type': 'student'
          }
        },
        {
          $sort: { created_at: -1 }
        }
      ]).toArray();
    } else {
      // Student view: fetch document requests for specific student
      documentRequests = await documentRequestsCollection.find({
        student_id: studentId
      }).sort({ created_at: -1 }).toArray();
    }

    // Format the data to match the component's expected structure
    const formattedRequests = documentRequests.map(request => {
      const baseRequest = {
        id: request.id || request._id.toString(),
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
        adminName: request.admin_name,
        completedByAdmin: request.completed_by_admin,
        status: request.status
      };

      // Add student information for admin view
      if (adminView && request.student) {
        baseRequest.studentName = `${request.student.first_name} ${request.student.last_name}`;
        baseRequest.studentId = request.student.account_number;
        baseRequest.gradeLevel = `Grade ${request.student.grade_level}`;
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
    console.log('PATCH request received for document requests');
    
    // Verify authentication and get user
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection('document_requests');

    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { id, action } = requestBody;

    if (!id || !action) {
      console.log('Missing required fields - id:', id, 'action:', action);
      return json({ 
        error: 'Request ID and action are required' 
      }, { status: 400 });
    }

    console.log('Processing action:', action, 'for request ID:', id);

    // Convert string ID to ObjectId if needed
    const requestId = ObjectId.isValid(id) ? new ObjectId(id) : id;

    if (action === 'cancel') {
      // Students can cancel their own requests, admins can cancel any request
      let query = { 
        $or: [{ _id: requestId }, { id: id }],
        status: 'pending'
      };

      // If not admin, restrict to user's own requests
      if (user.account_type !== 'admin') {
        query.student_id = user.id;
      }

      // Update the document request status to cancelled with cancelled_at timestamp
      const result = await documentRequestsCollection.updateOne(
        query,
        {
          $set: {
            status: 'cancelled',
            cancelled_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return json({ 
          error: 'Request not found or cannot be cancelled' 
        }, { status: 404 });
      }

      // Fetch the updated document
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id: id }]
      });

      // Log activity
      await logActivityWithUser(user, 'Document Request Cancelled', `Cancelled document request: ${updatedRequest.document_type}`);

      // Format the response to match component structure
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

    if (action === 'approve') {
      // Only admins can approve requests
      if (user.account_type !== 'admin') {
        return json({ error: 'Admin access required' }, { status: 403 });
      }

      console.log('Processing approve action');
      const { admin_note } = requestBody;
      console.log('Admin note:', admin_note);
      
      // Get admin name from database
      let adminName = 'Admin';
      try {
        const usersCollection = db.collection('users');
        const adminRecord = await usersCollection.findOne(
          { _id: new ObjectId(user.id) },
          { projection: { first_name: 1, last_name: 1, name: 1, username: 1 } }
        );
        
        if (adminRecord) {
          if (adminRecord.first_name && adminRecord.last_name) {
            adminName = `${adminRecord.first_name} ${adminRecord.last_name}`;
          } else if (adminRecord.name) {
            adminName = adminRecord.name;
          } else if (adminRecord.username) {
            adminName = adminRecord.username;
          }
        }
      } catch (dbError) {
        console.error('Error fetching admin name:', dbError);
      }

      // Update the document request status to processing with admin note and admin name
      const result = await documentRequestsCollection.updateOne(
        { 
          $or: [{ _id: requestId }, { id: id }],
          status: 'pending'
        },
        {
          $set: {
            status: 'processing',
            admin_note: admin_note || 'Approved',
            admin_name: adminName,
            admin_id: user.id,
            processed_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      console.log('Approve query result:', result.matchedCount, 'documents matched');

      if (result.matchedCount === 0) {
        return json({ 
          error: 'Request not found or cannot be approved' 
        }, { status: 404 });
      }

      // Fetch the updated document
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id: id }]
      });

      // Log activity
      await logActivityWithUser(user, 'Document Request Approved', `Approved document request: ${updatedRequest.document_type}`);

      // Create notification for student
      await createDocumentRequestNotification(
        db, 
        updatedRequest.student_id, 
        updatedRequest.document_type, 
        'processing',
        updatedRequest.admin_note,
        null, // rejection reason
        user // admin user who performed the action
      );

      // Format the response to match component structure
      const formattedRequest = {
        id: updatedRequest.id || updatedRequest._id.toString(),
        type: formatDocumentType(updatedRequest.document_type),
        purpose: updatedRequest.purpose,
        requestedDate: formatDate(updatedRequest.requested_at || updatedRequest.created_at),
        processedDate: formatDate(updatedRequest.processed_at),
        adminNote: updatedRequest.admin_note,
        adminName: updatedRequest.admin_name,
        status: updatedRequest.status
      };

      return json({
        success: true,
        data: formattedRequest
      });
    }

    if (action === 'reject') {
      // Only admins can reject requests
      if (user.account_type !== 'admin') {
        return json({ error: 'Admin access required' }, { status: 403 });
      }

      console.log('Processing reject action');
      const { rejection_reason } = requestBody;
      const rejectionReason = rejection_reason;
      console.log('Rejection reason:', rejectionReason);
      
      if (!rejectionReason || !rejectionReason.trim()) {
        console.log('Rejection reason validation failed');
        return json({ 
          error: 'Rejection reason is required' 
        }, { status: 400 });
      }

      // Get admin name from database
      let adminName = 'Admin';
      try {
        const usersCollection = db.collection('users');
        const adminRecord = await usersCollection.findOne(
          { _id: new ObjectId(user.id) },
          { projection: { first_name: 1, last_name: 1, name: 1, username: 1 } }
        );
        
        if (adminRecord) {
          if (adminRecord.first_name && adminRecord.last_name) {
            adminName = `${adminRecord.first_name} ${adminRecord.last_name}`;
          } else if (adminRecord.name) {
            adminName = adminRecord.name;
          } else if (adminRecord.username) {
            adminName = adminRecord.username;
          }
        }
      } catch (dbError) {
        console.error('Error fetching admin name:', dbError);
      }

      // Update the document request status to rejected with rejection reason and admin info
      const result = await documentRequestsCollection.updateOne(
        { 
          $or: [{ _id: requestId }, { id: id }],
          status: 'pending'
        },
        {
          $set: {
            status: 'rejected',
            rejection_reason: rejectionReason.trim(),
            admin_name: adminName,
            admin_id: user.id,
            updated_at: new Date()
          }
        }
      );

      console.log('Reject query result:', result.matchedCount, 'documents matched');

      if (result.matchedCount === 0) {
        return json({ 
          error: 'Request not found or cannot be rejected' 
        }, { status: 404 });
      }

      // Fetch the updated document
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id: id }]
      });

      // Log activity
      await logActivityWithUser(user, 'Document Request Rejected', `Rejected document request: ${updatedRequest.document_type} - Reason: ${rejectionReason.trim()}`);

      // Create notification for student
      await createDocumentRequestNotification(
        db, 
        updatedRequest.student_id, 
        updatedRequest.document_type, 
        'rejected',
        null, // admin note
        updatedRequest.rejection_reason,
        user // admin user who performed the action
      );

      // Format the response to match component structure
      const formattedRequest = {
        id: updatedRequest.id || updatedRequest._id.toString(),
        type: formatDocumentType(updatedRequest.document_type),
        purpose: updatedRequest.purpose,
        requestedDate: formatDate(updatedRequest.requested_at || updatedRequest.created_at),
        rejectionReason: updatedRequest.rejection_reason,
        adminName: updatedRequest.admin_name,
        status: updatedRequest.status
      };

      return json({
        success: true,
        data: formattedRequest
      });
    }

    if (action === 'complete') {
      // Only admins can complete requests
      if (user.account_type !== 'admin') {
        return json({ error: 'Admin access required' }, { status: 403 });
      }

      // Get admin name from database
      let adminName = 'Admin';
      try {
        const usersCollection = db.collection('users');
        const adminRecord = await usersCollection.findOne(
          { _id: new ObjectId(user.id) },
          { projection: { first_name: 1, last_name: 1, name: 1, username: 1 } }
        );
        
        if (adminRecord) {
          if (adminRecord.first_name && adminRecord.last_name) {
            adminName = `${adminRecord.first_name} ${adminRecord.last_name}`;
          } else if (adminRecord.name) {
            adminName = adminRecord.name;
          } else if (adminRecord.username) {
            adminName = adminRecord.username;
          }
        }
      } catch (dbError) {
        console.error('Error fetching admin name:', dbError);
      }

      // Update the document request status to completed with completion date and admin info
      const result = await documentRequestsCollection.updateOne(
        { 
          $or: [{ _id: requestId }, { id: id }],
          status: 'processing'
        },
        {
          $set: {
            status: 'completed',
            completed_at: new Date(),
            completed_by_admin: adminName,
            completed_by_admin_id: user.id,
            updated_at: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return json({ 
          error: 'Request not found or cannot be completed (must be in processing status)' 
        }, { status: 404 });
      }

      // Fetch the updated document
      const updatedRequest = await documentRequestsCollection.findOne({
        $or: [{ _id: requestId }, { id: id }]
      });

      // Log activity
      await logActivityWithUser(user, 'Document Request Completed', `Completed document request: ${updatedRequest.document_type}`);

      // Create notification for student
      await createDocumentRequestNotification(
        db, 
        updatedRequest.student_id, 
        updatedRequest.document_type, 
        'completed',
        null, // admin note
        null, // rejection reason
        user // admin user who performed the action
      );

      // Format the response to match component structure
      const formattedRequest = {
        id: updatedRequest.id || updatedRequest._id.toString(),
        type: formatDocumentType(updatedRequest.document_type),
        purpose: updatedRequest.purpose,
        requestedDate: formatDate(updatedRequest.requested_at || updatedRequest.created_at),
        processedDate: formatDate(updatedRequest.processed_at),
        completedDate: formatDate(updatedRequest.completed_at),
        adminNote: updatedRequest.admin_note,
        completedByAdmin: updatedRequest.completed_by_admin,
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
    console.log('POST request received for document requests');
    
    // Verify authentication and get user
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection('document_requests');

    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { student_id, document_type, purpose } = requestBody;

    // Validate required fields
    if (!student_id || !document_type || !purpose) {
      console.log('Missing required fields - student_id:', student_id, 'document_type:', document_type, 'purpose:', purpose);
      return json({ 
        error: 'Student ID, document type, and purpose are required' 
      }, { status: 400 });
    }

    // For students, ensure they can only create requests for themselves
    if (user.account_type === 'student' && user.id !== student_id) {
      return json({ error: 'Students can only create requests for themselves' }, { status: 403 });
    }

    console.log('Creating document request for student:', student_id);

    // Generate a unique ID for the document request
    const requestId = new ObjectId().toString();

    // Create the document request
    const newRequest = {
      id: requestId,
      student_id: student_id,
      document_type: document_type,
      purpose: purpose.trim(),
      status: 'pending',
      requested_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await documentRequestsCollection.insertOne(newRequest);

    if (!result.insertedId) {
      return json({ 
        error: 'Failed to create document request' 
      }, { status: 500 });
    }

    // Log activity
    await logActivityWithUser(user, 'Document Request Created', `Created document request: ${document_type} for student ${student_id}`);

    // Format the response to match component structure
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
    console.log('DELETE request received for document requests');
    
    // Verify authentication and get user
    const user = await getUserFromRequest(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await connectToDatabase();
    const documentRequestsCollection = db.collection('document_requests');

    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { id } = requestBody;

    if (!id) {
      console.log('Missing required field - id:', id);
      return json({ 
        error: 'Request ID is required' 
      }, { status: 400 });
    }

    console.log('Deleting document request with ID:', id);

    // Convert string ID to ObjectId if needed
    const requestId = ObjectId.isValid(id) ? new ObjectId(id) : id;

    // First, check if the request exists and get its details
    const existingRequest = await documentRequestsCollection.findOne({
      $or: [{ _id: requestId }, { id: id }]
    });

    if (!existingRequest) {
      return json({ 
        error: 'Document request not found' 
      }, { status: 404 });
    }

    // For students, ensure they can only delete their own requests
    if (user.account_type === 'student' && user.id !== existingRequest.student_id) {
      return json({ error: 'Students can only delete their own requests' }, { status: 403 });
    }

    // Check if the request can be deleted (only completed or cancelled requests)
    if (!['completed', 'cancelled'].includes(existingRequest.status)) {
      return json({ 
        error: 'Only completed or cancelled requests can be deleted' 
      }, { status: 400 });
    }

    // Delete the document request
    const result = await documentRequestsCollection.deleteOne({
      $or: [{ _id: requestId }, { id: id }],
      status: { $in: ['completed', 'cancelled'] }
    });

    if (result.deletedCount === 0) {
      return json({ 
        error: 'Request not found or cannot be deleted' 
      }, { status: 404 });
    }

    // Log activity
    await logActivityWithUser(user, 'Document Request Deleted', `Deleted document request: ${existingRequest.document_type} (ID: ${id})`);

    return json({
      success: true,
      message: 'Document request deleted successfully'
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