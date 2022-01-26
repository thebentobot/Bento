import { ApplicationCommandData, CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { MessageUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './command.js';

export class TestCommand implements Command {
	public name = `test`;
	public metadata: ApplicationCommandData = {
		name: `test`,
		description: `test`,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
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
