import { showAIModelSettingsModal } from '../components/AIModelSettingsModal.js';
import { showCalendarSettingsModal } from '../components/CalendarSettingsModal.js'; // Добавляем импорт
import { showInstructionModal } from '../components/InstructionModal.js';
import { Sidebar } from '../components/Sidebar.js';
import { showTaskPlanningModal } from '../components/TaskPlanningModal.js';
import { UserInfo } from '../components/UserInfo.js';
import { showUserSettingsModal } from '../components/UserSettingsModal.js';
import { loadCalendarSettings } from '../services/calendarSettings.js';
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
      console.log('🚀 Начинаем инкрементальную загрузку задач...');
    });
  });

  // Инициализируем select2 и навешиваем обработчик изменения
  $('#user-select')
    .select2()
    .on('change', function () {
      // Приводим "all" к строке "all", а всё остальное к числу что не null
      // Перезапрашиваем события в календаре
      if (window.calendar) {
        window.calendar.refetchEvents();
      }
    });

  // Функция фильтрации событий по выбранному пользователю
  window.filterEvents = (selectedUser) => {
    // Если выбран "all", сохраняем именно строку 'all' для формирования ключа кэша
    if (window.calendar) {
      window.calendar.refetchEvents();
    }
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
    } else if (action === 'Инструкция') {
      showInstructionModal();
    }
  });

  // Подключаем UserInfo
  console.log('✅ Вставляем UserInfo в #calendar-container');
  console.log('✅ Контейнер #calendar-container найден, создаем UserInfo...');

  // Создаём элемент лоадера, если его ещё нет
  let loaderEl = document.getElementById('loader');
  if (!loaderEl) {
    loaderEl = document.createElement('div');
    loaderEl.id = 'loader';
    // Стили для центрирования лоадера поверх всех элементов
    loaderEl.style.position = 'fixed';
    loaderEl.style.top = '50%';
    loaderEl.style.left = '50%';
    loaderEl.style.transform = 'translate(-50%, -50%)';
    loaderEl.style.zIndex = '9999';
    loaderEl.innerHTML = `<img src="https://bg59.online/We/photos/loading.gif" alt="Загрузка...">`;
    document.body.appendChild(loaderEl);
  }

  setTimeout(() => {
    const userInfoElement = UserInfo((selectedUser) => {
      console.log('🔄 Выбран новый пользователь:', selectedUser);
      filterEvents(selectedUser);
    });

    if (calendarContainer && userInfoElement) {
      console.log('✅ Добавляем UserInfo в #calendar-container');
      calendarContainer.insertBefore(userInfoElement, calendarContainer.firstChild);

      // После вставки UserInfo, через 500 мс скрываем лоадер
      setTimeout(() => {
        const loaderEl = document.getElementById('loader');
        if (loaderEl) {
          loaderEl.style.display = 'none';
          console.log('✅ Лоадер скрыт');
        }
      }, 500);
    } else {
      console.error(
        '❌ Ошибка: Не удалось вставить UserInfo — контейнер или элемент не определен!',
      );
    }
  }, 2000);

  window.filterEvents = function (selectedUser) {
    if (!window.calendar) return;

    const showActualTimeOnly = document.getElementById('showActualTimeOnly')?.checked;
    const hideNoDeadline = document.getElementById('hideNoDeadline')?.checked;
    let loaderEl = document.getElementById('loader');

    if (!loaderEl) {
      loaderEl = document.createElement('div');
      loaderEl.id = 'loader';
      loaderEl.style.position = 'fixed';
      loaderEl.style.top = '50%';
      loaderEl.style.left = '50%';
      loaderEl.style.transform = 'translate(-50%, -50%)';
      loaderEl.style.zIndex = '9999';
      loaderEl.style.padding = '20px';
      loaderEl.style.background = 'rgba(255,255,255,0.9)';
      loaderEl.style.borderRadius = '8px';
      loaderEl.innerHTML = `<img src="https://bg59.online/We/photos/loading.gif" alt="Загрузка...">`;
      document.body.appendChild(loaderEl);
    }

    // Показать лоадер перед фильтрацией
    loaderEl.style.display = 'block';

    setTimeout(() => {
      window.calendar.getEvents().forEach((event) => {
        let shouldShow = true;

        // Фильтр по пользователю
        if (selectedUser !== 'all') {
          if (String(event.extendedProps.executor) !== String(selectedUser)) {
            shouldShow = false;
          }
        }

        // 🔹 Фильтр "Показать задачи по фактическому времени"
        if (showActualTimeOnly) {
          const hasActualTime = event.extendedProps.dateStart && event.extendedProps.closedDate;
          if (!hasActualTime) {
            shouldShow = false;
          }
        }

        // 🔹 Фильтр "Убрать без крайнего срока"
        if (hideNoDeadline) {
          if (!event.extendedProps.deadline) {
            shouldShow = false;
          }
        }

        // Применяем к событию
        event.setProp('display', shouldShow ? 'auto' : 'none');
      });

      // Скрываем лоадер после завершения фильтрации
      loaderEl.style.display = 'none';
      console.log(
        `✅ Фильтрация завершена, выбран: ${selectedUser}, Фактическое время: ${showActualTimeOnly}`,
      );
    }, 100); // Задержка в 100 мс для плавности
  };

  console.log('✅ Календарь запущен');
});
