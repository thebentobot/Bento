import { guildMember, user } from '@prisma/client';
import { prisma } from '../services/prisma.js';
import { GuildMember, User } from 'discord.js';

export class PrismaUtils {
	public static async UserCreateIfNotExists(discordUser: User): Promise<user> {
		const user = await prisma.user.upsert({
			where: {
				userID: BigInt(discordUser.id),
			},
			update: {
				username: discordUser.username,
				discriminator: discordUser.discriminator,
				avatarURL: discordUser.avatarURL({
					extension: `webp`,
					forceStatic: false,
					size: 1024,
				}),
			},
			create: {
				userID: BigInt(discordUser.id),
				username: discordUser.username,
				discriminator: discordUser.discriminator,
				avatarURL: discordUser.avatarURL({
					extension: `webp`,
					forceStatic: false,
					size: 1024,
				}),
				level: 1,
				xp: 0,
			},
		});
		return user;
	}

	public static async GuildMemberCreateIfNotExists(discordGuildMember: GuildMember): Promise<guildMember> {
		const guildMemberExists = await prisma.guildMember.findFirst({
			where: {
				userID: BigInt(discordGuildMember.id),
				guildID: BigInt(discordGuildMember.guild.id),
			},
		});
		if (guildMemberExists !== null) return guildMemberExists;
		const guildMember = await prisma.guildMember.create({
			data: {
				userID: BigInt(discordGuildMember.id),
				guildID: BigInt(discordGuildMember.guild.id),
				avatarURL: discordGuildMember.user.avatarURL({
					extension: `webp`,
					forceStatic: false,
					size: 1024,
				}),
				xp: 0,
				level: 1,
			},
		});
		return guildMember;
	}

	public static async UserExists(discordUser: User): Promise<boolean> {
		const user = await prisma.user.findFirst({
			where: {
				userID: BigInt(discordUser.id),
			},
		});
		return user === null ? false : true;
	}

	public static async GuildMemberExists(discordGuildMember: GuildMember): Promise<boolean> {
		const guildMember = await prisma.guildMember.findFirst({
			where: {
				userID: BigInt(discordGuildMember.id),
				guildID: BigInt(discordGuildMember.guild.id),
			},
		});
		return guildMember === null ? false : true;
	}
}
