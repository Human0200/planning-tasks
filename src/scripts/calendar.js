import { Calendar } from '@fullcalendar/core';
import ruLocale from '@fullcalendar/core/locales/ru';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { showEventForm } from '../components/EventForm.js';
import { loadTasksForRange } from '../services/taskService.js';
// Чтобы сохранить логику преобразования задачи в событие, можно создать вспомогательную функцию:
export function transformTaskToEvent(t, colorMap) {
  const executorId = t.responsibleId;
  const color = String(colorMap[executorId] || '#cccccc');

  // Определяем даты в зависимости от статуса задачи
  let originalStart = null,
    originalEnd = null;

  if (t.status === '5') {
    originalStart = t.dateStart ? new Date(t.dateStart) : null;
    originalEnd = t.closedDate ? new Date(t.closedDate) : null;
  } else {
    originalStart = t.startDatePlan ? new Date(t.startDatePlan) : null;
    originalEnd = t.endDatePlan ? new Date(t.endDatePlan) : null;
  }

  // Если нет корректных дат – пропускаем задачу
  if (
    !originalStart ||
    !originalEnd ||
    isNaN(originalStart.getTime()) ||
    isNaN(originalEnd.getTime())
  ) {
    console.warn('⚠️ Пропущено событие без корректных дат:', t);
    return null;
  }

  // Проверяем, является ли событие многодневным
  const isMultiDay = originalStart.toDateString() !== originalEnd.toDateString();

  // Если задача помечена как "ALLDAY" или является однодневной – возвращаем один event
  if (t.xmlId === 'ALLDAY' || !isMultiDay) {
    // Для allDay-событий FullCalendar требует, чтобы end была эксклюзивной (на следующий день)
    let displayStart = new Date(originalStart);
    let displayEnd = new Date(originalEnd);
    const isAllDay = t.xmlId === 'ALLDAY';

    if (isAllDay) {
      displayEnd.setDate(displayEnd.getDate() + 1);
    }

    return {
      id: t.id,
      title: t.title || 'Без названия',
      start: displayStart,
      end: displayEnd,
      allDay: isAllDay,
      backgroundColor: color,
      borderColor: color,
      eventColor: color,
      textColor: '#ffffff',
      classNames: [`color-${executorId}`],
      extendedProps: {
        executor: executorId,
        responsibleName: t.responsibleName || (t.responsible ? t.responsible.name : 'Не указан'),
        deadline: t.deadline,
        color: color,
        comment: t.description || '',
        timeEstimate: t.timeEstimate || null,
        groupId: t.groupId,
        dateStart: t.dateStart || null,
        closedDate: t.closedDate || null,
        bitrix24Id: t.id,
        originalStart: originalStart,
        originalEnd: originalEnd,
        isMultiDay: false,
        durationFact: t.timeSpentInLogs,
        allowTimeTracking: t.allowTimeTracking,
      },
    };
  }

  // Если событие многодневное с конкретными временами – разбиваем его на сегменты
  // Например: задача с 8 февраля 07:00 до 18 февраля 17:00
  const segments = [];

  // 1️⃣ Первый день: от оригинального старта до конца дня (23:59:59)
  const firstDayEnd = new Date(originalStart);
  firstDayEnd.setHours(23, 59, 59, 999);
  segments.push({
    id: `${t.id}_start`,
    title: t.title || 'Без названия',
    start: originalStart,
    end: firstDayEnd,
    allDay: false, // поскольку на первом дне важен конкретный старт
    backgroundColor: color,
    borderColor: color,
    eventColor: color,
    textColor: '#ffffff',
    classNames: [`color-${executorId}`],
    extendedProps: {
      executor: executorId,
      responsibleName: t.responsibleName || (t.responsible ? t.responsible.name : 'Не указан'),
      deadline: t.deadline,
      color: color,
      comment: t.description || '',
      timeEstimate: t.timeEstimate || null,
      groupId: t.groupId,
      dateStart: t.dateStart || null,
      closedDate: t.closedDate || null,
      bitrix24Id: t.id,
      originalStart: originalStart,
      originalEnd: originalEnd,
      segment: 'start',
      isMultiDay: true,
      durationFact: t.timeSpentInLogs,
      allowTimeTracking: t.allowTimeTracking,
    },
  });

  // 2️⃣ Промежуточные дни (если они есть)
  let current = new Date(originalStart);
  current.setDate(current.getDate() + 1);
  while (current.toDateString() !== originalEnd.toDateString()) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setDate(dayEnd.getDate() + 1);
    segments.push({
      id: `${t.id}_middle_${current.toISOString().split('T')[0]}`,
      title: t.title || 'Без названия',
      start: dayStart,
      end: dayEnd,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      eventColor: color,
      textColor: '#ffffff',
      classNames: [`color-${executorId}`],
      extendedProps: {
        executor: executorId,
        responsibleName: t.responsibleName || (t.responsible ? t.responsible.name : 'Не указан'),
        deadline: t.deadline,
        color: color,
        comment: t.description || '',
        timeEstimate: t.timeEstimate || null,
        groupId: t.groupId,
        dateStart: t.dateStart || null,
        closedDate: t.closedDate || null,
        bitrix24Id: t.id,
        originalStart: originalStart,
        originalEnd: originalEnd,
        segment: 'middle',
        isMultiDay: true,
        durationFact: t.timeSpentInLogs,
        allowTimeTracking: t.allowTimeTracking,
      },
    });
    current.setDate(current.getDate() + 1);
  }

  // 3️⃣ Последний день: от начала дня (00:00) до оригинального времени окончания
  const lastDayStart = new Date(originalEnd);
  lastDayStart.setHours(0, 0, 0, 0);
  segments.push({
    id: `${t.id}_end`,
    title: t.title || 'Без названия',
    start: lastDayStart,
    end: originalEnd,
    allDay: false, // на последнем дне важен точный end
    backgroundColor: color,
    borderColor: color,
    eventColor: color,
    textColor: '#ffffff',
    classNames: [`color-${executorId}`],
    extendedProps: {
      executor: executorId,
      responsibleName: t.responsibleName || (t.responsible ? t.responsible.name : 'Не указан'),
      deadline: t.deadline,
      color: color,
      comment: t.description || '',
      timeEstimate: t.timeEstimate || null,
      groupId: t.groupId,
      dateStart: t.dateStart || null,
      closedDate: t.closedDate || null,
      bitrix24Id: t.id,
      originalStart: originalStart,
      originalEnd: originalEnd,
      segment: 'end',
      isMultiDay: true,
      durationFact: t.timeSpentInLogs,
      allowTimeTracking: t.allowTimeTracking,
    },
  });

  return segments;
}

export function initCalendar(settings, colorMap) {
  let calendarEl = document.getElementById('calendar-container');

  if (!calendarEl) {
    console.error('Ошибка: контейнер календаря не найден.');
    return;
  }

  let calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: ruLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    selectable: true,

    // Ограничиваем рабочее время
    slotMinTime: settings.slotMinTime,
    slotMaxTime: settings.slotMaxTime,
    slotDuration: settings.slotDuration,
    allDaySlot: settings.allDaySlot, // Включает секцию "Весь день
    allDayDefault: true,

    slotLabelInterval: '01:00:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },

    // Высота на весь экран
    height: '100%',
    expandRows: true,

    // Улучшения UX
    stickyHeaderDates: true,
    dayMaxEventRows: true,

    contentClassNames: ['bg-white', 'shadow-lg', 'rounded-lg', 'p-4'],
    buttonClassNames: ['bg-blue-500', 'text-white', 'px-4', 'py-2', 'rounded-md', 'shadow'],
    // Настройка отображения события (по умолчанию выводим время, заголовок и "Ответственный")
    eventContent: function (arg) {
      const timeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
      let timeText = '';

      if (arg.event.allDay) {
        if (arg.isStart && arg.isEnd) {
          timeText = `${new Intl.DateTimeFormat('ru-RU', timeFormatOptions).format(
            arg.event.extendedProps.originalStart,
          )} - ${new Intl.DateTimeFormat('ru-RU', timeFormatOptions).format(
            arg.event.extendedProps.originalEnd,
          )}`;
        } else if (arg.isStart) {
          timeText = `${new Intl.DateTimeFormat('ru-RU', timeFormatOptions).format(
            arg.event.extendedProps.originalStart,
          )} -`;
        } else if (arg.isEnd) {
          timeText = `- ${new Intl.DateTimeFormat('ru-RU', timeFormatOptions).format(
            arg.event.extendedProps.originalEnd,
          )}`;
        } else {
          timeText = 'Весь день';
        }
      } else {
        timeText = `${new Intl.DateTimeFormat('ru-RU', timeFormatOptions).format(
          arg.event.start,
        )} - ${new Intl.DateTimeFormat('ru-RU', timeFormatOptions).format(arg.event.end)}`;
      }

      let html = `<div class="fc-event-inner force-inline-content" style="margin-top: -10px;">`;
      if (timeText) {
        html += `<div class="fc-event-time force-inline-content">${timeText}</div>`;
      }
      html += `<div class="fc-event-title wrap-text" >${arg.event.title}</div>`;
      if (arg.event.extendedProps.responsibleName) {
        html += `<div class="fc-event-subtitle wrap-text">Ответственный: ${arg.event.extendedProps.responsibleName}</div>`;
      }
      html += `</div>`;
      return { html };
    },

    // При клике по ячейке для создания новой задачи
    dateClick: (info) => {
      console.log('📅 Клик по дате:', info.dateStr, 'allDay=', info.allDay);

      // Проверяем, куда кликнули
      const isAllDay = info.allDay === true;

      console.log(`✅ Определено: ${isAllDay ? 'Весь день' : 'Обычное время'}`);

      // Вызываем создание задачи с правильным `allDay`
      showEventForm(info.dateStr, null, { allDay: isAllDay, colorMap });
    },

    // Новый обработчик клика по уже существующему событию (для редактирования)
    eventClick: (info) => {
      console.log('Клик по событию:', info.event);
      // Вызываем модальное окно для редактирования и передаем объект события
      showEventForm(null, info.event, { colorMap });
    },

    // ★ Новый блок – динамическая загрузка задач:
    events: function (fetchInfo, successCallback, failureCallback) {
      console.log('Запрос событий для диапазона:', fetchInfo.start, fetchInfo.end);
      const startDate = fetchInfo.start.toISOString().split('T')[0];
      const endDate = fetchInfo.end.toISOString().split('T')[0];

      // Берём глобальный фильтр по ответственному
      let responsibleId = window.currentResponsibleId;
      if (responsibleId === 'all') {
        responsibleId = null;
      }
      console.log('calendar.js responsibleId:', responsibleId);
      setTimeout(() => {
        loadTasksForRange(
          startDate,
          endDate,
          (allTasks, err) => {
            if (err) {
              console.error('❌ Ошибка загрузки задач:', err);
              failureCallback(err);
              return;
            }

            console.log(`Загружено задач: ${allTasks.length}`);
            allTasks.forEach((task, index) => {
              console.log(`Задача ${index}: responsibleId=${task.responsibleId}`, task);
            });

            // Применяем дополнительные фильтры
            let filteredTasks = allTasks;
            if (window.currentShowActualTimeOnly) {
              filteredTasks = filteredTasks.filter((task) => task.dateStart && task.closedDate);
            }
            if (window.currentHideNoDeadline) {
              filteredTasks = filteredTasks.filter((task) => task.deadline);
            }

            console.log(`После доп. фильтров задач: ${filteredTasks.length}`);

            // Преобразуем задачи в события
            const events = filteredTasks
              .map((t) => {
                const event = transformTaskToEvent(t, colorMap);
                console.log('Преобразование задачи в событие:', event);
                return event;
              })
              .filter((ev) => ev !== null)
              .flat();

            // ★ Дополнительное логирование
            console.log('🔄 Передача событий в календарь:', events);
            console.log(`Событий для отображения: ${events.length}`);

            // ★ Если нужно очистить старые события, можно добавить:
            // window.calendar.getEvents().forEach(ev => ev.remove());
            successCallback(events);

            // ★ Если нужно, через небольшую задержку вывести все события, чтобы убедиться, что они есть
            setTimeout(() => {
              const currentEvents = window.calendar.getEvents();
              console.log('📌 События в календаре после successCallback:', currentEvents);
            }, 300);
          },
          null,
          (error) => failureCallback(error),
          responsibleId, // Если API умеет фильтровать, передавайте ответственного
        );
      }, 500);
    },
  });

  calendar.render();
  // Возвращаем экземпляр календаря
  return calendar;
}
