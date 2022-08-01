/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EmbedAuthorData, EmbedFooterData, Message, EmbedBuilder, PermissionsString } from 'discord.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';

export class EmotesCommand implements Command {
	public name = `emotes`;
	public aliases = [`emote`];
	public slashDescription = `Shows list of emotes from the server.`;
	public commandType = CommandType.MessageCommand;
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Shows list of emotes from the server.\nIt's both possible to see only the static emotes and animated emotes.`;
	public usage = `emotes [animated | static]`;
	public website = `https://www.bentobot.xyz/commands#emotes`;
	public category = `info`;

	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length || args[0] === `all`) {
			const authorData: EmbedAuthorData = {
				name: msg.guild!.name,
				iconURL: msg.guild!.iconURL({ extension: `png` }) as string,
			};
			const footerData: EmbedFooterData = {
				text: `Amount of emotes - ${msg.guild!.emojis.cache.size}`,
			};
			const embed = new EmbedBuilder()
				.setAuthor(authorData)
				.setTitle(`All Emotes in ${msg.guild!.name}`)
				.setThumbnail(
					msg.guild!.iconURL({
						extension: `png`,
						size: 1024,
						forceStatic: false,
					}) as string,
				)
				.setFooter(footerData)
				.setDescription(
					stylingUtils.trim(
						msg
							.guild!.emojis.cache.map((emote) =>
								emote.animated ? `<a:${emote.name}:${emote.id}>` : `<:${emote.name}:${emote.id}>`,
							)
							.join(` `) as string,
						4096,
					),
				);
			await MessageUtils.send(msg.channel, embed);
			return;
		}

		if (args[0] === `animated`) {
			const authorData: EmbedAuthorData = {
				name: msg.guild!.name,
				iconURL: msg.guild!.iconURL({ extension: `png` }) as string,
			};
			const footerData: EmbedFooterData = {
				text: `Amount of emotes - ${msg.guild!.emojis.cache.size}`,
			};
			const embed = new EmbedBuilder()
				.setAuthor(authorData)
				.setTitle(`All Animated Emotes in ${msg.guild!.name}`)
				.setThumbnail(
					msg.guild!.iconURL({
						extension: `png`,
						size: 1024,
						forceStatic: false,
					}) as string,
				)
				.setFooter(footerData)
				.setDescription(
					stylingUtils.trim(
						msg
							.guild!.emojis.cache.filter((e) => e.animated === true)
							.map((emote) => `<a:${emote.name}:${emote.id}>`)
							.join(` `) as string,
						4096,
					),
				);
			await MessageUtils.send(msg.channel, embed);
			return;
		}

		if (args[0] === `static`) {
			const authorData: EmbedAuthorData = {
				name: msg.guild!.name,
				iconURL: msg.guild!.iconURL({ extension: `png` }) as string,
			};
			const footerData: EmbedFooterData = {
				text: `Amount of emotes - ${msg.guild!.emojis.cache.size}`,
			};
			const embed = new EmbedBuilder()
				.setAuthor(authorData)
				.setTitle(`All Static Emotes in ${msg.guild!.name}`)
				.setThumbnail(
					msg.guild!.iconURL({
						extension: `png`,
						size: 1024,
						forceStatic: false,
					}) as string,
				)
				.setFooter(footerData)
				.setDescription(
					stylingUtils.trim(
						msg
							.guild!.emojis.cache.filter((e) => e.animated === false)
							.map((emote) => `<:${emote.name}:${emote.id}>`)
							.join(` `) as string,
						4096,
					),
				);
			await MessageUtils.send(msg.channel, embed);
			return;
		}

		await MessageUtils.send(
			msg.channel,
			`Invalid argument\nEither use the command without an argument, \`all\`, \`animated\` or \`static\``,
		);
		return;
	}
}
