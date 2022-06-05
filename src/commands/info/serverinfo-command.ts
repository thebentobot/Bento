/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	Message,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';

export class ServerInfoCommand implements Command {
	public name = `serverinfo`;
	public slashDescription = `Shows general info for the current server`;
	public commandType = CommandType.MessageCommand;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Shows general info for the current server`;
	public usage = `serverinfo`;
	public website = `https://www.bentobot.xyz/commands#serverinfo`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const embed = new MessageEmbed()
			.setTitle(msg.guild!.name)
			.setColor(`#${await stylingUtils.urlToColours(msg.guild!.iconURL({ format: `png` }) as string)}`)
			.setThumbnail(msg.guild!.iconURL({ dynamic: true, format: `png`, size: 1024 }) as string)
			.addField(`Server ID`, msg.guild!.id)
			.addField(`Server owner`, `${(await msg.guild!.fetchOwner({force: true})).user.tag} (${(await msg.guild!.fetchOwner({force: true})).user.id})`)
			.addField(`Total members`, `${msg.guild!.memberCount}`)
			.addField(`Server boost level`, msg.guild!.premiumTier)
			.addField(`Server boosters`, `${msg.guild!.premiumSubscriptionCount}`, true)
			.addField(
				`Text channels | Voice channels`,
				`${msg.guild!.channels.cache.filter((channel) => channel.isText()).size} | ${
						msg.guild!.channels.cache.filter((channel) => channel.isVoice()).size
				}`,
			)
			.addField(`Amount of roles`, `${msg.guild!.roles.cache.size}`)
			.addField(`Created at`, `<t:${Math.round(msg.guild!.createdTimestamp / 1000)}:F>`)
			.addField(
				`Emotes`,
				`${msg.guild!.emojis.cache.size} in total.\n${
						msg.guild!.emojis.cache.reduce((acc, emoji) => emoji.animated ? acc + 1 : acc + 0, 0)
				} animated emotes.`,
			);
		await MessageUtils.send(msg.channel, embed);
		return;
	}
}