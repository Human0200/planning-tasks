import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';

document.addEventListener('DOMContentLoaded', () => {
  // Данные о событиях
  let events = [
    {
      id: 1,
      title: 'Событие 1 / Иван Иванов / 1 час',
      start: '2025-01-22T09:00:00',
      end: '2025-01-22T10:00:00',
      employeeIds: [1], // Сотрудники
    },
  ];

  // Данные о сотрудниках
  let employees = [];

//   function loadEmployeesFromBitrix() {
//     BX24.callMethod(
//       "user.get",
//       {},
//       function (result) {
//         if (result.error()) {
//           console.error(result.error());
//         } else {
//           const users = result.data().result;

//           // Преобразуем данные из Bitrix24 в массив employees
//           employees = users.map(user => ({
//             id: parseInt(user.ID), // Преобразуем ID в число
//             name: `${user.NAME} ${user.LAST_NAME}`, // Объединяем имя и фамилию
//             color: getRandomColor(), // Генерация случайного цвета
//           }));

//           console.log('Сотрудники загружены:', employees);

//           // Обновляем выпадающие списки сотрудников
//           const employeeSelect = document.getElementById('employee');
//           employeeSelect.innerHTML = ''; // Очищаем список
//           employees.forEach(employee => {
//             const option = document.createElement('option');
//             option.value = employee.id;
//             option.textContent = employee.name;
//             employeeSelect.appendChild(option);
//           });

//           // Обновляем события календаря (если нужно)
//           const events = calendar.getEvents();
//           events.forEach(event => {
//             const employeeIds = event.extendedProps.employeeIds || [];
//             const colors = employees
//               .filter(e => employeeIds.includes(e.id))
//               .map(e => e.color);
//             event.setProp('color', colors.length === 1 ? colors[0] : `linear-gradient(90deg, ${colors.join(', ')})`);
//           });
//         }
//       }
//     );
//   }

//   // Функция для генерации случайного цвета
//   function getRandomColor() {
//     const letters = '0123456789ABCDEF';
//     let color = '#';
//     for (let i = 0; i < 6; i++) {
//       color += letters[Math.floor(Math.random() * 16)];
//     }
//     return color;
//   }

// function updateCalendarWithEmployees() {
//   const employeeSelect = document.getElementById('employee');
//   employeeSelect.innerHTML = ''; // Очищаем список
//   employees.forEach(employee => {
//     const option = document.createElement('option');
//     option.value = employee.id;
//     option.textContent = employee.name;
//     employeeSelect.appendChild(option);
//   });

//   const events = calendar.getEvents();
//   events.forEach(event => {
//     const employeeIds = event.extendedProps.employeeIds || [];
//     const colors = employees
//       .filter(e => employeeIds.includes(e.id))
//       .map(e => e.color);
//     event.setProp('color', colors.length === 1 ? colors[0] : `linear-gradient(90deg, ${colors.join(', ')})`);
//   });
// }
// loadEmployeesFromBitrix();
// updateCalendarWithEmployees();
  // Инициализация календаря
  const calendarEl = document.getElementById('calendar');
  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    events: events,
    selectable: true,
    dateClick: handleDateClick,
    select: handleSelect,
    eventClick: handleEventClick,
    locale: ruLocale,
    
  // Настройки временной сетки
  slotDuration: '01:00:00', // Интервал времени (1 час)
  slotMinTime: '08:00:00',  // Начало временного промежутка (8:00)
  slotMaxTime: '18:00:00',  // Конец временного промежутка (20:00)
  slotHeight: 50,           // Высота ячейки
  expandRows: true,         // Равномерное распределение строк
  contentHeight: 'auto',    // Автоматическая высота контента
    
    // Форматирование временных меток
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        meridiem: false
    },
    
    // Настройки для секции "Весь день"
    allDaySlot: true,
    allDayText: 'Весь день',
    
    // Оптимизация отображения
    dayHeaderFormat: { weekday: 'short', day: 'numeric' },
    fixedWeekCount: false,
    handleWindowResize: true
});

  calendar.render();
  // Добавляем в JavaScript после инициализации календаря

// Элементы настроек
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const toggleAllday = document.getElementById('toggle-allday');
const employeeColorSelect = document.getElementById('employee-color-select');
const employeeColorPicker = document.getElementById('employee-color-picker');
const saveColorBtn = document.getElementById('save-color');
const closeSettingsBtn = document.getElementById('close-settings');

// Загрузка настроек из LocalStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('calendarSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    
    // Загрузка цветов сотрудников
    settings.employees.forEach(savedEmployee => {
      const employee = employees.find(e => e.id === savedEmployee.id);
      if (employee) employee.color = savedEmployee.color;
    });
    
    // Загрузка настройки "Весь день"
    toggleAllday.checked = settings.showAllDay;
    calendar.setOption('allDaySlot', settings.showAllDay);
  }
}

// Сохранение настроек в LocalStorage
function saveSettings() {
  const settings = {
    employees: employees.map(e => ({ id: e.id, color: e.color })),
    showAllDay: toggleAllday.checked
  };
  localStorage.setItem('calendarSettings', JSON.stringify(settings));
}

// Заполнение списка сотрудников в настройках
employees.forEach(employee => {
  const option = document.createElement('option');
  option.value = employee.id;
  option.textContent = employee.name;
  employeeColorSelect.appendChild(option);
});

// Обработчики событий
settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'block';
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

employeeColorSelect.addEventListener('change', function() {
  const employee = employees.find(e => e.id === parseInt(this.value));
  if (employee) {
    employeeColorPicker.value = employee.color;
  }
});

saveColorBtn.addEventListener('click', () => {
  const selectedEmployee = employees.find(e => e.id === parseInt(employeeColorSelect.value));
  if (selectedEmployee) {
    selectedEmployee.color = employeeColorPicker.value;
    saveSettings();
    updateCalendarEvents();
  }
});

toggleAllday.addEventListener('change', function() {
  calendar.setOption('allDaySlot', this.checked);
  calendar.updateSize();
  saveSettings();
});

// Обновление событий календаря
function updateCalendarEvents() {
  const currentEvents = calendar.getEvents();
  currentEvents.forEach(event => {
    const employeeIds = event.extendedProps.employeeIds || [];
    const colors = employees
      .filter(e => employeeIds.includes(e.id))
      .map(e => e.color);
    
    event.setProp('color', colors.length === 1 ? colors[0] : `linear-gradient(90deg, ${colors.join(', ')})`);
  });
}

// Первоначальная загрузка настроек
loadSettings();

  // Заполнение фильтра сотрудников
  const employeeSelect = document.getElementById('employee');
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = employee.name;
    employeeSelect.appendChild(option);
  });

  employeeSelect.addEventListener('change', function () {
    const selectedEmployeeId = this.value;
    const allEvents = calendar.getEvents();
    
    allEvents.forEach(event => {
        const employeeIds = event.extendedProps.employeeIds || [];
        const shouldShow = !selectedEmployeeId || 
            employeeIds.includes(parseInt(selectedEmployeeId));
            
        event.setProp('display', shouldShow ? 'auto' : 'none');
    });
});

  // Элементы модального окна
  const modal = document.getElementById('modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const taskForm = document.getElementById('task-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskEmployeeSelect = document.getElementById('task-employee');
  const taskStartInput = document.getElementById('task-start');
  const taskEndInput = document.getElementById('task-end');
  const taskAllDayInput = document.getElementById('task-all-day');
  const modalClose = document.getElementById('modal-close'); // Элемент для закрытия модального окна

  // Заполнение выпадающего списка сотрудников в модальном окне
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = employee.name;
    taskEmployeeSelect.appendChild(option);
  });

  // Текущее редактируемое событие
  let currentEvent = null;

  // Обработка клика на ячейку
  function handleDateClick(info) {
    currentEvent = null; // Новое событие
    openModal();
    taskTitleInput.value = '';
    taskStartInput.value = info.dateStr.replace('T', ' ').substring(0, 16);
    taskEndInput.value = new Date(info.date.getTime() + 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 16);
    taskAllDayInput.checked = false; // Сбрасываем чекбокс "Весь день"
  }

  // Обработка выделения диапазона
  function handleSelect(info) {
    currentEvent = null; // Новое событие
    openModal();
    taskTitleInput.value = '';
    taskStartInput.value = info.startStr.replace('T', ' ').substring(0, 16);
    taskEndInput.value = info.endStr.replace('T', ' ').substring(0, 16);
    taskAllDayInput.checked = false; // Сбрасываем чекбокс "Весь день"
  }

  // Обработка клика на событие
  function handleEventClick(info) {
    currentEvent = info.event; // Редактируемое событие
    openModal();

    // Заполняем форму данными события
    const title = currentEvent.title.split(' / ')[0]; // Извлекаем название задачи
    taskTitleInput.value = title;
    taskStartInput.value = currentEvent.startStr.replace('T', ' ').substring(0, 16);
    taskEndInput.value = currentEvent.endStr.replace('T', ' ').substring(0, 16);
    taskAllDayInput.checked = currentEvent.allDay; // Устанавливаем чекбокс "Весь день"

    // Выбираем сотрудников в выпадающем списке
    Array.from(taskEmployeeSelect.options).forEach(option => {
      option.selected = currentEvent.extendedProps.employeeIds.includes(parseInt(option.value));
    });
  }

  taskAllDayInput.addEventListener('change', function () {
    if (this.checked) {
      taskStartInput.removeAttribute('required');
      taskEndInput.removeAttribute('required');
      taskStartInput.style.display = 'none';
      taskEndInput.style.display = 'none';
    } else {
      taskStartInput.setAttribute('required', 'true');
      taskEndInput.setAttribute('required', 'true');
      taskStartInput.style.display = 'block';
      taskEndInput.style.display = 'block';
    }
  });

  // Открытие модального окна
  function openModal() {
    modal.classList.add('open');
    modalOverlay.classList.add('open');
  }

  // Закрытие модального окна
  function closeModal() {
    modal.classList.remove('open');
    modalOverlay.classList.remove('open');
  }

  // Обработка закрытия модального окна
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
  
    const title = taskTitleInput.value;
    const employeeOptions = taskEmployeeSelect.selectedOptions;
    const employeeIds = Array.from(employeeOptions).map(option => parseInt(option.value));
    const allDay = taskAllDayInput.checked;
  
    // Проверка обязательных полей
    if (!title || employeeIds.length === 0) {
      alert('Заполните название задачи и выберите сотрудников!');
      return;
    }
  
    // Проверка времени, если не выбран "Весь день"
    if (!allDay && (!taskStartInput.value || !taskEndInput.value)) {
      alert('Заполните время начала и окончания!');
      return;
    }
  
    // Форматируем даты
    let start, end;
    if (allDay) {
      // Для событий на весь день используем только дату
      start = taskStartInput.value.split('T')[0];
      end = taskEndInput.value ? taskEndInput.value.split('T')[0] : start;
    } else {
      // Для обычных событий используем дату и время
      start = taskStartInput.value.replace(' ', 'T');
      end = taskEndInput.value.replace(' ', 'T');
    }
  
    // Формируем заголовок события
    const employeeNames = employees
      .filter(employee => employeeIds.includes(employee.id))
      .map(employee => employee.name)
      .join(', ');
  
    const eventTitle = allDay
      ? `${title} / ${employeeNames}`
      : `${title} / ${employeeNames} / ${Math.abs(new Date(end) - new Date(start)) / 36e5} часа`;
  
    // Цвет первого выбранного сотрудника
    const eventColor = employees.find(employee => employee.id === employeeIds[0]).color;
  
    // Создаем объект события
    const eventData = {
      title: eventTitle,
      start: start,
      end: end,
      allDay: allDay,
      employeeIds: employeeIds,
      color: eventColor,
    };
  
    // Добавляем или обновляем событие
    if (currentEvent) {
      // Обновляем существующее событие
      currentEvent.setProp('title', eventData.title);
      currentEvent.setStart(eventData.start);
      currentEvent.setEnd(eventData.end);
      currentEvent.setAllDay(eventData.allDay);
      currentEvent.setExtendedProp('employeeIds', eventData.employeeIds);
      currentEvent.setProp('color', eventData.color);
    } else {
      // Создаем новое событие
      const newEvent = calendar.addEvent(eventData);
      events.push(newEvent); // Добавляем событие в массив
    }
  
    closeModal();
    taskForm.reset();
  });
});
