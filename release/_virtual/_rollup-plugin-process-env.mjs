;(function () {
  const env = {"__INNETJS__PACKAGE_VERSION":"2.4.3"};
  if (typeof process === 'undefined') {
    globalThis.process = { env: env };
  } else if (process.env) {
    Object.assign(process.env, env);
  } else {
    process.env = env;
  }
})();
