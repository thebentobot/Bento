import { ApplicationCommandData, CommandInteraction, MessageEmbed, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class InfoCommand implements Command {
	public metadata: ApplicationCommandData = {
		name: `info`,
		description: `View bot info.`,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async execute(intr: CommandInteraction, _data: EventData): Promise<void> {
		const embed = new MessageEmbed()
			.setTitle(`${intr.client.user?.username} - Info`)
			.setDescription(`lmao`);
		await MessageUtils.sendIntr(intr, embed);
	}
}
