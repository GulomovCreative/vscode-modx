// TextDecoder есть и в хосте расширений на Node (глобально начиная с Node 11),
// и в браузерном, где расширение живёт в Web Worker. В lib "es2020" его нет, а
// подключать сюда "dom" или "webworker" ради одного класса значит объявить
// доступным всё окружение браузера, которого в хосте на Node не существует.
declare const TextDecoder: {
  new (label?: string): { decode(input?: Uint8Array): string }
};
