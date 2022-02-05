import { ApplicationCommandOptionType } from 'discord-api-types';
import { ApplicationCommandData, CommandInteraction, Message, MessageEmbed, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './command.js';

export class LinkCommand implements Command {
	public name = `link`;
	public metadata: ApplicationCommandData = {
		name: `link`,
		description: `Get links to invite, support, etc.`,
		options: [
			{
				name: `link`,
				description: `Link to display.`,
				required: true,
				type: ApplicationCommandOptionType.String.valueOf(),
				choices: [
					{
						name: `docs`,
						value: `docs`,
					},
					{
						name: `donate`,
						value: `donate`,
					},
					{
						name: `invite`,
						value: `invite`,
					},
					{
						name: `support`,
						value: `support`,
					},
					{
						name: `vote`,
						value: `vote`,
					},
				],
			},
		],
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const link = intr.options.getString(`link`);

		const command = await this.linkCommand(link);

		await MessageUtils.sendIntr(intr, command);
	}

	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const link = args[2];

		const command = await this.linkCommand(link);

		await MessageUtils.send(
			msg.channel,
			command.setColor(
				`#${await stylingUtils.urlToColours(msg.guild?.client?.user?.avatarURL({ format: `png` }) as string)}`,
			),
		);
	}

	private async linkCommand(link: string | null): Promise<MessageEmbed> {
		let embed: MessageEmbed;
		switch (link) {
			case `docs`: {
				embed = new MessageEmbed().setDescription(`docs`);
				break;
			}
			case `donate`: {
				embed = new MessageEmbed().setDescription(`donate`);
				break;
			}
			case `invite`: {
				embed = new MessageEmbed().setDescription(`invite`);
				break;
			}
			case `support`: {
				embed = new MessageEmbed().setDescription(`support`);
				break;
			}
			case `vote`: {
				embed = new MessageEmbed().setDescription(`vote`);
				break;
			}
			default: {
				embed = new MessageEmbed().setDescription(`Invalid link`);
			}
		}
		return embed;
	}
}
