import { Client, CommandInteraction, EmbedFooterData, Message, MessageEmbed, PermissionString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10.js';

export class AboutCommand implements Command {
	public name = `about`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Show info about ${config.botName}`;
	public slashDescription = `Show info about ${config.botName}`;
	public commandType = CommandType.Both;
	public usage = `about | /about`;
	public website = `https://www.bentobot.xyz/commands#about`;
	public category = `info`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `about`,
		description: this.slashDescription,
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.helpMSG(intr.client);
		await InteractionUtils.send(intr, command);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		const command = await this.helpMSG(msg.client);
		await MessageUtils.send(msg.channel, command);
		return;
	}

	private async helpMSG(client: Client) {
		const embedFooter: EmbedFooterData = {
			text: `Bento 🍱 is created by Banner#1017`,
			iconURL: (await client.users.fetch(`232584569289703424`))?.avatarURL({
				dynamic: true,
			}) as string,
		};

		const embed = new MessageEmbed()
			.setColor(`#${await stylingUtils.urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
			.setTitle(`Help`)
			.setThumbnail(client.user?.avatarURL({ format: `png`, dynamic: true, size: 1024 }) as string)
			.setDescription(`For a full list of commands, please use the \`help\` command`)
			.addField(
				`About Bento Bot 🍱`,
				`A Discord bot for chat moderation and fun features you did not know you needed on Discord.`,
			)
			.addField(`Get a full list and more details for each command`, `https://www.bentobot.xyz/commands`)
			.addField(`Want additional benefits when using Bento 🍱?`, `https://www.patreon.com/bentobot`)
			.addField(`Get a Bento 🍱 for each tip`, `https://ko-fi.com/bentobot`)
			.addField(`Vote on top.gg and receive 5 Bento 🍱`, `https://top.gg/bot/787041583580184609/vote`)
			.addField(`Want to check out the code for Bento 🍱?`, `https://github.com/thebentobot/bentoTS`)
			.addField(
				`Need help? Or do you have some ideas or feedback to Bento 🍱? Feel free to join the support server`,
				`https://discord.gg/dd68WwP`,
			)
			.setFooter(embedFooter);
		return embed;
	}
}
