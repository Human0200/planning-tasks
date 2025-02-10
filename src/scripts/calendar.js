import { Calendar } from '@fullcalendar/core';
import ruLocale from '@fullcalendar/core/locales/ru';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { showEventForm } from '../components/EventForm.js';

export function initCalendar(settings, colorMap) {
  let calendarEl = document.getElementById('calendar-container');

  if (!calendarEl) {
    console.error('Ошибка: контейнер календаря не найден.');
    return;
  }

  let calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay',
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
      const timeText = arg.timeText;
      const title = arg.event.title;
      const responsible = arg.event.extendedProps.responsibleName || '';

      let html = `<div class="fc-event-inner force-inline-content">`;
      if (timeText) {
        html += `<div class="fc-event-time force-inline-content">${timeText}</div>`;
      }
      // Здесь меняем класс для заголовка:
      html += `<div class="fc-event-title wrap-text">${title}</div>`;
      if (responsible) {
        // Можно также заменить или добавить для подзаголовка:
        html += `<div class="fc-event-subtitle wrap-text">Ответственный: ${responsible}</div>`;
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
  });

  calendar.render();
  // Возвращаем экземпляр календаря
  return calendar;
}
