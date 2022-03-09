import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	Message,
	MessageEmbed,
	PermissionString,
} from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../utils/index.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { Command, CommandDeferType } from './command.js';

export class InfoCommand implements Command {
	public name = `info`;
	public metadata: ChatInputApplicationCommandData = {
		name: `info`,
		description: `View bot info.`,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.infoCommand(intr);
		await InteractionUtils.send(intr, command);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const command = await this.infoCommand(msg);
		await MessageUtils.send(msg.channel, command);
	}

	private async infoCommand(message: Message | CommandInteraction): Promise<MessageEmbed> {
		const element = message;
		const embed = new MessageEmbed()
			.setColor(
				`#${await stylingUtils.urlToColours(element.guild?.client?.user?.avatarURL({ format: `png` }) as string)}`,
			)
			.setTitle(`${element.client.user?.username} - Info`)
			.setDescription(`lmao`);
		return embed;
	}
}
