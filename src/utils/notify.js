import Swal from 'sweetalert2'

const toastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
})

export function successToast(message) {
  return toastMixin.fire({ icon: 'success', title: message })
}

export function errorToast(message) {
  return toastMixin.fire({ icon: 'error', title: message })
}

export async function confirmDialog(title, text, options = {}) {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? 'Evet, sil',
    cancelButtonText: options.cancelButtonText ?? 'Vazgeç',
    confirmButtonColor: '#dc2626',
    reverseButtons: true,
  })

  return result.isConfirmed
}
