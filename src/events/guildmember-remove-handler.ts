import { GuildMember, MessageEmbed, TextChannel, EmbedFooterData, PartialGuildMember } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/index.js';
import { botColours } from '../utils/styling-utils.js';
import { EventHandler } from './event-handler.js';

export class GuildMemberRemoveHandler implements EventHandler {
	public async process(member: GuildMember | PartialGuildMember): Promise<void> {
		const memberLogData = await prisma.memberLog.findUnique({
			where: {
				guildID: BigInt(member.guild.id),
			},
		});

		if (memberLogData) {
			const [banData, kickData, muteData, warningData] = await prisma.$transaction([
				prisma.ban.findMany({
					where: {
						userID: BigInt(member.user.id),
					},
				}),
				prisma.kick.findMany({
					where: {
						userID: BigInt(member.user.id),
					},
				}),
				prisma.mute.findMany({
					where: {
						userID: BigInt(member.user.id),
					},
				}),
				prisma.warning.findMany({
					where: {
						userID: BigInt(member.user.id),
					},
				}),
			]);

			const channel = member.guild.channels.cache.get(`${memberLogData.channel}`) as TextChannel;

			const EmbedFooterData: EmbedFooterData = {
				text: `UserID: ${member.user.id}`,
			};

			const embed = new MessageEmbed()
				.setTitle(`${member} left the server!`)
				.setThumbnail(
					`${member.user.avatarURL({
						format: `png`,
						dynamic: true,
						size: 1024,
					})}`,
				)
				.setColor(botColours.error)
				.setFooter(EmbedFooterData)
				.setTimestamp()
				.setDescription(
					`**Account created:** <t:${Math.round(member.user.createdTimestamp / 1000)}:F>${
						new Date().getTime() - member.user.createdAt.getTime() < 3600000
							? `\n**WARNING** This user is created under an hour ago.`
							: ``
					}\n**Bans on other servers:** \`${banData.length}\`.\n**Kicks from other servers:** \`${
						kickData.length
					}\`.\n**Mutes on other servers:** \`${muteData.length}\`.\n**Warnings on other servers:** \`${
						warningData.length
					}\`.`,
				);
			await MessageUtils.send(channel, embed);
		}

		const guildMemberData = await prisma.guildMember.findFirst({
			where: {
				userID: BigInt(member.user.id),
				guildID: BigInt(member.guild.id),
			},
		});

		await prisma.guildMember.delete({
			where: {
				guildMemberID: guildMemberData?.guildMemberID,
			},
		});

		const userData = await prisma.user.findMany({
			where: {
				userID: BigInt(member.user.id),
			},
		});

		if (userData.length < 1) {
			await prisma.user.delete({
				where: {
					userID: BigInt(member.user.id),
				},
			});
		}

		const byeData = await prisma.bye.findUnique({
			where: {
				guildID: BigInt(member.guild.id),
			},
		});

		if (byeData && byeData.message && byeData.channel) {
			const channel = member.guild.channels.cache.get(`${byeData.channel}`) as TextChannel;
			if (!channel.permissionsFor(member.client.user?.id as string)?.has(`VIEW_CHANNEL`)) return;
			if (!channel.permissionsFor(member.client.user?.id as string)?.has(`SEND_MESSAGES`)) return;
			const msg = byeData.message;
			const msgClean = msg
				.replace(`{user}`, `${member.user}`)
				.replace(`{username}`, member.user.username)
				.replace(`{discriminator}`, member.user.discriminator)
				.replace(`{usertag}`, member.user.username + `#` + member.user.discriminator)
				.replace(`{server}`, member.guild.name)
				.replace(`{memberCount}`, `${member.guild.memberCount}`)
				.replace(`{space}`, `\n`)
				.replace(`\\`, ``)
				.replace(`\\`, ``)
				.replace(`\\`, ``)
				.replace(`\\`, ``)
				.replace(`\\`, ``)
				.replace(`\\`, ``);

			await MessageUtils.send(channel, msgClean);
		}
	}
}
