import { Message } from 'discord.js';

import { CommandHandler, EventHandler, TriggerHandler } from '.';

export class MessageHandler implements EventHandler {
	constructor(private commandHandler: CommandHandler, private triggerHandler: TriggerHandler) {}

	public async process(msg: Message): Promise<void> {
		// Don't respond to system messages or self
		if (msg.system || msg.author.id === msg.client.user?.id) {
			return;
		}

		// Process command
		const getPrefix: string = msg.content.charAt(0);
		const args = msg.content.slice(1).split(` `);
		args.unshift(getPrefix);
		if (this.commandHandler.shouldHandle(msg, args)) {
			await this.commandHandler.processMessage(msg, args);
			return;
		}

		// Process trigger
		await this.triggerHandler.process(msg);
	}
}
