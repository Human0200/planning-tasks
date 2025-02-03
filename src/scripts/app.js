import { Sidebar } from '../components/Sidebar.js';
import { UserInfo } from '../components/UserInfo.js';
import { initCalendar } from './calendar.js';

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

  // Создаём Sidebar и Modal
  const sidebarElement = Sidebar();

  if (sidebarElement instanceof HTMLElement) {
    document.body.insertBefore(sidebarElement, mainElement);
  }

  // Запускаем календарь и сохраняем его экземпляр
  const calendar = initCalendar();
  window.calendar = calendar;

  // ✅ Вставляем UserInfo ТОЛЬКО ПОСЛЕ рендера календаря
  setTimeout(() => {
    console.log('✅ Вставляем UserInfo в #calendar-container');
    const userInfoElement = UserInfo((selectedUser) => {
      console.log('🔄 Выбран новый пользователь:', selectedUser);
    });

    calendarContainer.prepend(userInfoElement);
  }, 100); // Небольшая задержка, чтобы FullCalendar не удалил UserInfo

  console.log('✅ Календарь запущен');
});
