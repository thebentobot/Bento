import {
	CommandInteraction,
	EmbedAuthorData,
	GuildMember,
	Message,
	EmbedBuilder,
	PermissionsString,
	User,
} from 'discord.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ClientUtils, InteractionUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { EventData } from '../../models/internal-models.js';

export class AvatarCommand implements Command {
	public name = `avatar`;
	public slashDescription = `Show the avatar for a user`;
	public commandType = CommandType.Both;
	public aliases: string[] = [`pfp`, `av`];
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
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
					},
				],
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
					},
				],
			},
		],
	};
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Show user's avatars, or your own if you don't mention anyone.`;
	public usage = `avatar [userID or mention a user] | /avatar <pick a user>`;
	public website = `https://www.bentobot.xyz/commands#avatar`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		let imageURL: string | null = ``;
		let imageURLColour: string | null = ``;
		let authorData: EmbedAuthorData = {
			name: `inital ts annoying`,
		};

		if (intr.options.data[0].name === `user`) {
			if (intr.options.getUser(`user`)) {
				const user = intr.options.getUser(`user`) as User;
				imageURL =
					user.avatarURL() !== null
						? (user.avatarURL({ extension: `png`, forceStatic: false, size: 1024 }) as string)
						: user.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 });
				imageURLColour =
					user.avatarURL() !== null
						? (user.avatarURL({ extension: `png` }) as string)
						: user.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 });
				authorData = {
					name: `${user.tag}'s avatar`,
				};
			} else {
				const user = intr.user as User;
				imageURL =
					user.avatarURL() !== null
						? (user.avatarURL({ extension: `png`, forceStatic: false, size: 1024 }) as string)
						: user.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 });
				imageURLColour =
					user.avatarURL() !== null
						? (user.avatarURL({ extension: `png` }) as string)
						: user.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 });
				authorData = {
					name: `${user.tag}'s avatar`,
				};
			}
		}

		if (intr.options.data[0].name === `server`) {
			if (intr.options.getMember(`user`)) {
				const guildMember = intr.options.getMember(`user`) as GuildMember;
				imageURL = guildMember.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 });
				imageURLColour = guildMember.displayAvatarURL({ extension: `png` }) as string;
				authorData = {
					name: `${guildMember.displayName}'s avatar`,
				};
			} else {
				const guildMember = intr.member as GuildMember;
				imageURL = guildMember.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 });
				imageURLColour = guildMember.displayAvatarURL({ extension: `png` }) as string;
				authorData = {
					name: `${guildMember.displayName}'s avatar`,
				};
			}
		}

		if (imageURL === null) {
			return;
		} else {
			const embed = new EmbedBuilder()
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
			const embeds: EmbedBuilder[] = [];
			const embed = new EmbedBuilder()
				.setColor(`#${await stylingUtils.urlToColours(msg.author.displayAvatarURL({ extension: `png` }) as string)}`)
				.setTitle(`${msg.author.tag}'s avatar`)
				.setImage(
					msg.author.displayAvatarURL({
						extension: `png`,
						size: 1024,
						forceStatic: false,
					}) as string,
				)
				.setTimestamp();
			embeds.push(embed);
			if (msg.member?.avatarURL()) {
				const embed = new EmbedBuilder()
					.setColor(`#${await stylingUtils.urlToColours(msg.member.avatarURL({ extension: `png` }) as string)}`)
					.setTitle(`${msg.member.displayName}'s avatar`)
					.setImage(
						msg.member.avatarURL({
							extension: `png`,
							size: 1024,
							forceStatic: false,
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
					const embeds: EmbedBuilder[] = [];
					const embed = new EmbedBuilder()
						.setColor(`#${await stylingUtils.urlToColours(user.displayAvatarURL({ extension: `png` }) as string)}`)
						.setTitle(`${user.tag}'s avatar`)
						.setImage(
							user.displayAvatarURL({
								extension: `png`,
								size: 1024,
								forceStatic: false,
							}) as string,
						)
						.setTimestamp();
					embeds.push(embed);
					const guildMember = await msg.guild?.members.fetch(user);
					if (guildMember) {
						const embed = new EmbedBuilder()
							.setColor(`#${await stylingUtils.urlToColours(guildMember.avatarURL({ extension: `png` }) as string)}`)
							.setTitle(`${guildMember.displayName}'s avatar`)
							.setImage(
								guildMember.avatarURL({
									extension: `png`,
									size: 1024,
									forceStatic: false,
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
