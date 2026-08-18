(function() {
	const env = { "__INNETJS__PACKAGE_VERSION": "4.0.0-alpha.20" };
	if (typeof process === "undefined") globalThis.process = { env };
	else if (process.env) Object.assign(process.env, env);
	else process.env = env;
})();
//#endregion
