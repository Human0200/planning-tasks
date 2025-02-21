// src/components/AIModelSettingsModal.js

import { loadAIModel } from '../services/aiService.js';
import { createModal } from './Modal.js';

export function showAIModelSettingsModal() {
  const title = 'Настройки модели ИИ (AI/ML API)';

  const content = `
    <div class="ai-model-settings-container">
      <!-- Поле поиска -->
      <div class="mb-4">
        <input 
          type="text" 
          id="aiModelSearch" 
          class="border p-2 w-full" 
          placeholder="🔍 Поиск по модели..."
        >
      </div>

      <!-- Список моделей -->
      <div 
        id="aiModelList" 
        class="space-y-2 max-h-60 overflow-auto border-t border-b p-2"
      ></div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-4 mt-4">
        <button 
          id="cancel-ai-model" 
          class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button 
          id="save-ai-model" 
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Сохранить
        </button>
      </div>
    </div>
  `;

  const modal = createModal(title, content, { width: '600px' });

  // 🔹 Список суб-моделей из AI/ML API.
  // (Примеры — проверьте реальные названия моделей в документации aimlapi.com)
  const modelData = [
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.2',
      name: 'Mistral 7B Instruct',
      description: 'OpenAI-совместимая модель Mistral 7B (инструкции).',
    },
    {
      id: 'qwen/QwenTurbo',
      name: 'Qwen Turbo',
      description: 'Пример модели Qwen (Alibaba) через aimlapi.',
    },
    {
      id: 'claude/AnthropicClaude2',
      name: 'Anthropic Claude 2',
      description: 'Если доступен через aimlapi.',
    },
    // Добавляйте дальше любые доступные модели:
    // { id: '...', name: '...', description: '...' },
  ];

  // 1) Рендерим список радио-кнопок
  const modelList = document.getElementById('aiModelList');
  modelList.innerHTML = modelData
    .map(
      (m) => `
      <label class="flex items-center p-2 border rounded hover:bg-gray-100 cursor-pointer">
        <input type="radio" name="aiModel" value="${m.id}" class="mr-2">
        <div>
          <div class="font-semibold">${m.name}</div>
          <div class="text-sm text-gray-600">${m.description}</div>
        </div>
      </label>
    `,
    )
    .join('');

  // 2) Подгружаем сохранённую модель (если есть)
  loadAIModel()
    .then((savedModel) => {
      if (savedModel) {
        // Ставим "checked" на ту, что выбрана
        const radio = modelList.querySelector(`input[name="aiModel"][value="${savedModel}"]`);
        if (radio) {
          radio.checked = true;
        }
      }
    })
    .catch((err) => console.error('Ошибка при loadAIModel:', err));

  // 3) Фильтрация по поиску
  const searchInput = document.getElementById('aiModelSearch');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const labels = modelList.querySelectorAll('label');
    labels.forEach((label) => {
      const text = label.textContent.toLowerCase();
      label.style.display = text.includes(query) ? 'flex' : 'none';
    });
  });

  // 4) Кнопка «Отмена»
  document.getElementById('cancel-ai-model').addEventListener('click', () => {
    modal.close();
  });

  // 5) Кнопка «Сохранить» (записать в Bitrix24)
  document.getElementById('save-ai-model').addEventListener('click', () => {
    const selected = document.querySelector('input[name="aiModel"]:checked');
    if (!selected) {
      alert('Пожалуйста, выберите модель ИИ (aimlapi).');
      return;
    }
    const selectedModel = selected.value;

    BX24.callMethod('app.option.set', { options: { ai_model: selectedModel } }, (res) => {
      if (res.error()) {
        console.error('Ошибка сохранения модели ИИ:', res.error());
        alert('Ошибка сохранения настроек модели ИИ.');
      } else {
        console.log('✅ Модель ИИ сохранена:', selectedModel);
        modal.close();
      }
    });
  });
}
