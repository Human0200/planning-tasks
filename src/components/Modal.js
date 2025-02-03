export function createModal(title, content, options = {}) {
  const modalContainer = document.createElement('div');
  modalContainer.id = 'modal-container';
  modalContainer.classList.add(
    'fixed',
    'inset-0',
    'flex',
    'items-center',
    'justify-center',
    'z-50',
  );

  const backdrop = document.createElement('div');
  backdrop.classList.add('absolute', 'inset-0', 'bg-black', 'opacity-50');
  backdrop.addEventListener('click', () => modalContainer.remove());

  const modal = document.createElement('div');
  modal.classList.add('bg-white', 'rounded-lg', 'shadow-lg', 'p-6', 'relative');
  modal.style.width = options.width || '500px';

  modal.innerHTML = `
    <div class="flex justify-between items-center border-b pb-3">
      <h2 class="text-lg font-semibold">${title}</h2>
      <button id="close-modal" class="text-gray-500 hover:text-gray-700">&times;</button>
    </div>
    <div class="mt-4">${content}</div>
  `;

  modalContainer.appendChild(backdrop);
  modalContainer.appendChild(modal);
  document.body.appendChild(modalContainer);

  document.getElementById('close-modal').addEventListener('click', () => {
    modalContainer.remove();
  });
}
