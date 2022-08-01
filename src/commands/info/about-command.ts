import { Client, CommandInteraction, EmbedFooterData, Message, EmbedBuilder, PermissionsString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';

export class AboutCommand implements Command {
	public name = `about`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
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
				forceStatic: false,
			}) as string,
		};

		const embed = new EmbedBuilder()
			.setColor(`#${await stylingUtils.urlToColours(client.user?.avatarURL({ extension: `png` }) as string)}`)
			.setTitle(`Help`)
			.setThumbnail(client.user?.avatarURL({ extension: `png`, forceStatic: false, size: 1024 }) as string)
			.setDescription(`For a full list of commands, please use the \`help\` command`)
			.addFields(
				{
					name: `About Bento Bot 🍱`,
					value: `A Discord bot for chat moderation and fun features you did not know you needed on Discord.`,
				},
				{
					name: `Get a full list and more details for each command`,
					value: `https://www.bentobot.xyz/commands`,
				},
				{
					name: `Want additional benefits when using Bento 🍱?`,
					value: `https://www.patreon.com/bentobot`,
				},
				{
					name: `Get a Bento 🍱 for each tip`,
					value: `https://ko-fi.com/bentobot`,
				},
				{
					name: `Vote on top.gg and receive 5 Bento 🍱`,
					value: `https://top.gg/bot/787041583580184609/vote`,
				},
				{
					name: `Want to check out the code for Bento 🍱?`,
					value: `https://github.com/thebentobot/bento`,
				},
				{
					name: `Need help? Or do you have some ideas or feedback to Bento 🍱? Feel free to join the support server`,
					value: `https://discord.gg/dd68WwP`,
				},
			)
			.setFooter(embedFooter);
		return embed;
	}
}
