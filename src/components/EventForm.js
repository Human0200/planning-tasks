import { createModal } from './Modal.js';

export function showEventForm(date) {
  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // +30 минут

  // Форматируем дату для input type="date"
  const formattedDate = startDate.toISOString().split('T')[0];

  // Форматируем время для input type="time"
  const formattedStartTime = startDate.toTimeString().slice(0, 5);
  const formattedEndTime = endDate.toTimeString().slice(0, 5);

  // Проверяем, что выбран глобальный фильтр "Все"
  const userFilterValue = document.querySelector('#user-select')?.value;
  let executorSelectHTML = '';
  if (userFilterValue === 'all') {
    executorSelectHTML = `
      <label class="block text-sm font-medium text-gray-700">Исполнитель</label>
<div class="custom-executor-wrapper">
  <select id="event-executor" class="custom-executor border rounded w-full p-2 mb-4">
    <option value="">Выберите исполнителя</option>
    <option value="user1">Иванов Иван</option>
    <option value="user2">Петров Петр</option>
    <option value="user3">Сидоров Сидор</option>
    <option value="user4">Алексеева Анна</option>
    <option value="user5">Семенов Виктор</option>
  </select>
</div>

    `;
  }

  const formContent = `
    <form id="event-form" class="w-full">
      <label class="block text-sm font-medium text-gray-700">Название задачи</label>
      <input type="text" id="event-title" class="border rounded w-full p-2 mb-4" placeholder="Введите название">

      <label class="block text-sm font-medium text-gray-700">Дата</label>
      <input type="date" id="event-date" class="border rounded w-full p-2 mb-4" value="${formattedDate}" readonly>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Время начала</label>
          <input type="time" id="event-start-time" class="border rounded w-full p-2 mb-4" value="${formattedStartTime}">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Время окончания</label>
          <input type="time" id="event-end-time" class="border rounded w-full p-2 mb-4" value="${formattedEndTime}">
        </div>
      </div>

      ${executorSelectHTML} <!-- Вставляем селект исполнителя, если нужно -->

      <!-- Новое поле "Крайний срок" -->
      <label class="block text-sm font-medium text-gray-700">Крайний срок</label>
      <input type="date" id="event-deadline" class="border rounded w-full p-2 mb-4">

      <label class="block text-sm font-medium text-gray-700">Комментарий</label>
      <textarea id="event-comment" class="border rounded w-full p-2 mb-4" rows="3" placeholder="Дополнительная информация"></textarea>

      <div class="flex justify-end gap-4">
        <button type="button" id="cancel-event" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600">Отмена</button>
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">Создать</button>
      </div>
    </form>
  `;

  createModal('Создать задачу', formContent, { width: '600px', backdrop: 'rgba(0, 0, 0, 0.5)' });

  document.getElementById('cancel-event').addEventListener('click', () => {
    document.getElementById('modal-container').remove();
  });

  // Обработка изменения времени начала и коррекция времени окончания
  document.getElementById('event-start-time').addEventListener('change', () => {
    const startTime = document.getElementById('event-start-time').value;
    const endTimeInput = document.getElementById('event-end-time');

    if (startTime >= endTimeInput.value) {
      let [hours, minutes] = startTime.split(':');
      minutes = parseInt(minutes) + 30;
      if (minutes >= 60) {
        hours = parseInt(hours) + 1;
        minutes = minutes - 60;
      }
      endTimeInput.value = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    }
  });

  // Если селект исполнителя добавлен, инициализируем select2
  if (userFilterValue === 'all') {
    setTimeout(() => {
      if ($.fn.select2) {
        $('#event-executor').select2({
          placeholder: 'Выберите исполнителя',
          allowClear: true,
          width: 'style',
        });

        // Добавляем класс к контейнеру, чтобы потом в CSS его точечно настроить
        $('#event-executor').data('select2').$container.addClass('custom-executor-container');
      } else {
        console.error('❌ Ошибка: Select2 не найден!');
      }
    }, 100);
  }

  document.getElementById('event-form').addEventListener('submit', (e) => {
    e.preventDefault();

    // Считываем данные из формы
    const title = document.getElementById('event-title').value.trim() || 'Без названия';
    const dateValue = document.getElementById('event-date').value;
    const startTime = document.getElementById('event-start-time').value;
    const endTime = document.getElementById('event-end-time').value;
    const deadline = document.getElementById('event-deadline').value;
    const comment = document.getElementById('event-comment').value.trim();

    // Определяем исполнителя: если выбран режим "Все", берем из селекта внутри формы,
    // иначе – значение глобального селекта.
    let executor = '';
    const globalSelect = document.querySelector('#user-select');
    if (globalSelect.value === 'all' && document.getElementById('event-executor')) {
      executor = document.getElementById('event-executor').value;
    } else {
      executor = globalSelect.value;
    }

    // Формируем ISO-формат для начала и окончания события
    const eventStart = `${dateValue}T${startTime}`;
    const eventEnd = `${dateValue}T${endTime}`;

    // Добавляем событие в календарь (если экземпляр календаря доступен)
    if (window.calendar) {
      window.calendar.addEvent({
        title: title,
        start: eventStart,
        end: eventEnd,
        extendedProps: {
          comment: comment,
          deadline: deadline,
          executor: executor,
        },
      });
      console.log('✅ Задача добавлена в календарь');
    } else {
      console.error('❌ Глобальная переменная calendar не найдена!');
    }

    // Закрываем модальное окно
    document.getElementById('modal-container').remove();
  });
}
