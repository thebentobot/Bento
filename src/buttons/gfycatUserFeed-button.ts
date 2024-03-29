import {
	APIActionRowComponent,
	APIButtonComponentWithCustomId,
	ButtonInteraction,
	ButtonStyle,
	ComponentType,
	Message,
} from 'discord.js';
import { EventData } from '../models/internal-models.js';
import { prisma } from '../services/prisma.js';
import { ButtonUtils } from '../utils/button-utils.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { MessageUtils } from '../utils/message-utils.js';
import { RegexUtils } from '../utils/regex-utils.js';
import { Button, ButtonDeferType } from './button.js';

export class GfycatUserFeedButton implements Button {
	public ids = [`gfycatUserFeed_previous`, `gfycatUserFeed_next`, `gfycatUserFeed_delete`];
	public deferType = ButtonDeferType.UPDATE;
	public requireGuild = true;
	public requireEmbedAuthorTag = false;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async execute(intr: ButtonInteraction, msg: Message, data: EventData): Promise<void> {
		if (intr.customId === `gfycatSearch_delete`) {
			await prisma.gfycatPosts.deleteMany({
				where: {
					messageId: BigInt(msg.id),
				},
			});
			await MessageUtils.delete(msg);
			return;
		}
		const embed = msg.content;
		const getNumberMessage = embed.split(` `);

		const pageNum = RegexUtils.pageNumber(`${getNumberMessage[0]} ${getNumberMessage[1]}`);
		if (pageNum === undefined) {
			console.log(`Error line 26 gfycatUserFeed-button.ts`);
			return;
		}

		let newPageNum = ButtonUtils.getNewPageNum(pageNum, intr.customId.replace(/^gfycatUserFeed_/, ``));
		if (newPageNum === undefined) {
			console.log(`Error line 35 gfycatUserFeed-button.ts`);
			return;
		}
		if (newPageNum <= 0) newPageNum = 1;

		const gfycatUserFeedData = await prisma.gfycatPosts.findMany({
			where: {
				messageId: BigInt(msg.id),
			},
		});

		const lastPageNumber = gfycatUserFeedData.length;

		if (newPageNum === 1) {
			await InteractionUtils.editReply(intr, {
				content: `Page ${newPageNum}/${gfycatUserFeedData.length}\n${gfycatUserFeedData[newPageNum - 1].content}`,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: `gfycatUserFeed_next`,
								emoji: `➡️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatUserFeed_delete`,
								label: `Close embed`,
								style: ButtonStyle.Danger,
							},
						],
					},
				],
			});
		} else if (newPageNum === lastPageNumber) {
			await InteractionUtils.editReply(intr, {
				content: `Page ${newPageNum}/${gfycatUserFeedData.length}\n${gfycatUserFeedData[newPageNum - 1].content}`,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: `gfycatUserFeed_previous`,
								emoji: `⬅️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatUserFeed_delete`,
								label: `Close embed`,
								style: ButtonStyle.Danger,
							},
						],
					},
				],
			});
		} else {
			await InteractionUtils.editReply(intr, {
				content: `Page ${newPageNum}/${gfycatUserFeedData.length}\n${gfycatUserFeedData[newPageNum - 1].content}`,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: `gfycatUserFeed_previous`,
								emoji: `⬅️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatUserFeed_next`,
								emoji: `➡️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatUserFeed_delete`,
								label: `Close embed`,
								style: ButtonStyle.Danger,
							},
						],
					},
				],
			});
		}
		return;
	}
}
