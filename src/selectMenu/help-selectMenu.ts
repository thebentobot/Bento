import {
	SelectMenuInteraction,
	Message,
	MessageActionRow,
	MessageSelectMenu,
	EmbedAuthorData,
	MessageEmbed,
	MessageSelectOptionData,
	EmbedFooterData,
} from 'discord.js';
import { CommandType } from '../commands/command.js';
import { EventData } from '../models/internal-models.js';
import { prisma } from '../services/prisma.js';
import { commands } from '../start.js';
import { InteractionUtils, stylingUtils } from '../utils/index.js';
import { SelectMenu, SelectMenuDeferType } from './selectMenu.js';

const categoryMap = new Map<string, { commandCategorySearch: string; categoryEmbed: string; description: string }>();
categoryMap.set(`selectMenu_helpCMD_category_admin`, {
	commandCategorySearch: `admin`,
	categoryEmbed: `Admin`,
	description: `Commands only for the administration of the server.\nVarious feature toggles and settings such as welcome messages, log channels etc..`,
});
categoryMap.set(`selectMenu_helpCMD_category_features`, {
	commandCategorySearch: `features`,
	categoryEmbed: `Features`,
	description: `Various features such as lastfm, gfycat, checking the weather, creating tags etc.`,
});
categoryMap.set(`selectMenu_helpCMD_category_info`, {
	commandCategorySearch: `info`,
	categoryEmbed: `Info`,
	description: `General information about users and servers.\nAvatar and Banner commands, emotes etc.`,
});
categoryMap.set(`selectMenu_helpCMD_category_moderation`, {
	commandCategorySearch: `moderation`,
	categoryEmbed: `Moderation`,
	description: `Commands only for moderation of the server.\nKick, ban, mute, case commands etc.`,
});
categoryMap.set(`selectMenu_helpCMD_category_user`, {
	commandCategorySearch: `user`,
	categoryEmbed: `User`,
	description: `User related commands such as rank profile and its customisation, leaderboards, reminders, bento etc.`,
});

const categoryIds = [
	`selectMenu_helpCMD_category_admin`,
	`selectMenu_helpCMD_category_features`,
	`selectMenu_helpCMD_category_info`,
	`selectMenu_helpCMD_category_moderation`,
	`selectMenu_helpCMD_category_user`,
];

const initialCategoryMenu: MessageSelectOptionData[] = [
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
];

export class HelpSelectMenu implements SelectMenu {
	public ids = [
		`selectMenu_helpCMD_category_initial`,
		`selectMenu_helpCMD_category_admin`,
		`selectMenu_helpCMD_category_features`,
		`selectMenu_helpCMD_category_info`,
		`selectMenu_helpCMD_category_moderation`,
		`selectMenu_helpCMD_category_user`,
	];
	public deferType = SelectMenuDeferType.UPDATE;
	public requireGuild = false;
	public requireEmbedAuthorTag = false;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async execute(intr: SelectMenuInteraction, _msg: Message, _data: EventData): Promise<void> {
		if (intr.customId === this.ids[0]) {
			const categorySelectMenuValue = intr.values.toString();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const getCategoryMap = categoryMap.get(categorySelectMenuValue)!;
			const authorData: EmbedAuthorData = {
				name: intr.client.user?.username as string,
				iconURL: intr.client.user?.avatarURL({ format: `png` }) as string,
			};
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setTitle(getCategoryMap.categoryEmbed)
				.setDescription(getCategoryMap.description);
			const categorySelectMenu = new MessageSelectMenu();
			initialCategoryMenu.map((category) =>
				categorySelectMenu.addOptions({
					...category,
					default: categorySelectMenuValue === category.value ? true : false,
				}),
			);
			const categoryRow = new MessageActionRow().addComponents(
				categorySelectMenu.setCustomId(`selectMenu_helpCMD_category_initial`),
			);
			const getCommands = commands.filter((command) => command.category === getCategoryMap.commandCategorySearch);
			const commandsSelectMenu = new MessageSelectMenu();
			getCommands.map((command) =>
				commandsSelectMenu.addOptions({
					label: command.name as string,
					description: command.slashDescription as string,
					value: command.name as string,
				}),
			);
			const commandRow = new MessageActionRow().addComponents(
				commandsSelectMenu.setCustomId(categorySelectMenuValue).setPlaceholder(`Pick a command`),
			);
			await InteractionUtils.editReply(intr, { embeds: [embed], components: [categoryRow, commandRow] });
			return;
		} else if (categoryIds.includes(intr.customId)) {
			const getCommandFromSelectMenu = intr.values.toString();
			const getCommand = commands.filter((command) => command.name === getCommandFromSelectMenu)[0];
			const authorData: EmbedAuthorData = {
				name:
					getCommand.commandType === CommandType.Both
						? `💬  Message command | / Slash command`
						: getCommand.commandType === CommandType.MessageCommand
						? `💬 Message command`
						: `**/** Slash command`,
			};
			const footerData: EmbedFooterData = {
				text: `<> = REQUIRED | [] = OPTIONAL`,
			};
			const guildData = await prisma.guild.findUnique({
				where: {
					guildID: BigInt(intr.guildId as string),
				},
			});
			const usageText =
				getCommand.commandType === CommandType.Both
					? `${guildData?.prefix}` + getCommand.usage
					: getCommand.commandType === CommandType.MessageCommand
					? `${guildData?.prefix}` + getCommand.usage
					: getCommand.usage;
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setTitle(stylingUtils.capitalizeFirstCharacter(getCommand.name))
				.setDescription(
					`${
						getCommand.aliases
							? `${
									getCommand.aliases.length > 1
										? `**Aliases:** ${getCommand.aliases.join(`, `)}\n`
										: `**Alias:** ${getCommand.aliases[0]}`
							  }\n`
							: ``
					}${getCommand.description}\n\n**Usage**\n${usageText}\n\n[Click here to check the command on the website](${
						getCommand.website
					})`,
				)
				.setFooter(footerData);
			const categorySelectMenu = new MessageSelectMenu();
			initialCategoryMenu.map((category) =>
				categorySelectMenu.addOptions({
					...category,
					default: intr.customId === category.value ? true : false,
				}),
			);
			const categoryRow = new MessageActionRow().addComponents(
				categorySelectMenu.setCustomId(`selectMenu_helpCMD_category_initial`),
			);
			const getCategory = categoryMap.get(intr.customId);
			const getCommands = commands.filter((command) => command.category === getCategory?.commandCategorySearch);
			const commandsSelectMenu = new MessageSelectMenu();
			getCommands.map((command) =>
				commandsSelectMenu.addOptions({
					label: command.name as string,
					description: command.slashDescription as string,
					value: command.name as string,
					default: command.name === getCommandFromSelectMenu ? true : false,
				}),
			);
			const commandRow = new MessageActionRow().addComponents(commandsSelectMenu.setCustomId(intr.customId));
			await InteractionUtils.editReply(intr, { embeds: [embed], components: [categoryRow, commandRow] });
			return;
		}
	}
}
