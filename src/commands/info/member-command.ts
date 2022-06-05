import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	GuildMember,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { EventData } from '../../models/internal-models.js';
import { stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class MemberCommand implements Command {
	public name = `member`;
	public slashDescription = `Show info for a member`;
	public commandType = CommandType.SlashCommand;
	public metadata: ChatInputApplicationCommandData = {
		name: `member`,
		description: this.slashDescription,
		options: [
			{
				name: `info`,
				description: `Show info for a member`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `Check info for a specific member`,
						type: ApplicationCommandOptionType.User.valueOf(),
					}
				]
			},
		]
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Show info for a member`;
	public usage = `/member`;
	public website = `https://www.bentobot.xyz/commands#member`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		if (intr.options.getSubcommand() === `info`) {
			let guildMember: GuildMember;
			if (intr.options.getMember(`user`)) {
				guildMember = intr.options.getMember(`user`) as GuildMember;
			} else {
				guildMember = intr.member as GuildMember;
			}
			const imageURLColour = guildMember.displayAvatarURL({format: `png`}) as string;
			const authorData = {
				name: guildMember.displayName,
				iconURL: guildMember.displayAvatarURL({ dynamic: true})
			};
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setColor(`#${await stylingUtils.urlToColours(imageURLColour)}`)
				.setTitle(`Profile for ${guildMember.displayName}`)
				.setThumbnail(guildMember.displayAvatarURL({ format: `png`, dynamic: true, size: 1024 }) as string)
				.setTimestamp()
				.addFields(
					[{
						name: `Nickname on the server`,
						value: guildMember.nickname !== null ? guildMember.nickname : guildMember.displayName,
					}],
					[{ name: `User ID`, value: guildMember.user.id }],
					[{
						name: `Account created on`,
						value: `<t:${Math.round(guildMember.user.createdTimestamp / 1000)}:F>`,
					}],
					[{
						name: `Joined server at`,
						value: `<t:${Math.round(guildMember.joinedTimestamp as number / 1000)}:F>`,
						inline: true,
					}],
					[{ name: `Highest role`, value: `${guildMember.roles.highest}` }],
					[{
						name: `All roles`,
						value: stylingUtils.trim(guildMember.roles.cache.map((r) => `${r}`).join(` | `) as string, 1024),
						inline: true,
					}],
				);
			await InteractionUtils.send(intr, embed);
		} 
	}
}