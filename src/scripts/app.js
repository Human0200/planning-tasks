import { showAIModelSettingsModal } from '../components/AIModelSettingsModal.js';
import { showCalendarSettingsModal } from '../components/CalendarSettingsModal.js'; // Добавляем импорт
import { Sidebar } from '../components/Sidebar.js';
import { showTaskPlanningModal } from '../components/TaskPlanningModal.js';
import { UserInfo } from '../components/UserInfo.js';
import { showUserSettingsModal } from '../components/UserSettingsModal.js';
import { loadCalendarSettings } from '../services/calendarSettings.js';
import { loadAllTasks } from '../services/taskService.js';
import { initCalendar } from './calendar.js';

// Функция загрузки цветов пользователей из app.option
function loadUserColors(callback) {
  BX24.callMethod('app.option.get', { option: 'user_colors' }, (res) => {
    if (res.error()) {
      console.error('❌ Ошибка загрузки цветов пользователей:', res.error());
      callback({});
    } else {
      console.log('✅ Загружены цвета пользователей:', res.data());
      callback(res.data() || {}); // Гарантируем, что если null, то вернём {}
    }
  });
}

// При загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM загружен');

  const mainElement = document.querySelector('main');
  if (!mainElement) {
    console.error('❌ Ошибка: элемент <main> не найден.');
    return;
  }

  const calendarContainer = document.getElementById('calendar-container');
  if (!calendarContainer) {
    console.error('❌ Ошибка: контейнер календаря не найден.');
    return;
  }

  // Создаём Sidebar
  const sidebarElement = Sidebar();
  if (sidebarElement instanceof HTMLElement) {
    document.body.insertBefore(sidebarElement, mainElement);
  }

  loadUserColors((colorMap) => {
    // 🔹 Загружаем настройки календаря перед инициализацией
    window.calendarSettings = {}; // Глобальный объект для настроек календаря

    loadCalendarSettings((settings) => {
      window.calendarSettings = settings; // Сохраняем настройки
      console.log('✅ Настройки календаря загружены:', window.calendarSettings);

      // Инициализируем календарь с полученными настройками
      const calendar = initCalendar(window.calendarSettings, colorMap);
      window.calendar = calendar;

      // Загружаем цвета пользователей и затем задачи

      console.log('🚀 Загружаем все задачи...');
      loadAllTasks((tasks, taskErr) => {
        if (taskErr) {
          console.error('❌ Ошибка загрузки задач:', taskErr);
          return;
        }

        console.log('✅ Полученные задачи:', tasks);

        // Преобразуем задачи в формат FullCalendar
        const events = tasks.map((t) => {
          const executorId = t.responsibleId;
          const color = String(colorMap[executorId] || '#cccccc'); // Принудительно приводим к строке

          const isAllDay = Boolean(
            t.xmlId === 'ALLDAY', // Начало и конец в один день
          );

          return {
            id: t.id,
            title: t.title || 'Без названия',
            start: t.startDatePlan,
            end: t.endDatePlan,
            allDay: isAllDay ? true : false, // Принудительно ставим true/false
            backgroundColor: color,
            borderColor: color,
            eventColor: color,
            textColor: '#ffffff', // Цвет текста для контраста
            classNames: [`color-${executorId}`], // Добавляем класс для стилизации
            extendedProps: {
              executor: executorId,
              responsibleName:
                t.responsibleName || (t.responsible ? t.responsible.name : 'Не указан'),
              deadline: t.deadline,
              color: color,
              comment: t.description || '',
              timeEstimate: t.timeEstimate || null,
              groupId: t.groupId,
              allDay: isAllDay ? true : false, // Принудительно ставим true/false
            },
          };
        });

        // Добавляем события в календарь
        calendar.addEventSource(events);
        console.log('✅ Задачи добавлены:', events.length);

        // Фильтруем задачи сразу после загрузки
        filterEvents($('#user-select').val());
      });
    });
  });

  window.filterEvents = function (selectedUser) {
    if (!window.calendar) return;

    window.calendar.getEvents().forEach((event) => {
      const executorId = String(event.extendedProps.executor);
      const shouldShow = selectedUser === 'all' || executorId === selectedUser;

      event.setProp('display', shouldShow ? 'auto' : 'none');
    });

    console.log(`🔄 Фильтрация завершена, выбран: ${selectedUser}`);
  };
  // Обработка кликов по меню
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-menu-action]');
    if (!link) return;

    const action = link.getAttribute('data-menu-action'); // ✅ Теперь action определён
    console.log(`🔍 Клик по меню: ${action}`);

    if (action === 'Пользователи') {
      showUserSettingsModal(window.calendar);
    } else if (action === 'Календарь') {
      showCalendarSettingsModal();
    } else if (action === 'Незапланированные задачи') {
      showTaskPlanningModal();
    } else if (action === 'Модель ИИ') {
      showAIModelSettingsModal();
    }
  });

  // Подключаем UserInfo
  console.log('✅ Вставляем UserInfo в #calendar-container');
  console.log('✅ Контейнер #calendar-container найден, создаем UserInfo...');

  setTimeout(() => {
    const userInfoElement = UserInfo((selectedUser) => {
      console.log('🔄 Выбран новый пользователь:', selectedUser);
      filterEvents(selectedUser);
    });

    if (calendarContainer && userInfoElement) {
      console.log('✅ Добавляем UserInfo в #calendar-container');
      calendarContainer.insertBefore(userInfoElement, calendarContainer.firstChild);
    } else {
      console.error(
        '❌ Ошибка: Не удалось вставить UserInfo — контейнер или элемент не определен!',
      );
    }
  }, 2000); // Задержка 200 мс для завершения рендеринга

  window.filterEvents = function (selectedUser) {
    if (!window.calendar) return;

    const hideNoTimeEstimate = document.getElementById('hideNoTimeEstimate')?.checked;
    const hideNoDeadline = document.getElementById('hideNoDeadline')?.checked;

    window.calendar.getEvents().forEach((event) => {
      let shouldShow = true;

      // фильтр по пользователю
      if (selectedUser !== 'all') {
        if (String(event.extendedProps.executor) !== String(selectedUser)) {
          shouldShow = false;
        }
      }

      // Если стоит галочка "убрать без планируемого времени"
      if (hideNoTimeEstimate) {
        if (!event.extendedProps.timeEstimate) {
          shouldShow = false;
        }
      }

      // Если стоит галочка "убрать без крайнего срока"
      if (hideNoDeadline) {
        if (!event.extendedProps.deadline) {
          shouldShow = false;
        }
      }

      // Применяем к событию
      event.setProp('display', shouldShow ? 'auto' : 'none');
    });
  };

  console.log('✅ Календарь запущен');
});
