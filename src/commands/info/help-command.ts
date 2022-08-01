import {
	Client,
	CommandInteraction,
	EmbedAuthorData,
	Message,
	ActionRowBuilder,
	EmbedBuilder,
	SelectMenuBuilder,
	PermissionsString,
} from 'discord.js';
import { CommandHandler } from '../../events/command-handler.js';

import { InteractionUtils, MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { config } from '../../config/config.js';
import { EventData } from '../../models/internal-models.js';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';

export class HelpCommand implements Command {
	public name = `help`;
	public aliases?: [`commands`];
	public slashDescription = `Shows commands and info for ${config.botName} in general`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `help`,
		description: this.slashDescription,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Shows commands and info for ${config.botName} in general`;
	public usage = `help | /help`;
	public website = `https://www.bentobot.xyz/commands#help`;
	public category = `info`;

	constructor(public commandHandler?: CommandHandler) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const selectMenu = this.commandsSelectMenu(intr.client);
		// there's an option for ephemeral if we deprecate message commands in the future
		await InteractionUtils.send(intr, { embeds: selectMenu.embeds, components: selectMenu.components });
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const selectMenu = this.commandsSelectMenu(msg.client);
		await MessageUtils.send(msg.channel, { embeds: selectMenu.embeds, components: selectMenu.components });
	}

	private commandsSelectMenu(client: Client) {
		const authorData: EmbedAuthorData = {
			name: client.user?.username as string,
			iconURL: client.user?.avatarURL({ extension: `png` }) as string,
		};
		const embed = new EmbedBuilder()
			.setAuthor(authorData)
			.setTitle(`Let me help you!`)
			.setDescription(`Pick a command category and command!`);

		const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
			new SelectMenuBuilder()
				.setCustomId(`selectMenu_helpCMD_category_initial`)
				.setPlaceholder(`Pick a command category`)
				.addOptions([
					{
						label: `Admin`,
						description: `Commands for the server admins`,
						value: `selectMenu_helpCMD_category_admin`,
					},
					{
						label: `Features`,
						description: `Fun, entertaining and practical commands`,
						value: `selectMenu_helpCMD_category_features`,
					},
					{
						label: `Info`,
						description: `Info about users, server and bot`,
						value: `selectMenu_helpCMD_category_info`,
					},
					{
						label: `Moderation`,
						description: `Commands for the server moderators`,
						value: `selectMenu_helpCMD_category_moderation`,
					},
					{
						label: `User`,
						description: `Bento, rank, reminders etc.`,
						value: `selectMenu_helpCMD_category_user`,
					},
				]),
		);
		return { embeds: [embed], components: [row] };
	}
}
