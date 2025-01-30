import { Modal } from '../components/Modal.js';
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
  const modalElement = Modal();

  if (sidebarElement instanceof HTMLElement) {
    document.body.insertBefore(sidebarElement, mainElement);
  }

  if (modalElement instanceof HTMLElement) {
    document.body.appendChild(modalElement);
  }

  // Запускаем календарь и сохраняем его экземпляр
  const calendar = initCalendar();

  // ✅ Вставляем UserInfo ТОЛЬКО ПОСЛЕ рендера календаря
  setTimeout(() => {
    console.log('✅ Вставляем UserInfo в #calendar-container');
    const userInfoElement = UserInfo((selectedUser) => {
      console.log('🔄 Выбран новый пользователь:', selectedUser);
      updateUser(selectedUser, calendar);
    });

    calendarContainer.prepend(userInfoElement);
  }, 100); // Небольшая задержка, чтобы FullCalendar не удалил UserInfo

  console.log('✅ Календарь запущен');
});

// Функция обновления данных о пользователе
function updateUser(userId, calendar) {
  let userData = getUserData(userId);

  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');

  if (avatarEl && nameEl && roleEl) {
    avatarEl.src = userData.avatar;
    nameEl.textContent = userData.name;
    roleEl.textContent = userData.role;
    console.log('✅ Данные о пользователе обновлены:', userData);
  } else {
    console.error('❌ Ошибка: не найдены элементы user-info');
  }

  // Обновляем события в календаре
  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(userData.events);
    console.log('✅ События обновлены для пользователя:', userId);
  } else {
    console.error('❌ Ошибка: calendar не найден.');
  }
}

// Функция заглушка с пользователями (можно заменить на API Bitrix24)
function getUserData(userId) {
  const users = {
    user1: {
      name: 'Иванов Иван',
      role: 'Менеджер проектов',
      avatar: 'https://i.pravatar.cc/50?u=user1',
      events: [
        { title: 'Встреча с клиентом', start: '2024-02-01T10:00:00' },
        { title: 'Обсуждение проекта', start: '2024-02-02T14:00:00' },
      ],
    },
    user2: {
      name: 'Петров Петр',
      role: 'Разработчик',
      avatar: 'https://i.pravatar.cc/50?u=user2',
      events: [
        { title: 'Код-ревью', start: '2024-02-01T12:00:00' },
        { title: 'Демо-версия', start: '2024-02-03T16:00:00' },
      ],
    },
    user3: {
      name: 'Сидоров Сидор',
      role: 'HR-специалист',
      avatar: 'https://i.pravatar.cc/50?u=user3',
      events: [
        { title: 'Собеседование', start: '2024-02-02T09:00:00' },
        { title: 'Оценка сотрудников', start: '2024-02-04T13:00:00' },
      ],
    },
  };
  return users[userId] || users['user1'];
}
