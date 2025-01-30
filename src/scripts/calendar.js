import { Calendar } from '@fullcalendar/core';
import ruLocale from '@fullcalendar/core/locales/ru';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

export function initCalendar() {
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
    slotMinTime: '09:00:00',
    slotMaxTime: '18:00:00',

    // Настройки подписей времени
    slotDuration: '01:00:00',
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
  });

  calendar.render();
}
