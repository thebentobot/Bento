import { DiscordAPIError } from 'discord.js';
import pino from 'pino';

let logger = pino(
	{
		formatters: {
			level: (label) => {
				return { level: label };
			},
		},
	},
	pino.transport({
		target: `pino-pretty`,
		options: {
			colorize: true,
			ignore: `pid,hostname`,
			translateTime: `yyyy-mm-dd HH:MM:ss.l`,
		},
	}),
);

export class Logger {
	private static shardId: number;

	public static info(message: string): void {
		logger.info(message);
	}

	public static warn(message: string): void {
		logger.warn(message);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static async error(message: string, error?: any): Promise<void> {
		// Log just a message if no error object
		if (!error) {
			logger.error(message);
			return;
		}

		// Otherwise log details about the error
		switch (true) {
			case error instanceof Response: {
				let resText: string | undefined;
				try {
					resText = await error.text();
				} catch {
					// Ignore
				}
				logger
					.child({
						path: error.url,
						statusCode: error.status,
						statusName: error.statusText,
						headers: error.headers.raw(),
						body: resText,
					})
					.error(message);
				break;
			}
			case error instanceof DiscordAPIError: {
				logger
					.child({
						message: error.message,
						code: error.code,
						statusCode: error.httpStatus,
						method: error.method,
						path: error.path,
						stack: error.stack,
					})
					.error(message);
				break;
			}
			default: {
				logger.error(error, message);
				break;
			}
		}
	}

	public static setShardId(shardId: number): void {
		if (this.shardId !== shardId) {
			this.shardId = shardId;
			logger = logger.child({ shardId });
		}
	}
}
