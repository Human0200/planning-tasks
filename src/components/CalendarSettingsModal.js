import { createModal } from './Modal.js';

/**
 * Открывает модальное окно настроек календаря.
 */
export function showCalendarSettingsModal() {
  const title = 'Настройки календаря';

  const content = `
    <div class="calendar-settings-container">
      <p class="text-gray-600 mb-4">Здесь вы можете настроить параметры отображения календаря.</p>

      <div class="flex flex-col gap-4">
        <!-- Минимальное и максимальное время слотов -->
        <div>
          <label for="slotMinTime" class="block font-medium">Минимальное время слотов:</label>
          <input type="time" id="slotMinTime" class="border p-2 w-full">
        </div>

        <div>
          <label for="slotMaxTime" class="block font-medium">Максимальное время слотов:</label>
          <input type="time" id="slotMaxTime" class="border p-2 w-full">
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

  createModal(title, content, { width: '500px' });

  // Кнопка "Отмена"
  document.getElementById('cancel-calendar-settings')?.addEventListener('click', () => {
    document.getElementById('modal-container')?.remove();
  });

  // Загружаем текущие настройки пользователя
  BX24.callMethod('user.option.get', { option: 'calendar_settings' }, (res) => {
    if (res.error()) {
      console.error('Ошибка загрузки настроек календаря:', res.error());
      return;
    }

    const settings = res.data() || {};
    document.getElementById('slotMinTime').value = settings.slotMinTime || '08:00';
    document.getElementById('slotMaxTime').value = settings.slotMaxTime || '18:00';
    document.getElementById('slotDuration').value = settings.slotDuration || '01:00:00';
  });

  // Сохранение настроек
  document.getElementById('save-calendar-settings')?.addEventListener('click', () => {
    const newSettings = {
      slotMinTime: document.getElementById('slotMinTime').value,
      slotMaxTime: document.getElementById('slotMaxTime').value,
      slotDuration: document.getElementById('slotDuration').value,
    };

    BX24.callMethod('user.option.set', { options: { calendar_settings: newSettings } }, (res) => {
      if (res.error()) {
        console.error('Ошибка сохранения настроек календаря:', res.error());
      } else {
        console.log('✅ Настройки календаря сохранены:', newSettings);
        document.getElementById('modal-container')?.remove();
        location.reload(); // Перезагружаем страницу, чтобы применились настройки
      }
    });
  });
}
