import { ApplicationCommandData, CommandInteraction, MessageEmbed, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class HelpCommand implements Command {
	public metadata: ApplicationCommandData = {
		name: `help`,
		description: `View help menu and list of commands.`,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async execute(intr: CommandInteraction, _data: EventData): Promise<void> {
		const embed = new MessageEmbed()
			.setTitle(`${intr.client.user?.username} - Help`)
			.setDescription(`[Bento](https://github.com/thebentobot/bento2) helps give developers a starting point for new Discord bots, so that much of the initial setup can be avoided and developers can instead focus on meaningful bot features.`)
			.addField(`Commands`, `**/test** - Run the test command.\n**/info** - View bot info.`)
			.addField(`Links`, `[View Documentation](https://top.gg/)\n[Join Support Server](https://support.discord.com/)\n[Invite My Bot to a Server](https://discord.com)`);
		await MessageUtils.sendIntr(intr, embed);
	}
}
