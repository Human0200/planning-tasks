export function saveAIModel(modelId) {
  return new Promise((resolve, reject) => {
    BX24.callMethod('app.option.set', { options: { ai_model: modelId } }, (res) => {
      if (res.error()) {
        console.error('❌ Ошибка сохранения модели в Bitrix24:', res.error());
        reject(res.error());
      } else {
        console.log(`✅ Модель ${modelId} сохранена в Bitrix24`);
        localStorage.setItem('ai_model', modelId);
        resolve();
      }
    });
  });
}

export function loadAIModel() {
  return new Promise((resolve, reject) => {
    BX24.callMethod('app.option.get', {}, (res) => {
      if (res.error()) {
        console.error('❌ Ошибка загрузки модели из Bitrix24:', res.error());
        // Если хотим, можно вернуть null или выбросить ошибку
        return reject(res.error());
      }
      const data = res.data();
      // Проверяем, есть ли у нас ai_model
      const savedModel = data?.ai_model || null;
      resolve(savedModel);
    });
  });
}
