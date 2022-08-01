/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Message, EmbedBuilder, PermissionsString } from 'discord.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';

export class ServerInfoCommand implements Command {
	public name = `serverinfo`;
	public slashDescription = `Shows general info for the current server`;
	public commandType = CommandType.MessageCommand;
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Shows general info for the current server`;
	public usage = `serverinfo`;
	public website = `https://www.bentobot.xyz/commands#serverinfo`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const embed = new EmbedBuilder()
			.setTitle(msg.guild!.name)
			.setColor(`#${await stylingUtils.urlToColours(msg.guild!.iconURL({ extension: `png` }) as string)}`)
			.setThumbnail(msg.guild!.iconURL({ forceStatic: false, extension: `png`, size: 1024 }) as string)
			.addFields(
				{
					name: `Server ID`,
					value: msg.guild!.id
				},
				{
					name: `Created at`,
					value: `<t:${Math.round(msg.guild!.createdTimestamp / 1000)}:F>`
				},
				{
					name: `Server owner`,
					value: `${(await msg.guild!.fetchOwner({ force: true })).user.tag} (${
						(await msg.guild!.fetchOwner({ force: true })).user.id
					})`,
				},
				{
					name: `Total members`,
					value: `${msg.guild!.memberCount}`
				},
				{
					name: `Server boost level`,
					value: msg.guild!.premiumTier.toString()
				},
				{
					name: `Server boosters`,
					value: `${msg.guild!.premiumSubscriptionCount}`,
					inline: true
				},
				{
					name: `Text channels | Voice channels`,
					value: `${msg.guild!.channels.cache.filter((channel) => channel.isTextBased()).size} | ${
						msg.guild!.channels.cache.filter((channel) => channel.isVoiceBased()).size
					}`,
				},
				{
					name: `Amount of roles`,
					value: `${msg.guild!.roles.cache.size}`
				},
				{
					name: `Emotes`,
					value: `${msg.guild!.emojis.cache.size} in total.\n${msg.guild!.emojis.cache.reduce(
						(acc, emoji) => (emoji.animated ? acc + 1 : acc + 0),
						0,
					)} animated emotes.`,
				},
				{
					name: `Features`,
					value: `\`${msg.guild!.features.join(` `)}\``
				},
			);
		await MessageUtils.send(msg.channel, embed);
		return;
	}
}
