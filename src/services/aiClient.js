// aiClient.js

const AIML_API_URL = 'https://api.aimlapi.com/v1/chat/completions';
const AIML_API_KEY = 'a6802191344643d4b64597e73a0549b9'; // Или как вы храните ключ

export async function askAiReport(finalPrompt) {
  // Формируем тело в стиле OpenAI ChatCompletion
  const requestBody = {
    model: 'mistralai/Mistral-7B-Instruct-v0.2', // или любую доступную через aimlapi модель
    messages: [
      { role: 'system', content: 'Ты — помощник, который составляет краткие отчёты по задачам.' },
      { role: 'user', content: finalPrompt },
    ],
    max_tokens: 200,
    temperature: 0.7,
  };

  try {
    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AIML_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Нет ответа';
  } catch (error) {
    console.error('Ошибка при запросе к AI:', error);
    throw error;
  }
}
