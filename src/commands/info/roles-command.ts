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

export class RolesCommand implements Command {
	public name = `roles`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const authorData: EmbedAuthorData = {
			name: msg.guild!.name,
			iconURL: msg.guild!.iconURL({format: `png`}) as string
		};
		const footerData: EmbedFooterData = {
			text: `Amount of roles - ${msg.guild!.roles.cache.size}`,
		};
		const embed = new MessageEmbed()
			.setAuthor(authorData)
			.setTitle(`All roles in ${msg.guild!.name}`)
			.setThumbnail(
                msg.guild!.iconURL({
            	format: `png`,
            	size: 1024,
            	dynamic: true,
                }) as string,
			)
			.setFooter(footerData)
			.setDescription(stylingUtils.trim(msg.guild!.roles.cache.map((role) => `${role}`).join(` | `) as string, 4096));
		await MessageUtils.send(msg.channel, embed);
		return;
	}
}