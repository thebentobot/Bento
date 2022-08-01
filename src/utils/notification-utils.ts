import {
	EmbedAuthorData,
	Message,
	ActionRowBuilder,
	ButtonBuilder,
	EmbedBuilder,
	NewsChannel,
	TextChannel,
	ButtonStyle,
	PermissionFlagsBits,
} from 'discord.js';
import { prisma } from '../services/prisma.js';
import { StringUtils, stylingUtils } from './index.js';
import { notificationMessage } from '@prisma/client';

export class notificationUtils {
	public static async notificationCheck(msg: Message): Promise<Message | void> {
		const notiMessage = msg.content
			.replace(`%`, ``)
			.replace(`_`, ``)
			.replace(/\\/g, `\\\\`)
			.replace(`__`, ``)
			.split(` `);

		const notificationData = await prisma.notificationMessage.findMany({
			where: {
				content: {
					contains: notiMessage.toString(),
					mode: `insensitive`,
				},
			},
		});
		if (notificationData) {
			const guildMemberData = await prisma.guildMember.findMany({
				where: {
					userID: BigInt(msg.author.id),
				},
			});
			const guildCheck = guildMemberData.map((guild) => guild.guildID);
			const newNotiArr: Array<notificationMessage> = [];
			for (const notiCheck of notificationData) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (notiCheck.guildID.toString() !== msg.guild!.id) {
					const guildMemberNotificationData = await prisma.guildMember.findMany({
						where: {
							userID: notiCheck.userID,
						},
					});
					const guildMemberNotificationDataCheck = guildMemberNotificationData.map((guild) => guild.guildID);
					if (
						notiCheck.global === true &&
						notiCheck.userID.toString() !== msg.author.id &&
						guildCheck.some((guild) => guildMemberNotificationDataCheck.includes(guild))
					) {
						newNotiArr.push(notiCheck);
					}
				} else if (notiCheck.userID.toString() !== msg.author.id) {
					newNotiArr.push(notiCheck);
				}
			}
			for (const noti of newNotiArr) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const user = await (await msg.client.guilds.fetch(msg.guild!.id)).members.fetch(noti.userID.toString());
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const channelData = msg.client.channels.cache.get(msg.channel.id) as
						| TextChannel
						| NewsChannel;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					if (!user.permissionsIn(channelData).has(PermissionFlagsBits.ViewChannel)) return;
					const lastMessagesCollection = await msg.channel.messages.fetch({ limit: 3 });
					const lastMessages = [...lastMessagesCollection.values()].reverse();
					const embedAuthorData: EmbedAuthorData = {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						name: msg.guild!.name,
						url: `https://www.bentobot.xyz/`,
						iconURL: msg.guild?.iconURL()
							? (msg.guild.iconURL({
								forceStatic: false,
								extension: `png`,
							  }) as string)
							: (msg.client?.user?.avatarURL({ extension: `png` }) as string),
					};

					const embed = new EmbedBuilder()
						.setAuthor(embedAuthorData)
						.setTimestamp()
						.setThumbnail(
							msg.author.displayAvatarURL({
								extension: `png`,
								size: 1024,
								forceStatic: false,
							}) as string,
						)
						.setColor(
							`#${await stylingUtils.urlToColours(
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								(msg.guild!.iconURL({ extension: `png` }) as string)
									? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									  (msg.guild!.iconURL({ extension: `png` }) as string)
									: (msg.client?.user?.avatarURL({ extension: `png` }) as string),
							)}`,
						)
						.setDescription(
							StringUtils.truncate(
								`🗨 ${msg.member} mentioned \`${noti.content}\` in ${msg.channel} on **${
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									msg.guild!.name
								}**.\n${lastMessages
									.map(
										(msgMap: Message) =>
											`**[<t:${Math.round(msgMap.createdTimestamp / 1000)}:T>] ${msgMap.member}**\n> ${
												msgMap.content === ``
													? `[MessageEmbed]`
													: msgMap.content.replace(noti.content, `**${noti.content}**`)
											}\n`,
									)
									.join(``)}`,
								4096,
							),
						);
					const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder().setURL(msg.url).setLabel(`Link to message`).setStyle(ButtonStyle.Link),
					);
					await user.send({ embeds: [embed], components: [row] }).catch(async () => {
						await prisma.notificationMessage.delete({
							where: {
								id: noti.id,
							},
						});
					});
					return;
				} catch {
					return;
				}
			}
		}
	}
}
