import { PartialUser, User } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { EventHandler } from './event-handler.js';
import { PrismaUtils } from '../utils/prisma-utils.js';

export class UserUpdateHandler implements EventHandler {
	public async process(oldUser: User | PartialUser, newUser: User): Promise<void> {
		if (oldUser.bot) return;
		if ((await PrismaUtils.UserExists(newUser)) === false) return;
		if (oldUser.avatarURL() !== newUser.avatarURL()) {
			await prisma.user.update({
				where: {
					userID: BigInt(oldUser.id),
				},
				data: {
					avatarURL: newUser.avatarURL({
						extension: `webp`,
						forceStatic: false,
						size: 1024,
					}),
				},
			});
			const patreonData = await prisma.patreon.findMany();
			const patreonUser = patreonData.find((user) => user.userID === BigInt(oldUser.id));
			if (patreonUser !== undefined) {
				await prisma.patreon.update({
					where: {
						userID: BigInt(oldUser.id),
					},
					data: {
						avatar: newUser.avatarURL({
							extension: `webp`,
							forceStatic: false,
							size: 1024,
						}),
					},
				});
			}
		}

		if (oldUser.username !== newUser.username) {
			await prisma.user.update({
				where: {
					userID: BigInt(oldUser.id),
				},
				data: {
					username: newUser.username,
				},
			});
		}

		if (oldUser.discriminator !== newUser.discriminator) {
			await prisma.user.update({
				where: {
					userID: BigInt(oldUser.id),
				},
				data: {
					username: newUser.discriminator,
				},
			});
		}
	}
}
