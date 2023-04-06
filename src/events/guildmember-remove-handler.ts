import { GuildMember, TextChannel, PartialGuildMember, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/index.js';
import { EventHandler } from './event-handler.js';
import { PrismaUtils } from '../utils/prisma-utils.js';

export class GuildMemberRemoveHandler implements EventHandler {
	public async process(member: GuildMember | PartialGuildMember): Promise<void> {
		if (member.user.bot) return;
		if ((await PrismaUtils.GuildMemberExists(member)) === false) return;

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

		const byeData = await prisma.bye.findUnique({
			where: {
				guildID: BigInt(member.guild.id),
			},
		});

		if (byeData && byeData.message !== null && byeData.channel !== null) {
			const channel = member.guild.channels.cache.get(`${byeData.channel}`) as TextChannel;
			if (!channel.permissionsFor(member.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
			if (!channel.permissionsFor(member.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
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

		const anyGuildMemberData = await prisma.guildMember.findMany({
			where: {
				userID: BigInt(member.user.id),
			},
		});

		if (anyGuildMemberData.length === 0) {
			await prisma.user.delete({
				where: {
					userID: BigInt(member.user.id),
				},
			});
		}
	}
}
