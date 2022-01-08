import { ErrorRequestHandler } from 'express';
import { Logger } from '../services';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Logs = require(`../../lang/logs.json`);

export function handleError(): ErrorRequestHandler {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	return (error, req, res, _next) => {
		Logger.error(Logs.error.apiRequest.replaceAll(`{HTTP_METHOD}`, req.method).replaceAll(`{URL}`, req.url), error);
		res.status(500).json({ error: true, message: error.message });
	};
}
