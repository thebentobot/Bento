/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CommandInteraction, EmbedAuthorData, EmbedFooterData, EmbedBuilder, PermissionsString } from 'discord.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { EventData } from '../../models/internal-models.js';
import { stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class ServerCommand implements Command {
	public name = `server`;
	public slashDescription = `Shows info for the current server`;
	public commandType = CommandType.SlashCommand;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `server`,
		description: this.slashDescription,
		options: [
			{
				name: `info`,
				description: `Show info for the server`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
			{
				name: `emotes`,
				description: `Show emotes for the server`,
				type: ApplicationCommandOptionType.SubcommandGroup.valueOf(),
				options: [
					{
						name: `all`,
						description: `Show all emotes for the server`,
						type: ApplicationCommandOptionType.Subcommand.valueOf(),
					},
					{
						name: `animated`,
						description: `Show all animated emotes for the server`,
						type: ApplicationCommandOptionType.Subcommand.valueOf(),
					},
					{
						name: `static`,
						description: `Show all static emotes for the server`,
						type: ApplicationCommandOptionType.Subcommand.valueOf(),
					},
				],
			},
			{
				name: `roles`,
				description: `Show roles for the server`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
		],
	};
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Shows various information about the server.\nRoles, emotes, general information.`;
	public usage = `/server <one of the options>`;
	public website = `https://www.bentobot.xyz/commands#link`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		if (intr.options.get(`info`)) {
			const embed = new EmbedBuilder()
				.setTitle(intr.guild!.name)
				.setColor(`#${await stylingUtils.urlToColours(intr.guild!.iconURL({ extension: `png` }) as string)}`)
				.setThumbnail(intr.guild!.iconURL({ forceStatic: false, extension: `png`, size: 1024 }) as string)
				.addFields(
					{
						name: `Server ID`,
						value: intr.guild!.id
					},
					{
						name: `Created at`,
						value: `<t:${Math.round(intr.guild!.createdTimestamp / 1000)}:F>`
					},
					{
						name: `Server owner`,
						value: `${(await intr.guild!.fetchOwner({ force: true })).user.tag} (${
							(await intr.guild!.fetchOwner({ force: true })).user.id
						})`,
					},
					{
						name: `Total members`,
						value: `${intr.guild!.memberCount}`
					},
					{
						name: `Server boost level`,
						value: intr.guild!.premiumTier.toString()
					},
					{
						name: `Server boosters`,
						value: `${intr.guild!.premiumSubscriptionCount}`,
						inline: true
					},
					{
						name: `Text channels | Voice channels`,
						value: `${intr.guild!.channels.cache.filter((channel) => channel.isTextBased()).size} | ${
							intr.guild!.channels.cache.filter((channel) => channel.isVoiceBased()).size
						}`,
					},
					{
						name: `Amount of roles`,
						value: `${intr.guild!.roles.cache.size}`
					},
					{
						name: `Emotes`,
						value: `${intr.guild!.emojis.cache.size} in total.\n${intr.guild!.emojis.cache.reduce(
							(acc, emoji) => (emoji.animated ? acc + 1 : acc + 0),
							0,
						)} animated emotes.`,
					},
					{
						name: `Features`,
						value: `\`${intr.guild!.features.join(` `)}\``
					},
				);
			await InteractionUtils.send(intr, embed);
			return;
		}

		if (intr.options.get(`emotes`)) {
			if (intr.options.get(`all`)) {
				const authorData: EmbedAuthorData = {
					name: intr.guild!.name,
					iconURL: intr.guild!.iconURL({ extension: `png` }) as string,
				};
				const footerData: EmbedFooterData = {
					text: `Amount of emotes - ${intr.guild!.emojis.cache.size}`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(authorData)
					.setTitle(`All Emotes in ${intr.guild!.name}`)
					.setThumbnail(
						intr.guild!.iconURL({
							extension: `png`,
							size: 1024,
							forceStatic: false,
						}) as string,
					)
					.setFooter(footerData)
					.setDescription(
						stylingUtils.trim(
							intr
								.guild!.emojis.cache.map((emote) =>
									emote.animated ? `<a:${emote.name}:${emote.id}>` : `<:${emote.name}:${emote.id}>`,
								)
								.join(` `) as string,
							4096,
						),
					);
				await InteractionUtils.send(intr, embed);
				return;
			}

			if (intr.options.get(`animated`)) {
				const authorData: EmbedAuthorData = {
					name: intr.guild!.name,
					iconURL: intr.guild!.iconURL({ extension: `png` }) as string,
				};
				const footerData: EmbedFooterData = {
					text: `Amount of emotes - ${intr.guild!.emojis.cache.size}`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(authorData)
					.setTitle(`All Animated Emotes in ${intr.guild!.name}`)
					.setThumbnail(
						intr.guild!.iconURL({
							extension: `png`,
							size: 1024,
							forceStatic: false,
						}) as string,
					)
					.setFooter(footerData)
					.setDescription(
						stylingUtils.trim(
							intr
								.guild!.emojis.cache.filter((e) => e.animated === true)
								.map((emote) => `<a:${emote.name}:${emote.id}>`)
								.join(` `) as string,
							4096,
						),
					);
				await InteractionUtils.send(intr, embed);
				return;
			}

			if (intr.options.get(`static`)) {
				const authorData: EmbedAuthorData = {
					name: intr.guild!.name,
					iconURL: intr.guild!.iconURL({ extension: `png` }) as string,
				};
				const footerData: EmbedFooterData = {
					text: `Amount of emotes - ${intr.guild!.emojis.cache.size}`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(authorData)
					.setTitle(`All Static Emotes in ${intr.guild!.name}`)
					.setThumbnail(
						intr.guild!.iconURL({
							extension: `png`,
							size: 1024,
							forceStatic: false,
						}) as string,
					)
					.setFooter(footerData)
					.setDescription(
						stylingUtils.trim(
							intr
								.guild!.emojis.cache.filter((e) => e.animated === false)
								.map((emote) => `<:${emote.name}:${emote.id}>`)
								.join(` `) as string,
							4096,
						),
					);
				await InteractionUtils.send(intr, embed);
				return;
			}
		}

		if (intr.options.get(`roles`)) {
			const authorData: EmbedAuthorData = {
				name: intr.guild!.name,
				iconURL: intr.guild!.iconURL({ extension: `png` }) as string,
			};
			const footerData: EmbedFooterData = {
				text: `Amount of roles - ${intr.guild!.roles.cache.size}`,
			};
			const embed = new EmbedBuilder()
				.setAuthor(authorData)
				.setTitle(`All roles in ${intr.guild!.name}`)
				.setThumbnail(
					intr.guild!.iconURL({
						extension: `png`,
						size: 1024,
						forceStatic: false,
					}) as string,
				)
				.setFooter(footerData)
				.setDescription(
					stylingUtils.trim(intr.guild!.roles.cache.map((role) => `${role}`).join(` | `) as string, 4096),
				);
			await InteractionUtils.send(intr, embed);
			return;
		}
	}
}
