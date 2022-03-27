import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	MessageEmbed,
	PermissionString,
	User,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { EventData } from '../../models/internal-models.js';
import { stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class UserCommand implements Command {
	public metadata: ChatInputApplicationCommandData = {
		name: `user`,
		description: `Show info for a user`,
		options: [
			{
				name: `info`,
				description: `Show info for a user`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `Check info for a specific user`,
						type: ApplicationCommandOptionType.User.valueOf(),
					}
				]
			},
		]
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		if (intr.options.getSubcommand() === `info`) {
			let user: User;
			if (intr.options.getUser(`user`)) {
				const interactionUser = intr.options.getUser(`user`) as User;
				user = await intr.client.users.fetch(interactionUser,{ force: true });
			} else {
				const interactionUser = intr.user as User;
				user = await intr.client.users.fetch(interactionUser,{ force: true });
			}
			const imageURLColour = user.avatarURL() !== null ? user.avatarURL({format: `png`}) as string : user.displayAvatarURL({format: `png`, dynamic: true, size: 1024});
			const authorData = {
				name: user.tag,
				iconURL: user.avatarURL() !== null ? user.avatarURL({format: `png`, dynamic: true, size: 1024}) as string : user.displayAvatarURL({format: `png`, dynamic: true, size: 1024})
			};
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setColor(`#${await stylingUtils.urlToColours(imageURLColour)}`)
				.setTitle(`Profile for ${user.tag}`)
				.setThumbnail(user.avatarURL() !== null ? user.avatarURL({format: `png`, dynamic: true, size: 1024}) as string : user.displayAvatarURL({format: `png`, dynamic: true, size: 1024}))
				.setTimestamp()
				.addFields(
					[{
						name: `Username`,
						value: user.tag,
					}],
					[{ name: `User ID`, value: user.id }],
					[{
						name: `Account created on`,
						value: `<t:${Math.round(user.createdTimestamp / 1000)}:F>`,
					}],
					[{ name: `Accent Hex Colour`, value: `${user.hexAccentColor ? user.hexAccentColor : `Not set`}` }],
				);
			await InteractionUtils.send(intr, embed);
			return;
		}
	}
}