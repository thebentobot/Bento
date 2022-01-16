import { EmbedAuthorData, Message, MessageActionRow, MessageButton, MessageEmbed, NewsChannel, TextChannel, ThreadChannel, User } from "discord.js";
import { prisma } from "../services/prisma";
import { DateTime } from "luxon";
import { StringUtils, stylingUtils } from ".";
import { notificationMessage } from "@prisma/client";
/*
interface notificationValues {
    id: number
    userID: bigint
    guildID: bigint
    content: string
    global: boolean
    guildMemberID: bigint
}
*/
export class notificationUtils {
	public static async notificationCheck(msg: Message): Promise<Message | void> {
		const notiMessage = msg.content
			.replace(`%`, ``)
			.replace(`_`, ``)
			.replace(/\\/g, `\\\\`)
			.replace(`__`, ``)
			.split(` `);
		/*
		const notificationData: Array<notificationValues> = await prisma.$queryRaw
		`
        SELECT n.*, gM."guildMemberID"
        FROM "notificationMessage" as n
        INNER JOIN "guildMember" gM on n."userID" = gM."userID"
        WHERE content ILIKE ANY(ARRAY [${notiMessage}]);`, notiMessage;
*/
		const notificationData = await prisma.notificationMessage.findMany({
			where: {
				content: {
					contains: notiMessage.toString(),
					mode: `insensitive`
				}
			},
		});
		if (notificationData) {
			const guildMemberData = await prisma.guildMember.findMany({
				where: {
					userID: BigInt(msg.author.id)
				}
			});
			const guildCheck = guildMemberData.map((guild) => guild.guildID);
			const newNotiArr: Array<notificationMessage> = [];
			for (const notiCheck of notificationData) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (notiCheck.guildID.toString() !== msg.guild!.id) {
					const guildMemberNotificationData = await prisma.guildMember.findMany({
						where: {
							userID: notiCheck.userID
						}
					});
					const guildMemberNotificationDataCheck = guildMemberNotificationData.map((guild) => guild.guildID);
					if (
						notiCheck.global === true &&
                notiCheck.userID.toString() !== msg.author.id &&
                guildCheck.some(guild => guildMemberNotificationDataCheck.includes(guild))
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
					// we need to somehow get the channel object
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const channelData = (msg.client.channels.cache.get(msg.channel.id) as TextChannel | NewsChannel | ThreadChannel);
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					//console.log(user.permissionsIn(channelData).has(`VIEW_CHANNEL`));
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					if (!user.permissionsIn(channelData).has(`VIEW_CHANNEL`)) return;
					const lastMessagesCollection = (await msg.channel.messages.fetch({ limit: 3 }));
					const lastMessages = [...lastMessagesCollection.values()].reverse();
					const embedAuthorData: EmbedAuthorData = {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						name: msg.guild!.name,
						url: `https://www.bentobot.xyz/`,
						iconURL: msg.guild?.iconURL() ? (msg.guild.iconURL({
							dynamic: true,
							format: `png`,
						}) as string)
							: (msg.client?.user?.avatarURL({ format: `png` }) as string),
					};
            
					const embed = new MessageEmbed()
						.setAuthor(embedAuthorData)
						.setTimestamp()
						.setThumbnail(
                    msg.author.avatarURL({
                    	format: `png`,
                    	size: 1024,
                    	dynamic: true,
                    }) as string,
						)
						.setColor(
							`#${await stylingUtils.urlToColours(
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								(msg.guild!.iconURL({ format: `png` }) as string)
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									? (msg.guild!.iconURL({ format: `png` }) as string)
									: (msg.client?.user?.avatarURL({ format: `png` }) as string),
							)}`,
						)
						.setDescription(
							StringUtils.truncate(
								`🗨 ${
									msg.member} mentioned \`${noti.content}\` in ${msg.channel} on **${
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									msg.guild!.name
								}**.\n${lastMessages
									.map(
										(msgMap: Message) =>
											`**[<t:${Math.round(msgMap.createdTimestamp / 1000)}:T>] ${
												msgMap.member
											}**\n> ${
												msgMap.content === `` ? `[MessageEmbed]` : msgMap.content.replace(noti.content, `**${noti.content}**`)
											}\n`,
									)
									.join(``)}`,
								4096,
							),
						);
					const row = new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setURL(msg.url)
								.setLabel(`Link to message`)
								.setStyle(`LINK`),
						);
					await user.send({embeds: [embed], components: [row]}).catch(async () => {
						await prisma.notificationMessage.delete({
							where: {
								id: noti.id,
							},
						});
					});
					return;
				} catch {
					console.log(`reached`);
					return;
				}
			}
		}
	}
}