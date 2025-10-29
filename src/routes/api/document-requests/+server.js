import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../database/db.js';
import { ObjectId } from 'mongodb';
import { verifyAuth, logActivityWithUser, getUserFromRequest } from '../helper/auth-helper.js';
import { encryptMessage, decryptMessages } from '../helper/encryption-helper.js';

// GET /api/document-requests - Fetch document requests
export async function GET({ url, request }) {
	try {
		// Verify authentication (students can view their own, admin/teachers can view all)
		const authResult = await verifyAuth(request, ['admin', 'teacher', 'student']);
		if (!authResult.success) {
			return json({ error: authResult.error }, { status: 401 });
		}

		const db = await connectToDatabase();
		const action = url.searchParams.get('action');

		switch (action) {
			case 'all':
				// Get all document requests with optional filters (admin/teacher only)
				if (authResult.user.account_type !== 'admin' && authResult.user.account_type !== 'teacher') {
					return json({ error: 'Access denied. Only admins and teachers can view all requests.' }, { status: 403 });
				}

				const status = url.searchParams.get('status');
				const documentType = url.searchParams.get('documentType');
				const gradeLevel = url.searchParams.get('gradeLevel');
				const searchTerm = url.searchParams.get('search');

				// Build query
				let query = {};

				if (status) {
					query.status = status;
				}

				if (documentType) {
					query.document_type = documentType;
				}

				if (gradeLevel) {
					query.grade_level = gradeLevel.toString();
				}

				if (searchTerm) {
					query.$or = [
						{ full_name: { $regex: searchTerm, $options: 'i' } },
						{ account_number: { $regex: searchTerm, $options: 'i' } },
						{ request_id: { $regex: searchTerm, $options: 'i' } },
						{ document_type: { $regex: searchTerm, $options: 'i' } }
					];
				}

				const requests = await db
					.collection('document_requests')
					.find(query)
					.sort({ submitted_date: -1 })
					.toArray();

				// Format the data for the frontend
				const formattedRequests = requests.map((req) => ({
					id: req._id.toString(),
					studentId: req.account_number,
					gradeLevel: `Grade ${req.grade_level}`,
					section: req.section,
					studentName: req.full_name,
					documentType: req.document_type,
					requestId: req.request_id,
					submittedDate: formatDate(req.submitted_date),
					cancelledDate: req.cancelled_date ? formatDate(req.cancelled_date) : null,
					payment: req.payment_amount !== null && req.payment_amount !== undefined 
						? (req.payment_amount === 0 ? 'Free' : `₱${req.payment_amount}`) 
						: 'Tentative',
					paymentAmount: req.payment_amount,
					paymentStatus: req.payment_status,
					status: req.status,
					tentativeDate: req.tentative_date ? formatDateForInput(req.tentative_date) : null,
					isUrgent: req.is_urgent || false,
					purpose: req.purpose,
					dateOfBirth: formatDateDisplay(req.birthdate),
					processedBy: req.processed_by,
					processedById: req.processed_by_id
				}));

				return json({ success: true, data: formattedRequests });

			case 'student':
				// Get student's own document requests
				const studentRequests = await db
					.collection('document_requests')
					.find({ student_id: authResult.user.id })
					.sort({ submitted_date: -1 })
					.toArray();

				const formattedStudentRequests = studentRequests.map((req) => ({
					id: req._id.toString(),
					requestId: req.request_id,
					documentType: req.document_type,
					purpose: req.purpose,
					status: req.status,
					submittedDate: formatDate(req.submitted_date),
					tentativeDate: req.tentative_date ? formatDate(req.tentative_date) : null,
					payment: req.payment_amount !== null && req.payment_amount !== undefined 
						? (req.payment_amount === 0 ? 'Free' : `₱${req.payment_amount}`) 
						: 'Tentative',
					paymentAmount: req.payment_amount,
					paymentStatus: req.payment_status,
					processedBy: req.processed_by,
					isUrgent: req.is_urgent || false,
					messages: decryptMessages(req.messages || [])
				}));

				return json({ success: true, data: formattedStudentRequests });

			case 'stats':
				// Get statistics for status cards
				const stats = await db
					.collection('document_requests')
					.aggregate([
						{
							$group: {
								_id: '$status',
								count: { $sum: 1 }
							}
						}
					])
					.toArray();

				const statsObj = {
					on_hold: 0,
					verifying: 0,
					processing: 0,
					for_pickup: 0,
					released: 0
				};

				stats.forEach((stat) => {
					if (statsObj.hasOwnProperty(stat._id)) {
						statsObj[stat._id] = stat.count;
					}
				});

				return json({ success: true, data: statsObj });

			case 'single':
				const requestId = url.searchParams.get('requestId');
				if (!requestId) {
					return json({ error: 'Request ID is required' }, { status: 400 });
				}

				const request = await db.collection('document_requests').findOne({ request_id: requestId });

				if (!request) {
					return json({ error: 'Request not found' }, { status: 404 });
				}

				// Ensure messages field exists (migration fix)
				if (!request.messages) {
					await db.collection('document_requests').updateOne(
						{ request_id: requestId },
						{ $set: { messages: [] } }
					);
					request.messages = [];
				}

				const formattedRequest = {
					id: request._id.toString(),
					studentId: request.account_number,
					gradeLevel: `Grade ${request.grade_level}`,
					section: request.section,
					studentName: request.full_name,
					documentType: request.document_type,
					requestId: request.request_id,
					submittedDate: formatDate(request.submitted_date),
					cancelledDate: request.cancelled_date ? formatDate(request.cancelled_date) : null,
					payment: request.payment_amount !== null && request.payment_amount !== undefined 
						? (request.payment_amount === 0 ? 'Free' : `₱${request.payment_amount}`) 
						: 'Tentative',
					paymentAmount: request.payment_amount,
					paymentStatus: request.payment_status,
					status: request.status,
					tentativeDate: request.tentative_date ? formatDateForInput(request.tentative_date) : null,
					isUrgent: request.is_urgent || false,
					purpose: request.purpose,
					dateOfBirth: formatDateDisplay(request.birthdate),
					processedBy: request.processed_by,
					processedById: request.processed_by_id,
					messages: decryptMessages(request.messages || [])
				};

				return json({ success: true, data: formattedRequest });

			default:
				return json({ error: 'Invalid action parameter' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error in /api/document-requests GET:', error);
		return json({ error: 'Failed to fetch document requests' }, { status: 500 });
	}
}

// POST /api/document-requests - Create or update document request
export async function POST({ request }) {
	try {
		// Verify authentication
		const authResult = await verifyAuth(request, ['admin', 'teacher', 'student']);
		if (!authResult.success) {
			return json({ error: authResult.error }, { status: 401 });
		}

		const user = authResult.user;
		const db = await connectToDatabase();
		const data = await request.json();
		const { action } = data;

		switch (action) {
			case 'create':
				// Students can create their own requests
				if (user.account_type === 'student') {
					// Get student information from users collection
					const student = await db
						.collection('users')
						.findOne({ _id: new ObjectId(user.id) });

					if (!student) {
						return json({ error: 'Student not found' }, { status: 404 });
					}

					// Generate request ID
					const lastRequest = await db
						.collection('document_requests')
						.find()
						.sort({ request_id: -1 })
						.limit(1)
						.toArray();

					let nextRequestNumber = 1;
					if (lastRequest.length > 0) {
						const lastId = lastRequest[0].request_id;
						const match = lastId.match(/REQ-(\d+)-(\d+)/);
						if (match) {
							nextRequestNumber = parseInt(match[2]) + 1;
						}
					}

					const requestId = `REQ-${new Date().getFullYear()}-${String(nextRequestNumber).padStart(4, '0')}`;

					// Get student's section
					const sectionStudent = await db
						.collection('section_students')
						.findOne({ student_id: new ObjectId(user.id), status: 'active' });

					let sectionName = 'N/A';
					if (sectionStudent) {
						const section = await db
							.collection('sections')
							.findOne({ _id: sectionStudent.section_id });
						if (section) {
							sectionName = section.name;
						}
					}

					const newRequest = {
						student_id: student._id.toString(),
						account_number: student.account_number,
						full_name: student.full_name,
						grade_level: student.grade_level,
						section: sectionName,
						birthdate: student.birthdate,
						document_type: data.documentType,
						request_id: requestId,
						submitted_date: new Date(),
						payment_amount: data.paymentAmount !== undefined && data.paymentAmount !== null ? data.paymentAmount : null,
						payment_status: 'pending',
						status: 'on_hold',
						tentative_date: null,
						is_urgent: data.isUrgent || false,
						purpose: data.purpose,
						processed_by: null,
						processed_by_id: null,
						messages: [],
						created_at: new Date(),
						updated_at: new Date()
					};

					const result = await db.collection('document_requests').insertOne(newRequest);

					// Log activity
					await logActivityWithUser(
						'document_request_created',
						`Document request ${requestId} created for ${data.documentType}`,
						user
					);

					return json({
						success: true,
						message: 'Document request created successfully',
						data: { ...newRequest, id: result.insertedId.toString() }
					});
				} else {
					return json({ error: 'Only students can create requests' }, { status: 403 });
				}

			case 'update':
				// Admin and teachers can update requests
				if (user.account_type !== 'admin' && user.account_type !== 'teacher') {
					return json({ error: 'Permission denied' }, { status: 403 });
				}

				const { requestId, status, tentativeDate, paymentStatus, paymentAmount } = data;

				if (!requestId) {
					return json({ error: 'Request ID is required' }, { status: 400 });
				}

				const updateData = {
					updated_at: new Date()
				};

				if (status) {
					updateData.status = status;
					// Clear tentative date if status is not processing
					if (status !== 'processing') {
						updateData.tentative_date = null;
					}
				}

				if (tentativeDate !== undefined) {
					updateData.tentative_date = tentativeDate ? new Date(tentativeDate) : null;
				}

				if (paymentStatus) {
					updateData.payment_status = paymentStatus;
				}

				if (paymentAmount !== undefined && paymentAmount !== null) {
					updateData.payment_amount = parseFloat(paymentAmount);
				}

				// Set processed by if not already set
				const existingRequest = await db
					.collection('document_requests')
					.findOne({ request_id: requestId });

				if (existingRequest && !existingRequest.processed_by) {
					updateData.processed_by = user.name;
					updateData.processed_by_id = user.id;
				}

				const updateResult = await db
					.collection('document_requests')
					.updateOne({ request_id: requestId }, { $set: updateData });

				if (updateResult.matchedCount === 0) {
					return json({ error: 'Request not found' }, { status: 404 });
				}

				// Log activity
				await logActivityWithUser(
					'document_request_updated',
					`Document request ${requestId} updated`,
					user
				);

				return json({ success: true, message: 'Request updated successfully' });

			case 'reject':
				// Admin and teachers can reject requests
				if (user.account_type !== 'admin' && user.account_type !== 'teacher') {
					return json({ error: 'Permission denied' }, { status: 403 });
				}

				const rejectRequestId = data.requestId;
				if (!rejectRequestId) {
					return json({ error: 'Request ID is required' }, { status: 400 });
				}

				const rejectResult = await db
					.collection('document_requests')
					.updateOne(
						{ request_id: rejectRequestId },
						{
							$set: {
								status: 'rejected',
								tentative_date: null,
								processed_by: user.name,
								processed_by_id: user.id,
								updated_at: new Date()
							}
						}
					);

				if (rejectResult.matchedCount === 0) {
					return json({ error: 'Request not found' }, { status: 404 });
				}

				// Log activity
				await logActivityWithUser(
					'document_request_rejected',
					`Document request ${rejectRequestId} rejected`,
					user
				);

				return json({ success: true, message: 'Request rejected successfully' });

			case 'cancel':
				// Students can cancel their own pending requests
				const cancelRequestId = data.requestId;
				if (!cancelRequestId) {
					return json({ error: 'Request ID is required' }, { status: 400 });
				}

				// Find the request first to verify ownership
				const requestToCancel = await db
					.collection('document_requests')
					.findOne({ request_id: cancelRequestId });

				if (!requestToCancel) {
					return json({ error: 'Request not found' }, { status: 404 });
				}

				// Check if student owns this request
				if (requestToCancel.student_id !== user.id) {
					return json({ error: 'You can only cancel your own requests' }, { status: 403 });
				}

				// Check if request can be cancelled (only on_hold status)
				if (requestToCancel.status !== 'on_hold') {
					return json({ error: 'Only pending requests can be cancelled' }, { status: 400 });
				}

				const cancelResult = await db
					.collection('document_requests')
					.updateOne(
						{ request_id: cancelRequestId },
						{
							$set: {
								status: 'cancelled',
								cancelled_date: new Date(),
								updated_at: new Date()
							}
						}
					);

				if (cancelResult.matchedCount === 0) {
					return json({ error: 'Request not found' }, { status: 404 });
				}

				// Log activity
				await logActivityWithUser(
					'document_request_cancelled',
					`Document request ${cancelRequestId} cancelled by student`,
					user
				);

				return json({ success: true, message: 'Request cancelled successfully' });

			case 'sendMessage':
				// Both students and admins can send messages
				const msgRequestId = data.requestId;
				const messageText = data.message;

				if (!msgRequestId || !messageText) {
					return json({ error: 'Request ID and message are required' }, { status: 400 });
				}

				// Find the request
				const targetRequest = await db
					.collection('document_requests')
					.findOne({ request_id: msgRequestId });

				if (!targetRequest) {
					return json({ error: 'Request not found' }, { status: 404 });
				}

				// For students, verify they own the request
				if (user.account_type === 'student' && targetRequest.student_id !== user.id) {
					return json({ error: 'You can only send messages to your own requests' }, { status: 403 });
				}

				// Encrypt the message text before storing
				const encryptedText = encryptMessage(messageText.trim());

				// Create the message object with encrypted text
				const newMessage = {
					id: new ObjectId().toString(),
					author: user.name || user.full_name,
					authorId: user.id,
					authorRole: user.account_type,
					text: encryptedText,
					created_at: new Date()
				};

				// Add message to the document request
				const messageResult = await db
					.collection('document_requests')
					.updateOne(
						{ request_id: msgRequestId },
						{
							$push: { messages: newMessage },
							$set: { updated_at: new Date() }
						}
					);

				if (messageResult.matchedCount === 0) {
					return json({ error: 'Failed to send message' }, { status: 500 });
				}

				// Log activity
				await logActivityWithUser(
					'document_request_message_sent',
					`Message sent to document request ${msgRequestId}`,
					user
				);

				// Return the message with decrypted text for the response
				return json({
					success: true,
					message: 'Message sent successfully',
					data: {
						...newMessage,
						text: messageText.trim() // Return plaintext in response
					}
				});

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error in /api/document-requests POST:', error);
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
}

// Helper function to format date for display (MM/DD/YYYY)
function formatDate(dateString) {
	if (!dateString) return 'N/A';
	const date = new Date(dateString);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const year = date.getFullYear();
	return `${month}/${day}/${year}`;
}

// Helper function to format date for input (YYYY-MM-DD)
function formatDateForInput(dateString) {
	if (!dateString) return null;
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// Helper function to format date of birth for display (Month DD, YYYY)
function formatDateDisplay(dateString) {
	if (!dateString) return 'N/A';
	const date = new Date(dateString);
	const options = { year: 'numeric', month: 'long', day: 'numeric' };
	return date.toLocaleDateString('en-US', options);
}

