import { loadAllTasksforunPlanned, loadUnplannedTasks } from '../services/taskService.js';
import { getUsers } from '../services/userService.js';
import { openEditModal } from './EditTaskModal.js';
import { createModal } from './Modal.js';

export function showTaskPlanningModal() {
  const title = 'Планирование задач';

  const content = `
    <div class="task-planning-container">
      <div class="flex gap-4 mb-4">
        <!-- Поле поиска -->
        <input 
          type="text" 
          id="taskSearch" 
          class="border p-2 flex-grow" 
          placeholder="🔍 Поиск по названию..."
        />

        <!-- Фильтр по пользователям -->
        <select id="userFilter" class="border p-2">
          <option value="all">Все пользователи</option>
        </select>
      </div>

      <!-- Чекбокс для фильтрации просроченных задач -->
      <label class="flex items-center gap-2 mb-4">
        <input type="checkbox" id="showOverdueTasks" class="cursor-pointer" />
        <span>Показывать просроченные задачи</span>
      </label>

      <div id="task-list" class="max-h-80 overflow-auto border-t border-b"></div>
    </div>
  `;

  createModal(title, content, { width: '700px' });

  const taskListContainer = document.getElementById('task-list');
  const searchInput = document.getElementById('taskSearch');
  const userFilter = document.getElementById('userFilter');
  const overdueCheckbox = document.getElementById('showOverdueTasks');

  let allTasks = []; // Храним все загруженные задачи
  let overdueTasks = []; // Храним только просроченные задачи

  // Загружаем пользователей в фильтр
  getUsers((users) => {
    users.forEach((user) => {
      const option = document.createElement('option');
      option.value = user.ID;
      option.textContent = `${user.NAME} ${user.LAST_NAME}`;
      userFilter.appendChild(option);
    });
  });

  // Загружаем **обычные незапланированные задачи**
  function loadTasks() {
    loadUnplannedTasks((tasks) => {
      allTasks = tasks; // Сохраняем все обычные задачи
      filterAndRenderTasks();
    });
  }

  // Загружаем **все задачи при включении чекбокса**
  function loadOverdueTasks() {
    loadAllTasksforunPlanned((tasks) => {
      const now = new Date();
      overdueTasks = tasks.filter((task) => {
        // ✅ Исключаем задачи, у которых `endDatePlan` пустое или отсутствует
        if (!task.endDatePlan || task.endDatePlan.trim() === '') {
          return false;
        }

        // ✅ Проверяем просрочена ли задача
        return new Date(task.endDatePlan) < now && ['1', '2', '3'].includes(task.status);
      });

      filterAndRenderTasks();
    });
  }

  // Фильтруем задачи перед рендерингом
  function filterAndRenderTasks() {
    const showOverdueOnly = overdueCheckbox.checked;
    const selectedUser = userFilter.value;
    const query = searchInput.value.toLowerCase();

    let filteredTasks = allTasks; // По умолчанию отображаем незапланированные задачи

    if (showOverdueOnly) {
      filteredTasks = [...allTasks, ...overdueTasks]; // Добавляем просроченные задачи
    }

    // Фильтр по пользователю
    if (selectedUser !== 'all') {
      filteredTasks = filteredTasks.filter((task) => task.responsibleId === selectedUser);
    }

    // Фильтр по поисковому запросу
    if (query) {
      filteredTasks = filteredTasks.filter((task) => task.title.toLowerCase().includes(query));
    }

    renderTaskList(filteredTasks);
  }

  function renderTaskList(tasks) {
    taskListContainer.innerHTML = '';
    tasks.forEach((task) => {
      const taskRow = document.createElement('div');
      taskRow.className = 'flex items-center justify-between py-2 px-2 border-b';

      taskRow.innerHTML = `
        <div class="flex flex-col">
          <a href="#" class="text-blue-600 hover:underline" data-task-id="${task.id}">
            ${task.title}
          </a>
          <p class="text-gray-500 text-sm">Ответственный: ${
            task.responsibleName || (task.responsible ? task.responsible.name : 'Не указан')
          }</p>
        </div>
        <button class="bg-gray-300 px-3 py-1 rounded task-edit-btn" data-task-id="${task.id}">
          ✏️ Редактировать
        </button>
      `;

      taskListContainer.appendChild(taskRow);
    });
  }

  // Открываем задачу в слайдере Bitrix24
  taskListContainer.addEventListener('click', (e) => {
    if (e.target.closest('.task-edit-btn')) return;

    const link = e.target.closest('[data-task-id]');
    if (link) {
      const taskId = link.getAttribute('data-task-id');
      const taskUrl = `/company/personal/user/8/tasks/task/view/${taskId}/`;

      BX24.openPath(taskUrl, function (result) {
        console.log('🔗 Открыта задача:', taskUrl, 'Результат:', result);
      });
    }
  });

  // Обработчик редактирования задачи
  taskListContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.task-edit-btn');
    if (button) {
      const taskId = button.getAttribute('data-task-id');
      openEditModal(taskId);
    }
  });

  // Обработчики фильтрации
  searchInput.addEventListener('input', filterAndRenderTasks);
  userFilter.addEventListener('change', filterAndRenderTasks);
  overdueCheckbox.addEventListener('change', () => {
    if (overdueCheckbox.checked) {
      loadOverdueTasks(); // Загружаем все задачи, если чекбокс включен
    } else {
      filterAndRenderTasks(); // Если чекбокс выключен, просто отфильтровать
    }
  });

  loadTasks();

  window.addEventListener('taskUpdated', (e) => {
    // Если включён чекбокс "Показывать просроченные задачи", вызываем loadOverdueTasks, иначе loadTasks
    if (document.getElementById('showOverdueTasks')?.checked) {
      loadOverdueTasks();
    } else {
      loadTasks();
    }
  });
}
