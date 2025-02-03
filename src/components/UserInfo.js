import { getUserData } from '../services/userModel.js';

export function UserInfo(onUserChange) {
  const userInfoContainer = document.createElement('div');
  userInfoContainer.id = 'user-info-container';
  userInfoContainer.className = 'flex items-center bg-white shadow-md p-4 rounded-lg gap-6';

  userInfoContainer.innerHTML = `
    <img id="user-avatar" src="https://i.pravatar.cc/50?u=user1" class="rounded-full w-12 h-12 shadow-md" alt="Аватар">
<div class="flex flex-col">
  <p id="user-name" class="text-lg font-semibold text-gray-900">Иванов Иван</p>
  <p id="user-role" class="text-sm text-gray-600">Менеджер проектов</p>
</div>
   <select id="user-select" class="border rounded px-3 py-2 bg-gray-100 w-96" >
      <option value="all">Все</option>
      <option value="user1" selected>Иванов Иван</option>
      <option value="user2">Петров Петр</option>
      <option value="user3">Сидоров Сидор</option>
      <option value="user4">Алексеева Анна</option>
      <option value="user5">Семенов Виктор</option>
    </select>
  `;

  // Дожидаемся появления элемента в DOM перед инициализацией Select2
  setTimeout(() => {
    if ($.fn.select2) {
      console.log('✅ Select2 найден, инициализируем...');
      $('#user-select').select2({
        placeholder: 'Выберите пользователя',
        allowClear: true,
        width: '300px',
      });
    } else {
      console.error('❌ Ошибка: Select2 не найден!');
    }
  }, 100);

  // Обработчик смены пользователя
  userInfoContainer.querySelector('#user-select').addEventListener('change', function () {
    if (typeof onUserChange === 'function') {
      onUserChange(this.value);
    }

    // Если выбрана опция "Все", меняем аватар и текст
    const userAvatar = document.getElementById('user-avatar');
    if (this.value === 'all') {
      userAvatar.src = 'https://cdn-icons-png.flaticon.com/512/1946/1946429.png'; // Иконка "Все"
      document.getElementById('user-name').textContent = 'Все сотрудники';
      document.getElementById('user-role').textContent = 'Просмотр всех задач';
    } else {
      const selectedUser = getUserData(this.value);
      userAvatar.src = selectedUser.avatar;
      document.getElementById('user-name').textContent = selectedUser.name;
      document.getElementById('user-role').textContent = selectedUser.role;
    }
  });

  return userInfoContainer;
}
