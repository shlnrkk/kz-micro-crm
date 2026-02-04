export default {
  fetch(request, env) {
    // отдаём статические файлы из папки public
    return env.ASSETS.fetch(request);
  },
};