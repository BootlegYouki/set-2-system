import { w as push, G as head, y as pop, I as ensure_array_like, J as attr_class, K as escape_html, M as stringify, N as attr } from './index-DG4mDhwe.js';
import { t as toastStore, m as modalStore } from './auth-Cnb4WhwS.js';

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
    $$payload.out.push(`<div${attr_class(`toast toast-${stringify(type)}`, "svelte-l93vew", { "toast-visible": !hiding, "toast-hiding": hiding })}><div class="toast-content svelte-l93vew"><span class="material-symbols-outlined toast-icon svelte-l93vew">${escape_html(getIcon(type))}</span> <span class="toast-message svelte-l93vew">${escape_html(message)}</span> <button class="toast-close svelte-l93vew" aria-label="Close notification"><span class="material-symbols-outlined svelte-l93vew">close</span></button></div></div>`);
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
  $$payload.out.push(`<div class="toast-container svelte-9k6dxx"><!--[-->`);
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
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  let currentFavicon = favicon;
  head($$payload, ($$payload2) => {
    $$payload2.out.push(`<link rel="icon"${attr("href", currentFavicon)}/> <link rel="preconnect" href="https://fonts.googleapis.com"/> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/> <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/> <meta name="viewport" content="width=device-width, initial-scale=1.0"/> <meta name="theme-color" content="#1565c0"/>`);
  });
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  ToastContainer($$payload);
  $$payload.out.push(`<!----> `);
  ModalContainer($$payload);
  $$payload.out.push(`<!---->`);
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-CvAmEXBP.js.map
