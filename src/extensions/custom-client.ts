import { ActivityType, Client, ClientOptions, Presence, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';

export class CustomClient extends Client {
	constructor(clientOptions: ClientOptions) {
		super(clientOptions);
	}

	public setPresence(type: ActivityType, name: string, url: string): Presence | undefined {
		return this.user?.setPresence({
			activities: [
				{
					// TODO: Discord.js won't accept all ActivityType's here
					// Need to find a solution to remove "any"
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					type: type as any,
					name,
					url,
				},
			],
		});
	}

	public async topggVoting(user: string, isWeekend: boolean): Promise<void> {
		const newUserDate = DateTime.now().plus({ hours: -12 }).toJSDate();
		await prisma.bento.upsert({
			create: {
				userID: BigInt(user),
				bento: isWeekend ? 10 : 5,
				bentoDate: new Date(newUserDate),
			},
			update: {
				userID: BigInt(user),
				bento: {
					increment: isWeekend ? 10 : 5,
				},
			},
			where: {
				userID: BigInt(user),
			},
		});

		const webhookChannel = this.channels.cache.get(`881566124993544232`) as TextChannel;
		const voteUser = this.users.cache.get(user);
		const voteMessageChannel = `<@${user}> has voted on top.gg 👏\nYou have now received ${
			isWeekend
				? `**10 Bento** 🍱 as a thanks for your support 🥺💖`
				: `**5 Bento** 🍱 as a thanks for your support 🥺💖`
		}`;
		const voteMessageUser = `Thank you so much for voting on me 🍱 on top.gg 👏\nYou have now received ${
			isWeekend
				? `**10 Bento** 🍱 as a thanks for your support 🥺💖`
				: `**5 Bento** 🍱 as a thanks for your support 🥺💖`
		}`;
		await MessageUtils.send(webhookChannel, voteMessageChannel);
		if (voteUser) {
			await MessageUtils.send(voteUser, voteMessageUser);
		}
	}
}
