/**
 * Получает список пользователей из Bitrix24 с кешированием (срок жизни кеша — 1 день).
 * @param {Function} callback - Функция, которая принимает массив пользователей.
 */
export function getUsers(callback) {
  const cacheKey = 'cachedUsers';
  const cacheDuration = 24 * 60 * 60 * 1000; // 1 день в миллисекундах
  const cached = localStorage.getItem(cacheKey);

  // if (cached) {
  //   try {
  //     const { timestamp, data } = JSON.parse(cached);
  //     if (Date.now() - timestamp < cacheDuration) {
  //       console.log('✅ Используем кешированные данные пользователей');
  //       callback(data);
  //       return;
  //     } else {
  //       console.log('❌ Кеш устарел, загружаем заново');
  //     }
  //   } catch (e) {
  //     console.error('Ошибка парсинга кеша пользователей:', e);
  //   }
  // }

  BX24.callMethod('user.get', { ACTIVE: true }, (result) => {
    if (result.error()) {
      console.error('Ошибка получения пользователей:', result.error());
      callback([]);
    } else {
      const users = result.data();
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: users }));
      callback(users);
    }
  });
}

/**
 * Получает данные конкретного пользователя по его ID с кешированием (срок жизни кеша — 1 день).
 * @param {String} userId - Идентификатор пользователя (например, "1" или "user1").
 * @param {Function} callback - Функция, которая принимает объект пользователя или null.
 */
export function getUserData(userId, callback) {
  const cacheKey = `cachedUser_${userId}`;
  const cacheDuration = 24 * 60 * 60 * 1000; // 1 день в миллисекундах
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheDuration) {
        console.log(`✅ Используем кешированные данные для пользователя ${userId}`);
        callback(data);
        return;
      } else {
        console.log(`❌ Кеш для пользователя ${userId} устарел, загружаем заново`);
      }
    } catch (e) {
      console.error(`Ошибка парсинга кеша для пользователя ${userId}:`, e);
    }
  }

  BX24.callMethod('user.get', { filter: { ID: userId, ACTIVE: true } }, (result) => {
    if (result.error()) {
      console.error('Ошибка получения пользователя:', result.error());
      callback(null);
    } else {
      const data = result.data();
      if (data.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data[0] }));
        callback(data[0]);
      } else {
        callback(null);
      }
    }
  });
}
