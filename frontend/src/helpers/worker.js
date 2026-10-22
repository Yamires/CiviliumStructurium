export function workerTask(data, signal) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./calculation.worker.js', import.meta.url), { type: 'module' });
    const finish = (error, result) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      worker.terminate();
      if (error) reject(new Error(error));
      else resolve(result);
    };
    const cancel = () => finish('Calcul annulé');
    const timer = setTimeout(() => finish('Temps de traitement dépassé'), 10000);
    if (signal?.aborted) { cancel(); return; }
    signal?.addEventListener('abort', cancel, { once: true });
    worker.onmessage = ({ data: answer }) => finish(answer.error, answer.result);
    worker.onerror = () => finish('Erreur de traitement');
    worker.postMessage(data);
  });
}
