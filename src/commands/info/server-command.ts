/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	EmbedAuthorData,
	EmbedFooterData,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { EventData } from '../../models/internal-models.js';
import { stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class ServerCommand implements Command {
	public name = `server`;
	public slashDescription = `Shows info for the current server`;
	public commandType = CommandType.SlashCommand;
	public metadata: ChatInputApplicationCommandData = {
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
				]
			},
			{
				name: `roles`,
				description: `Show roles for the server`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
		]
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Shows various information about the server.\nRoles, emotes, general information.`;
	public usage = `/server <one of the options>`;
	public website = `https://www.bentobot.xyz/commands#link`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		if (intr.options.getSubcommand() === `info`) {
			const embed = new MessageEmbed()
				.setTitle(intr.guild!.name)
				.setColor(`#${await stylingUtils.urlToColours(intr.guild!.iconURL({ format: `png` }) as string)}`)
				.setThumbnail(intr.guild!.iconURL({ dynamic: true, format: `png`, size: 1024 }) as string)
				.addField(`Server ID`, intr.guild!.id)
				.addField(`Server owner`, `${(await intr.guild!.fetchOwner({force: true})).user.tag} (${(await intr.guild!.fetchOwner({force: true})).user.id})`)
				.addField(`Total members`, `${intr.guild!.memberCount}`)
				.addField(`Server boost level`, intr.guild!.premiumTier)
				.addField(`Server boosters`, `${intr.guild!.premiumSubscriptionCount}`, true)
				.addField(
					`Text channels | Voice channels`,
					`${intr.guild!.channels.cache.filter((channel) => channel.isText()).size} | ${
						intr.guild!.channels.cache.filter((channel) => channel.isVoice()).size
					}`,
				)
				.addField(`Amount of roles`, `${intr.guild!.roles.cache.size}`)
				.addField(`Created at`, `<t:${Math.round(intr.guild!.createdTimestamp / 1000)}:F>`)
				.addField(
					`Emotes`,
					`${intr.guild!.emojis.cache.size} in total.\n${
						intr.guild!.emojis.cache.reduce((acc, emoji) => emoji.animated ? acc + 1 : acc + 0, 0)
					} animated emotes.`,
				);
			await InteractionUtils.send(intr, embed);
			return;
		}
		
		if (intr.options.getSubcommandGroup() === `emotes`) {
			if (intr.options.getSubcommand() === `all`) {
				const authorData: EmbedAuthorData = {
					name: intr.guild!.name,
					iconURL: intr.guild!.iconURL({format: `png`}) as string
				};
				const footerData: EmbedFooterData = {
					text: `Amount of emotes - ${intr.guild!.emojis.cache.size}`,
				};
				const embed = new MessageEmbed()
					.setAuthor(authorData)
					.setTitle(`All Emotes in ${intr.guild!.name}`)
					.setThumbnail(
								intr.guild!.iconURL({
									format: `png`,
									size: 1024,
									dynamic: true,
								}) as string,
					)
					.setFooter(footerData)
					.setDescription(
						stylingUtils.trim(
									intr.guild!.emojis.cache
										.map((emote) => (emote.animated ? `<a:${emote.name}:${emote.id}>` : `<:${emote.name}:${emote.id}>`))
										.join(` `) as string,
									4096,
						),
					);
				await InteractionUtils.send(intr, embed);
				return;
			}

			if (intr.options.getSubcommand() === `animated`) {
				const authorData: EmbedAuthorData = {
					name: intr.guild!.name,
					iconURL: intr.guild!.iconURL({format: `png`}) as string
				};
				const footerData: EmbedFooterData = {
					text: `Amount of emotes - ${intr.guild!.emojis.cache.size}`,
				};
				const embed = new MessageEmbed()
					.setAuthor(authorData)
					.setTitle(`All Animated Emotes in ${intr.guild!.name}`)
					.setThumbnail(
								intr.guild!.iconURL({
									format: `png`,
									size: 1024,
									dynamic: true,
								}) as string,
					)
					.setFooter(footerData)
					.setDescription(
						stylingUtils.trim(
									intr.guild!.emojis.cache
										.filter((e) => e.animated === true)
										.map((emote) => `<a:${emote.name}:${emote.id}>`)
										.join(` `) as string,
									4096,
						),
					);
				await InteractionUtils.send(intr, embed);
				return;
			}

			if (intr.options.getSubcommand() === `static`) {
				const authorData: EmbedAuthorData = {
					name: intr.guild!.name,
					iconURL: intr.guild!.iconURL({format: `png`}) as string
				};
				const footerData: EmbedFooterData = {
					text: `Amount of emotes - ${intr.guild!.emojis.cache.size}`,
				};
				const embed = new MessageEmbed()
					.setAuthor(authorData)
					.setTitle(`All Static Emotes in ${intr.guild!.name}`)
					.setThumbnail(
								intr.guild!.iconURL({
									format: `png`,
									size: 1024,
									dynamic: true,
								}) as string,
					)
					.setFooter(footerData)
					.setDescription(
						stylingUtils.trim(
									intr.guild!.emojis.cache
										.filter((e) => e.animated === false)
										.map((emote) => `<:${emote.name}:${emote.id}>`)
										.join(` `) as string,
									4096,
						),
					);
				await InteractionUtils.send(intr, embed);
				return;
			}
		}
        
		if (intr.options.getSubcommand() === `roles`) {
			const authorData: EmbedAuthorData = {
				name: intr.guild!.name,
				iconURL: intr.guild!.iconURL({format: `png`}) as string
			};
			const footerData: EmbedFooterData = {
				text: `Amount of roles - ${intr.guild!.roles.cache.size}`,
			};
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setTitle(`All roles in ${intr.guild!.name}`)
				.setThumbnail(
				intr.guild!.iconURL({
					format: `png`,
					size: 1024,
					dynamic: true,
				}) as string,
				)
				.setFooter(footerData)
				.setDescription(stylingUtils.trim(intr.guild!.roles.cache.map((role) => `${role}`).join(` | `) as string, 4096));
			await InteractionUtils.send(intr, embed);
			return;
		}
	}
}