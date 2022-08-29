import { PartialUser, User } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { EventHandler } from './event-handler.js';

export class UserUpdateHandler implements EventHandler {
	public async process(oldUser: User | PartialUser, newUser: User): Promise<void> {
		if (oldUser.bot) return;
		if (oldUser.avatarURL() !== newUser.avatarURL()) {
			await prisma.user.update({
				where: {
					userID: BigInt(oldUser.id),
				},
				data: {
					avatarURL: newUser.avatarURL({
						extension: `png`,
						forceStatic: false,
						size: 1024,
					}),
				},
			});
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
