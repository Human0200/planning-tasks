// src/services/userService.js

/**
 * Получает список пользователей из Bitrix24.
 * @param {Function} callback - Функция, которая принимает массив пользователей.
 */
export function getUsers(callback) {
  BX24.callMethod('user.get', { ACTIVE: true }, (result) => {
    if (result.error()) {
      console.error('Ошибка получения пользователей:', result.error());
      callback([]);
    } else {
      callback(result.data());
    }
  });
}

/**
 * Получает данные конкретного пользователя по его ID.
 * @param {String} userId - Идентификатор пользователя (например, "1" или "user1").
 * @param {Function} callback - Функция, которая принимает объект пользователя или null.
 */
export function getUserData(userId, callback) {
  BX24.callMethod('user.get', { filter: { ID: userId, ACTIVE: true } }, (result) => {
    if (result.error()) {
      console.error('Ошибка получения пользователя:', result.error());
      callback(null);
    } else {
      const data = result.data();

      if (data.length > 0) {
        callback(data[0]);
      } else {
        callback(null);
      }
    }
  });
}
