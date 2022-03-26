/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	EmbedAuthorData,
	EmbedFooterData,
	Message,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class EmotesCommand implements Command {
	public name = `emotes`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length || args[0] === `all`) {
			const authorData: EmbedAuthorData = {
				name: msg.guild!.name,
				iconURL: msg.guild!.iconURL({format: `png`}) as string
			};
			const footerData: EmbedFooterData = {
				text: `Amount of emotes - ${msg.guild!.emojis.cache.size}`,
			};
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setTitle(`All Emotes in ${msg.guild!.name}`)
				.setThumbnail(
                    msg.guild!.iconURL({
                            	format: `png`,
                            	size: 1024,
                            	dynamic: true,
                    }) as string,
				)
				.setFooter(footerData)
				.setDescription(
					stylingUtils.trim(
                        msg.guild!.emojis.cache
                                	.map((emote) => (emote.animated ? `<a:${emote.name}:${emote.id}>` : `<:${emote.name}:${emote.id}>`))
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
				iconURL: msg.guild!.iconURL({format: `png`}) as string
			};
			const footerData: EmbedFooterData = {
				text: `Amount of emotes - ${msg.guild!.emojis.cache.size}`,
			};
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setTitle(`All Animated Emotes in ${msg.guild!.name}`)
				.setThumbnail(
                    msg.guild!.iconURL({
                            	format: `png`,
                            	size: 1024,
                            	dynamic: true,
                    }) as string,
				)
				.setFooter(footerData)
				.setDescription(
					stylingUtils.trim(
                        msg.guild!.emojis.cache
                                	.filter((e) => e.animated === true)
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
				iconURL: msg.guild!.iconURL({format: `png`}) as string
			};
			const footerData: EmbedFooterData = {
				text: `Amount of emotes - ${msg.guild!.emojis.cache.size}`,
			};
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setTitle(`All Static Emotes in ${msg.guild!.name}`)
				.setThumbnail(
                    msg.guild!.iconURL({
                            	format: `png`,
                            	size: 1024,
                            	dynamic: true,
                    }) as string,
				)
				.setFooter(footerData)
				.setDescription(
					stylingUtils.trim(
                        msg.guild!.emojis.cache
                                	.filter((e) => e.animated === false)
                                	.map((emote) => `<:${emote.name}:${emote.id}>`)
                                	.join(` `) as string,
                        4096,
					),
				);
			await MessageUtils.send(msg.channel, embed);
			return;
		}

		await MessageUtils.send(msg.channel, `Invalid argument\nEither use the command without an argument, \`all\`, \`animated\` or \`static\``);
		return;
	}
}