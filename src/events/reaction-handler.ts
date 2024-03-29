import { Message, MessageReaction, User } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventHandler } from '.';
import { config as Config } from '../config/config.js';
import { Reaction } from '../reactions/index.js';
import { EventDataService } from '../services/index.js';

export class ReactionHandler implements EventHandler {
	private rateLimiter = new RateLimiter(
		Config.rateLimiting.reactions.amount,
		Config.rateLimiting.reactions.interval * 1000,
	);

	constructor(private reactions: Reaction[], private eventDataService: EventDataService) {}

	public async process(msgReaction: MessageReaction, msg: Message, reactor: User): Promise<void> {
		// Don't respond to self, or other bots
		if (reactor.id === msgReaction.client.user?.id || reactor.bot) {
			return;
		}

		// Try to find the reaction the user wants
		const reaction = this.findReaction(msgReaction.emoji.name);
		if (!reaction) {
			return;
		}

		if (reaction.requireGuild && !msg.guild) {
			return;
		}

		if (reaction.requireSentByClient && msg.author.id !== msg.client.user?.id) {
			return;
		}

		// Check if user is rate limited
		const limited = this.rateLimiter.take(msg.author.id);
		if (limited) {
			return;
		}

		// TODO: Get data from database
		const data = await this.eventDataService.create({
			user: msg.author,
			channel: msg.channel,
			guild: msg.guild !== null ? msg.guild : undefined,
		});

		// Execute the reaction
		await reaction.execute(msgReaction, msg, reactor, data);
	}

	private findReaction(emoji: string | null): Reaction | undefined {
		return this.reactions.find((reaction) => reaction.emoji === emoji);
	}
}
