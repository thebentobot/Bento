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

export class GfycatSearchButton implements Button {
	public ids = [`gfycatSearch_previous`, `gfycatSearch_next`, `gfycatSearch_delete`];
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
			console.log(`Error line 26 gfycatSearch-button.ts`);
			return;
		}
		let newPageNum = ButtonUtils.getNewPageNum(pageNum, intr.customId.replace(/^gfycatSearch_/, ``));
		if (newPageNum === undefined) {
			console.log(`Error line 35 gfycatSearch-button.ts`);
			return;
		}
		if (newPageNum <= 0) newPageNum = 1;
		const gfycatSearchData = await prisma.gfycatPosts.findMany({
			where: {
				messageId: BigInt(msg.id),
			},
		});

		const lastPageNumber = gfycatSearchData.length;

		if (newPageNum === 1) {
			await InteractionUtils.editReply(intr, {
				content: `Page ${newPageNum}/${gfycatSearchData.length}\n${gfycatSearchData[newPageNum - 1].content}`,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: `gfycatSearch_next`,
								emoji: `➡️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatSearch_delete`,
								label: `Close embed`,
								style: ButtonStyle.Danger,
							},
						],
					},
				],
			});
		} else if (newPageNum === lastPageNumber) {
			await InteractionUtils.editReply(intr, {
				content: `Page ${newPageNum}/${gfycatSearchData.length}\n${gfycatSearchData[newPageNum - 1].content}`,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: `gfycatSearch_previous`,
								emoji: `⬅️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatSearch_delete`,
								label: `Close embed`,
								style: ButtonStyle.Danger,
							},
						],
					},
				],
			});
		} else {
			await InteractionUtils.editReply(intr, {
				content: `Page ${newPageNum}/${gfycatSearchData.length}\n${gfycatSearchData[newPageNum - 1].content}`,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: `gfycatSearch_previous`,
								emoji: `⬅️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatSearch_next`,
								emoji: `➡️`,
								style: ButtonStyle.Primary,
							},
							{
								type: ComponentType.Button,
								customId: `gfycatSearch_delete`,
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
