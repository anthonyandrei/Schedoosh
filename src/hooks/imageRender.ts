export function getPreviewRenderOptions<T extends object>(options: T) {
  return {
    ...options,
    cacheBust: true,
    quality: 0.3,
    pixelRatio: 0.5,
  };
}

export function getExportRenderOptions<T extends object>(options: T) {
  return {
    ...options,
    cacheBust: true,
    pixelRatio: 1,
  };
}

export function createSerialRenderQueue() {
  let tail: Promise<void> = Promise.resolve();

  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(
      () => task(),
      () => task()
    );

    tail = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  };
}
