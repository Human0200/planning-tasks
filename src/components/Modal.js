/**
 * Создаёт модальное окно с возможностью перетаскивания.
 * В этой реализации:
 * - Не используется backdrop (затемнение заднего плана отсутствует).
 * - Окно не закрывается по клику вне его области.
 * - Заголовок окна (header) служит для перетаскивания.
 *
 * @param {string} title - Заголовок модального окна.
 * @param {string} content - HTML-содержимое модального окна.
 * @param {Object} options - Дополнительные настройки (например, ширина окна).
 * @returns {Object} Объект с методом close() и ссылкой на элемент модального окна.
 */
export function createModal(title, content, options = {}) {
  // Создаём модальное окно (без backdrop)
  const modal = document.createElement('div');
  modal.classList.add('draggable-modal', 'bg-white', 'rounded-lg', 'shadow-lg', 'p-6', 'relative');
  modal.style.width = options.width || '500px';
  modal.style.position = 'fixed';
  // Центрируем окно на экране
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.zIndex = 9999; // Поверх остальных элементов

  // Создаём шапку (header) модального окна, которая будет использоваться для перетаскивания
  const header = document.createElement('div');
  header.classList.add(
    'modal-header',
    'flex',
    'justify-between',
    'items-center',
    'border-b',
    'pb-3',
    'cursor-move',
  );

  const headerTitle = document.createElement('h2');
  headerTitle.classList.add('text-lg', 'font-semibold');
  headerTitle.innerText = title;

  // Кнопка закрытия (крестик)
  const closeButton = document.createElement('button');
  closeButton.classList.add('modal-close', 'text-gray-500', 'hover:text-gray-700');
  closeButton.innerHTML = '&times;';

  header.appendChild(headerTitle);
  header.appendChild(closeButton);

  // Контейнер для контента окна
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('modal-content', 'mt-4');
  contentContainer.innerHTML = content;

  // Собираем модальное окно
  modal.appendChild(header);
  modal.appendChild(contentContainer);

  // Добавляем модальное окно в документ
  document.body.appendChild(modal);

  // Обработчик кнопки закрытия
  closeButton.addEventListener('click', () => {
    closeModal();
  });

  // Реализация перетаскивания
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    // Получаем текущие координаты окна
    const rect = modal.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    // Убираем трансформацию для корректного позиционирования при перетаскивании
    modal.style.transform = '';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    // Обновляем позицию модального окна
    modal.style.left = e.clientX - offsetX + 'px';
    modal.style.top = e.clientY - offsetY + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Функция закрытия конкретного модального окна
  function closeModal() {
    modal.remove();
  }

  return {
    close: closeModal,
    modalElement: modal,
  };
}
