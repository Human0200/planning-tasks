// src/services/taskService.js

/**
 * Создаёт новую задачу в Bitrix24.
 * @param {Object} taskData - Объект с данными задачи.
 * @param {Function} callback - Функция, вызываемая после завершения запроса.
 */
export function createTask(taskData, callback) {
  console.log('📝 Попытка создания задачи:', taskData);
  BX24.callMethod(
    'tasks.task.add',
    {
      fields: {
        TITLE: taskData.title,
        DESCRIPTION: taskData.comment || null || '',
        RESPONSIBLE_ID: taskData.executor, // ID исполнителя (реальный ID, полученный через userService)
        START_DATE_PLAN: taskData.start,
        END_DATE_PLAN: taskData.end,
        DEADLINE: taskData.deadline || null || '',
        XML_ID: taskData.allDay ? 'ALLDAY' : null, // ✅ Только для "Весь день"
        GROUP_ID: taskData.groupId, // <-- тут
        TIME_ESTIMATE: taskData.timeEstimate || null,
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
        TIME_ESTIMATE: taskData.timeEstimate || null,
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
          filter: { '!TIME_ESTIMATE': null }, // Здесь можно добавить фильтрацию
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

export function loadAllTasksforunPlanned(callback) {
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
          filter: {
            '<STATUS': 4,
          }, // Здесь можно добавить фильтрацию
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
          filter: {
            '<STATUS': 4,
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

export function getProjects(callback) {
  BX24.callMethod('sonet_group.get', {}, (res) => {
    if (res.error()) {
      console.error('Ошибка загрузки проектов:', res.error());
      callback([]);
    } else {
      callback(res.data() || []);
    }
  });
}

export function loadAllTasksIncrementally(onComplete, onBatchLoaded, onError) {
  // onComplete – вызывается по завершении загрузки всех задач (как раньше)
  // onBatchLoaded – вызывается для каждого пакета задач (новый параметр)
  // onError – вызывается при ошибке

  let tasks = new Map();
  const batchSize = 50; // Количество задач на одну страницу
  const maxBatch = 5; // Количество страниц в одном batch-запросе
  let startIndex = 0;

  function fetchBatch(start) {
    let batch = {};
    console.log(`📡 Запрос batch с ${maxBatch} страниц, начиная с ${start}`);
    for (let i = 0; i < maxBatch; i++) {
      let startPosition = start + i * batchSize;
      batch[`page_${i}`] = [
        'tasks.task.list',
        {
          filter: { '!TIME_ESTIMATE': null },
          order: { CREATED_DATE: 'DESC' }, // Сортируем по дате создания (новейшие сначала)
          SELECT: [
            'ID',
            'TITLE',
            'RESPONSIBLE_ID',
            'START_DATE_PLAN',
            'END_DATE_PLAN',
            'DEADLINE',
            'CREATED_DATE',
            'DESCRIPTION',
            'GROUP_ID',
            'TIME_ESTIMATE',
          ],
          start: startPosition,
        },
      ];
    }

    BX24.callBatch(batch, (res) => {
      let hasMore = false;
      let batchTasks = [];
      for (let key in res) {
        if (res[key].error()) {
          console.error(`❌ Ошибка загрузки задач (${key}):`, res[key].error());
          onError && onError(res[key].error());
          return;
        }
        const data = res[key].data();
        if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
          console.log(`📥 Загружены ${data.tasks.length} задач(и) с ${key}`);
          data.tasks.forEach((task) => {
            tasks.set(task.id, task);
            batchTasks.push(task);
          });
          hasMore = true;
        }
      }

      // Если пакет задач получен, вызываем onBatchLoaded (если передан)
      if (typeof onBatchLoaded === 'function' && batchTasks.length) {
        // Если порядок в пакете не гарантирован, можно отсортировать по CREATED_DATE
        batchTasks.sort((a, b) => new Date(b.CREATED_DATE) - new Date(a.CREATED_DATE));
        onBatchLoaded(batchTasks);
      }

      if (hasMore) {
        fetchBatch(start + maxBatch * batchSize);
      } else {
        console.log(`✅ Все задачи загружены. Всего задач: ${tasks.size}`);
        onComplete(Array.from(tasks.values()), null);
      }
    });
  }

  fetchBatch(startIndex);
}
