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
        DESCRIPTION: taskData.comment || null || '',
        RESPONSIBLE_ID: taskData.executor, // ID исполнителя (реальный ID, полученный через userService)
        START_DATE_PLAN: taskData.start,
        END_DATЕ_PLAN: taskData.end,
        DEADLINE: taskData.deadline || null || '',
        XML_ID: taskData.allDay ? 'ALLDAY' : null, // ✅ Только для "Весь день"
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
  console.log('🗑️ Попытка удаления задачи с ID:', taskId, typeof taskId);
  BX24.callMethod('tasks.task.delete', { taskId }, (result) => {
    if (result.error()) {
      console.error('Ошибка удаления задачи:', result.error());
      callback(false, result.error());
    } else {
      callback(true);
    }
  });
}

export function loadAllTasks(callback) {
  let tasks = new Map();
  let batchSize = 50; // Количество задач на одну страницу
  let maxBatch = 5; // Количество страниц в одном batch-запросе
  let startIndex = 0;

  function fetchBatch(start) {
    let batch = {};
    console.log(`📡 Запрос batch с ${maxBatch} страниц, начиная с ${start}`);

    for (let i = 0; i < maxBatch; i++) {
      let startPosition = start + i * batchSize;
      batch[`page_${i}`] = [
        'tasks.task.list',
        {
          FILTER: {}, // Здесь можно добавить фильтрацию
          SELECT: ['ID', 'TITLE', 'RESPONSIBLE_ID', 'START_DATE_PLAN', 'END_DATE_PLAN', 'DEADLINE'],
          start: startPosition,
        },
      ];
    }

    BX24.callBatch(batch, (res) => {
      let hasMore = false;

      for (let key in res) {
        if (res[key].error()) {
          console.error(`❌ Ошибка загрузки задач (${key}):`, res[key].error());
          callback(null, res[key].error());
          return;
        }

        const data = res[key].data();
        if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
          console.log(`📥 Загружены ${data.tasks.length} задач(и) с ${key}`);

          data.tasks.forEach((task) => {
            tasks.set(task.id, task);
          });

          // Если данные пришли, скорее всего есть еще задачи
          hasMore = true;
        }
      }

      if (hasMore) {
        fetchBatch(start + maxBatch * batchSize);
      } else {
        console.log(`✅ Все задачи загружены. Всего задач: ${tasks.size}`);
        callback(Array.from(tasks.values()), null);
      }
    });
  }

  fetchBatch(startIndex);
}

export function loadUnplannedTasks(callback) {
  let tasks = new Map();
  let batchSize = 50;
  let maxBatch = 5;
  let startIndex = 0;

  function fetchBatch(start) {
    let batch = {};
    console.log(`📡 Запрос batch с ${maxBatch} страниц, начиная с ${start}`);

    for (let i = 0; i < maxBatch; i++) {
      let startPosition = start + i * batchSize;
      batch[`page_${i}`] = [
        'tasks.task.list',
        {
          FILTER: {
            '!START_DATE_PLAN': null,
            '!END_DATE_PLAN': null,
          },
          SELECT: [
            'ID',
            'TITLE',
            'RESPONSIBLE_ID',
            'START_DATE_PLAN',
            'END_DATE_PLAN',
            'TIME_ESTIMATE',
            'RESPONSIBLE', // ✅ Добавляем объект ответственного
          ],
          start: startPosition,
        },
      ];
    }

    BX24.callBatch(batch, (res) => {
      let hasMore = false;

      for (let key in res) {
        if (res[key].error()) {
          console.error(`❌ Ошибка загрузки задач (${key}):`, res[key].error());
          callback(null, res[key].error());
          return;
        }

        const data = res[key].data();
        if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
          console.log(`📥 Загружены ${data.tasks.length} задач(и) с ${key}`);

          data.tasks.forEach((task) => {
            if (!task.startDatePlan || !task.endDatePlan || !task.timeEstimate) {
              tasks.set(task.id, {
                id: task.id,
                title: task.title || 'Без названия',
                responsibleId: task.responsible?.id || task.responsibleId,
                responsibleName: task.responsible?.name || 'Неизвестен', // ✅ Исправлено
                startDatePlan: task.startDatePlan || '',
                endDatePlan: task.endDatePlan || '',
                timeEstimate: task.timeEstimate || '',
              });
            }
          });

          hasMore = true;
        }
      }

      if (hasMore) {
        fetchBatch(start + maxBatch * batchSize);
      } else {
        console.log(`✅ Все незапланированные задачи загружены. Всего: ${tasks.size}`);
        callback(Array.from(tasks.values()), null);
      }
    });
  }

  fetchBatch(startIndex);
}
