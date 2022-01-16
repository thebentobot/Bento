import { ApplicationCommandData, CommandInteraction, Message, MessageEmbed, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class InfoCommand implements Command {
	public name = `info`;
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
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.infoCommand(intr);
		await MessageUtils.sendIntr(intr, command);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[],): Promise<void> {
		const command = await this.infoCommand(msg);
		await MessageUtils.send(msg.channel, command);
	}

	private async infoCommand(message: Message | CommandInteraction): Promise<MessageEmbed> {
		const element = message;
		const embed = new MessageEmbed()
			.setTitle(`${element.client.user?.username} - Info`)
			.setDescription(`lmao`);
		return embed;
	}
}
