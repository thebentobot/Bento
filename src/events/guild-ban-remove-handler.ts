import { GuildBan, MessageEmbed, TextChannel } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';
import { EventHandler } from './event-handler.js';

export class GuildBanRemoveHandler implements EventHandler {
	public async process(ban: GuildBan): Promise<void> {
		const modLogData = await prisma.modLog.findUnique({
			where: {
				guildID: BigInt(ban.guild.id),
			},
		});

		const banCaseData = await prisma.ban.findFirst({
			where: {
				guildID: BigInt(ban.guild.id),
				userID: BigInt(ban.user.id),
			},
		});

		if (modLogData) {
			const logChannel: TextChannel = ban.client.channels.cache.get(`${modLogData?.channel}`) as TextChannel;
			if (!logChannel.permissionsFor(ban.client.user?.id as string)?.has(`VIEW_CHANNEL`)) return;
			if (!logChannel.permissionsFor(ban.client.user?.id as string)?.has(`SEND_MESSAGES`)) return;
			const embed = new MessageEmbed()
				.setColor(`#f5ec42`)
				.setThumbnail(
					ban.client.users.cache.get(ban.user.id)?.avatarURL({ size: 1024, dynamic: true, format: `png` }) as string,
				)
				.setTitle(
					`${ban.client.users.cache.get(ban.user.id)?.username}#${
						ban.client.users.cache.get(ban.user.id)?.discriminator
					} was unbanned!`,
				)
				.setDescription(
					`**The reason the user was banned:**\n${ban.reason ? ban.reason : `No reason specified`}${
						banCaseData
							? `\nNotes about the user ban case:\n${
									banCaseData.note !== null ? banCaseData.note : `No notes written for this case`
							  }`
							: ``
					}`,
				)
				.addField(`User ID`, ban.user.id)
				.setTimestamp();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			if (banCaseData) {
				embed.addField(
					`Mod who banned the user`,
					banCaseData.actor !== null
						? `${ban.client.users.cache.get(`${banCaseData.actor}`)?.username}#${
								ban.client.users.cache.get(`${banCaseData.actor}`)?.discriminator
						  }`
						: `Not specified`,
				);
				embed.addField(`Ban date`, `<t:${Math.round(banCaseData.date.getMilliseconds() / 1000)}:F>`);
			}
			await MessageUtils.send(logChannel, embed);
		}

		await MessageUtils.send(ban.user, `🙏 You were \`unbanned\` from **${ban.guild.name}**`);
	}
}
