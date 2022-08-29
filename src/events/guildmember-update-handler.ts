import {
	EmbedAuthorData,
	EmbedFooterData,
	GuildMember,
	EmbedBuilder,
	PartialGuildMember,
	TextChannel,
	PermissionFlagsBits,
} from 'discord.js';
import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';
import { EventHandler } from './event-handler.js';

export class GuildMemberUpdateHandler implements EventHandler {
	public async process(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
		if (oldMember.user.bot) return;
		const memberLogChannelData = await prisma.memberLog.findUnique({
			where: {
				guildID: BigInt(oldMember.guild.id),
			},
		});
		const modLogData = await prisma.modLog.findUnique({
			where: {
				guildID: BigInt(oldMember.guild.id),
			},
		});
		if (memberLogChannelData) {
			const memberLogChannel: TextChannel = oldMember.client.channels.cache.get(
				`${memberLogChannelData.channel}`,
			) as TextChannel;
			if (oldMember.nickname !== newMember.nickname) {
				if (!memberLogChannel.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel))
					return;
				if (
					!memberLogChannel.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)
				)
					return;
				const embedAuthorData: EmbedAuthorData = {
					name: `${oldMember.user.username + `#` + oldMember.user.discriminator} (userID: ${oldMember.id})`,
					iconURL: oldMember.displayAvatarURL({ forceStatic: false }),
				};

				const embedFooterData: EmbedFooterData = {
					text: `Updated at`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(embedAuthorData)
					.setColor(`#39FF14`)
					.setDescription(
						`Nickname updated for this user.\n**Previous nickname:**\n${oldMember.nickname}\n**New nickname:**\n${newMember.nickname}`,
					)
					.setFooter(embedFooterData)
					.setTimestamp();
				await MessageUtils.send(memberLogChannel, embed);
			}
			if (oldMember.displayAvatarURL() !== newMember.displayAvatarURL()) {
				await updateAvatar(newMember, true, memberLogChannel);
			}
			return;
		}

		if (modLogData) {
			const memberLogChannel: TextChannel = oldMember.client.channels.cache.get(`${modLogData.channel}`) as TextChannel;
			if (oldMember.isCommunicationDisabled() === false && newMember.isCommunicationDisabled() === true) {
				await setTimeOut(newMember, true, memberLogChannel);
			}
			if (oldMember.isCommunicationDisabled() === true && newMember.isCommunicationDisabled() === false) {
				await removeTimeOut(newMember, true, memberLogChannel);
			}
		}

		if (oldMember.displayAvatarURL() !== newMember.displayAvatarURL()) {
			await updateAvatar(newMember, false);
		}
		if (oldMember.isCommunicationDisabled() === false && newMember.isCommunicationDisabled() === true) {
			await setTimeOut(newMember, false);
		}
		if (oldMember.isCommunicationDisabled() === true && newMember.isCommunicationDisabled() === false) {
			await removeTimeOut(newMember, false);
		}

		async function updateAvatar(newMember: GuildMember, memberLog: boolean, channel?: TextChannel) {
			await prisma.guildMember.updateMany({
				where: {
					userID: BigInt(newMember.user.id),
					guildID: BigInt(newMember.guild.id),
				},
				data: {
					avatarURL: newMember.displayAvatarURL({
						forceStatic: false,
						extension: `png`,
						size: 1024,
					}),
				},
			});
			if (memberLog === true) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages))
					return;
				const embedAuthorData: EmbedAuthorData = {
					name: `${oldMember.user.username + `#` + oldMember.user.discriminator} (userID: ${oldMember.id})`,
					iconURL: oldMember.displayAvatarURL({ forceStatic: false }),
				};

				const embedFooterData: EmbedFooterData = {
					text: `Updated at`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(embedAuthorData)
					.setThumbnail(newMember.displayAvatarURL({ forceStatic: false, extension: `png`, size: 1024 }))
					.setColor(`#39FF14`)
					.setDescription(
						`Avatar updated for this user.\n**Previous avatar:**\n${oldMember.user.displayAvatarURL({
							forceStatic: false,
							extension: `png`,
							size: 1024,
						})}\n**New avatar:**\n${newMember.user.displayAvatarURL({
							forceStatic: false,
							extension: `png`,
							size: 1024,
						})}`,
					)
					.setFooter(embedFooterData)
					.setTimestamp();
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await MessageUtils.send(channel!, embed);
			} else {
				return;
			}
		}

		async function setTimeOut(newMember: GuildMember, modLog: boolean, channel?: TextChannel) {
			const muteData = await prisma.mute.create({
				data: {
					userID: BigInt(newMember.user.id),
					date: new Date(),
					muteEnd: newMember.communicationDisabledUntil as Date,
					MuteStatus: true,
					guildID: BigInt(newMember.guild.id),
				},
			});
			const muteDataCount = await prisma.mute.count({
				where: {
					userID: BigInt(newMember.user.id),
					guildID: BigInt(newMember.guild.id),
				},
			});
			if (modLog) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages))
					return;
				const embedAuthorData: EmbedAuthorData = {
					name: `${oldMember.user.username + `#` + oldMember.user.discriminator} (userID: ${oldMember.id})`,
					iconURL: oldMember.displayAvatarURL({ forceStatic: false }),
				};

				const embedFooterData: EmbedFooterData = {
					text: `Mute Case Number: ${muteData.muteCase}`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(embedAuthorData)
					.setThumbnail(oldMember.displayAvatarURL({ forceStatic: false, extension: `png`, size: 1024 }))
					.setColor(`#000000`)
					.addFields(
						{
							name: `User ID`,
							value: oldMember.id,
						},
						{
							name: `Amount of times muted on this server`,
							value: muteDataCount > 1 ? `${muteDataCount} times` : `${muteDataCount} time`,
						},
					)
					.setTitle(`${oldMember.displayName} (${oldMember.user.username}#${oldMember.user.discriminator}) was muted!`)
					.setDescription(
						`Time period of this time out: <t:${newMember.communicationDisabledUntilTimestamp}:R> (<t:${newMember.communicationDisabledUntilTimestamp}:F>)`,
					)
					.setFooter(embedFooterData)
					.setTimestamp();
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await MessageUtils.send(channel!, embed);
				await MessageUtils.send(
					newMember.user,
					`😶 You have been timed out in ${newMember.guild.name}.\nThe time period for this time out lasts till <t:${
						newMember.communicationDisabledUntilTimestamp
					}:R> (<t:${newMember.communicationDisabledUntilTimestamp}:F>)\nYou have been timed out ${
						muteDataCount > 1 ? `${muteDataCount} times` : `${muteDataCount} time`
					} on this server.`,
				);
			} else {
				await MessageUtils.send(
					newMember.user,
					`😶 You have been timed out in ${newMember.guild.name}.\nThe time period for this time out lasts till <t:${
						newMember.communicationDisabledUntilTimestamp
					}:R> (<t:${newMember.communicationDisabledUntilTimestamp}:F>)\nYou have been timed out ${
						muteDataCount > 1 ? `${muteDataCount} times` : `${muteDataCount} time`
					} on this server.`,
				);
			}
		}
		async function removeTimeOut(newMember: GuildMember, modLog: boolean, channel?: TextChannel) {
			let muteData = await prisma.mute.findFirst({
				where: {
					guildID: BigInt(newMember.guild.id),
					userID: BigInt(newMember.user.id),
				},
			});
			if (muteData) {
				muteData = await prisma.mute.update({
					where: {
						muteCase: muteData.muteCase,
					},
					data: {
						MuteStatus: false,
					},
				});
			} else {
				muteData = await prisma.mute.create({
					data: {
						userID: BigInt(newMember.user.id),
						muteEnd: oldMember.communicationDisabledUntil as Date,
						MuteStatus: false,
						guildID: BigInt(newMember.guild.id),
						NonBentoMute: true,
					},
				});
			}

			const muteDataCount = await prisma.mute.count({
				where: {
					userID: BigInt(newMember.user.id),
					guildID: BigInt(newMember.guild.id),
				},
			});
			if (modLog) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(oldMember.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages))
					return;
				const embedAuthorData: EmbedAuthorData = {
					name: `${oldMember.user.username + `#` + oldMember.user.discriminator} (userID: ${oldMember.id})`,
					iconURL: oldMember.displayAvatarURL({ forceStatic: false }),
				};

				const embedFooterData: EmbedFooterData = {
					text: `Mute Case Number: ${muteData.muteCase}`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(embedAuthorData)
					.setThumbnail(oldMember.displayAvatarURL({ forceStatic: false, extension: `png`, size: 1024 }))
					.setColor(`#00ff4a`)
					.addFields(
						{
							name: `User ID`,
							value: oldMember.id,
						},
						{
							name: `Amount of times muted on this server`,
							value: muteDataCount > 1 ? `${muteDataCount} times` : `${muteDataCount} time`,
						},
					)
					.setTitle(
						`${oldMember.displayName} (${oldMember.user.username}#${oldMember.user.discriminator}) was unmuted!`,
					)
					.setDescription(
						`Reason for mute: ${muteData.reason === null ? `No reason listed.` : muteData.reason}\nNotes for mute: ${
							muteData.note === null ? `No notes written.` : muteData.note
						}${
							muteData.NonBentoMute === true
								? ``
								: `Date for mute: <t:${Math.round(muteData.date.getTime() / 1000)}:R> (<t:${Math.round(
										muteData.date.getTime() / 1000,
								  )}:F>`
						}`,
					)
					.setFooter(embedFooterData)
					.setTimestamp();
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await MessageUtils.send(channel!, embed);
				await MessageUtils.send(
					newMember.user,
					`🙏🏻 You time out in ${newMember.guild.name} has expired.\nYou have been timed out ${
						muteDataCount > 1 ? `${muteDataCount} times` : `${muteDataCount} time`
					} on this server.`,
				);
			} else {
				await MessageUtils.send(
					newMember.user,
					`🙏🏻 You time out in ${newMember.guild.name} has expired.\nYou have been timed out ${
						muteDataCount > 1 ? `${muteDataCount} times` : `${muteDataCount} time`
					} on this server.`,
				);
			}
		}
	}
}
