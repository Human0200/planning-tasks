export function UserInfo(onUserChange) {
  const userInfoContainer = document.createElement('div');
  userInfoContainer.id = 'user-info-container';
  userInfoContainer.className = 'flex items-center bg-white shadow-md p-4 rounded-lg gap-4';

  userInfoContainer.innerHTML = `
    <img id="user-avatar" src="https://i.pravatar.cc/50?u=user1" class="rounded-full w-12 h-12 shadow-md" alt="Аватар">
    <div>
      <p id="user-name" class="text-lg font-semibold text-gray-900">Иванов Иван</p>
      <p id="user-role" class="text-sm text-gray-600">Менеджер проектов</p>
    </div>
    <select id="user-select" class="border rounded px-3 py-2 bg-gray-100">
      <option value="user1" selected>Иванов Иван</option>
      <option value="user2">Петров Петр</option>
      <option value="user3">Сидоров Сидор</option>
      <option value="user4">Алексеева Анна</option>
      <option value="user5">Семенов Виктор</option>
    </select>
  `;

  userInfoContainer.querySelector('#user-select').addEventListener('change', function () {
    if (typeof onUserChange === 'function') {
      onUserChange(this.value);
    }
  });

  return userInfoContainer;
}
