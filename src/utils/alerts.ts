import Swal from 'sweetalert2';

// Apple dark glassmorphism preset for SweetAlert2
export const appleSwal = Swal.mixin({
  background: '#121214',
  color: '#f5f5f7',
  backdrop: 'rgba(0, 0, 0, 0.75)',
  customClass: {
    popup: 'apple-glass rounded-3xl p-6 border border-white/10 shadow-2xl font-sans',
    title: 'text-lg font-semibold text-white tracking-tight',
    htmlContainer: 'text-sm text-zinc-400 font-normal mt-1 leading-relaxed',
    confirmButton: 'apple-button-primary px-5 py-2.5 rounded-full text-xs font-medium cursor-pointer shadow-lg mx-1.5',
    cancelButton: 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10 px-5 py-2.5 rounded-full text-xs font-medium cursor-pointer mx-1.5 transition-all',
  },
  buttonsStyling: false,
});

export const confirmDeleteAlert = async (projectName: string): Promise<boolean> => {
  const result = await appleSwal.fire({
    title: '¿Eliminar proyecto?',
    html: `Esta acción no se puede deshacer. Se eliminará el proyecto <strong>"${projectName}"</strong>, sus bloques y sus usuarios asociados.`,
    icon: 'warning',
    iconColor: '#ef4444',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
};

export const showSuccessToast = (title: string, message?: string) => {
  appleSwal.fire({
    title,
    text: message,
    icon: 'success',
    iconColor: '#10b981',
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

export const showErrorAlert = (title: string, message?: string) => {
  appleSwal.fire({
    title,
    text: message || 'Ocurrió un error inesperado al procesar la solicitud.',
    icon: 'error',
    iconColor: '#ef4444',
    confirmButtonText: 'Entendido',
  });
};
