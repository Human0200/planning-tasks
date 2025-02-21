// Где-нибудь рядом с showEventForm (или в отдельном файле),
// но обязательно импортируйте createModal, если нужно.
import { createModal } from './Modal.js';

export function showAiReportModal(reportText) {
  const content = `
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2">Сформированный отчёт</h3>
      <!-- Используем pre-line, чтобы сохранять переносы строк в ответе -->
      <p class="whitespace-pre-line">${reportText}</p>
    </div>
  `;
  // Заголовок — «Отчёт по задаче» (или любой другой)
  createModal('Отчёт по задаче', content, { width: '600px' });
}
