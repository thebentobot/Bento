import { ApplicationCommandOptionType } from 'discord-api-types';
import { ApplicationCommandData, CommandInteraction, MessageEmbed, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class LinkCommand implements Command {
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
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async execute(intr: CommandInteraction, _data: EventData): Promise<void> {
		const link = intr.options.getString(`link`);

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
			return;
		}
		}

		await MessageUtils.sendIntr(intr, embed);
	}
}
