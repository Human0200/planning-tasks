export function Modal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 hidden';
  modal.id = 'event-modal';

  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 class="text-lg font-semibold mb-4">Добавить событие</h2>
      <input type="text" id="event-title" class="w-full p-2 border border-gray-300 rounded mb-2" placeholder="Название события">
      <input type="datetime-local" id="event-date" class="w-full p-2 border border-gray-300 rounded mb-2">
      
      <div class="flex justify-end">
        <button id="close-modal" class="bg-gray-400 text-white py-2 px-4 rounded mr-2">Закрыть</button>
        <button id="save-event" class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">Сохранить</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  return modal;
}
