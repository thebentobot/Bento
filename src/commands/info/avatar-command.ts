import {
	CommandInteraction,
	EmbedAuthorData,
	GuildMember,
	Message,
	MessageEmbed,
	PermissionString,
	User,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { ClientUtils, InteractionUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { EventData } from '../../models/internal-models.js';

export class AvatarCommand implements Command {
	public name = `avatar`;
	public slashDescription = `Show the avatar for a user`;
	public commandType = CommandType.Both;
	public aliases: string[] = [`pfp`, `av`];
	public metadata = {
		name: `avatar`,
		description: `Show the avatar for a user`,
		options: [
			{
				name: `user`,
				description: `Show the avatar for a user`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `Check the avatar for a specific user`,
						type: ApplicationCommandOptionType.User.valueOf(),
					}
				]
			},
			{
				name: `server`,
				description: `Show the server avatar for a user`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `Check the avatar for a specific user`,
						type: ApplicationCommandOptionType.User.valueOf(),
					}
				]
			},
		]
	};
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Show user's avatars, or your own if you don't mention anyone.`;
	public usage = `avatar [userID or mention a user] | /avatar <pick a user>`;
	public website = `https://www.bentobot.xyz/commands#avatar`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		let imageURL: string | null = ``;
		let imageURLColour: string | null = ``;
		let authorData: EmbedAuthorData = {
			name: `inital ts annoying`
		};

		if (intr.options.getSubcommand() === `user`) {
			if (intr.options.getUser(`user`)) {
				const user = intr.options.getUser(`user`) as User;
				imageURL = user.avatarURL() !== null ? user.avatarURL({format: `png`, dynamic: true, size: 1024}) as string : user.displayAvatarURL({format: `png`, dynamic: true, size: 1024});
				imageURLColour = user.avatarURL() !== null ? user.avatarURL({format: `png`}) as string : user.displayAvatarURL({format: `png`, dynamic: true, size: 1024});
				authorData = {
					name: `${user.tag}'s avatar`,
				};
			} else {
				const user = intr.user as User;
				imageURL = user.avatarURL() !== null ? user.avatarURL({format: `png`, dynamic: true, size: 1024}) as string : user.displayAvatarURL({format: `png`, dynamic: true, size: 1024});
				imageURLColour = user.avatarURL() !== null ? user.avatarURL({format: `png`}) as string : user.displayAvatarURL({format: `png`, dynamic: true, size: 1024});
				authorData = {
					name: `${user.tag}'s avatar`,
				};
			}
		}

		if (intr.options.getSubcommand() === `server`) {
			if (intr.options.getMember(`user`)) {
				const guildMember = intr.options.getMember(`user`) as GuildMember;
				imageURL = guildMember.displayAvatarURL({format: `png`, dynamic: true, size: 1024});
				imageURLColour = guildMember.displayAvatarURL({format: `png`}) as string;
				authorData = {
					name: `${guildMember.displayName}'s avatar`,
				};
			} else {
				const guildMember = intr.member as GuildMember;
				imageURL = guildMember.displayAvatarURL({format: `png`, dynamic: true, size: 1024});
				imageURLColour = guildMember.displayAvatarURL({format: `png`}) as string;
				authorData = {
					name: `${guildMember.displayName}'s avatar`,
				};
			}
		}

		if (imageURL === null) {
			return;
		} else {
			const embed = new MessageEmbed()
				.setAuthor(authorData)
				.setColor(`#${await stylingUtils.urlToColours(imageURLColour as string)}`)
				.setImage(imageURL as string);
			await InteractionUtils.send(intr, embed);
			return;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			const embeds: MessageEmbed[] = [];
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
			embeds.push(embed);
			if (msg.member?.avatarURL()) {
				const embed = new MessageEmbed()
					.setColor(`#${await stylingUtils.urlToColours(msg.member.avatarURL({ format: `png` }) as string)}`)
					.setTitle(`${msg.member.displayName}'s avatar`)
					.setImage(
                    msg.member.avatarURL({
                    	format: `png`,
                    	size: 1024,
                    	dynamic: true,
                    }) as string,
					)
					.setTimestamp();
				embeds.push(embed);
			}
			await MessageUtils.send(msg.channel, { embeds: embeds });
			return;
		} else {
			const userID = this.getUserFromMention(msg, args[0]);
			if (userID) {
				const user = await ClientUtils.getUser(msg.client, userID);
				if (user) {
					const embeds: MessageEmbed[] = [];
					const embed = new MessageEmbed()
						.setColor(`#${await stylingUtils.urlToColours(user.displayAvatarURL({ format: `png` }) as string)}`)
						.setTitle(`${user.tag}'s avatar`)
						.setImage(
							user.displayAvatarURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						)
						.setTimestamp();
					embeds.push(embed);
					const guildMember = await msg.guild?.members.fetch(user);
					if (guildMember) {
						const embed = new MessageEmbed()
							.setColor(`#${await stylingUtils.urlToColours(guildMember.avatarURL({ format: `png` }) as string)}`)
							.setTitle(`${guildMember.displayName}'s avatar`)
							.setImage(
							guildMember.avatarURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
							)
							.setTimestamp();
						embeds.push(embed);
					}
					await MessageUtils.send(msg.channel, { embeds: embeds });
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