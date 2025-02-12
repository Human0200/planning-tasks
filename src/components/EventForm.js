import { askAiReport } from '../services/aiClient.js';
import { createTask, deleteTask, getProjects, updateTask } from '../services/taskService.js';
import { getUsers } from '../services/userService.js';
import { createModal } from './Modal.js';
import { showAiReportModal } from './showAiReportModal.js';

export function showEventForm(date, eventData, options = {}) {
  const colorMap = options.colorMap || {}; // Получаем переданную карту цветов
  const isEditMode = !!eventData;
  // Проверяем флаг "Весь день"
  const allDay = options.allDay === true || eventData?.extendedProps?.allDay === true;

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
  const deadlineValue = eventData?.extendedProps?.deadline
    ? eventData.extendedProps.deadline.split('T')[0]
    : '';

  const commentValue = eventData?.extendedProps?.comment || '';
  const groupIdValue =
    isEditMode && eventData?.extendedProps?.groupId ? eventData.extendedProps.groupId : '';

  const timeEstimateValue =
    isEditMode && eventData?.extendedProps?.timeEstimate
      ? (eventData.extendedProps.timeEstimate / 3600).toFixed(2)
      : '';
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

          <!-- Новый блок: Проект -->
    <label class="block text-sm font-medium text-gray-700">Проект (Группа Bitrix24)</label>
    <div id="project-container" class="mb-4"></div>
    
    <!-- Новый блок: Планируемое время (часы) -->
    <label class="block text-sm font-medium text-gray-700">Планируемое время (часы)</label>
    <input
      type="number"
      step="0.5"
      min="0"
      id="event-time-estimate"
      class="border rounded w-full p-2 mb-4"
      value="${timeEstimateValue}"
      placeholder="Например, 2.5"
    >

      <label class="block text-sm font-medium text-gray-700">Комментарий</label>
      <textarea
        id="event-comment"
        class="border rounded w-full p-2 mb-4"
        rows="3"
        placeholder="Дополнительная информация"
      >${commentValue}</textarea>

         <!-- КНОПКА ФОРМИРОВАНИЯ ОТЧЁТА ПОД КОММЕНТАРИЕМ, но ДО основных кнопок -->
    ${
      !isNew
        ? `<div class="mb-4 flex justify-end">
             <button
               type="button"
               id="generate-report"
               class="border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded hover:bg-gray-100"
             >
               Сформировать отчёт
             </button>
           </div>`
        : ''
    }

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

  const modalInstance = createModal(modalTitle, formContent, { width: '600px', maxHeight: '80vh' });

  // Загрузка проектов (групп)
  const projContainer = document.getElementById('project-container');
  if (projContainer) {
    const projectSelect = document.createElement('select');
    projectSelect.id = 'event-project';
    // Применяем те же классы, что и у селекта исполнителей
    projectSelect.className = 'custom-executor border rounded w-full p-2 mb-4';

    const defOpt = document.createElement('option');
    defOpt.value = '';
    defOpt.textContent = 'Выберите проект';
    projectSelect.appendChild(defOpt);
    projContainer.appendChild(projectSelect);

    // Загрузка списка проектов
    getProjects((groups) => {
      console.log('Загружены проекты:', groups);
      groups.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.ID;
        opt.textContent = g.NAME;
        projectSelect.appendChild(opt);
      });
      // Если редактирование и уже есть groupId, подставляем его:
      if (isEditMode && groupIdValue) {
        projectSelect.value = String(groupIdValue);
      }
      // Инициализация Select2 для проекта
      if ($.fn.select2) {
        $(projectSelect).select2({
          placeholder: 'Выберите проект',
          allowClear: true,
          width: 'style',
          dropdownParent: $(modalInstance.modalElement),
        });
        if (isEditMode && groupIdValue) {
          $(projectSelect).val(String(groupIdValue)).trigger('change');
        }
      }
    });
  }

  // Кнопка "Отмена"
  document.getElementById('cancel-event').addEventListener('click', () => {
    modalInstance.close();
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
            dropdownParent: $(modalInstance.modalElement),
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
    const projectSelect = document.getElementById('event-project');
    const groupId = projectSelect?.value ? parseInt(projectSelect.value, 10) : null;
    const timeEstInput = document.getElementById('event-time-estimate');
    const hours = parseFloat(timeEstInput.value) || 0;
    const timeEstimateSec = Math.round(hours * 3600);

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
      allDay: allDay, // Приводим к формату Bitrix
      timeEstimate: timeEstimateSec,
      groupId,
    };

    console.log('Смотрим на отправленный массив данных для задачи:', taskData);

    if (isNew) {
      // Создание задачи
      createTask(taskData, (res, err) => {
        if (err) {
          alert('Ошибка создания задачи');
        } else {
          if (window.calendar && res?.task?.id) {
            const realId = res.task.id;
            const newTaskColor = colorMap[executor] || '#cccccc'; // Определяем цвет
            console.log('🚀 Новый цвет задачи:', newTaskColor);
            window.calendar.addEvent({
              id: realId,
              title,
              start: eventStart,
              end: eventEnd,
              allDay,
              backgroundColor: newTaskColor,
              borderColor: newTaskColor,
              extendedProps: {
                comment,
                deadline,
                executor,
                bitrix24Id: realId,
                allDay,
                color: newTaskColor,
                groupId,
                timeEstimate: timeEstimateSec,
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
          eventData.setExtendedProp('groupId', groupId);
          eventData.setExtendedProp('timeEstimate', timeEstimateSec);
          console.log('✅ Задача обновлена:', taskId);
        }
      });
    }

    modalInstance.close();
  });

  function shorten(text, maxLen) {
    if (!text) return '';
    if (text.length <= maxLen) {
      return text;
    }
    return text.slice(0, maxLen - 3) + '...';
  }

  if (!isNew) {
    const reportBtn = document.getElementById('generate-report');
    if (reportBtn) {
      reportBtn.addEventListener('click', async () => {
        // 1. Считываем исходные поля
        let titleField = document.getElementById('event-title').value.trim();
        let commentField = document.getElementById('event-comment').value.trim();

        // 2. Сокращаем их, чтобы не превышать лимит
        //    (Например, 50 символов для названия, 100 для комментария)
        titleField = shorten(titleField, 50);
        commentField = shorten(commentField, 100);

        // 3. Формируем промпт (сырой)
        let rawPrompt = `
Составь краткий отчёт по задаче:
Название: "${titleField}"
Описание: "${commentField}"
Напиши отчёт на русском, в понятном виде, максимум 10 предложений.
`;

        // 4. И ещё раз подрезаем сам промпт, чтобы он не был длиннее 256 символов
        const finalPrompt = shorten(rawPrompt, 256);
        console.log('📝 Окончательный промпт для AI:', finalPrompt);

        try {
          // 5. Вызываем функцию AI
          const aiAnswer = await askAiReport(finalPrompt);
          console.log('Ответ AI:', aiAnswer);

          // 6. Отображаем результат
          showAiReportModal(aiAnswer);
        } catch (err) {
          console.error('Ошибка при запросе отчёта:', err);
          alert('Ошибка при формировании отчёта');
        }
      });
    }
  }

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
        modalInstance.close();
      });
    });
  }
}
