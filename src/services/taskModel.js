import { getUserData } from '../services/userService.js';

// Пример функции для генерации уникального идентификатора
export function generateUniqueId() {
  // Можно использовать библиотеку или простую реализацию:
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Функция сбора данных из формы и формирования объекта задачи
export function collectTaskData() {
  const title = document.getElementById('event-title').value.trim() || 'Без названия';
  const dateValue = document.getElementById('event-date').value;
  const startTime = document.getElementById('event-start-time').value;
  const endTime = document.getElementById('event-end-time').value;
  const deadline = document.getElementById('event-deadline').value;
  const comment = document.getElementById('event-comment').value.trim();

  // Определяем исполнителя: если выбран глобальный режим "Все" — берем значение из модального селекта
  let executorId = '';
  const globalSelect = document.querySelector('#user-select');
  if (globalSelect.value === 'all' && document.getElementById('event-executor')) {
    executorId = document.getElementById('event-executor').value;
  } else {
    executorId = globalSelect.value;
  }

  // Получаем данные о пользователе (используя, например, вашу существующую функцию getUserData)
  const executor = getUserData(executorId);

  const eventStart = `${dateValue}T${startTime}`;
  const eventEnd = `${dateValue}T${endTime}`;

  return {
    id: generateUniqueId(),
    title,
    start: eventStart,
    end: eventEnd,
    deadline,
    comment,
    executor,
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bitrix24Id: null,
    priority: 'normal',
    tags: [],
    customFields: {},
  };
}

// Если функция getUserData уже определена в другом модуле, убедитесь, что она доступна (либо импортируйте её сюда)
