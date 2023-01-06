import { Message, StringSelectMenuInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventHandler } from './index.js';
import { config as Config } from '../config/config.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { SelectMenu, SelectMenuDeferType } from '../selectMenu/selectMenu.js';
import { EventDataService } from '../services/index.js';

export class SelectMenuHandler implements EventHandler {
	private rateLimiter = new RateLimiter(
		Config.rateLimiting.buttons.amount,
		Config.rateLimiting.buttons.interval * 1000,
	);

	constructor(private selectMenuReplies: SelectMenu[], private eventDataService: EventDataService) {}

	public async process(intr: StringSelectMenuInteraction, msg: Message): Promise<void> {
		// Don't respond to self, or other bots
		if (intr.user.id === intr.client.user?.id || intr.user.bot) {
			return;
		}

		// Check if user is rate limited
		const limited = this.rateLimiter.take(intr.user.id);
		if (limited) {
			return;
		}

		// Try to find the select menu the user wants
		const selectMenuReply = this.findSelectMenuReplies(intr.customId);
		if (!selectMenuReply) {
			return;
		}

		if (selectMenuReply.requireGuild && !intr.guild) {
			return;
		}

		// Check if the embeds author equals the users tag
		if (selectMenuReply.requireEmbedAuthorTag && msg.embeds[0]?.author?.name !== intr.user.tag) {
			return;
		}

		// Defer interaction
		// NOTE: Anything after this point we should be responding to the interaction
		switch (selectMenuReply.deferType) {
			case SelectMenuDeferType.REPLY: {
				await InteractionUtils.deferReply(intr);
				break;
			}
			case SelectMenuDeferType.UPDATE: {
				await InteractionUtils.deferUpdate(intr);
				break;
			}
		}

		// TODO: Get data from database
		const data = await this.eventDataService.create({
			user: msg.author,
			channel: msg.channel,
			guild: msg.guild !== null ? msg.guild : undefined,
		});

		// Execute the button
		await selectMenuReply.execute(intr, msg, data);
	}

	private findSelectMenuReplies(id: string): SelectMenu | undefined {
		return this.selectMenuReplies.find((selectMenuReply) => selectMenuReply.ids.includes(id));
	}
}
