/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EmbedAuthorData, EmbedFooterData, Message, EmbedBuilder, PermissionsString } from 'discord.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';

export class RolesCommand implements Command {
	public name = `roles`;
	public slashDescription = `Shows list of roles on the server.`;
	public commandType = CommandType.MessageCommand;
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Shows list of roles on the server.`;
	public usage = `roles`;
	public website = `https://www.bentobot.xyz/commands#roles`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const authorData: EmbedAuthorData = {
			name: msg.guild!.name,
			iconURL: msg.guild!.iconURL({ extension: `png` }) as string,
		};
		const footerData: EmbedFooterData = {
			text: `Amount of roles - ${msg.guild!.roles.cache.size}`,
		};
		const embed = new EmbedBuilder()
			.setAuthor(authorData)
			.setTitle(`All roles in ${msg.guild!.name}`)
			.setThumbnail(
				msg.guild!.iconURL({
					extension: `png`,
					size: 1024,
					forceStatic: false,
				}) as string,
			)
			.setFooter(footerData)
			.setDescription(stylingUtils.trim(msg.guild!.roles.cache.map((role) => `${role}`).join(` | `) as string, 4096));
		await MessageUtils.send(msg.channel, embed);
		return;
	}
}
