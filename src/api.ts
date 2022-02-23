import express, { Express } from 'express';
import util from 'util';
import { config as Config } from './config/config.js';

import { Controller } from './controllers/index.js';
import { logs as Logs } from './lang/logs.js';
import { checkAuth, handleError } from './middleware/index.js';
import { Logger } from './services/index.js';

export class Api {
	private app: Express;

	constructor(public controllers: Controller[]) {
		this.app = express();
		this.app.use(express.json());
		this.setupControllers();
		this.app.use(handleError());
	}

	public async start(): Promise<void> {
		const listen = util.promisify(this.app.listen.bind(this.app));
		// await listen(Config.api.port) gave an error cuz listen is expected to be empty;
		await listen();
		Logger.info(Logs.info.apiStarted.replaceAll(`{PORT}`, `${Config.api.port}`));
	}

	private setupControllers(): void {
		for (const controller of this.controllers) {
			if (controller.authToken) {
				controller.router.use(checkAuth(controller.authToken));
			}
			controller.register();
			this.app.use(controller.path, controller.router);
		}
	}
	// kofi
	// topgg voting
}
