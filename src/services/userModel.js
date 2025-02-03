// src/services/userService.js

export function getUserData(userId) {
  const users = {
    user1: {
      name: 'Иванов Иван',
      role: 'Менеджер проектов',
      avatar: 'https://i.pravatar.cc/50?u=user1',
    },
    user2: {
      name: 'Петров Петр',
      role: 'Разработчик',
      avatar: 'https://i.pravatar.cc/50?u=user2',
    },
    user3: {
      name: 'Сидоров Сидор',
      role: 'HR-специалист',
      avatar: 'https://i.pravatar.cc/50?u=user3',
    },
    user4: {
      name: 'Алексеева Анна',
      role: 'Маркетолог',
      avatar: 'https://i.pravatar.cc/50?u=user4',
    },
    user5: {
      name: 'Семенов Виктор',
      role: 'Тестировщик',
      avatar: 'https://i.pravatar.cc/50?u=user5',
    },
  };
  return users[userId] || users['user1'];
}
