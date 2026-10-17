// Modal dialogs require an explicit Close/Cancel action. Sidebars, menus and
// tours retain their independent Escape behavior when no modal is open.
export const MODAL_SELECTOR = [
  'dialog[open]', '.modal', '.modal-shell', '.headteacher-modal-shell',
  '.records-modal-backdrop', '.answer-key-modal', '.join-class-modal',
  '.secretary-modal', '.invitation-dialog',
  '[aria-modal="true"]:not(.teacher-page-tour-dialog):not(.student-tour-dialog)',
].join(',')

export function protectModalFromEscape(event, root = document) {
  if (event.key !== 'Escape') return
  const openModal = Array.from(root.querySelectorAll(MODAL_SELECTOR)).some(element => {
    if (element.closest('.teacher-page-tour, .student-tour')) return false
    return element.getClientRects().length > 0 && !element.hidden
  })
  if (!openModal) return
  event.preventDefault()
  event.stopImmediatePropagation()
}

document.addEventListener('keydown', protectModalFromEscape, true)
if (import.meta.hot) import.meta.hot.dispose(() => document.removeEventListener('keydown', protectModalFromEscape, true))
