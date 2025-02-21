/**
 * Разбивает многодневную задачу на несколько событий для календаря.
 * @param {Object} task - Объект задачи, содержащий startDatePlan и endDatePlan.
 * @param {Object} settings - Настройки календаря, содержащие slotMinTime и slotMaxTime (например, '08:00' и '20:00').
 * @param {Object} colorMap - Карта цветов, используемая для задания цвета события.
 * @returns {Array} Массив событий, подходящих для отображения в календаре.
 */
export function splitTaskIntoEvents(task, settings, colorMap) {
  const events = [];
  const start = new Date(task.startDatePlan);
  const end = new Date(task.endDatePlan);
  const executorId = task.responsibleId;
  const color = String(colorMap[executorId] || '#cccccc');
  const title = task.title || 'Без названия';

  // Если задача занимает только один день, возвращаем одно событие без разбиения:
  if (start.toDateString() === end.toDateString()) {
    events.push({
      id: task.id,
      title,
      start: task.startDatePlan,
      end: task.endDatePlan,
      allDay: false,
      backgroundColor: color,
      borderColor: color,
      eventColor: color,
      textColor: '#ffffff',
      classNames: [`color-${executorId}`],
      extendedProps: {
        executor: executorId,
        responsibleName:
          task.responsibleName || (task.responsible ? task.responsible.name : 'Не указан'),
        deadline: task.deadline,
        color,
        comment: task.description || '',
        timeEstimate: task.timeEstimate || null,
        groupId: task.groupId,
        allDay: false,
      },
    });
    return events;
  }

  // Если задача занимает несколько дней:

  // 1. Первый день: от task.startDatePlan до конца рабочего дня
  const firstDayEnd = new Date(start);
  const [maxHour, maxMinute] = settings.slotMaxTime.split(':').map(Number);
  firstDayEnd.setHours(maxHour, maxMinute, 0, 0);
  events.push({
    id: task.id + '_1',
    title,
    start: task.startDatePlan,
    end: firstDayEnd.toISOString(),
    allDay: false,
    backgroundColor: color,
    borderColor: color,
    eventColor: color,
    textColor: '#ffffff',
    classNames: [`color-${executorId}`],
    extendedProps: {
      executor: executorId,
      responsibleName:
        task.responsibleName || (task.responsible ? task.responsible.name : 'Не указан'),
      deadline: task.deadline,
      color,
      comment: task.description || '',
      timeEstimate: task.timeEstimate || null,
      groupId: task.groupId,
      allDay: false,
    },
  });

  // 2. Промежуточные дни: создаем allDay‑события для каждого полного дня между первым и последним
  let current = new Date(start);
  current.setDate(current.getDate() + 1);
  while (current.toDateString() !== end.toDateString()) {
    const dayStr = current.toISOString().split('T')[0];
    events.push({
      id: task.id + '_' + dayStr,
      title,
      start: dayStr,
      end: dayStr,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      eventColor: color,
      textColor: '#ffffff',
      classNames: [`color-${executorId}`],
      extendedProps: {
        executor: executorId,
        responsibleName:
          task.responsibleName || (task.responsible ? task.responsible.name : 'Не указан'),
        deadline: task.deadline,
        color,
        comment: task.description || '',
        timeEstimate: task.timeEstimate || null,
        groupId: task.groupId,
        allDay: true,
      },
    });
    current.setDate(current.getDate() + 1);
  }

  // 3. Последний день: от начала рабочего дня до task.endDatePlan
  const lastDayStart = new Date(end);
  const [minHour, minMinute] = settings.slotMinTime.split(':').map(Number);
  lastDayStart.setHours(minHour, minMinute, 0, 0);
  events.push({
    id: task.id + '_last',
    title,
    start: lastDayStart.toISOString(),
    end: task.endDatePlan,
    allDay: false,
    backgroundColor: color,
    borderColor: color,
    eventColor: color,
    textColor: '#ffffff',
    classNames: [`color-${executorId}`],
    extendedProps: {
      executor: executorId,
      responsibleName:
        task.responsibleName || (task.responsible ? task.responsible.name : 'Не указан'),
      deadline: task.deadline,
      color,
      comment: task.description || '',
      timeEstimate: task.timeEstimate || null,
      groupId: task.groupId,
      allDay: false,
    },
  });

  return events;
}
