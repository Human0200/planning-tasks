import { createModal } from './Modal.js';

/**
 * Открывает модальное окно настроек календаря.
 */
export function showCalendarSettingsModal() {
  const title = 'Настройки календаря';

  // Изначально рендерим окно без данных, затем подгрузим настройки
  const content = `
    <div class="calendar-settings-container">
      <p class="text-gray-600 mb-4">Здесь вы можете настроить параметры отображения календаря.</p>

      <div class="flex flex-col gap-4">
        <!-- Минимальное и максимальное время слотов -->
        <div>
          <label for="slotMinTime" class="block font-medium">Минимальное время слотов:</label>
          <input type="time" id="slotMinTime" class="border p-2 w-full" value="08:00">
        </div>

        <div>
          <label for="slotMaxTime" class="block font-medium">Максимальное время слотов:</label>
          <input type="time" id="slotMaxTime" class="border p-2 w-full" value="18:00">
        </div>

        <!-- Отображение сетки времени -->
        <div>
          <label for="slotDuration" class="block font-medium">Интервал сетки времени:</label>
          <select id="slotDuration" class="border p-2 w-full">
            <option value="00:15:00">15 минут</option>
            <option value="00:30:00">30 минут</option>
            <option value="01:00:00" selected>1 час</option>
            <option value="02:00:00">2 часа</option>
          </select>
        </div>

        <!-- Чекбокс для отображения секции "Весь день" -->
        <div>
          <label class="flex items-center gap-2">
            <input type="checkbox" id="allDaySlot" class="rounded border-gray-300">
            <span class="text-sm font-medium text-gray-700">Показывать секцию "Весь день"</span>
          </label>
        </div>
      </div>

      <!-- Новый блок: Динамический крайний срок -->
<div>
  <label class="flex items-center gap-2">
    <input type="checkbox" id="dynamicDeadline" class="rounded border-gray-300">
    <span class="text-sm font-medium text-gray-700">Динамический крайний срок</span>
  </label>
</div>


      <div class="flex justify-end gap-4 mt-6">
        <button id="cancel-calendar-settings" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600">
          Отмена
        </button>
        <button id="save-calendar-settings" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
          Сохранить
        </button>
      </div>
    </div>
  `;

  // Создаём модальное окно и сохраняем экземпляр для дальнейшего управления
  const modalInstance = createModal(title, content, { width: '500px' });

  // Загружаем текущие настройки пользователя **после отрисовки модального окна**
  BX24.callMethod('user.option.get', { option: 'calendar_settings' }, (res) => {
    if (res.error()) {
      console.error('Ошибка загрузки настроек календаря:', res.error());
      return;
    }

    let settings = res.data() || {};

    // Если настройки сохранены как строка, парсим их
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        console.error('Ошибка парсинга настроек календаря:', e);
        settings = {};
      }
    }

    console.log('✅ Загруженные настройки календаря в модальном окне:', settings);

    // Теперь обновляем элементы модального окна с загруженными данными
    document.getElementById('slotMinTime').value = settings.slotMinTime || '08:00';
    document.getElementById('slotMaxTime').value = settings.slotMaxTime || '18:00';
    document.getElementById('slotDuration').value = settings.slotDuration || '01:00:00';
    document.getElementById('allDaySlot').checked =
      settings.allDaySlot !== undefined ? settings.allDaySlot : true;
    document.getElementById('dynamicDeadline').checked =
      settings.dynamicDeadline !== undefined ? settings.dynamicDeadline : false;
  });

  // Кнопка "Отмена"
  // Обработчик кнопки "Отмена" — закрываем окно через modalInstance.close()
  document.getElementById('cancel-calendar-settings')?.addEventListener('click', () => {
    modalInstance.close();
  });
  // Сохранение настроек
  document.getElementById('save-calendar-settings')?.addEventListener('click', () => {
    const newSettings = {
      slotMinTime: document.getElementById('slotMinTime').value,
      slotMaxTime: document.getElementById('slotMaxTime').value,
      slotDuration: document.getElementById('slotDuration').value,
      allDaySlot: document.getElementById('allDaySlot').checked,
      dynamicDeadline: document.getElementById('dynamicDeadline').checked,
    };

    BX24.callMethod(
      'user.option.set',
      { options: { calendar_settings: JSON.stringify(newSettings) } },
      (res) => {
        if (res.error()) {
          console.error('Ошибка сохранения настроек календаря:', res.error());
        } else {
          console.log('✅ Настройки календаря сохранены:', newSettings);
          document.getElementById('modal-container')?.remove();
          modalInstance.close();
          location.reload(); // Перезагружаем страницу, чтобы применились настройки
        }
      },
    );
  });
}
