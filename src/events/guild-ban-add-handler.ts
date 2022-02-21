import { GuildBan, MessageEmbed, TextChannel } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';
import { EventHandler } from './event-handler.js';

export class GuildBanAddHandler implements EventHandler {
	public async process(ban: GuildBan): Promise<void> {
		const modLogData = await prisma.modLog.findUnique({
			where: {
				guildID: BigInt(ban.guild.id),
			},
		});

		if (modLogData) {
			const logChannel: TextChannel = ban.client.channels.cache.get(`${modLogData?.channel}`) as TextChannel;
			if (!logChannel.permissionsFor(ban.client.user?.id as string)?.has(`VIEW_CHANNEL`)) return;
			if (!logChannel.permissionsFor(ban.client.user?.id as string)?.has(`SEND_MESSAGES`)) return;
			const embed = new MessageEmbed()
				.setColor(`#f54242`)
				.setThumbnail(
					ban.guild.members.cache
						.get(ban.user.id)
						?.user.displayAvatarURL({ size: 1024, dynamic: true, format: `png` }) as string,
				)
				.setTitle(
					`${ban.guild.members.cache.get(ban.user.id)?.user.username}#${
						ban.guild.members.cache.get(ban.user.id)?.user.discriminator
					} was banned!`,
				)
				.setDescription(`**The reason the user was banned:**\n${ban.reason ? ban.reason : `No reason specified`}`)
				.addField(`User ID`, ban.user.id)
				.addField(`Ban date`, `<t:${Math.round(new Date().getTime() / 1000)}:F>`)
				.setTimestamp();
			await MessageUtils.send(logChannel, embed);
		}

		await prisma.ban.create({
			data: {
				userID: BigInt(ban.user.id),
				guildID: BigInt(ban.guild.id),
				reason: ban.reason,
			},
		});

		await MessageUtils.send(
			ban.user,
			`🔨 You were \`banned\` from **${ban.guild.name}** 🔨 \n**Reason**: ${ban.reason}.`,
		);

		await prisma.guildMember.deleteMany({
			where: {
				userID: BigInt(ban.user.id),
				guildID: BigInt(ban.guild.id),
			},
		});

		const userCheck = await prisma.guildMember.findFirst({
			where: {
				userID: BigInt(ban.user.id),
			},
		});

		if (userCheck) {
			await prisma.user.delete({
				where: {
					userID: BigInt(ban.user.id),
				},
			});
		}
	}
}
