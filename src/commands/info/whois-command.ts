import { Message, EmbedBuilder, PermissionsString, User } from 'discord.js';
import { ClientUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';

export class WhoIsCommand implements Command {
	public name = `whois`;
	public aliases: string[] = [`user`, `userinfo`];
	public slashDescription = `Displays info about a user`;
	public commandType = CommandType.MessageCommand;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Displays info about the mentioned user or the user who uses the command.`;
	public usage = `whois [user id or mention user]`;
	public website = `https://www.bentobot.xyz/commands#whois`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			const embed = new EmbedBuilder()
				.setColor(await stylingUtils.urlToColours(msg.author.displayAvatarURL({ extension: `png` })))
				.setTitle(`Profile for ${msg.author.tag}`)
				.setThumbnail(msg.author.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 }) as string)
				.setTimestamp()
				.addFields(
					{
						name: `Nickname on the server`,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						value: msg.member!.nickname !== null ? msg.member!.nickname : msg.member!.displayName,
					},
					{
						name: `User ID`,
						value: msg.author.id,
					},
					{
						name: `Account created on`,
						value: `<t:${Math.round(msg.author.createdTimestamp / 1000)}:F>`,
					},
					{
						name: `Joined server at`,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						value: `<t:${Math.round((msg.member!.joinedTimestamp as number) / 1000)}:F>`,
						inline: true,
					},
					{
						name: `Highest role`,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						value: `${msg.member!.roles.highest}`,
					},
					{
						name: `All roles`,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						value: stylingUtils.trim(msg.member!.roles.cache.map((r) => `${r}`).join(` | `) as string, 1024),
						inline: true,
					},
				);
			await MessageUtils.send(msg.channel, embed);
			return;
		} else {
			const userID = this.getUserFromMention(msg, args[0]);
			if (userID) {
				if (msg.guild?.members.cache.has(userID as string)) {
					const user = msg.guild.members.cache.get(userID as string);
					const embed = new EmbedBuilder()
						.setColor(await stylingUtils.urlToColours(user?.displayAvatarURL({ extension: `png` })))
						.setTitle(`Profile for ${user?.displayName}`)
						.setThumbnail(user?.displayAvatarURL({ extension: `png`, forceStatic: false }) as string)
						.addFields(
							{
								name: `Nickname on the server`,
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								value: msg.member!.nickname !== null ? msg.member!.nickname : msg.member!.displayName,
							},
							{
								name: `User ID`,
								value: msg.author.id,
							},
							{
								name: `Account created on`,
								value: `<t:${Math.round(msg.author.createdTimestamp / 1000)}:F>`,
							},
							{
								name: `Joined server at`,
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								value: `<t:${Math.round((msg.member!.joinedTimestamp as number) / 1000)}:F>`,
								inline: true,
							},
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							{
								name: `Highest role`,
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								value: `${msg.member!.roles.highest}`,
							},
							{
								name: `All roles`,
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								value: stylingUtils.trim(msg.member!.roles.cache.map((r) => `${r}`).join(` | `) as string, 1024),
								inline: true,
							},
						);
					await MessageUtils.send(msg.channel, embed);
					return;
				} else {
					try {
						const globalUser = (await ClientUtils.getUser(msg.client, userID)) as User;
						if (globalUser.bot === true) return;
						const embed = new EmbedBuilder()
							.setColor(await stylingUtils.urlToColours(globalUser.displayAvatarURL({ extension: `png` })))
							.setTitle(`Profile for ${globalUser.tag}`)
							.setThumbnail(
								globalUser?.displayAvatarURL({ extension: `png`, forceStatic: false, size: 1024 }) as string,
							)
							.setTimestamp()
							.addFields(
								{
									name: `User ID`,
									value: globalUser.id,
								},
								{
									name: `Account created on`,
									value: `<t:${Math.round(globalUser.createdTimestamp / 1000)}:F>`,
								},
							);
						await MessageUtils.send(msg.channel, embed);
						return;
					} catch {
						await MessageUtils.send(msg.channel, `This user does not exist.`);
						return;
					}
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
