(async () => {
  try {
    const { isValidApiKeyFormat } = await import('./js/config.js');
    console.log(isValidApiKeyFormat('openrouter', 'sk-or-123'));
  } catch (e) {
    console.error(e);
  }
})();
