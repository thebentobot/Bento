import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import {
	CommandInteraction,
	Message,
	PermissionString,
} from 'discord.js';
import { config } from '../../config/config.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';

export class LinkCommand implements Command {
	public name = `link`;
	public slashDescription = `Get various links related to ${config.botName}`;
	public commandType = CommandType.Both;
	public metadata = {
		name: `link`,
		description: this.slashDescription,
		options: [
			{
				name: `link`,
				description: `Link to receive.`,
				required: true,
				type: ApplicationCommandOptionType.String.valueOf(),
				choices: [
					{
						name: `website`,
						value: `https://www.bentobot.xyz/`,
					},
					{
						name: `github`,
						value: `https://github.com/thebentobot`,
					},
					{
						name: `patreon`,
						value: `https://www.patreon.com/bentobot`,
					},
					{
						name: `ko-fi`,
						value: `https://ko-fi.com/bentobot`,
					},
					{
						name: `top.gg`,
						value: `https://top.gg/bot/787041583580184609`,
					}
				],
			},
		],
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Get various links related to ${config.botName}.\nThe options are "website", "github", "patreon", "kofi" and "topgg".`;
	public usage = `link <one of the options> | /link <choose an option>`;
	public website = `https://www.bentobot.xyz/commands#link`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const link = intr.options.getString(`link`);
		await InteractionUtils.send(intr, link as string);
	}

	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const command = this.linkCommand(args[0]);
		await MessageUtils.send(
			msg.channel,
			command
		);
	}

	private linkCommand(link: string | null): string {
		let returnLink: string;
		switch (link) {
		case `bento`: {
			returnLink = `https://www.bentobot.xyz/`;
			break;
		}
		case `github`: {
			returnLink = `https://github.com/thebentobot`;
			break;
		}
		case `patreon`: {
			returnLink = `https://www.patreon.com/bentobot`;
			break;
		}
		case `kofi`: {
			returnLink = `https://ko-fi.com/bentobot`;
			break;
		}
		case `topgg`: {
			returnLink = `https://top.gg/bot/787041583580184609`;
			break;
		}
		case `invite`: {
			returnLink = `https://discord.com/oauth2/authorize?client_id=787041583580184609&permissions=261926943991&scope=bot%20applications.commands`;
			break;
		}
		default: {
			returnLink = `\`${link}\` is an **invalid link**\nPossible links: \`bento\`, \`github\`, \`patreon\`, \`kofi\`, \`topgg\` and \`invite\`.`;
		}
		}
		return returnLink;
	}
}
