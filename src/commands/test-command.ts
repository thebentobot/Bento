import { ApplicationCommandData, CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class TestCommand implements Command {
	public name = `test`;
	public metadata: ApplicationCommandData = {
		name: `test`,
		description: `test`,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.testCommand();
		await MessageUtils.sendIntr(intr, command);
	}

	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		const command = await this.testCommand();
		await MessageUtils.send(msg.channel, command);
	}

	private async testCommand(): Promise<string> {
		return `Test :D`;
	}
}
