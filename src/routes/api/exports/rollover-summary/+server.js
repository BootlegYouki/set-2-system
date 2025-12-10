import { json } from '@sveltejs/kit';
import { connectToDatabase } from '../../../database/db.js';
import { verifyAuth } from '../../helper/auth-helper.js';
import PDFDocument from 'pdfkit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, url }) {
  try {
    // Verify authentication - only admin can export
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.success) {
      console.log('Export failed: Unauthorized');
      return json({ error: authResult.error }, { status: 401 });
    }

    const type = url.searchParams.get('type') || 'combined';
    console.log(`Starting rollover export for type: ${type}`);

    const db = await connectToDatabase();
    // Debug: Log what we are looking for
    console.log('Searching for last_rollover_details in admin_settings');
    const rolloverSettings = await db.collection('admin_settings').findOne({ setting_key: 'last_rollover_details' });

    if (!rolloverSettings || !rolloverSettings.setting_value) {
      console.log('Export failed: No rollover data found in DB');
      // Changed to 400 to distinguish from 404 Route Not Found
      return json({ error: 'No rollover summary found' }, { status: 400 });
    }

    // Note: admin-settings API stores it in 'setting_value', not 'value'
    // My previous code accessed 'rolloverSettings.value', but the PUT handler uses 'setting_value'.
    // This was likely the bug! 
    // Fix: access setting_value
    let summaryData = typeof rolloverSettings.setting_value === 'string'
      ? JSON.parse(rolloverSettings.setting_value)
      : rolloverSettings.setting_value;

    // Generate PDF
    const pdfBuffer = await generateSummaryPDF(summaryData, type);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="rollover-summary-${type}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating export:', error);
    return json({ error: 'Failed to generate export' }, { status: 500 });
  }
}

function generateSummaryPDF(data, type) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text('Rollover Summary Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`${data.previous_year} to ${data.new_year}`, { align: 'center' });
      doc.moveDown(2);

      // Filter data
      let studentsToPrint = [];

      if (type === 'promoted') {
        renderSection(doc, 'Promoted Students', data.promoted, '#16a34a');
      } else if (type === 'retained') {
        renderSection(doc, 'Retained Students', data.retained, '#ea580c');
      } else {
        // Combined
        renderSection(doc, 'Promoted Students', data.promoted, '#16a34a');

        // Check if we need a new page for the next section
        if (doc.y > 650) {
          doc.addPage();
        } else {
          doc.moveDown(2);
        }

        renderSection(doc, 'Retained Students', data.retained, '#ea580c');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderSection(doc, title, students, color) {
  // Ensure we don't start a section title at the very bottom
  if (doc.y > 700) {
    doc.addPage();
  }

  // Section Title
  doc.x = 50; // Reset X to left margin
  doc.fontSize(14).fillColor(color).font('Helvetica-Bold').text(`${title} (${students.length})`);
  doc.fillColor('black').moveDown(0.5);

  if (students.length === 0) {
    doc.fontSize(10).font('Helvetica-Oblique').text('No students in this category.');
    return;
  }

  // Table Header
  const tableTop = doc.y;
  const colX = { id: 50, name: 130, oldIdx: 330, newIdx: 400, gwa: 480 };

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('ID', colX.id, tableTop);
  doc.text('Name', colX.name, tableTop);
  doc.text('Old Grade', colX.oldIdx, tableTop);
  doc.text('New Grade', colX.newIdx, tableTop);
  doc.text('GWA', colX.gwa, tableTop, { width: 50, align: 'right' });

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').stroke();
  doc.moveDown(0.5);

  // Table Rows
  doc.font('Helvetica');
  students.forEach((student, index) => {
    // Check if close to bottom
    if (doc.y > 700) {
      doc.addPage();

      // Re-print Header on new page
      const headerY = doc.y; // Capture new top Y
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('ID', colX.id, headerY);
      doc.text('Name', colX.name, headerY);
      doc.text('Old Grade', colX.oldIdx, headerY);
      doc.text('New Grade', colX.newIdx, headerY);
      doc.text('GWA', colX.gwa, headerY, { width: 50, align: 'right' });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica');
    }

    const y = doc.y;

    doc.text(student.id, colX.id, y);
    doc.text(student.name, colX.name, y, { width: 190, ellipsis: true });
    doc.text(student.old_grade, colX.oldIdx, y);
    doc.text(student.new_grade, colX.newIdx, y);
    doc.text(student.gwa, colX.gwa, y, { width: 50, align: 'right' });

    doc.moveDown(1);
  });
}
