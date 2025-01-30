export function EventForm() {
  const form = document.createElement('form');
  form.className = 'p-4 bg-white shadow-md rounded-lg';
  form.innerHTML = `
    <label class="block mb-2 text-sm font-medium text-gray-700">Название события</label>
    <input type="text" id="event-name" class="w-full p-2 border border-gray-300 rounded mb-2" placeholder="Введите название">

    <label class="block mb-2 text-sm font-medium text-gray-700">Дата и время</label>
    <input type="datetime-local" id="event-date" class="w-full p-2 border border-gray-300 rounded mb-2">

    <button type="submit" class="w-full mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
      Создать событие
    </button>
  `;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const eventName = document.getElementById('event-name').value;
    const eventDate = document.getElementById('event-date').value;

    console.log(`Событие: ${eventName}, Дата: ${eventDate}`);
  });

  return form;
}
