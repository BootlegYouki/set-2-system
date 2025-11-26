import { w as push, G as head, y as pop, I as ensure_array_like, J as store_get, K as attr_class, M as unsubscribe_stores, N as escape_html, O as attr, P as stringify, Q as attr_style } from './index-BwMdFRNM.js';
import { t as toastStore, m as modalStore, s as studentDocReqModalStore, a as studentGradeModalStore, d as docReqModalStore } from './studentGradeModalStore-V1jsZG2G.js';

const favicon = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20height='48px'%20viewBox='0%20-960%20960%20960'%20width='48px'%20fill='%23789DE5'%3e%3cpath%20d='M222-255q63-40%20124.5-60.5T480-336q72%200%20134%2020.5T739-255q44-54%2062.5-109T820-480q0-145-97.5-242.5T480-820q-145%200-242.5%2097.5T140-480q0%2061%2019%20116t63%20109Zm257.81-195q-57.81%200-97.31-39.69-39.5-39.68-39.5-97.5%200-57.81%2039.69-97.31%2039.68-39.5%2097.5-39.5%2057.81%200%2097.31%2039.69%2039.5%2039.68%2039.5%2097.5%200%2057.81-39.69%2097.31-39.68%2039.5-97.5%2039.5Zm-.21%20370q-83.15%200-156.28-31.5t-127.22-86Q142-252%20111-324.84%2080-397.68%2080-480.5t31.5-155.66Q143-709%20197.5-763t127.34-85.5Q397.68-880%20480.5-880t155.66%2031.5Q709-817%20763-763t85.5%20127Q880-563%20880-480.27q0%2082.74-31.5%20155.5Q817-252%20763-197.5t-127.13%2086Q562.74-80%20479.6-80Z'/%3e%3c/svg%3e";
function Toast($$payload, $$props) {
  push();
  let { message = "", type = "success" } = $$props;
  let hiding = false;
  function getIcon(type2) {
    switch (type2) {
      case "success":
        return "check_circle";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "check_circle";
    }
  }
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class(`toast toast-${stringify(type)}`, "svelte-1rmoiu", { "toast-visible": !hiding, "toast-hiding": hiding })}><div class="toast-content svelte-1rmoiu"><span class="material-symbols-outlined toast-icon svelte-1rmoiu">${escape_html(getIcon(type))}</span> <span class="toast-message svelte-1rmoiu">${escape_html(message)}</span> <button class="toast-close svelte-1rmoiu" aria-label="Close notification"><span class="material-symbols-outlined svelte-1rmoiu">close</span></button></div></div>`);
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function ToastContainer($$payload, $$props) {
  push();
  let toasts = [];
  toastStore.subscribe((value) => {
    toasts = value;
  });
  const each_array = ensure_array_like(toasts);
  $$payload.out.push(`<div class="toast-container svelte-n5a2bz"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let toast = each_array[$$index];
    Toast($$payload, {
      message: toast.message,
      type: toast.type,
      duration: toast.duration
    });
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function Modal($$payload, $$props) {
  push();
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function AdminDocumentRequestModal($$payload, $$props) {
  push();
  let {
    request = {},
    requestStatuses = [],
    modalStatuses = []
  } = $$props;
  let selectedRequest = { ...request };
  let isModalStatusDropdownOpen = false;
  let newMessage = "";
  let isSendingMessage = false;
  let selectedFiles = [];
  let paymentStatus = "pending";
  let messages = selectedRequest.messages || [];
  let savedStatus = request.status || "";
  request.paymentStatus || "pending";
  let isChatDisabled = savedStatus === "released" || savedStatus === "cancelled";
  function formatTentativeDateForDisplay(dateStr) {
    if (!dateStr) return "--/--/----";
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return "--/--/----";
    return `${m}/${d}/${y}`;
  }
  let modalCurrentStatusName = selectedRequest ? (requestStatuses.find((s) => s.id === selectedRequest.status) || {}).name || "Select" : "Select";
  const each_array = ensure_array_like(
    // Watch for message changes and scroll to bottom (including automated messages)
    // Scroll to bottom whenever messages change
    // Start polling when component mounts
    // Poll every 8 seconds for new messages (reduced from 3s to reduce server load)
    // Listen for visibility changes to pause polling when tab is hidden
    // Scroll to bottom when messages change
    // Cleanup on unmount
    modalStatuses
  );
  $$payload.out.push(`<div class="docreq-modal-content svelte-qbny1s"><div class="docreq-modal-grid svelte-qbny1s"><div class="docreq-modal-left-container svelte-qbny1s"><header class="docreq-modal-title svelte-qbny1s"><div class="docreq-modal-title-row svelte-qbny1s"><div><h2 class="svelte-qbny1s">Request Details</h2> <div class="docreq-modal-sub svelte-qbny1s">ID: <span>${escape_html(selectedRequest.requestId)}</span></div></div> `);
  if (selectedRequest.status === "for_pickup") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="generate-receipt-btn svelte-qbny1s" title="Generate Receipt"><span class="material-symbols-outlined svelte-qbny1s">receipt</span> <span>Generate Receipt</span></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></header> <div class="docreq-cards svelte-qbny1s"><div class="docreq-card svelte-qbny1s"><div class="card-label svelte-qbny1s"><span class="material-symbols-outlined">description</span> Document Type</div> <div class="admin-card-value svelte-qbny1s">${escape_html(selectedRequest.documentType)}</div></div> <div class="docreq-card svelte-qbny1s"><div class="card-label svelte-qbny1s"><span class="material-symbols-outlined">info</span> Status</div> <div class="admin-card-value svelte-qbny1s"><div${attr_class("docreq-status-dropdown svelte-qbny1s", void 0, { "open": isModalStatusDropdownOpen })} aria-haspopup="listbox"${attr("aria-expanded", isModalStatusDropdownOpen)}><button class="docreq-status-dropdown-trigger svelte-qbny1s" aria-label="Change status"${attr("disabled", request?.status === "cancelled" || request?.status === "rejected" || request?.status === "released", true)}><span class="docreq-status-dropdown-label svelte-qbny1s">${escape_html(modalCurrentStatusName)}</span> <span class="material-symbols-outlined docreq-status-dropdown-caret svelte-qbny1s">${escape_html("expand_more")}</span></button> <div class="docreq-status-dropdown-menu svelte-qbny1s" role="listbox" aria-label="Select status"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let st = each_array[$$index];
    $$payload.out.push(`<button type="button" class="docreq-status-item svelte-qbny1s" role="option"${attr("aria-selected", selectedRequest.status === st.id)}><span${attr_class(`status-dot ${stringify(st.id)}`, "svelte-qbny1s")}></span> <span class="status-text svelte-qbny1s">${escape_html(st.name)}</span></button>`);
  }
  $$payload.out.push(`<!--]--></div></div></div></div> <div class="docreq-card svelte-qbny1s"><div class="card-label svelte-qbny1s"><span class="material-symbols-outlined">account_circle</span> Processed By</div> <div class="admin-card-value svelte-qbny1s">${escape_html(selectedRequest.processedBy ?? "—")}</div></div> `);
  if (selectedRequest.tentativeDate) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="docreq-card svelte-qbny1s"><div class="card-label svelte-qbny1s"><span class="material-symbols-outlined">event</span> ${escape_html(selectedRequest.status === "for_compliance" ? "Deadline" : "Tentative Date")}</div> <div class="admin-card-value svelte-qbny1s"><div class="date-box readonly svelte-qbny1s">${escape_html(formatTentativeDateForDisplay(selectedRequest.tentativeDate))}</div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="docreq-card svelte-qbny1s"><div class="card-label svelte-qbny1s"><span class="material-symbols-outlined">numbers</span> Quantity</div> <div class="admin-card-value svelte-qbny1s">${escape_html(selectedRequest.quantity ? `${selectedRequest.quantity} ${selectedRequest.quantity === 1 ? "Copy" : "Copies"}` : "—")}</div></div> <div class="docreq-card svelte-qbny1s"><div class="card-label svelte-qbny1s"><span class="material-symbols-outlined">payments</span> Payment Amount</div> <div class="admin-card-value svelte-qbny1s"><div class="payment-display-container svelte-qbny1s"><div${attr_class(`payment-readonly ${stringify(request?.status !== "cancelled" && request?.status !== "rejected" && selectedRequest.paymentAmount !== null && selectedRequest.paymentAmount !== void 0 ? paymentStatus : "")}`, "svelte-qbny1s")}>`);
  if (selectedRequest.paymentAmount !== null && selectedRequest.paymentAmount !== void 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`₱${escape_html(selectedRequest.paymentAmount.toFixed(2))}`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<span class="not-set svelte-qbny1s">Not set</span>`);
  }
  $$payload.out.push(`<!--]--></div> <div class="payment-actions svelte-qbny1s"><button${attr_class(`payment-status-toggle ${stringify("paid")}`, "svelte-qbny1s")}${attr("title", selectedRequest.paymentAmount === null || selectedRequest.paymentAmount === void 0 ? "Set payment amount first" : "Mark as paid")}${attr("aria-label", "Mark as paid")}${attr("disabled", savedStatus === "cancelled" || savedStatus === "rejected" || savedStatus === "released" || selectedRequest.paymentAmount === null || selectedRequest.paymentAmount === void 0, true)}><span class="material-symbols-outlined svelte-qbny1s">${escape_html("check_circle")}</span></button></div></div></div></div> `);
  if (selectedRequest.status === "cancelled" && selectedRequest.cancelledDate) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="docreq-card svelte-qbny1s"><div class="card-label svelte-qbny1s"><span class="material-symbols-outlined">event_busy</span> Cancelled Date</div> <div class="admin-card-value svelte-qbny1s">${escape_html(selectedRequest.cancelledDate)}</div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="docreq-purpose svelte-qbny1s"><div class="purpose-label svelte-qbny1s"><span class="material-symbols-outlined">description</span> Purpose &amp; Details</div> <div class="purpose-content svelte-qbny1s">${escape_html(selectedRequest.purpose ?? "No purpose provided")}</div></div> <div class="action-buttons svelte-qbny1s"><button class="docreq-approve-button svelte-qbny1s"${attr("disabled", request?.status === "cancelled" || request?.status === "rejected" || request?.status === "released", true)}><span class="material-symbols-outlined svelte-qbny1s">check_circle</span> Update Request</button> <button class="docreq-reject-button svelte-qbny1s"${attr("disabled", savedStatus === "cancelled" || savedStatus === "rejected" || savedStatus === "released", true)}><span class="material-symbols-outlined svelte-qbny1s">cancel</span> Reject Request</button> <button class="docreq-complete-button svelte-qbny1s"><span class="material-symbols-outlined svelte-qbny1s">arrow_back</span> Back</button></div></div> <div class="docreq-modal-right-container svelte-qbny1s"><div class="student-info-section svelte-qbny1s"><h3 class="svelte-qbny1s"><span class="material-symbols-outlined">school</span> Student Information</h3> <div class="student-info-grid svelte-qbny1s"><div class="student-field svelte-qbny1s"><div class="field-label svelte-qbny1s">Student ID</div> <div class="field-value svelte-qbny1s">${escape_html(selectedRequest.studentId)}</div></div> <div class="student-field svelte-qbny1s"><div class="field-label svelte-qbny1s">Full Name</div> <div class="field-value svelte-qbny1s">${escape_html(selectedRequest.studentName)}</div></div> <div class="student-field svelte-qbny1s"><div class="field-label svelte-qbny1s">Grade &amp; Section</div> <div class="field-value svelte-qbny1s">${escape_html(selectedRequest.gradeLevel)} - ${escape_html(selectedRequest.section || "N/A")}</div></div> <div class="student-field svelte-qbny1s"><div class="field-label svelte-qbny1s">Date of birth</div> <div class="field-value svelte-qbny1s">${escape_html(selectedRequest.dateOfBirth ?? "—")}</div></div></div></div> <div class="chat-container svelte-qbny1s"><div class="chat-header svelte-qbny1s"><h3 class="svelte-qbny1s"><span class="material-symbols-outlined svelte-qbny1s">forum</span> Communication</h3> <span class="chat-count-badge svelte-qbny1s">${escape_html(messages.length)}</span></div> <div class="admin-chat-messages svelte-qbny1s">`);
  if (messages.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(messages);
    $$payload.out.push(`<!--[-->`);
    for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
      let msg = each_array_1[$$index_2];
      $$payload.out.push(`<div${attr_class(`message-wrapper ${stringify(msg.authorRole === "admin" ? "sent" : "received")}`, "svelte-qbny1s")}>`);
      if (msg.authorRole !== "admin") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="message-avatar svelte-qbny1s"><span class="material-symbols-outlined svelte-qbny1s">account_circle</span></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> <div class="message-bubble svelte-qbny1s"><div class="message-header svelte-qbny1s"><span class="message-author svelte-qbny1s">${escape_html(msg.author)}</span> <span class="message-time svelte-qbny1s">${escape_html(new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</span></div> `);
      if (msg.text) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="admin-document-request-message-text">${escape_html(msg.text)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (msg.attachments && msg.attachments.length > 0) {
        $$payload.out.push("<!--[-->");
        const each_array_2 = ensure_array_like(msg.attachments);
        $$payload.out.push(`<div class="message-attachments svelte-qbny1s"><!--[-->`);
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let attachment = each_array_2[$$index_1];
          $$payload.out.push(`<button class="attachment-item svelte-qbny1s"><span class="material-symbols-outlined svelte-qbny1s">attach_file</span> <div class="attachment-info svelte-qbny1s"><span class="attachment-name svelte-qbny1s">${escape_html(attachment.name)}</span> <span class="attachment-size svelte-qbny1s">${escape_html((attachment.size / 1024).toFixed(1))} KB</span></div> <span class="material-symbols-outlined svelte-qbny1s">download</span></button>`);
        }
        $$payload.out.push(`<!--]--></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="no-chat svelte-qbny1s"><span class="material-symbols-outlined svelte-qbny1s">chat_bubble_outline</span> <p class="svelte-qbny1s">No messages yet</p> <p class="subtitle svelte-qbny1s">Start a conversation with the student</p></div>`);
  }
  $$payload.out.push(`<!--]--></div> <div class="admin-chat-input-wrapper svelte-qbny1s">`);
  if (selectedFiles.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_3 = ensure_array_like(selectedFiles);
    $$payload.out.push(`<div class="selected-files-preview svelte-qbny1s"><!--[-->`);
    for (let index = 0, $$length = each_array_3.length; index < $$length; index++) {
      let file = each_array_3[index];
      $$payload.out.push(`<div class="file-preview-item svelte-qbny1s"><span class="material-symbols-outlined svelte-qbny1s">description</span> <span class="file-preview-name svelte-qbny1s">${escape_html(file.name)}</span> <span class="file-preview-size svelte-qbny1s">(${escape_html((file.size / 1024).toFixed(1))} KB)</span> <button class="remove-file-btn svelte-qbny1s" title="Remove file"><span class="material-symbols-outlined svelte-qbny1s">close</span></button></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div${attr_class("admin-chat-input svelte-qbny1s", void 0, { "disabled": isChatDisabled })}>`);
  if (isChatDisabled) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="chat-disabled-notice svelte-qbny1s"><span class="material-symbols-outlined svelte-qbny1s">block</span> <span>Chat is disabled for ${escape_html(savedStatus === "released" ? "released" : "cancelled")} requests</span></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style="display: none;" class="svelte-qbny1s"/> <button class="attach-btn svelte-qbny1s" title="Attach file" aria-label="Attach file"><span class="material-symbols-outlined svelte-qbny1s">attach_file</span></button> <input placeholder="Type your message..." aria-label="Message input"${attr("value", newMessage)}${attr("disabled", isSendingMessage, true)} class="svelte-qbny1s"/> <button class="send-btn svelte-qbny1s" title="Send message" aria-label="Send message"${attr("disabled", !newMessage.trim() && selectedFiles.length === 0, true)}><span class="material-symbols-outlined svelte-qbny1s">send</span></button>`);
  }
  $$payload.out.push(`<!--]--></div></div></div></div></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function ModalContainer($$payload, $$props) {
  push();
  let modals = [];
  modalStore.subscribe((value) => {
    modals = value;
  });
  const each_array = ensure_array_like(modals);
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let modal = each_array[$$index];
    Modal($$payload, {
      title: modal.props.title || "",
      size: modal.options.size || "medium",
      closable: modal.options.closable !== false,
      backdrop: modal.options.backdrop !== false
    });
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function AdminDocumentRequestModalContainer($$payload, $$props) {
  push();
  var $$store_subs;
  let modalState = store_get($$store_subs ??= {}, "$docReqModalStore", docReqModalStore);
  let visible = false;
  let closing = false;
  if (modalState.isOpen || visible || closing) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class("docreq-modal-overlay svelte-1yi457b", void 0, {
      "docreq-modal-visible": visible,
      "docreq-modal-closing": closing
    })} role="dialog" aria-modal="true" tabindex="-1">`);
    AdminDocumentRequestModal($$payload, {
      request: modalState.request,
      requestStatuses: modalState.requestStatuses,
      modalStatuses: modalState.modalStatuses,
      onUpdate: modalState.onUpdate,
      onReject: modalState.onReject
    });
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function StudentDocumentRequestModal($$payload, $$props) {
  push();
  let {
    request = {}
  } = $$props;
  let selectedRequest = { ...request };
  let newMessage = "";
  let isSendingMessage = false;
  let selectedFiles = [];
  let currentPage = 1;
  let messages = selectedRequest.messages || [];
  let isChatDisabled = selectedRequest.status === "released" || selectedRequest.status === "cancelled";
  function getStatusDisplayName(status) {
    const statusNames = {
      "on_hold": "On Hold",
      "verifying": "Verifying",
      "for_compliance": "For Compliance",
      "processing": "For Processing",
      "for_pickup": "For Pick Up",
      "released": "Released",
      "non_compliance": "Non-Compliant",
      "rejected": "Rejected",
      "cancelled": "Cancelled"
    };
    return statusNames[status] || status;
  }
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
  $$payload.out.push(`<div class="student-docreq-modal-content svelte-1mqkwr3"><div class="student-docreq-modal-grid svelte-1mqkwr3"><div${attr_class("student-docreq-modal-left-container svelte-1mqkwr3", void 0, {
    "mobile-hidden": (
      // Start polling when component mounts
      // Poll every 8 seconds for new messages (reduced from 3s to reduce server load)
      // Listen for visibility changes to pause polling when tab is hidden
      // Scroll to bottom when messages change
      // Cleanup on unmount
      currentPage !== 1
    )
  })}><header class="student-docreq-modal-title svelte-1mqkwr3"><h2 class="svelte-1mqkwr3">Request Details</h2> <div class="student-docreq-modal-sub svelte-1mqkwr3">ID: <span>${escape_html(selectedRequest.requestId)}</span></div></header> <div class="student-docreq-cards svelte-1mqkwr3"><div${attr_class(`student-docreq-card full-width status-card-horizontal status-card-${stringify(selectedRequest.status)}`, "svelte-1mqkwr3")}><div class="status-group svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">info</span> Status:</div> <button${attr_class(`status-badge status-${stringify(selectedRequest.status)}`, "svelte-1mqkwr3")} title="Click to view status history" aria-label="View status history timeline">${escape_html(getStatusDisplayName(selectedRequest.status))}</button></div> <button class="status-info-button svelte-1mqkwr3" title="Click to view status flow information" aria-label="View status flow information"><span class="material-symbols-outlined svelte-1mqkwr3">help</span></button></div> <div class="student-docreq-card third-row svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">description</span> Document Type</div> <div class="card-value svelte-1mqkwr3">${escape_html(selectedRequest.type)}</div></div> <div class="student-docreq-card third-row svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">numbers</span> Quantity</div> <div class="card-value svelte-1mqkwr3">${escape_html(selectedRequest.quantity || 1)} ${escape_html((selectedRequest.quantity || 1) === 1 ? "copy" : "copies")}</div></div> <div class="student-docreq-card third-row svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">account_circle</span> Processed By</div> <div class="card-value svelte-1mqkwr3">${escape_html(selectedRequest.processedBy ?? "—")}</div></div> `);
  if (selectedRequest.paymentAmount !== null && selectedRequest.paymentAmount !== void 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="student-docreq-card third-row svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">payments</span> Total Payment</div> <div class="card-value payment-value svelte-1mqkwr3">`);
    if (selectedRequest.paymentAmount === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="payment-amount free svelte-1mqkwr3">Free</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (selectedRequest.paymentStatus === "pending") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<a href="javascript:void(0)" class="payment-amount pending clickable svelte-1mqkwr3" title="Click to view payment instructions" aria-label="View payment instructions" role="button">₱${escape_html((selectedRequest.paymentAmount || 0).toFixed(2))} (Pending)</a>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<span class="payment-amount paid svelte-1mqkwr3">₱${escape_html((selectedRequest.paymentAmount || 0).toFixed(2))} (Paid)</span>`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="student-docreq-card third-row svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">calendar_today</span> Requested Date</div> <div class="card-value svelte-1mqkwr3">${escape_html(selectedRequest.requestedDate ?? "—")}</div></div> `);
  if (selectedRequest.status === "cancelled" && selectedRequest.cancelledDate) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="student-docreq-card third-row svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">event_busy</span> Cancelled Date</div> <div class="card-value svelte-1mqkwr3">${escape_html(selectedRequest.cancelledDate)}</div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (selectedRequest.tentativeDate) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="student-docreq-card third-row svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">event</span> ${escape_html(selectedRequest.status === "for_compliance" ? "Deadline" : "Tentative Date")}</div> <div class="card-value svelte-1mqkwr3"><div class="date-display svelte-1mqkwr3">${escape_html(formatDate(selectedRequest.tentativeDate))}</div></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> `);
  if (selectedRequest.status === "released" && selectedRequest.completedDate) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="student-docreq-card svelte-1mqkwr3"><div class="card-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">check_circle</span> Released Date</div> <div class="card-value svelte-1mqkwr3">${escape_html(selectedRequest.completedDate)}</div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="student-docreq-purpose svelte-1mqkwr3"><div class="purpose-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">description</span> Purpose &amp; Details</div> <div class="purpose-content svelte-1mqkwr3">${escape_html(selectedRequest.purpose || "No purpose provided")}</div></div> `);
  if (selectedRequest.adminNote) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="admin-note-section svelte-1mqkwr3"><div class="note-label svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">note</span> Admin Note</div> <p class="note-text svelte-1mqkwr3">${escape_html(selectedRequest.adminNote)}</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="student-modal-action-buttons svelte-1mqkwr3"><button class="student-cancel-button svelte-1mqkwr3"${attr("disabled", selectedRequest.status !== "on_hold", true)}${attr("title", selectedRequest.status !== "on_hold" ? "Can only cancel requests that are on hold" : "Cancel this request")}><span class="material-symbols-outlined svelte-1mqkwr3">cancel</span> Cancel Request</button> <button class="student-back-button svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">arrow_back</span> Back</button></div></div> <div${attr_class("student-docreq-modal-right-container svelte-1mqkwr3", void 0, { "mobile-hidden": currentPage !== 2 })}><div class="chat-container svelte-1mqkwr3"><div class="chat-header svelte-1mqkwr3"><h3 class="svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">forum</span> Communication</h3> <span class="chat-count-badge svelte-1mqkwr3">${escape_html(messages.length)}</span></div> <div class="student-chat-messages svelte-1mqkwr3">`);
  if (messages.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(messages);
    $$payload.out.push(`<!--[-->`);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let msg = each_array[$$index_1];
      $$payload.out.push(`<div${attr_class(`message-wrapper ${stringify(msg.authorRole === "admin" ? "received" : "sent")}`, "svelte-1mqkwr3")}>`);
      if (msg.authorRole === "admin") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="message-avatar svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">admin_panel_settings</span></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> <div class="message-bubble svelte-1mqkwr3"><div class="message-header svelte-1mqkwr3"><span class="message-author svelte-1mqkwr3">${escape_html(msg.author)}</span> <span class="message-time svelte-1mqkwr3">${escape_html(new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</span></div> `);
      if (msg.text) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="student-document-request-message-text">${escape_html(msg.text)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (msg.attachments && msg.attachments.length > 0) {
        $$payload.out.push("<!--[-->");
        const each_array_1 = ensure_array_like(msg.attachments);
        $$payload.out.push(`<div class="message-attachments svelte-1mqkwr3"><!--[-->`);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let attachment = each_array_1[$$index];
          $$payload.out.push(`<button class="attachment-item svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">attach_file</span> <div class="attachment-info svelte-1mqkwr3"><span class="attachment-name svelte-1mqkwr3">${escape_html(attachment.name)}</span> <span class="attachment-size svelte-1mqkwr3">${escape_html((attachment.size / 1024).toFixed(1))} KB</span></div> <span class="material-symbols-outlined svelte-1mqkwr3">download</span></button>`);
        }
        $$payload.out.push(`<!--]--></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="no-chat svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">chat_bubble_outline</span> <p class="svelte-1mqkwr3">No messages yet</p> <p class="subtitle svelte-1mqkwr3">Start a conversation with the admin</p></div>`);
  }
  $$payload.out.push(`<!--]--></div> <div class="student-chat-input-wrapper svelte-1mqkwr3">`);
  if (selectedFiles.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_2 = ensure_array_like(selectedFiles);
    $$payload.out.push(`<div class="selected-files-preview svelte-1mqkwr3"><!--[-->`);
    for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
      let file = each_array_2[index];
      $$payload.out.push(`<div class="file-preview-item svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">description</span> <span class="file-preview-name svelte-1mqkwr3">${escape_html(file.name)}</span> <span class="file-preview-size svelte-1mqkwr3">(${escape_html((file.size / 1024).toFixed(1))} KB)</span> <button class="remove-file-btn svelte-1mqkwr3" title="Remove file"><span class="material-symbols-outlined svelte-1mqkwr3">close</span></button></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div${attr_class("student-chat-input svelte-1mqkwr3", void 0, { "disabled": isChatDisabled })}>`);
  if (isChatDisabled) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="chat-disabled-notice svelte-1mqkwr3"><span class="material-symbols-outlined svelte-1mqkwr3">block</span> <span>Chat is disabled for ${escape_html(selectedRequest.status === "released" ? "released" : "cancelled")} requests</span></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style="display: none;" class="svelte-1mqkwr3"/> <button class="attach-btn svelte-1mqkwr3" title="Attach file" aria-label="Attach file"><span class="material-symbols-outlined svelte-1mqkwr3">attach_file</span></button> <input placeholder="Type your message..." aria-label="Message input"${attr("value", newMessage)}${attr("disabled", isSendingMessage, true)} class="svelte-1mqkwr3"/> <button class="send-btn svelte-1mqkwr3" title="Send message" aria-label="Send message"${attr("disabled", !newMessage.trim() && selectedFiles.length === 0, true)}><span class="material-symbols-outlined svelte-1mqkwr3">send</span></button>`);
  }
  $$payload.out.push(`<!--]--></div></div></div></div></div> <div class="mobile-pagination-controls svelte-1mqkwr3"><div class="pagination-dots svelte-1mqkwr3"><button${attr_class("pagination-dot svelte-1mqkwr3", void 0, { "active": currentPage === 1 })} aria-label="Go to request details"><span class="material-symbols-outlined svelte-1mqkwr3">description</span></button> <button${attr_class("pagination-dot svelte-1mqkwr3", void 0, { "active": currentPage === 2 })} aria-label="Go to chat"><span class="material-symbols-outlined svelte-1mqkwr3">forum</span></button></div></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function StudentDocumentRequestModalContainer($$payload, $$props) {
  push();
  let modalState = {
    isOpen: false,
    request: null,
    onCancel: null,
    onRefresh: null
  };
  studentDocReqModalStore.subscribe((value) => {
    modalState = value;
  });
  let visible = false;
  let closing = false;
  if (modalState.isOpen || visible || closing) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class("student-docreq-modal-overlay svelte-1ingzcd", void 0, {
      "student-docreq-modal-visible": visible,
      "student-docreq-modal-closing": closing
    })} role="dialog" aria-modal="true" tabindex="-1">`);
    StudentDocumentRequestModal($$payload, {
      request: modalState.request,
      onCancel: modalState.onCancel,
      onRefresh: modalState.onRefresh
    });
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function StudentGradeModal($$payload, $$props) {
  push();
  let {
    subject = {},
    quarterName = "",
    schoolYear = ""
  } = $$props;
  function getGradeColor(grade) {
    if (grade === 0 || grade === null || grade === void 0) return "var(--grade-no-grade)";
    if (grade >= 85) return "var(--grade-excellent)";
    if (grade >= 80) return "var(--grade-good)";
    if (grade >= 75) return "var(--grade-satisfactory)";
    if (grade >= 65) return "var(--grade-needs-improvement)";
    return "var(--grade-needs-improvement)";
  }
  function getGradeIndicator(grade) {
    if (grade >= 85) return "Excellent";
    if (grade >= 80) return "Good";
    if (grade >= 75) return "Satisfactory";
    if (grade >= 65) return "Needs Improvement";
    return "No Grade";
  }
  function formatGradeDisplay(grade) {
    if (grade === null || grade === void 0 || grade === 0) return "N/A";
    if (grade % 1 === 0) {
      return grade.toString();
    }
    return grade.toFixed(1);
  }
  function formatScoreLabel(index, type) {
    const types = { written: "Quiz", performance: "Project", quarterly: "Exam" };
    return `${types[type] || "Task"} ${index + 1}`;
  }
  function getProgressWidth(grade) {
    if (!grade || grade === 0) return 0;
    return Math.min(grade / 100 * 100, 100);
  }
  function hasDetailedScores() {
    if (!subject) return false;
    return subject.writtenWorkScores && subject.writtenWorkScores.length > 0 || subject.performanceTasksScores && subject.performanceTasksScores.length > 0 || subject.quarterlyAssessmentScores && subject.quarterlyAssessmentScores.length > 0;
  }
  $$payload.out.push(`<div class="grade-modal-content svelte-1e19mq7">`);
  if (subject) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal-header svelte-1e19mq7"><div class="header-info svelte-1e19mq7"><h2 class="subject-title svelte-1e19mq7">${escape_html(subject.name || "Subject")}</h2> <div class="header-meta svelte-1e19mq7"><span class="meta-item svelte-1e19mq7"><span class="material-symbols-outlined svelte-1e19mq7">person</span> ${escape_html(subject.teacher || "No teacher assigned")}</span> <span class="meta-item svelte-1e19mq7"><span class="material-symbols-outlined svelte-1e19mq7">calendar_today</span> ${escape_html(quarterName)} • ${escape_html(schoolYear)}</span></div></div> <button class="close-btn svelte-1e19mq7" aria-label="Close modal"><span class="material-symbols-outlined svelte-1e19mq7">close</span></button></div> <div class="grade-overview-card svelte-1e19mq7"><div class="grade-display svelte-1e19mq7"><div class="grade-label svelte-1e19mq7">Final Grade</div> <div class="grade-value svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(subject.numericGrade))}`)}>${escape_html(formatGradeDisplay(subject.numericGrade))}</div> <div class="grade-status svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(subject.numericGrade))}`)}>${escape_html(getGradeIndicator(subject.numericGrade))}</div></div> <div class="grade-progress svelte-1e19mq7"><div class="progress-bar-container svelte-1e19mq7"><div class="progress-bar-fill svelte-1e19mq7"${attr_style(`width: ${stringify(getProgressWidth(subject.numericGrade))}%; background-color: ${stringify(getGradeColor(subject.numericGrade))}`)}></div></div></div></div> <div class="tab-content svelte-1e19mq7"><div class="breakdown-tab">`);
    if (hasDetailedScores()) {
      $$payload.out.push("<!--[-->");
      if (subject.writtenWorkScores && subject.writtenWorkScores.length > 0) {
        $$payload.out.push("<!--[-->");
        const each_array = ensure_array_like(subject.writtenWorkScores);
        $$payload.out.push(`<div class="breakdown-section svelte-1e19mq7"><div class="breakdown-header svelte-1e19mq7"><div class="breakdown-title svelte-1e19mq7"><span class="material-symbols-outlined svelte-1e19mq7">edit</span> <span>Written Work</span></div> <div class="breakdown-average svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(subject.writtenWork))}`)}>Avg: ${escape_html(formatGradeDisplay(subject.writtenWork))}</div></div> <div class="scores-grid svelte-1e19mq7"><!--[-->`);
        for (let i = 0, $$length = each_array.length; i < $$length; i++) {
          let score = each_array[i];
          $$payload.out.push(`<div class="score-card svelte-1e19mq7"><div class="score-label svelte-1e19mq7">${escape_html(formatScoreLabel(i, "written"))}</div> <div class="score-value svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(score))}`)}>${escape_html(formatGradeDisplay(score))}</div></div>`);
        }
        $$payload.out.push(`<!--]--></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (subject.performanceTasksScores && subject.performanceTasksScores.length > 0) {
        $$payload.out.push("<!--[-->");
        const each_array_1 = ensure_array_like(subject.performanceTasksScores);
        $$payload.out.push(`<div class="breakdown-section svelte-1e19mq7"><div class="breakdown-header svelte-1e19mq7"><div class="breakdown-title svelte-1e19mq7"><span class="material-symbols-outlined svelte-1e19mq7">assignment</span> <span>Performance Tasks</span></div> <div class="breakdown-average svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(subject.performanceTasks))}`)}>Avg: ${escape_html(formatGradeDisplay(subject.performanceTasks))}</div></div> <div class="scores-grid svelte-1e19mq7"><!--[-->`);
        for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
          let score = each_array_1[i];
          $$payload.out.push(`<div class="score-card svelte-1e19mq7"><div class="score-label svelte-1e19mq7">${escape_html(formatScoreLabel(i, "performance"))}</div> <div class="score-value svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(score))}`)}>${escape_html(formatGradeDisplay(score))}</div></div>`);
        }
        $$payload.out.push(`<!--]--></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (subject.quarterlyAssessmentScores && subject.quarterlyAssessmentScores.length > 0) {
        $$payload.out.push("<!--[-->");
        const each_array_2 = ensure_array_like(subject.quarterlyAssessmentScores);
        $$payload.out.push(`<div class="breakdown-section svelte-1e19mq7"><div class="breakdown-header svelte-1e19mq7"><div class="breakdown-title svelte-1e19mq7"><span class="material-symbols-outlined svelte-1e19mq7">quiz</span> <span>Quarterly Assessment</span></div> <div class="breakdown-average svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(subject.quarterlyAssessment))}`)}>Avg: ${escape_html(formatGradeDisplay(subject.quarterlyAssessment))}</div></div> <div class="scores-grid svelte-1e19mq7"><!--[-->`);
        for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
          let score = each_array_2[i];
          $$payload.out.push(`<div class="score-card svelte-1e19mq7"><div class="score-label svelte-1e19mq7">${escape_html(formatScoreLabel(i, "quarterly"))}</div> <div class="score-value svelte-1e19mq7"${attr_style(`color: ${stringify(getGradeColor(score))}`)}>${escape_html(formatGradeDisplay(score))}</div></div>`);
        }
        $$payload.out.push(`<!--]--></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="empty-state svelte-1e19mq7"><span class="material-symbols-outlined svelte-1e19mq7">pending</span> <p class="svelte-1e19mq7">No detailed scores available yet</p> <small class="svelte-1e19mq7">Scores will appear here once your teacher uploads them</small></div>`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function StudentGradeModalContainer($$payload, $$props) {
  push();
  let modalState = {
    isOpen: false,
    subject: null,
    quarterName: null,
    schoolYear: null
  };
  studentGradeModalStore.subscribe((value) => {
    modalState = value;
  });
  let visible = false;
  let closing = false;
  if (modalState.isOpen || visible || closing) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class("student-grade-modal-overlay svelte-niq90y", void 0, {
      "student-grade-modal-visible": visible,
      "student-grade-modal-closing": closing
    })} role="dialog" aria-modal="true" tabindex="-1">`);
    StudentGradeModal($$payload, {
      subject: modalState.subject,
      quarterName: modalState.quarterName,
      schoolYear: modalState.schoolYear
    });
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  let currentFavicon = favicon;
  head($$payload, ($$payload2) => {
    $$payload2.out.push(`<link rel="icon"${attr("href", currentFavicon)}/> <link rel="preconnect" href="https://fonts.googleapis.com"/> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/> <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet"/> <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/> <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/> <meta name="theme-color" content="#1565c0"/>`);
  });
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  ToastContainer($$payload);
  $$payload.out.push(`<!----> `);
  ModalContainer($$payload);
  $$payload.out.push(`<!----> `);
  AdminDocumentRequestModalContainer($$payload);
  $$payload.out.push(`<!----> `);
  StudentDocumentRequestModalContainer($$payload);
  $$payload.out.push(`<!----> `);
  StudentGradeModalContainer($$payload);
  $$payload.out.push(`<!---->`);
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-DQcUC5iq.js.map
