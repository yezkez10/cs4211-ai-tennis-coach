export function streamToAsyncIterable<T>(
  reader: ReadableStreamDefaultReader<T>,
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          const result = await reader.read();
          if (result.done) {
            return { done: true, value: undefined };
          }
          return { done: false, value: result.value };
        },
      };
    },
  };
}
