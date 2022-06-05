import {
	ChatInputApplicationCommandData,
	Client,
	CommandInteraction,
	EmbedAuthorData,
	EmbedFooterData,
	Message,
	MessageActionRow,
	MessageEmbed,
	MessageSelectMenu,
	PermissionString,
} from 'discord.js';
import { stringify } from 'node:querystring';
import { CommandHandler } from '../../events/command-handler.js';
import { prisma } from '../../services/prisma.js';

import { InteractionUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { config } from '../../config/config.js';
import { EventData } from '../../models/internal-models.js';

export class HelpCommand implements Command {
	public name = `help`;
	public aliases?: [`about`, `commands`];
	public slashDescription = `Shows commands and info for ${config.botName} in general`;
	public commandType = CommandType.Both;
	public metadata: ChatInputApplicationCommandData = {
		name: `help`,
		description: this.slashDescription,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Shows commands and info for ${config.botName} in general`;
	public usage = `help | /help`;
	public website = `https://www.bentobot.xyz/commands#help`;
	public category = `info`;

	constructor(public commandHandler?: CommandHandler) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const selectMenu = this.commandsSelectMenu(intr.client);
		await InteractionUtils.send(intr, {embeds: selectMenu.embeds, components: selectMenu.components});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const selectMenu = this.commandsSelectMenu(msg.client);
		await MessageUtils.send(msg.channel, {embeds: selectMenu.embeds, components: selectMenu.components});
	}

	private commandsSelectMenu(client: Client) {
		const authorData: EmbedAuthorData = {
			name: client.user?.username as string,
			iconURL: client.user?.avatarURL({format: `png`}) as string
		};
		const embed = new MessageEmbed()
			.setAuthor(authorData)
			.setTitle(`Let me help you!`)
			.setDescription(`Pick a command category and command!`);

		// vi skal lave et edit select menu event som så sørger for at edit command help content
		const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
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
		return {embeds: [embed], components: [row]};
	}

	private async helpMSG(client: Client, message: Message) {
		const guildDB = await prisma.guild.findUnique({
			where: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				guildID: BigInt(message.guild!.id)
			}
		});

		const embedFooter: EmbedFooterData = {
			text: `Bento 🍱 is created by Banner#1017`,
			iconURL: (await client.users.fetch(`232584569289703424`))?.avatarURL({
				dynamic: true,
			}) as string
		};

		const embed = new MessageEmbed()
			.setColor(`#${await stylingUtils.urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
			.setTitle(`Help`)
			.setThumbnail(client.user?.avatarURL({ format: `png`, dynamic: true, size: 1024}) as string)
			.setDescription(
				`For a full list of commands, please type \`${guildDB?.prefix}commands\` \nTo see more info about a specific command, please type \`${guildDB?.prefix}help <command>\` without the \`<>\``,
			)
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

	private async getCMD(client: Client, message: Message, input: string) {
		const guildDB = await prisma.guild.findUnique({
			where: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				guildID: BigInt(message.guild!.id)
			}
		});

		const embed = new MessageEmbed();

		const cmd =
		(this.commandHandler as CommandHandler).commands.find((command) => command.name === input) ??
		(this.commandHandler as CommandHandler).commands.find((command) => command.aliases?.includes(input));

		let info = `No information found for command **${input.toLowerCase()}**`;

		if (!cmd) {
			return embed
				.setColor(`#${await stylingUtils.urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
				.setDescription(info);
		}
		// vi skal tilføje de manglede attributter til alle msg cmds
		// bare det samme som på bento for nu
		cmd.aliases = Array.prototype.slice.call(cmd.aliases);
		if (cmd.name) info = `**Command Name**: ${cmd.name}`;
		if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map((a: string) => `\`${stringify({ a }).slice(2)}\``).join(`, `)}`;
		if (cmd.description) info += `\n**Description**: ${cmd.description}`;
		if (cmd.usage) {
			info += `\n**Usage**: ${guildDB?.prefix}${cmd.usage}`;
			const embedFooter: EmbedFooterData = {
				text: `<> = REQUIRED | [] = OPTIONAL`,
			};
			embed.setFooter(embedFooter);
		}
		if (cmd.website) info += `\n**Website**: ${cmd.website}`;

		return embed.setColor(`#${await stylingUtils.urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`).setDescription(info);
	}
}
