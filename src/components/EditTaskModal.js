import { updateTask } from '../services/taskService.js';
import { createModal } from './Modal.js';

/**
 * Открывает модальное окно для редактирования задачи.
 * @param {string|number} taskId - ID задачи.
 */
export function openEditModal(taskId) {
  const title = `Редактирование задачи #${taskId}`;

  const content = `

  <!-- Ссылка для открытия задачи в Bitrix24 -->
<label class="block mb-2">
  <span class="text-gray-700">Задача в Bitrix24:</span>
  <div id="task-title-link"
       class="border rounded w-full p-2 mb-4 bg-gray-100 text-blue-600 hover:underline cursor-pointer">
    Открыть задачу
  </div>
</label>

    <div class="edit-task-container">
      <label class="block mb-2">
        <span class="text-gray-700">Название задачи:</span>
        <input type="text" id="editTaskTitle" class="border p-2 w-full" />
      </label>

      <label class="block mb-2">
        <span class="text-gray-700">Исполнитель:</span>
        <input type="text" id="editTaskResponsible" class="border p-2 w-full bg-gray-200" readonly />
        <input type="hidden" id="editTaskResponsibleId" />
      </label>

      <label class="block mb-2">
        <span class="text-gray-700">Дата начала:</span>
        <input type="datetime-local" id="editStartDate" class="border p-2 w-full" />
      </label>

      <label class="block mb-2">
        <span class="text-gray-700">Дата окончания:</span>
        <input type="datetime-local" id="editEndDate" class="border p-2 w-full" />
      </label>

      <label class="block mb-2">
        <span class="text-gray-700">Крайний срок:</span>
        <input type="datetime-local" id="editDeadline" class="border p-2 w-full" />
      </label>

      <label class="block mb-2">
        <span class="text-gray-700">Оценочное время (в часах):</span>
        <input type="number" id="editTimeEstimate" class="border p-2 w-full" min="0" step="0.5" />
      </label>
      
      <!-- Новое поле: Фактическое затраченное время -->
      <label class="block mb-2">
        <span class="text-gray-700">Фактическое затраченное время (в часах):</span>
        <input type="number" id="editTimeSpent" class="border p-2 w-full bg-gray-200" readonly />
      </label>

       <!-- Новый чекбокс: Разрешить учет времени -->
      <label class="block mb-2 flex items-center gap-2">
        <input type="checkbox" id="allowTimeTracking" class="cursor-pointer" />
        <span class="text-gray-700">Разрешить учет времени</span>
      </label>

      <div class="flex justify-end gap-4 mt-6">
        <button id="cancel-edit-task" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600">
          Отмена
        </button>
        <button id="save-edit-task" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
          Сохранить
        </button>
      </div>
    </div>
  `;

  // Создаём модальное окно и сохраняем возвращаемый объект для дальнейшего управления
  const modalInstance = createModal(title, content, { width: '500px', maxHeight: '80vh' });
  let originalComment = '';
  /**
   * Преобразование даты в формат Bitrix24 (YYYY-MM-DDTHH:MM:SS)
   * @param {string} dateStr - Дата в формате datetime-local (из `<input type="datetime-local">`)
   * @returns {string|null} - Дата в формате Bitrix24 или null
   */
  function formatDateToBitrix(dateStr) {
    if (!dateStr) return null;

    const date = new Date(dateStr);

    // Форматируем дату в `YYYY-MM-DDTHH:MM:SS`
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяц начинается с 0
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00'; // Фиксированные секунды

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  function toLocalDateTimeString(dateStr) {
    if (!dateStr) return '';

    // Парсим строку в объект Date
    const date = new Date(dateStr);

    // Сдвигаем дату на локальный offset,
    // чтобы при последующем .toISOString() у нас сохранилось "местное" время
    // (если dateStr уже содержит +03:00, то возможно этого делать не нужно, зависит от формата хранения)
    // date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    // Формируем строку "YYYY-MM-DDTHH:MM" (без `Z` и без перехода в UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Загружаем текущие данные задачи
  BX24.callMethod('tasks.task.get', { taskId }, (res) => {
    if (res.error()) {
      console.error('❌ Ошибка загрузки задачи:', res.error());
      return;
    }

    const task = res.data().task;

    // Сохраняем описание в переменную
    originalComment = task.description || '';

    document.getElementById('editTaskTitle').value = task.title || '';

    // Преобразование даты в datetime-local
    document.getElementById('editStartDate').value = task.startDatePlan
      ? toLocalDateTimeString(task.startDatePlan)
      : '';
    document.getElementById('editEndDate').value = task.endDatePlan
      ? toLocalDateTimeString(task.endDatePlan)
      : '';
    document.getElementById('editDeadline').value = task.deadline
      ? toLocalDateTimeString(task.deadline)
      : '';
    document.getElementById('editTimeEstimate').value = task.timeEstimate
      ? (task.timeEstimate / 3600).toFixed(2)
      : '';

    // Заполняем новое поле "Фактическое затраченное время" (переводим секунды в часы)
    document.getElementById('editTimeSpent').value = task.timeSpentInLogs
      ? (task.timeSpentInLogs / 3600).toFixed(2)
      : '';
    // Устанавливаем значение чекбокса allowTimeTracking
    document.getElementById('allowTimeTracking').checked = task.allowTimeTracking === 'Y';
    // Заполняем данные об исполнителе (readonly) и сохраняем его ID
    const responsibleField = document.getElementById('editTaskResponsible');
    responsibleField.value = task.responsible?.name || 'Не указан';
    document.getElementById('editTaskResponsibleId').value = task.responsible?.id || '';

    // ✅ Добавляем ссылку на задачу в Bitrix24
    const taskTitleElement = document.getElementById('task-title-link');
    taskTitleElement.setAttribute('data-task-id', taskId);
    taskTitleElement.addEventListener('click', () => {
      const executorId = task.responsible?.id || '0'; // Если нет ID, ставим 0
      const taskUrl = `/company/personal/user/${executorId}/tasks/task/view/${taskId}/`;

      console.log('🔗 Открываем задачу:', taskUrl);

      BX24.openPath(taskUrl, function (result) {
        console.log('✅ Задача открыта в слайдере:', taskUrl, 'Результат:', result);
      });
    });
  });

  // Проверяем, загружены ли цвета пользователей; если нет — загружаем
  if (!window.colorMap) {
    BX24.callMethod('app.option.get', { option: 'user_colors' }, (res) => {
      if (res.error()) {
        console.error('❌ Ошибка загрузки цветов пользователей:', res.error());
        window.colorMap = {}; // Чтобы избежать undefined
      } else {
        window.colorMap = res.data() || {};
      }
    });
  }

  const editEndDateInput = document.getElementById('editEndDate');
  const editDeadlineInput = document.getElementById('editDeadline');

  if (editEndDateInput && editDeadlineInput && window.calendarSettings?.dynamicDeadline) {
    // При открытии модального окна сразу подставляем значение даты окончания в крайний срок
    editDeadlineInput.value = editEndDateInput.value;

    // При изменении даты окончания автоматически обновляем крайний срок
    editEndDateInput.addEventListener('change', (e) => {
      editDeadlineInput.value = e.target.value;
    });
  }

  // Обработчик кнопки "Сохранить"
  document.getElementById('save-edit-task').addEventListener('click', () => {
    const updatedTask = {
      title: document.getElementById('editTaskTitle').value,
      start: formatDateToBitrix(document.getElementById('editStartDate').value) || null,
      end: formatDateToBitrix(document.getElementById('editEndDate').value) || null,
      deadline: formatDateToBitrix(document.getElementById('editDeadline').value) || null,
      timeEstimate: document.getElementById('editTimeEstimate').value
        ? document.getElementById('editTimeEstimate').value * 3600
        : null,
      executor: parseInt(document.getElementById('editTaskResponsibleId').value, 10) || null,
      comment: originalComment,
      allowTimeTracking: document.getElementById('allowTimeTracking').checked ? 'Y' : 'N',
      // Поле timeSpentInLogs не редактируется пользователем и не передаётся в updateTask
    };

    console.log('🚀 Отправка обновления:', updatedTask);

    updateTask(taskId, updatedTask, (res, err) => {
      if (err) {
        console.error('❌ Ошибка обновления задачи:', err);
        return;
      }

      console.log(`✅ Задача ${taskId} обновлена!`, res);
      // Закрываем модальное окно
      modalInstance.close();

      // Обновление задачи в календаре без перезагрузки
      if (window.calendar) {
        let event = window.calendar.getEventById(taskId);
        const executorId = updatedTask.executor;
        const color = window.colorMap?.[executorId] || '#cccccc';

        if (event) {
          event.setProp('title', updatedTask.title);
          event.setDates(updatedTask.start, updatedTask.end);
          event.setProp('backgroundColor', color);
          event.setProp('borderColor', color);
        } else {
          window.calendar.addEvent({
            id: taskId,
            title: updatedTask.title,
            start: updatedTask.start,
            end: updatedTask.end,
            backgroundColor: color,
            borderColor: color,
            textColor: '#ffffff',
            extendedProps: {
              originalStart: updatedTask.start,
              originalEnd: updatedTask.end,
              executor: executorId,
              deadline: updatedTask.deadline,
              allowTimeTracking: updatedTask.allowTimeTracking,
            },
          });
        }
      }

      // Диспатчим событие, чтобы уведомить о том, что задача обновлена
      window.dispatchEvent(new CustomEvent('taskUpdated', { detail: { taskId } }));

      // 🔹 После добавления/обновления вызываем фильтрацию по пользователю
      console.log('🔄 Фильтрация событий после обновления');
      const selectedUser = document.getElementById('user-select')?.value || 'all'; // Получаем текущего пользователя
      window.filterEvents(selectedUser);
    });
  });

  // Обработчик кнопки "Отмена"
  document.getElementById('cancel-edit-task').addEventListener('click', () => {
    modalInstance.close();
  });

  // Обработчик кнопки "×" (закрытие модалки) не нужен, так как закрытие уже реализовано в createModal.
}
