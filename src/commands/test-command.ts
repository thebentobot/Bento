import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class TestCommand implements Command {
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
	public async execute(intr: CommandInteraction, _data: EventData): Promise<void> {
		await MessageUtils.sendIntr(intr, `Test :D`);
	}
}
