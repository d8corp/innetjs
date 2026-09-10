(function() {
	const env = { "__INNETJS__PACKAGE_VERSION": "4.0.0-beta.4" };
	if (typeof process === "undefined") globalThis.process = { env };
	else if (process.env) Object.assign(process.env, env);
	else process.env = env;
})();
//#endregion
