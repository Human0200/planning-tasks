import { transformTaskToEvent } from '../scripts/calendar.js';
import { askAiReport } from '../services/aiClient.js';
import { createTask, deleteTask, getProjects, updateTask } from '../services/taskService.js';
import { getUsers } from '../services/userService.js';
import { createModal } from './Modal.js';
import { showAiReportModal } from './showAiReportModal.js';

export function showEventForm(date, eventData, options = {}) {
  const colorMap = options.colorMap || {}; // Получаем переданную карту цветов
  const isEditMode = !!eventData;

  // Используйте eventData?.extendedProps вместо eventData?.extendedProps
  console.log('🔍 eventData?.extendedProps:', eventData?.extendedProps);

  // Проверяем флаг "Весь день"
  const allDay = options.allDay === true || eventData?.extendedProps?.allDay === true;

  const settings = window.calendarSettings || { slotMinTime: '08:00', slotMaxTime: '18:00' };

  let startDate,
    formattedDate,
    formattedFinishDate,
    formattedStartTime,
    formattedEndTime,
    formattedStartDateTime,
    formattedFinishDateTime;

  if (isEditMode) {
    // Редактирование
    startDate = new Date(eventData?.extendedProps?.originalStart);
    const endDate = eventData?.extendedProps.originalEnd
      ? new Date(eventData?.extendedProps.originalEnd)
      : new Date(startDate.getTime() + 30 * 60 * 1000);

    formattedStartDateTime = startDate.toISOString().slice(0, 16); // Формат YYYY-MM-DDTHH:MM
    formattedFinishDateTime = endDate.toISOString().slice(0, 16);
  } else {
    // Создание
    startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    formattedStartDateTime = startDate.toISOString().slice(0, 16); // Формат YYYY-MM-DDTHH:MM
    formattedFinishDateTime = endDate.toISOString().slice(0, 16);

    if (allDay) {
      formattedStartTime = settings.slotMinTime; // или что-то вроде getUserCalendarStart()
      formattedEndTime = settings.slotMaxTime;
    }
  }

  const titleValue = eventData?.title || '';
  const deadlineValue = eventData?.extendedProps?.deadline
    ? eventData?.extendedProps.deadline.split('T')[0]
    : '';

  const commentValue = eventData?.extendedProps?.comment || '';
  const groupIdValue =
    isEditMode && eventData?.extendedProps?.groupId ? eventData?.extendedProps.groupId : '';

  const timeEstimateValue =
    isEditMode && eventData?.extendedProps?.timeEstimate
      ? (eventData?.extendedProps.timeEstimate / 3600).toFixed(2)
      : '';

  const actualStartDate = eventData?.extendedProps?.dateStart
    ? new Date(eventData?.extendedProps.dateStart).toISOString().split('T')[0]
    : '—';

  const actualFinishDate = eventData?.extendedProps?.closedDate
    ? new Date(eventData?.extendedProps.closedDate).toISOString().split('T')[0]
    : '—';

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

  const allowTimeTrackingValue = isEditMode && eventData?.extendedProps?.allowTimeTracking === 'Y';
  const actualTimeSpentValue =
    isEditMode && eventData?.extendedProps?.durationFact
      ? (eventData.extendedProps.durationFact / 3600).toFixed(2)
      : '0.00';
  // Блок с фактическими датами (только для режима редактирования)
  const actualTimeBlock = isEditMode
    ? `
  <div class="grid grid-cols-2 gap-4 bg-gray-100 p-2 rounded-md mb-4">
    <div>
      <label class="block text-sm font-medium text-gray-700">Фактическое начало</label>
      <input type="text" class="border rounded w-full p-2 bg-gray-200" value="${actualStartDate}" readonly>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700">Фактическое завершение</label>
      <input type="text" class="border rounded w-full p-2 bg-gray-200" value="${actualFinishDate}" readonly>
    </div>
    <div class="col-span-2">
      <label class="block text-sm font-medium text-gray-700">Фактическое затраченное время (часы)</label>
      <input type="text" class="border rounded w-full p-2 bg-gray-200" value="${actualTimeSpentValue}" readonly>
    </div>
  </div>
  `
    : '';

  const taskLinkBlock =
    isEditMode && eventData?.extendedProps?.bitrix24Id
      ? `
    <div>
      <label class="block text-sm font-medium text-gray-700">Задача в Bitrix24</label>
      <div
        id="task-title-link"
        data-task-id="${eventData?.extendedProps.bitrix24Id}"
        class="border rounded w-full p-2 mb-4 bg-gray-100 text-blue-600 hover:underline cursor-pointer"
      >
        Открыть задачу
      </div>
    </div>
  `
      : '';

  const timeTrackingCheckbox = `
  <div class="flex items-center mb-4">
    <input type="checkbox" id="allow-time-tracking" class="mr-2" ${
      allowTimeTrackingValue ? 'checked' : ''
    }>
    <label for="allow-time-tracking" class="text-sm font-medium text-gray-700">
      Учитывать затраченное время
    </label>
  </div>
`;
  // Генерируем форму
  const formContent = `
    <form id="event-form" class="w-full">
     ${taskLinkBlock}
    <label class="block text-sm font-medium text-gray-700">Название задачи</label>
    <input
      type="text"
      id="event-title"
      class="border rounded w-full p-2 mb-4"
      placeholder="Введите название"
      value="${titleValue}"
    >
          <!-- Блок фактических дат (только если редактирование) -->
    ${actualTimeBlock}

<div>
  <label class="block text-sm font-medium text-gray-700">Дата и время начала</label>
  <input type="datetime-local" id="event-start-datetime" class="border rounded w-full p-2 mb-4" value="${formattedStartDateTime}" ${readonlyAttr}>
</div>

<div>
  <label class="block text-sm font-medium text-gray-700">Дата и время завершения</label>
  <input type="datetime-local" id="event-finish-datetime" class="border rounded w-full p-2 mb-4" value="${formattedFinishDateTime}" ${readonlyAttr}>
</div>


      ${executorSelectHTML}
      

<label class="block text-sm font-medium text-gray-700">Крайний срок</label>
<input type="datetime-local" id="event-deadline-datetime" class="border rounded w-full p-2 mb-4" value="${deadlineValue}">


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



        <!-- Чекбокс "Учитывать затраченное время" -->
    ${timeTrackingCheckbox}

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

  console.log('🔍 Проверка isEditMode:', isEditMode);
  console.log('🔍 eventData?.extendedProps:', eventData?.extendedProps);
  console.log('🔍 bitrix24Id:', eventData?.extendedProps?.bitrix24Id);

  const modalInstance = createModal(modalTitle, formContent, { width: '600px', maxHeight: '80vh' });

  if (isEditMode && eventData?.extendedProps?.bitrix24Id) {
    console.log('⏳ Добавляем обработчик для клика по названию задачи...');

    setTimeout(() => {
      const taskTitleElement = document.getElementById('task-title-link');
      if (taskTitleElement) {
        console.log('✅ Найден элемент task-title-link, добавляем обработчик клика');

        taskTitleElement.addEventListener('click', () => {
          const taskId = taskTitleElement.getAttribute('data-task-id');
          const executorId = eventData?.extendedProps.executor || '0'; // Если нет, подставляем 0
          const taskUrl = `/company/personal/user/${executorId}/tasks/task/view/${taskId}/`;

          console.log('🔗 Открываем задачу:', taskUrl); // Логируем перед открытием

          BX24.openPath(taskUrl, function (result) {
            console.log('✅ Задача открыта в слайдере:', taskUrl, 'Результат:', result);
          });
        });
      } else {
        console.warn('⚠️ Не найден элемент task-title-link! Проверь разметку.');
      }
    }, 0); // Гарантируем, что элемент загружен перед добавлением обработчика
  }

  const finishDatetimeInput = document.getElementById('event-finish-datetime');
  const deadlineInput = document.getElementById('event-deadline-datetime');

  if (finishDatetimeInput && deadlineInput && settings?.dynamicDeadline) {
    deadlineInput.value = finishDatetimeInput.value;
  }

  if (finishDatetimeInput && deadlineInput) {
    finishDatetimeInput.addEventListener('change', (e) => {
      if (settings?.dynamicDeadline) {
        deadlineInput.value = e.target.value;
      }
    });
  }

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
            $(selectEl).val(eventData?.extendedProps.executor).trigger('change');
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
    const allowTimeTrackingChecked = document.getElementById('allow-time-tracking').checked;
    const allowTimeTracking = allowTimeTrackingChecked ? 'Y' : 'N';

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
      allowTimeTracking, // ✅ Передаем в задачу
    };

    console.log('Смотрим на отправленный массив данных для задачи:', taskData);
    let responsibleName = '';
    if (userFilterValue !== 'all') {
      // Если выбран конкретный пользователь — берём текст выбранного option
      responsibleName = globalSelect?.selectedOptions[0]?.textContent || '';
    } else {
      // Если выбран вариант "all", то из селекта исполнителя
      const exSel = document.getElementById('event-executor');
      responsibleName = exSel?.selectedOptions[0]?.textContent || '';
    }

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

            // Формируем объект задачи в том же формате, что используется в transformTaskToEvent:
            const newTaskObject = {
              ...taskData,
              id: realId,
              // Для незавершённых задач используем плановые даты:
              startDatePlan: eventStart,
              endDatePlan: eventEnd,
              // Если задача "на весь день", выставляем xmlId:
              xmlId: allDay ? 'ALLDAY' : null,
              responsibleId: executor,
              responsibleName,
            };

            // Преобразуем задачу в событие (возможно, массив сегментов)
            const transformed = transformTaskToEvent(newTaskObject, colorMap);
            const eventsToAdd = Array.isArray(transformed) ? transformed : [transformed];

            // Добавляем каждый сегмент в календарь
            eventsToAdd.forEach((ev) => {
              window.calendar.addEvent(ev);
            });

            console.log('✅ Задача создана:', realId);
          }
        }
      });
    } else {
      // Редактирование задачи
      const taskId = eventData?.extendedProps?.bitrix24Id || eventData?.id;
      updateTask(taskId, taskData, (res, err) => {
        if (err) {
          alert('Ошибка обновления задачи');
        } else {
          // Формируем обновлённый объект задачи для преобразования
          const updatedTaskObject = {
            ...taskData,
            id: taskId,
            startDatePlan: eventStart,
            endDatePlan: eventEnd,
            xmlId: allDay ? 'ALLDAY' : null,
            responsibleId: executor,
            responsibleName,
            allowTimeTracking, // ✅ Передаем в задачу
          };

          const transformed = transformTaskToEvent(updatedTaskObject, colorMap);
          // Для простоты, обновляем текущее событие, используя первый сегмент
          const updatedEvent = Array.isArray(transformed) ? transformed[0] : transformed;

          // Обновляем свойства текущего события
          eventData.setProp('title', updatedEvent.title);
          eventData.setStart(updatedEvent.start);
          eventData.setEnd(updatedEvent.end);
          // Обновляем extendedProps полностью
          Object.keys(updatedEvent.extendedProps).forEach((key) => {
            eventData.setExtendedProp(key, updatedEvent.extendedProps[key]);
          });

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
      const taskId = eventData?.extendedProps?.bitrix24Id || eventData?.id;
      if (!taskId) {
        console.error('❌ Ошибка: ID задачи не найден!');
        return;
      }
      deleteTask(taskId, (success, err) => {
        if (success) {
          eventData?.remove();
          console.log('✅ Задача удалена:', taskId);
        } else {
          alert('Ошибка удаления задачи');
        }
        modalInstance.close();
      });
    });
  }
}
