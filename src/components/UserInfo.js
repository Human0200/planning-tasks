import { getUserData, getUsers } from '../services/userService.js';
import { showEventForm } from './EventForm.js'; // поправьте путь, если нужно

export function UserInfo(onUserChange) {
  const userInfoContainer = document.createElement('div');
  userInfoContainer.id = 'user-info-container';
  userInfoContainer.className = 'flex items-center bg-white shadow-md p-4 rounded-lg gap-6';

  // Базовая разметка без жестко зашитых опций – опции заполним динамически
  userInfoContainer.innerHTML = `
    <img id="user-avatar" src="https://bg59.online/We/photos/all.png" class="rounded-full w-12 h-12 shadow-md" alt="Аватар">
    <div class="flex flex-col">
      <p id="user-name" class="text-lg font-semibold text-gray-900">Все сотрудники</p>
      <p id="user-role" class="text-sm text-gray-600">Просмотр всех задач</p>
    </div>
    <select id="user-select" class="border rounded px-3 py-2 bg-gray-100 w-96"></select>
  `;

  const selectEl = userInfoContainer.querySelector('#user-select');

  // ▼▼▼ Динамические чекбоксы внутри того же контейнера ▼▼▼
  const filterContainer = document.createElement('div');
  filterContainer.className = 'flex items-center gap-4';

  filterContainer.innerHTML = `
<label class="inline-flex items-center gap-1">
      <input type="checkbox" id="showActualTimeOnly" class="cursor-pointer" />
      <span>Показать задачи по фактическому времени</span>
    </label>
    <label class="inline-flex items-center gap-1">
      <input type="checkbox" id="hideNoDeadline" class="cursor-pointer" />
      <span>Убрать задачи без крайнего срока</span>
    </label>
  `;
  // Добавляем в основной контейнер (рядом с select)
  userInfoContainer.appendChild(filterContainer);

  // Добавляем поле поиска по задачам в этот же контейнер (например, справа от чекбоксов)
  const searchContainer = document.createElement('div');
  searchContainer.className = 'relative ml-auto'; // ml-auto для сдвига вправо
  searchContainer.innerHTML = `
  <span class="absolute inset-y-0 left-0 flex items-center pl-2">
    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M21 21l-4.35-4.35m2.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  </span>
  <input type="text" id="task-search" class="border rounded pl-10 pr-3 py-2" placeholder="Поиск по задачам..."> 
`;

  // Создаем элемент индикатора загрузки
  const loadingIndicator = document.createElement('img');
  loadingIndicator.id = 'search-loading';
  loadingIndicator.src = 'https://bg59.online/We/photos/loading_search.gif'; // ссылка на гифку
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.right = '10px';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.transform = 'translateY(-50%)';
  loadingIndicator.style.height = '20px'; // настройте размер по необходимости
  loadingIndicator.style.display = 'none';
  searchContainer.appendChild(loadingIndicator);

  filterContainer.appendChild(searchContainer);

  // ─── кнопка «Создать задачу» ───────────────────────────────────────
  const createTaskBtn = document.createElement('button');
  createTaskBtn.textContent = 'Создать задачу';
  createTaskBtn.className = 'ml-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600';
  createTaskBtn.addEventListener('click', () => {
    // Открываем форму создания задачи на текущий момент (можешь передать любую дату)
    const now = new Date().toISOString();
    showEventForm(now, null, {
      allDay: false,
      colorMap: window.userColors, // или откуда у тебя приходит карта цветов
    });
  });
  filterContainer.appendChild(createTaskBtn);
  // ───────────────────────────────────────────────────────────────────

  // Вешаем обработчики на чекбоксы:
  const chkActualTimeOnly = filterContainer.querySelector('#showActualTimeOnly');
  const chkDeadline = filterContainer.querySelector('#hideNoDeadline');

  // При клике на чекбокс – вызываем фильтрацию по текущему выбранному пользователю
  [chkActualTimeOnly, chkDeadline].forEach((chk) => {
    chk.addEventListener('change', () => {
      // Если используете filterEvents глобально, передавайте текущего пользователя:
      const currentUserValue = $(selectEl).val();
      if (typeof window.filterEvents === 'function') {
        window.filterEvents(currentUserValue);
      }
    });
  });
  // ▲▲▲ Конец блока чекбоксов ▲▲▲

  // Добавляем обработчик для поля поиска с дебаунсом
  // (Чтобы фильтрация не запускалась слишком часто, можно реализовать простейший дебаунс)
  // Получаем элемент поля поиска и индикатор загрузки (предполагается, что он уже добавлен в searchContainer)
  let debounceTimeout;
  const searchInput = searchContainer.querySelector('#task-search');

  searchInput.addEventListener('input', (e) => {
    // Показываем индикатор сразу при вводе
    loadingIndicator.style.display = 'block';
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const query = e.target.value.toLowerCase();
      filterEventsByTitle(query);
      // После завершения фильтрации скрываем индикатор
      loadingIndicator.style.display = 'none';
    }, 300);
  });

  // Функция фильтрации событий по названию
  function filterEventsByTitle(searchTerm) {
    if (!window.calendar) return;
    window.calendar.getEvents().forEach((event) => {
      const eventTitle = event.title.toLowerCase();
      if (eventTitle.includes(searchTerm)) {
        event.setProp('display', 'auto');
      } else {
        event.setProp('display', 'none');
      }
    });
  }

  // Заполняем селект реальными данными пользователей через вызов BX24 API (getUsers)
  getUsers((users) => {
    selectEl.innerHTML = '';

    // Добавляем опцию "Все"
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Все';
    selectEl.appendChild(allOption);

    // Для каждого пользователя создаем элемент option
    users.forEach((user) => {
      const option = document.createElement('option');
      option.value = user.ID; // Используем ID пользователя из Bitrix24
      option.textContent = `${user.NAME} ${user.LAST_NAME}`;
      selectEl.appendChild(option);
    });

    // Инициализируем select2, если он подключен
    if ($.fn.select2) {
      $(selectEl).select2({
        placeholder: 'Выберите пользователя',
        allowClear: true,
        width: '300px',
      });
    } else {
      console.error('❌ Ошибка: Select2 не найден!');
    }

    // Значение по умолчанию – "Все"
    // $(selectEl).val('all').trigger('change');
    if (typeof onUserChange === 'function') {
      onUserChange('all');
    }
  });

  // Обработчик изменения селекта через jQuery для совместимости с select2
  $(selectEl).on('change', function () {
    const selectedValue = $(this).val();
    window.currentResponsibleId = selectedValue === 'all' ? 'all' : selectedValue;
    console.log(
      'Выбранное значение , которое сохраняем в currentResponsibleId:',
      window.currentResponsibleId,
    );
    console.log('Выбранное значение:', selectedValue);

    const userAvatar = document.querySelector('#user-avatar');
    const userName = document.querySelector('#user-name');
    const userRole = document.querySelector('#user-role');

    console.log('🔍 Проверка элементов userInfo:', userAvatar, userName, userRole);

    if (!userAvatar || !userName || !userRole) {
      console.error('❌ Ошибка: Один из элементов (avatar, name, role) не найден в DOM!');
      return;
    }
    if (selectedValue === 'all') {
      userAvatar.src = 'https://bg59.online/We/photos/all.png';
      userName.textContent = 'Все сотрудники';
      userRole.textContent = 'Просмотр всех задач';
    } else {
      getUserData(selectedValue, (selectedUser) => {
        console.log('Полученные данные пользователя:', selectedUser);
        if (selectedUser) {
          userAvatar.src =
            selectedUser.PERSONAL_PHOTO || 'https://bg59.online/We/photos/avatar.png';
          userName.textContent = `${selectedUser.NAME} ${selectedUser.LAST_NAME}`;
          userRole.textContent = selectedUser.WORK_POSITION || 'Пользователь';
        }
      });
    }
    // 🔹 Добавляем вызов фильтрации после смены пользователя
    if (typeof window.filterEvents === 'function') {
      console.log(`🔄 Запускаем фильтрацию для пользователя ${selectedValue}`);
      window.filterEvents(selectedValue);
    } else {
      console.error('❌ Ошибка: Функция filterEvents не найдена!');
    }
  });

  return userInfoContainer;
}
