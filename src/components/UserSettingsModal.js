import { createModal } from './Modal.js';

/**
 * Открывает модальное окно настроек пользователей.
 */
export function showUserSettingsModal() {
  const title = 'Настройки пользователей';

  const content = `
    <div class="user-settings-container">
      <!-- Поле поиска -->
      <div class="flex items-center gap-2 mb-4">
        <input 
          type="text" 
          id="userSearch" 
          class="border p-2 flex-grow" 
          placeholder="🔍 Поиск по ФИО..."
        />
      </div>

      <!-- Список пользователей -->
      <div id="user-settings-list" class="max-h-80 overflow-auto border-t border-b"></div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-4 mt-6">
        <button id="cancel-user-settings" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600">
          Отмена
        </button>
        <button id="save-user-settings" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
          Сохранить
        </button>
      </div>
    </div>
  `;

  createModal(title, content, { width: '600px' });

  // Кнопка "Отмена"
  document.getElementById('cancel-user-settings')?.addEventListener('click', () => {
    document.getElementById('modal-container')?.remove();
  });

  // Получаем контейнер для списка пользователей
  const userListContainer = document.getElementById('user-settings-list');
  if (!userListContainer) return;

  // Загружаем список пользователей и цвета
  BX24.callMethod('user.get', {}, (res) => {
    if (res.error()) {
      console.error('Ошибка загрузки пользователей:', res.error());
      return;
    }

    const users = res.data();
    BX24.callMethod('app.option.get', { option: 'user_colors' }, (colorRes) => {
      const colorMap = colorRes.data() || {};
      let displayedUsers = [];

      function renderUserList(filteredUsers = users) {
        userListContainer.innerHTML = '';
        displayedUsers = filteredUsers;

        filteredUsers.forEach((user) => {
          const userId = user.ID;
          const defaultColor = colorMap[userId] || '#cccccc';

          const userRow = document.createElement('div');
          userRow.className = 'flex items-center justify-between py-2 px-2 border-b';

          userRow.innerHTML = `
            <div class="flex items-center gap-2">
              <img src="${user.PERSONAL_PHOTO || 'https://bg59.online/We/photos/avatar.png'}"
                    class="w-8 h-8 rounded-full object-cover"
                    alt="avatar">
              <div>
                <p class="font-semibold">${user.NAME} ${user.LAST_NAME}</p>
                <p class="text-gray-500 text-sm">${user.WORK_POSITION || ''}</p>
              </div>
            </div>

            <input 
              type="color" 
              value="${defaultColor}" 
              data-user-id="${userId}" 
              class="color-picker border w-12 h-8 cursor-pointer">
          `;

          userListContainer.appendChild(userRow);
        });
      }

      // Изначально рендерим весь список
      renderUserList();

      // Фильтрация пользователей
      document.getElementById('userSearch')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = users.filter((user) => {
          const fullName = `${user.NAME} ${user.LAST_NAME}`.toLowerCase();
          return fullName.includes(query);
        });
        renderUserList(filtered);
      });
    });
  });

  // Сохранение цветов
  document.getElementById('save-user-settings')?.addEventListener('click', () => {
    const colorPickers = document.querySelectorAll('.color-picker');
    const newColors = {};

    colorPickers.forEach((picker) => {
      newColors[picker.getAttribute('data-user-id')] = picker.value;
    });

    BX24.callMethod('app.option.set', { options: { user_colors: newColors } }, (res) => {
      if (res.error()) {
        console.error('Ошибка сохранения цветов:', res.error());
      } else {
        console.log('✅ Цвета сохранены:', newColors);
        document.getElementById('modal-container')?.remove();
      }
    });
  });
}
