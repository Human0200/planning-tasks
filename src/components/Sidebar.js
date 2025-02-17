export function Sidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className =
    'sidebar w-16 bg-gray-900 text-white h-screen left-0 top-0 flex flex-col items-center p-2 shadow-lg transition-all duration-300 ease-in-out overflow-hidden';

  sidebar.innerHTML = `
    <!-- Кнопка управления меню -->
    <button id="menu-toggle" class="text-white text-2xl focus:outline-none mb-4 self-center">
      <span class="material-icons">menu</span>
    </button>

    <nav class="w-full flex-1">
      <ul class="space-y-2 w-full">
        ${createMenuItem('event', 'Настройки календаря', 'data-menu-action="Календарь"')}
        ${createMenuItem(
          'assignment',
          'Незапланированные задачи',
          'data-menu-action="Незапланированные задачи"',
        )}
        ${createMenuItem('group', 'Настройки пользователей', 'data-menu-action="Пользователи"')}

      </ul>
    </nav>
  `;

  setTimeout(() => {
    document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
  }, 100);

  return sidebar;
}

// Функция для создания пунктов меню (если её не вынесли отдельно)
function createMenuItem(icon, text, extraAttributes = '') {
  return `
    <li class="menu-item flex items-center w-full">
      <a href="#" 
         class="flex items-center p-3 rounded-lg hover:bg-gray-700 transition w-full"
         ${extraAttributes}
      >
        <span class="material-icons text-xl menu-icon">${icon}</span>
        <span class="ml-3 menu-text opacity-0 invisible transition-opacity duration-300">${text}</span>
      </a>
    </li>
  `;
}

// Функция переключения меню
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const calendarContainer = document.getElementById('calendar-container');

  sidebar.classList.toggle('w-16');
  sidebar.classList.toggle('w-64');

  // Обновляем ширину календаря в зависимости от размера меню
  if (sidebar.classList.contains('w-16')) {
    calendarContainer.style.width = 'calc(100vw - 4rem)';
  } else {
    calendarContainer.style.width = 'calc(100vw - 16rem)';
  }

  // Управляем текстом меню
  document.querySelectorAll('.menu-text').forEach((el) => {
    if (sidebar.classList.contains('w-16')) {
      el.classList.add('opacity-0', 'invisible');
    } else {
      setTimeout(() => {
        el.classList.remove('opacity-0', 'invisible');
      }, 200);
    }
  });

  // Перерисовываем календарь
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 300);
}
