// Node's native test events are the source of result states, not text matching guesses.
module.exports = async function* (events) {
  for await (const { type, data } of events) {
    if (!['test:pass', 'test:fail'].includes(type)) continue;
    const error = data.details?.error;
    yield JSON.stringify({ name: data.name, file: data.file,
      status: data.skip || data.todo ? 'Not Run' : type === 'test:pass' ? 'Pass' : 'Fail',
      durationMs: data.details?.duration_ms ?? 0,
      error: error ? { message: error.message, code: error.code, cause: error.cause?.message,
        actual: error.cause?.actual, expected: error.cause?.expected } : null }) + '\n';
  }
};
