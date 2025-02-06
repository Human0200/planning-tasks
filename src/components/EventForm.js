import { createTask, deleteTask, updateTask } from '../services/taskService.js';
import { getUsers } from '../services/userService.js';
import { createModal } from './Modal.js';

export function showEventForm(date, eventData, options = {}) {
  const isEditMode = !!eventData;
  // Проверяем флаг "Весь день"
  const allDay = options.allDay || eventData?.extendedProps?.allDay || false;

  const settings = window.calendarSettings || { slotMinTime: '08:00', slotMaxTime: '18:00' };

  let startDate, formattedDate, formattedFinishDate, formattedStartTime, formattedEndTime;

  if (isEditMode) {
    // Редактирование
    startDate = new Date(eventData.start);
    const endDate = eventData.end
      ? new Date(eventData.end)
      : new Date(startDate.getTime() + 30 * 60 * 1000);

    formattedDate = startDate.toISOString().split('T')[0];
    formattedFinishDate = endDate.toISOString().split('T')[0];
    formattedStartTime = startDate.toTimeString().slice(0, 5);
    formattedEndTime = endDate.toTimeString().slice(0, 5);
  } else {
    // Создание
    startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    formattedDate = startDate.toISOString().split('T')[0];
    formattedFinishDate = endDate.toISOString().split('T')[0];
    formattedStartTime = startDate.toTimeString().slice(0, 5);
    formattedEndTime = endDate.toTimeString().slice(0, 5);

    if (allDay) {
      formattedStartTime = settings.slotMinTime; // или что-то вроде getUserCalendarStart()
      formattedEndTime = settings.slotMaxTime;
    }
  }

  const titleValue = eventData?.title || '';
  const deadlineValue = eventData?.extendedProps?.deadline || '';
  const commentValue = eventData?.extendedProps?.comment || '';

  const isNew = !isEditMode;
  const submitButtonText = isNew ? 'Создать' : 'Сохранить изменения';
  const modalTitle = isNew ? 'Создать задачу' : 'Редактировать задачу';
  const deleteButtonHTML = !isNew
    ? `<button type="button" id="delete-event" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700">Удалить задачу</button>`
    : '';

  const globalSelect = document.querySelector('#user-select');
  const userFilterValue = globalSelect?.value;
  let executorSelectHTML = '';
  if (userFilterValue === 'all') {
    executorSelectHTML = `
      <label class="block text-sm font-medium text-gray-700">Исполнитель</label>
      <div id="executor-container" class="custom-executor-wrapper mb-4"></div>
    `;
  }

  // Если allDay = true -> используем атрибут readonly в полях
  const readonlyAttr = allDay ? 'readonly' : '';

  // Генерируем форму
  const formContent = `
    <form id="event-form" class="w-full">
      <label class="block text-sm font-medium text-gray-700">Название задачи</label>
      <input
        type="text"
        id="event-title"
        class="border rounded w-full p-2 mb-4"
        placeholder="Введите название"
        value="${titleValue}"
      >

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Дата начала</label>
          <input
            type="date"
            id="event-date"
            class="border rounded w-full p-2 mb-4"
            value="${formattedDate}"
            ${readonlyAttr}
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Дата завершения</label>
          <input
            type="date"
            id="event-finish-date"
            class="border rounded w-full p-2 mb-4"
            value="${formattedFinishDate}"
            ${readonlyAttr}
          >
        </div>
      </div>

      <!-- Время начала/окончания (всегда показываем, но readonly при allDay) -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Время начала</label>
          <input
            type="time"
            id="event-start-time"
            class="border rounded w-full p-2 mb-4"
            value="${formattedStartTime}"
            ${readonlyAttr}
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Время окончания</label>
          <input
            type="time"
            id="event-end-time"
            class="border rounded w-full p-2 mb-4"
            value="${formattedEndTime}"
            ${readonlyAttr}
          >
        </div>
      </div>

      ${executorSelectHTML}

      <label class="block text-sm font-medium text-gray-700">Крайний срок</label>
      <input
        type="date"
        id="event-deadline"
        class="border rounded w-full p-2 mb-4"
        value="${deadlineValue}"
      >

      <label class="block text-sm font-medium text-gray-700">Комментарий</label>
      <textarea
        id="event-comment"
        class="border rounded w-full p-2 mb-4"
        rows="3"
        placeholder="Дополнительная информация"
      >${commentValue}</textarea>

      <div class="flex justify-end gap-4">
        <button
          type="button"
          id="cancel-event"
          class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
        >Отмена</button>
        ${deleteButtonHTML}
        <button
          type="submit"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
        >${submitButtonText}</button>
      </div>
    </form>
  `;

  createModal(modalTitle, formContent, {
    width: '600px',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  });

  // Кнопка "Отмена"
  document.getElementById('cancel-event').addEventListener('click', () => {
    document.getElementById('modal-container').remove();
  });

  // Динамическая загрузка исполнителей, если userFilterValue === 'all'
  if (userFilterValue === 'all') {
    const executorBlock = document.getElementById('executor-container');
    if (executorBlock) {
      getUsers((users) => {
        const selectEl = document.createElement('select');
        selectEl.id = 'event-executor';
        selectEl.className = 'custom-executor border rounded w-full p-2 mb-4';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Выберите исполнителя';
        selectEl.appendChild(defaultOpt);

        users.forEach((u) => {
          const opt = document.createElement('option');
          opt.value = u.ID;
          opt.textContent = `${u.NAME} ${u.LAST_NAME}`;
          selectEl.appendChild(opt);
        });

        executorBlock.appendChild(selectEl);

        // Инициализируем select2
        if ($.fn.select2) {
          $(selectEl).select2({
            placeholder: 'Выберите исполнителя',
            allowClear: true,
            width: 'style',
          });
          if (isEditMode && eventData?.extendedProps?.executor) {
            $(selectEl).val(eventData.extendedProps.executor).trigger('change');
          }
        }
      });
    }
  }

  // Обработчик сабмита формы
  document.getElementById('event-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('event-title').value.trim() || 'Без названия';
    const startDateVal = document.getElementById('event-date').value;
    const finishDateVal = document.getElementById('event-finish-date').value;
    const deadline = document.getElementById('event-deadline').value;
    const comment = document.getElementById('event-comment').value.trim();

    let executor = '';
    if (userFilterValue === 'all') {
      const exSel = document.getElementById('event-executor');
      executor = exSel?.value || '';
    } else {
      executor = userFilterValue;
    }

    let startTimeVal, endTimeVal;
    if (allDay) {
      // "Весь день" = 09:00–18:00
      startTimeVal = settings.slotMinTime;
      endTimeVal = settings.slotMaxTime;
    } else {
      // Не "Весь день" — берём инпуты
      startTimeVal = document.getElementById('event-start-time')?.value || settings.slotMinTime;
      endTimeVal = document.getElementById('event-end-time')?.value || settings.slotMaxTime;
    }

    const eventStart = `${startDateVal}T${startTimeVal}`;
    const eventEnd = `${finishDateVal}T${endTimeVal}`;

    const taskData = {
      title,
      comment,
      executor,
      start: eventStart,
      end: eventEnd,
      deadline,
    };

    if (isNew) {
      // Создание задачи
      createTask(taskData, (res, err) => {
        if (err) {
          alert('Ошибка создания задачи');
        } else {
          if (window.calendar && res?.task?.id) {
            const realId = res.task.id;
            window.calendar.addEvent({
              id: realId,
              title,
              start: eventStart,
              end: eventEnd,
              extendedProps: {
                comment,
                deadline,
                executor,
                bitrix24Id: realId,
                allDay,
              },
            });
            console.log('✅ Задача создана:', realId);
          }
        }
      });
    } else {
      // Редактирование задачи
      const taskId = eventData.extendedProps?.bitrix24Id || eventData.id;
      updateTask(taskId, taskData, (res, err) => {
        if (err) {
          alert('Ошибка обновления задачи');
        } else {
          eventData.setProp('title', title);
          eventData.setStart(eventStart);
          eventData.setEnd(eventEnd);
          eventData.setExtendedProp('comment', comment);
          eventData.setExtendedProp('deadline', deadline);
          eventData.setExtendedProp('executor', executor);
          eventData.setExtendedProp('allDay', allDay);
          console.log('✅ Задача обновлена:', taskId);
        }
      });
    }

    document.getElementById('modal-container').remove();
  });

  // Удаление задачи
  if (!isNew) {
    document.getElementById('delete-event').addEventListener('click', () => {
      const taskId = eventData.extendedProps?.bitrix24Id || eventData.id;
      if (!taskId) {
        console.error('❌ Ошибка: ID задачи не найден!');
        return;
      }
      deleteTask(taskId, (success, err) => {
        if (success) {
          eventData.remove();
          console.log('✅ Задача удалена:', taskId);
        } else {
          alert('Ошибка удаления задачи');
        }
        document.getElementById('modal-container').remove();
      });
    });
  }
}
