export function loadCalendarSettings(callback) {
  BX24.callMethod('user.option.get', { option: 'calendar_settings' }, (res) => {
    if (res.error()) {
      console.error('❌ Ошибка загрузки настроек календаря:', res.error());
      callback({
        slotMinTime: '09:00',
        slotMaxTime: '18:00',
        slotDuration: '01:00:00',
        allDaySlot: true, // Дефолтное значение
        dynamicDeadline: false,
      });
    } else {
      let settings = res.data() || '{}'; // Защита от null
      try {
        settings = JSON.parse(settings); // Преобразуем строку в объект
      } catch (e) {
        console.error('Ошибка парсинга настроек календаря:', e);
        settings = {}; // Если ошибка парсинга, используем пустой объект
      }

      console.log('✅ Загруженные настройки календаря:', settings);
      callback({
        slotMinTime: settings.slotMinTime || '08:00',
        slotMaxTime: settings.slotMaxTime || '20:00',
        slotDuration: settings.slotDuration || '01:00:00',
        allDaySlot: settings.allDaySlot !== undefined ? settings.allDaySlot : true, // Загружаем флаг
        dynamicDeadline: settings.dynamicDeadline !== undefined ? settings.dynamicDeadline : false,
      });
    }
  });
}
