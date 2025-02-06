export function loadCalendarSettings(callback) {
  BX24.callMethod('user.option.get', { option: 'calendar_settings' }, (res) => {
    if (res.error()) {
      console.error('❌ Ошибка загрузки настроек календаря:', res.error());
      callback({
        slotMinTime: '09:00',
        slotMaxTime: '18:00',
        slotDuration: '01:00:00',
      }); // Дефолтные значения
    } else {
      const settings = res.data() || {};
      console.log('✅ Загруженные настройки календаря:', settings);
      callback({
        slotMinTime: settings.slotMinTime || '08:00',
        slotMaxTime: settings.slotMaxTime || '20:00',
        slotDuration: settings.slotDuration || '01:00:00',
      });
    }
  });
}
