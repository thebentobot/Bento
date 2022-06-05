import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	EmbedAuthorData,
	Message,
	MessageEmbed,
	PermissionString,
	User,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { ClientUtils, InteractionUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { EventData } from '../../models/internal-models.js';

export class BannerCommand implements Command {
	public name = `banner`;
	public slashDescription = `Show the banner for a user`;
	public commandType = CommandType.Both;
	public metadata: ChatInputApplicationCommandData = {
		name: `banner`,
		description: this.slashDescription,
		options: [
			{
				name: `user`,
				description: `Show the banner for a user`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `Check the banner for a specific user`,
						type: ApplicationCommandOptionType.User.valueOf(),
					}
				]
			},
			/*
			{
				name: `server`,
				description: `Show the server banner for a user`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `Check the banner for a specific user`,
						type: ApplicationCommandOptionType.User.valueOf(),
					}
				]
			},
            */
		]
	};
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Show the banner for a user.\nIf they don't have a banner, it will show their colour.\nIf they don't have a colour it won't show anything.`;
	public usage = `banner [user id or mention user] | /banner <pick an option>`;
	public website = `https://www.bentobot.xyz/commands#banner`;
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
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const interactionUser = await intr.options.getUser(`user`)!.fetch(true) as User;
				const user = await intr.client.users.fetch(interactionUser,{ force: true });
				imageURL = user.bannerURL({format: `png`, dynamic: true, size: 1024});
				imageURLColour = user.bannerURL({format: `png`});
				authorData = {
					name: `${user.tag}'s banner`,
				};
			} else {
				const interactionUser = intr.user as User;
				const user = await intr.client.users.fetch(interactionUser,{ force: true });
				imageURL = user.bannerURL({format: `png`, dynamic: true, size: 1024});
				imageURLColour = user.bannerURL({format: `png`});
				authorData = {
					name: `${user.tag}'s banner`,
				};
			}
		}
		/*
	if (intr.options.get(`server`)) {
		if (intr.options.get(`user`)?.member) {
			const guildMember = intr.options.get(`user`)?.member as GuildMember;
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
	*/

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
			const interactionUser = msg.author as User;
			const user = await msg.client.users.fetch(interactionUser, { force: true });
			if (user.bannerURL()) {
				const embeds: MessageEmbed[] = [];
				const embed = new MessageEmbed()
					.setColor(`#${await stylingUtils.urlToColours(user.bannerURL({ format: `png` }) as string)}`)
					.setTitle(`${user.tag}'s banner`)
					.setImage(
						user.bannerURL({
							format: `png`,
							size: 1024,
							dynamic: true,
						}) as string,
					)
					.setTimestamp();
				embeds.push(embed);
				/*
				if (msg.member?.bannerURL()) {
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
				*/
				await MessageUtils.send(msg.channel, { embeds: embeds });
				return;
			} else {
				await MessageUtils.send(msg.channel, `${msg.author} You don't have a banner set.`);
				return;
			}
		} else {
			const userID = this.getUserFromMention(msg, args[0]);
			if (userID) {
				const user = await ClientUtils.getUser(msg.client, userID);
				if (user) {
					if (user.bannerURL()) {
						const embeds: MessageEmbed[] = [];
						const embed = new MessageEmbed()
							.setColor(`#${await stylingUtils.urlToColours(user.bannerURL({ format: `png` }) as string)}`)
							.setTitle(`${user.tag}'s avatar`)
							.setImage(
								user.bannerURL({
									format: `png`,
									size: 1024,
									dynamic: true,
								}) as string,
							)
							.setTimestamp();
						embeds.push(embed);
						/*
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
						*/
						await MessageUtils.send(msg.channel, { embeds: embeds });
						return;
					} else {
						await MessageUtils.send(msg.channel, `${msg.author} This user does not have a banner.`);
						return;
					}
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