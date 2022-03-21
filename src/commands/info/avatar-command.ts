import {
	Message,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { ClientUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class AvatarCommand implements Command {
	public name = `avatar`;
	public aliases: string[] = [`pfp`];
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			const embed = new MessageEmbed()
				.setColor(`#${await stylingUtils.urlToColours(msg.author.displayAvatarURL({ format: `png` }) as string)}`)
				.setTitle(`${msg.author.tag}'s avatar`)
				.setImage(
                    msg.author.displayAvatarURL({
                    	format: `png`,
                    	size: 1024,
                    	dynamic: true,
                    }) as string,
				)
				.setTimestamp();
			await MessageUtils.send(msg.channel, embed);
			return;
		} else {
			const userID = this.getUserFromMention(msg, args[0]);
			if (userID) {
				const user = await ClientUtils.getUser(msg.client, userID);
				if (user) {
					const embed = new MessageEmbed()
						.setColor(`#${await stylingUtils.urlToColours(msg.author.displayAvatarURL({ format: `png` }) as string)}`)
						.setTitle(`${user.tag}'s avatar`)
						.setImage(
							user.displayAvatarURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						)
						.setTimestamp();
					await MessageUtils.send(msg.channel, embed);
					return;
				} else {
					return;
				}
			}			
		}
	}

	private getUserFromMention(msg: Message, mention: string) {
		if (!mention) return;

		if (mention.startsWith(`<@`) && mention.endsWith(`>`)) {
			mention = mention.slice(2, -1);

			if (mention.startsWith(`!`)) {
				mention = mention.slice(1);
			}

			return msg.client.users.cache.get(mention)?.id;
		} else {
			return mention;
		}
	}
}