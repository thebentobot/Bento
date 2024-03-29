import {
	CommandInteraction,
	EmbedBuilder,
	NewsChannel,
	TextChannel,
	ThreadChannel,
	Message,
	GuildMember,
	PermissionFlagsBits,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventHandler } from './index.js';
import { CommandDeferAccessType, CommandType } from '../commands/command.js';
import { Command } from '../commands/index.js';
import { config as Config } from '../config/config.js';
import { logs as Logs } from '../lang/logs.js';
import { EventData } from '../models/internal-models.js';
import { EventDataService, Logger } from '../services/index.js';
import { prisma } from '../services/prisma.js';
import { CommandUtils, MessageUtils, PermissionUtils } from '../utils/index.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { DiscordLimits } from '../constants/index.js';
import { botColours } from '../utils/styling-utils.js';
import { DateTime } from 'luxon';

export class CommandHandler implements EventHandler {
	private rateLimiter = new RateLimiter(
		Config.rateLimiting.commands.amount,
		Config.rateLimiting.commands.interval * 1000,
	);

	constructor(private helpCommand: Command, public commands: Command[], private eventDataService: EventDataService) {}

	public async shouldHandle(msg: Message, args: string[]): Promise<boolean> {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const guildData = await prisma.guild.findUnique({ where: { guildID: BigInt(msg.guild!.id) } });
		return (
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			[guildData!.prefix, `<@${msg.client.user!.id}>`, `<@!${msg.client.user!.id}>`].includes(args[0].toLowerCase()) &&
			!msg.author.bot
		);
	}

	public async processMessage(msg: Message, args: string[]): Promise<void> {
		const limited = this.rateLimiter.take(msg.author.id);
		if (limited) {
			return;
		}

		// TODO: Get data from database
		const data = await this.eventDataService.create({
			user: msg.author,
			channel: msg.channel,
			guild: msg.guild !== null ? msg.guild : undefined,
		});

		// Check if I have permission to send a message
		if (!PermissionUtils.canSend(msg.channel)) {
			// No permission to send message
			if (PermissionUtils.canSend(msg.channel)) {
				const message = `I don't have all permissions required to send messages here!\nPlease allow me to **View Channel**, **Send Messages**, and **Embed Links** in this channel.`;
				await MessageUtils.send(msg.channel, message);
			}
			return;
		}

		if (args.length === 1 && msg.mentions.users.has(msg.client?.user?.id as string)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			await this.helpCommand.executeMsgCmd!(msg, [], data);
			return;
		}
		args.shift();
		const getCmd = args.shift()?.toLowerCase();

		if (!getCmd) return;

		// Try to find the command the user wants
		const command = this.find(getCmd);

		if (!command) {
			const customCommand = await prisma.tag.findFirst({
				where: {
					guildID: BigInt(msg.guild?.id as string),
					command: args[1],
				},
			});
			if (customCommand) {
				await prisma.tag.update({
					where: {
						tagID: customCommand.tagID,
					},
					data: {
						count: {
							increment: 1,
						},
					},
				});
				await MessageUtils.send(msg.channel, customCommand.content);
				return;
			} else {
				return;
			}
			//await this.helpCommand.executeMsgCmd(msg, args, data);
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (command!.requireDev && !Config.developers.includes(msg.author.id)) {
			await MessageUtils.send(msg.channel, `This command can only be used by developers.`);
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (msg.member && !this.hasPermission(msg.member, command!)) {
			await MessageUtils.send(msg.channel, `You don't have permission to run that command!`);
			return;
		}

		if (command.commandType === CommandType.SlashCommand) {
			return;
		}

		try {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			await command!.executeMsgCmd!(msg, args, data);
		} catch (error) {
			try {
				await MessageUtils.send(
					msg.channel,
					new EmbedBuilder()
						.setDescription(`Something went wrong!`)
						.setColor(`#ff4a4a`)
						.addFields(
							{
								name: `Error code`,
								value: `${error}`,
							},
							{
								name: `Contact support`,
								value: `[Support Server](https://discord.gg/dd68WwP)`,
							},
						),
				);
				// eslint-disable-next-line no-empty
			} catch {
				// empty eh
			}

			Logger.error(
				msg.channel instanceof TextChannel || msg.channel instanceof NewsChannel || msg.channel instanceof ThreadChannel
					? Logs.error.commandGuild
							.replaceAll(`{MESSAGE_ID}`, msg.id)
							.replaceAll(`{COMMAND_NAME}`, command?.name as string)
							.replaceAll(`{USER_TAG}`, msg.author.tag)
							.replaceAll(`{USER_ID}`, msg.author.id)
							.replaceAll(`{CHANNEL_NAME}`, msg.channel.name)
							.replaceAll(`{CHANNEL_ID}`, msg.channel.id)
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							.replaceAll(`{GUILD_NAME}`, msg.guild!.name)
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							.replaceAll(`{GUILD_ID}`, msg.guild!.id)
					: Logs.error.commandOther
							.replaceAll(`{MESSAGE_ID}`, msg.id)
							.replaceAll(`{COMMAND_NAME}`, command?.aliases?.join(`, `) as string)
							.replaceAll(`{USER_TAG}`, msg.author.tag)
							.replaceAll(`{USER_ID}`, msg.author.id),
				error,
			);
		}
	}

	private find(input: string): Command | undefined {
		input = input.toLowerCase();
		return (
			this.commands.find((command) => command.name === input) ??
			this.commands.find((command) => command.aliases?.includes(input))
		);
	}

	private hasPermission(member: GuildMember, command: Command): boolean {
		// Developers and members with "Manage Server" have permission for all commands
		if (member.permissions.has(PermissionFlagsBits.ManageGuild) || Config.developers.includes(member.id)) {
			return true;
		}
		// Check if member has required permissions for command
		if (!member.permissions.has(command.requireUserPerms)) {
			return false;
		}
		return true;
	}

	public async processIntr(intr: CommandInteraction | AutocompleteInteraction): Promise<void> {
		// Don't respond to self, or other bots
		if (intr.user.id === intr.client.user?.id || intr.user.bot) {
			return;
		}

		// Check if user is rate limited
		const limited = this.rateLimiter.take(intr.user.id);
		if (limited) {
			return;
		}

		const commandParts =
			intr instanceof ChatInputCommandInteraction || intr instanceof AutocompleteInteraction
				? [intr.commandName, intr.options.getSubcommandGroup(false), intr.options.getSubcommand(false)].filter(Boolean)
				: [intr.commandName];
		const commandName = commandParts.join(` `);

		// Try to find the command the user wants
		const command = this.commands.find((command) => command.metadata?.name === intr.commandName);
		if (!command) {
			Logger.error(
				Logs.error.commandNotFound
					.replaceAll(`{INTERACTION_ID}`, intr.id)
					.replaceAll(`{COMMAND_NAME}`, intr.commandName),
			);
			return;
		}

		if (intr instanceof AutocompleteInteraction) {
			if (!command.autocomplete) {
				Logger.error(
					Logs.error.autocompleteNotFound
						.replaceAll(`{INTERACTION_ID}`, intr.id)
						.replaceAll(`{COMMAND_NAME}`, commandName),
				);
				return;
			}

			try {
				const option = intr.options.getFocused(true);
				const choices = await command.autocomplete(intr, option);
				await InteractionUtils.respond(intr, choices?.slice(0, DiscordLimits.CHOICES_PER_AUTOCOMPLETE));
			} catch (error) {
				Logger.error(
					intr.channel instanceof TextChannel ||
						intr.channel instanceof NewsChannel ||
						intr.channel instanceof ThreadChannel
						? Logs.error.autocompleteGuild
								.replaceAll(`{INTERACTION_ID}`, intr.id)
								.replaceAll(`{OPTION_NAME}`, commandName)
								.replaceAll(`{COMMAND_NAME}`, commandName)
								.replaceAll(`{USER_TAG}`, intr.user.tag)
								.replaceAll(`{USER_ID}`, intr.user.id)
								.replaceAll(`{CHANNEL_NAME}`, intr.channel.name)
								.replaceAll(`{CHANNEL_ID}`, intr.channel.id)
								.replaceAll(`{GUILD_NAME}`, intr.guild?.name as string)
								.replaceAll(`{GUILD_ID}`, intr.guild?.id as string)
						: Logs.error.autocompleteOther
								.replaceAll(`{INTERACTION_ID}`, intr.id)
								.replaceAll(`{OPTION_NAME}`, commandName)
								.replaceAll(`{COMMAND_NAME}`, commandName)
								.replaceAll(`{USER_TAG}`, intr.user.tag)
								.replaceAll(`{USER_ID}`, intr.user.id),
					error,
				);
			}
			return;
		}

		// Defer interaction
		// NOTE: Anything after this point we should be responding to the interaction
		switch (command.deferType) {
			case CommandDeferAccessType.PUBLIC: {
				await InteractionUtils.deferReply(intr, false);
				break;
			}
			case CommandDeferAccessType.HIDDEN: {
				await InteractionUtils.deferReply(intr, true);
				break;
			}
		}

		// TODO: Get data from database
		const data = await this.eventDataService.create({
			user: intr.user,
			channel: intr.channel !== null ? intr.channel : undefined,
			guild: intr.guild !== null ? intr.guild : undefined,
		});

		try {
			// Check if interaction passes command checks
			const passesChecks = await CommandUtils.runChecks(command, intr, data);
			if (passesChecks) {
				// Execute the command
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await command.executeIntr!(intr, data);
			}
		} catch (error) {
			await this.sendIntrError(intr, data);

			// Log command error
			Logger.error(
				intr.channel instanceof TextChannel ||
					intr.channel instanceof NewsChannel ||
					intr.channel instanceof ThreadChannel
					? Logs.error.commandGuild
							.replaceAll(`{INTERACTION_ID}`, intr.id)
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							.replaceAll(`{COMMAND_NAME}`, command.metadata!.name)
							.replaceAll(`{USER_TAG}`, intr.user.tag)
							.replaceAll(`{USER_ID}`, intr.user.id)
							.replaceAll(`{CHANNEL_NAME}`, intr.channel.name)
							.replaceAll(`{CHANNEL_ID}`, intr.channel.id)
							.replaceAll(`{GUILD_NAME}`, intr.guild?.name as string)
							.replaceAll(`{GUILD_ID}`, intr.guild?.id as string)
					: Logs.error.commandOther
							.replaceAll(`{INTERACTION_ID}`, intr.id)
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							.replaceAll(`{COMMAND_NAME}`, command.metadata!.name)
							.replaceAll(`{USER_TAG}`, intr.user.tag)
							.replaceAll(`{USER_ID}`, intr.user.id),
				error,
			);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private async sendIntrError(intr: CommandInteraction, _data: EventData): Promise<void> {
		try {
			const intrErrorInfo = {
				id: intr.id,
				bentoPermissions: intr.appPermissions,
				commandName: intr.commandName,
				guildId: intr.guildId,
				channelId: intr.channelId,
				replied: intr.replied,
				ephemeral: intr.ephemeral,
				userId: intr.user.id,
				userPermissions: intr.memberPermissions,
				dateTimeUTC: DateTime.fromMillis(intr.createdTimestamp).toUTC().toFormat(`yyyy-MM-dd HH:mm:ss`),
				isChatInputCommand: intr.isChatInputCommand().valueOf(),
				isMessageComponent: intr.isMessageComponent().valueOf(),
				isUserSelectMenu: intr.isUserSelectMenu().valueOf(),
			};
			const embed = new EmbedBuilder()
				.setTitle(`Error`)
				.setDescription(
					`Something went wrong!\n\nIf reporting this error, please **copy** and include the following information below:\n\`\`\`json\n${JSON.stringify(
						intrErrorInfo,
						null,
						2,
					)}\n\`\`\``,
				)
				.addFields({
					name: `Feel very free to report the error in the Support Server, either publicly or privately to the owner.`,
					value: `[Support Server](https://discord.gg/dd68WwP)`,
				})
				.setColor(botColours.error);
			if (intr.guild) {
				embed.addFields(
					{
						name: `Guild ID`,
						value: intr.guild.id,
					},
					{
						name: `Shard ID`,
						value: intr.guild.shardId.toString(),
					},
				);
			}
			await InteractionUtils.send(intr, embed);
		} catch {
			// Ignore
		}
	}
}
