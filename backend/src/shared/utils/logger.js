const levels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG'
};

const write = (level, message, meta) => {
  if (process.env.NODE_ENV === 'test') return;

  const payload = {
    level: levels[level],
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta } : {})
  };

  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') write('debug', message, meta);
  }
};
