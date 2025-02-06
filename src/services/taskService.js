// src/services/taskService.js

/**
 * Создаёт новую задачу в Bitrix24.
 * @param {Object} taskData - Объект с данными задачи.
 * @param {Function} callback - Функция, вызываемая после завершения запроса.
 */
export function createTask(taskData, callback) {
  BX24.callMethod(
    'tasks.task.add',
    {
      fields: {
        TITLE: taskData.title,
        DESCRIPTION: taskData.comment,
        RESPONSIBLE_ID: taskData.executor, // ID исполнителя (реальный ID, полученный через userService)
        START_DATE_PLAN: taskData.start,
        END_DATA_PLAN: taskData.end,
        END_DATE_PLAN: taskData.end,
        DEADLINE: taskData.deadline,
        // Дополнительные поля, если нужны (приоритет, теги и т.д.)
      },
    },
    (result) => {
      if (result.error()) {
        console.error('Ошибка создания задачи:', result.error());
        callback(null, result.error());
      } else {
        callback(result.data());
      }
    },
  );
}

/**
 * Обновляет существующую задачу в Bitrix24.
 * @param {String|Number} taskId - ID задачи.
 * @param {Object} taskData - Объект с новыми данными задачи.
 * @param {Function} callback - Функция, вызываемая после выполнения запроса.
 */
export function updateTask(taskId, taskData, callback) {
  BX24.callMethod(
    'tasks.task.update',
    {
      taskId: taskId,
      fields: {
        TITLE: taskData.title,
        DESCRIPTION: taskData.comment,
        RESPONSIBLE_ID: taskData.executor,
        START_DATE_PLAN: taskData.start,
        END_DATE_PLAN: taskData.end,
        DEADLINE: taskData.deadline,
      },
    },
    (result) => {
      if (result.error()) {
        console.error('Ошибка обновления задачи:', result.error());
        callback(null, result.error());
      } else {
        callback(result.data());
      }
    },
  );
}

/**
 * Удаляет задачу в Bitrix24.
 * @param {String|Number} taskId - ID задачи.
 * @param {Function} callback - Функция, вызываемая после выполнения запроса.
 */
export function deleteTask(taskId, callback) {
  BX24.callMethod('tasks.task.delete', { taskId }, (result) => {
    if (result.error()) {
      console.error('Ошибка удаления задачи:', result.error());
      callback(false, result.error());
    } else {
      callback(true);
    }
  });
}

/**
 * Получает все задачи через batch-запросы или постранично.
 * В SELECT указываем поля в высоком регистре, но Bitrix24 вернёт их в нижнем.
 * @param {Function} callback (tasks, error) => {}
 */
export function loadAllTasks(callback) {
  let tasks = new Map(); // Используем Map для хранения уникальных задач
  let currentPage = 1;
  let isLoading = false;

  function fetchPage(page) {
    if (isLoading) return;
    isLoading = true;

    console.log(`📡 Загружаем задачи, страница ${page}...`);
    BX24.callMethod(
      'tasks.task.list',
      {
        FILTER: {}, // Можно добавить фильтры при необходимости
        SELECT: ['ID', 'TITLE', 'RESPONSIBLE_ID', 'START_DATE_PLAN', 'END_DATE_PLAN', 'DEADLINE'],
        PARAMS: { NAV_PARAMS: { NAV_PAGE_SIZE: 50, NAV_PAGE: page } },
      },
      (res) => {
        isLoading = false;

        if (res.error()) {
          console.error('❌ Ошибка при загрузке задач:', res.error());
          callback(null, res.error());
          return;
        }

        const data = res.data();
        if (!data || !Array.isArray(data.tasks) || data.tasks.length === 0) {
          console.log('✅ Все задачи загружены, возвращаем результат.');
          callback(Array.from(tasks.values()), null);
          return;
        }

        console.log(`📥 Загружены ${data.tasks.length} задач(и) с страницы ${page}.`);

        // Добавляем задачи в Map (ID => объект)
        data.tasks.forEach((task) => {
          tasks.set(task.id, task); // Уникальное добавление
        });

        // Проверяем, есть ли следующая страница (и отличается ли она от текущей)
        const next = res.answer?.next;
        if (next && next > page) {
          console.log(`➡️ Переход на следующую страницу: ${next}`);
          fetchPage(next);
        } else {
          console.log(`✅ Все страницы загружены. Всего задач: ${tasks.size}`);
          callback(Array.from(tasks.values()), null);
        }
      },
    );
  }

  // Начинаем загрузку с первой страницы
  fetchPage(currentPage);
}
