import { ApplicationCommandData, CommandInteraction, Message, MessageEmbed, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './command.js';

export class HelpCommand implements Command {
	public name = `help`;
	public metadata: ApplicationCommandData = {
		name: `help`,
		description: `View help menu and list of commands.`,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.helpCommand(intr);
		await MessageUtils.sendIntr(intr, command);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const command = await this.helpCommand(msg);
		await MessageUtils.send(msg.channel, command);
	}

	private async helpCommand(message: Message | CommandInteraction): Promise<MessageEmbed> {
		const element = message;
		const embed = new MessageEmbed()
			.setColor(
				`#${await stylingUtils.urlToColours(element.guild?.client?.user?.avatarURL({ format: `png` }) as string)}`,
			)
			.setTitle(`${element.client.user?.username} - Help`)
			.setDescription(
				`[Bento](https://github.com/thebentobot/bento2) helps give developers a starting point for new Discord bots, so that much of the initial setup can be avoided and developers can instead focus on meaningful bot features.`,
			)
			.addField(`Commands`, `**/test** - Run the test command.\n**/info** - View bot info.`)
			.addField(
				`Links`,
				`[View Documentation](https://top.gg/)\n[Join Support Server](https://support.discord.com/)\n[Invite My Bot to a Server](https://discord.com)`,
			);
		return embed;
	}
}
