import { GuildMember, EmbedBuilder, Role, TextChannel, EmbedFooterData, PermissionFlagsBits } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/index.js';
import { EventHandler } from './event-handler.js';

export class GuildMemberAddHandler implements EventHandler {
	public async process(member: GuildMember): Promise<void> {
		if (member.user.bot) return;
		const currentMute = await prisma.mute.findFirst({
			where: {
				userID: BigInt(member.user.id),
				guildID: BigInt(member.guild.id),
			},
		});

		if (currentMute) {
			const muteRoleData = await prisma.muteRole.findUnique({
				where: {
					guildID: BigInt(member.guild.id),
				},
			});

			const role = member.guild.roles.cache.get(`${muteRoleData?.roleID}`);

			if (member.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
				try {
					await member.roles.add(role as Role);
				} catch {
					console.log(`${member.guild.id} has deleted a mute role and can't mute the user`);
				}
			} else {
				console.log(
					`Attempted to add mute role in ${member.guild.name} (${member.guild.id}), but didn't have permissions.`,
				);
			}
		}

		const autoRoleData = await prisma.autoRole.findMany({
			where: {
				guildID: BigInt(member.guild.id),
			},
		});

		if (autoRoleData) {
			const iterator = autoRoleData.values();

			for (const value of iterator) {
				if (member.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
					try {
						await member.roles.add(`${value.roleID}`);
					} catch {
						console.log(`AutoRole ${value.roleID} couldn't be added because it is deleted.`);
						await prisma.autoRole.delete({
							where: {
								autoRoleID: value.autoRoleID,
							},
						});
						continue;
					}
				} else {
					console.log(
						`Attempted to add autoRole ${value.roleID} in ${member.guild.name} (${member.guild.id}), but didn't have permissions.`,
					);
					continue;
				}
			}
		}

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

			const embed = new EmbedBuilder()
				.setTitle(`${member} joined the server!`)
				.setThumbnail(
					`${member.user.avatarURL({
						extension: `png`,
						forceStatic: false,
						size: 1024,
					})}`,
				)
				.setColor(`#00ff1a`)
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

		const welcomeData = await prisma.welcome.findUnique({
			where: {
				guildID: BigInt(member.guild.id),
			},
		});

		if (welcomeData && welcomeData.message && welcomeData.channel) {
			const channel = member.guild.channels.cache.get(`${welcomeData.channel}`) as TextChannel;
			if (!channel.permissionsFor(member.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
			if (!channel.permissionsFor(member.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
			const msg = welcomeData.message;
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
