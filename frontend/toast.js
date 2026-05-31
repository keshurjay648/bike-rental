// ── Global Toast Notification System ──────────────────────────────────────
(function () {
  // Inject styles once
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      #toast-container {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        pointer-events: none;
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 280px;
        max-width: 360px;
        padding: 0.85rem 1.1rem;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 8px 24px rgba(0,0,0,0.14);
        font-family: "Roboto", sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        color: #080a08;
        pointer-events: all;
        border-left: 4px solid #ccc;
        animation: toastIn 0.3s ease forwards;
        position: relative;
        overflow: hidden;
      }
      .toast.removing {
        animation: toastOut 0.3s ease forwards;
      }
      .toast-icon { font-size: 1.2rem; flex-shrink: 0; }
      .toast-msg  { flex: 1; line-height: 1.4; }
      .toast-close {
        background: none; border: none; cursor: pointer;
        color: #868e96; font-size: 1rem; padding: 0 0 0 0.4rem;
        flex-shrink: 0; line-height: 1;
      }
      .toast-close:hover { color: #080a08; }
      .toast-progress {
        position: absolute; bottom: 0; left: 0;
        height: 3px; background: currentColor; opacity: 0.3;
        animation: toastProgress linear forwards;
      }
      .toast.success { border-left-color: #28a745; color: #080a08; }
      .toast.success .toast-icon { color: #28a745; }
      .toast.error   { border-left-color: #ff4424; }
      .toast.error   .toast-icon { color: #ff4424; }
      .toast.info    { border-left-color: #f77214; }
      .toast.info    .toast-icon { color: #f77214; }
      .toast.warning { border-left-color: #fde628; }
      .toast.warning .toast-icon { color: #e6a817; }
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(60px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(60px); }
      }
      @keyframes toastProgress {
        from { width: 100%; }
        to   { width: 0%; }
      }
      @media (max-width: 479px) {
        #toast-container { bottom: 1rem; right: 0.5rem; left: 0.5rem; }
        .toast { min-width: unset; max-width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function getContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  const ICONS = {
    success: 'ri-checkbox-circle-line',
    error:   'ri-error-warning-line',
    info:    'ri-information-line',
    warning: 'ri-alert-line',
  };

  /**
   * Show a toast.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration  ms before auto-dismiss (0 = sticky)
   */
  window.showToast = function (message, type = 'info', duration = 3500) {
    const container = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `
      <i class="toast-icon ${ICONS[type] || ICONS.info}"></i>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Dismiss">&#x2715;</button>
      ${duration > 0 ? `<span class="toast-progress" style="animation-duration:${duration}ms"></span>` : ''}
    `;

    container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    if (duration > 0) setTimeout(dismiss, duration);

    return dismiss; // caller can dismiss early
  };
}());
