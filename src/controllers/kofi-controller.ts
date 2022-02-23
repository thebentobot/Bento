import { Router } from 'express';
import router from 'express-promise-router';
import * as dotenv from 'dotenv';
dotenv.config();
import { Controller } from './controller.js';
import { ShardingManager, TextChannel } from 'discord.js';
import { MessageUtils } from '../utils/message-utils.js';

export class kofiController implements Controller {
	public path = `/kofi`;
	public router: Router = router();

	constructor(private shardManager: ShardingManager) {}

	public register(): void {
		this.router.post(`/`, (req) => {
			const data = req.body.data;
			if (!data) return;
			const dataJSON = JSON.parse(data);
			if (dataJSON.is_public === false) return;
			this.shardManager.broadcastEval(
				async (client) => {
					const webhookChannel: TextChannel = client.channels.cache.get(`881566124993544232`) as TextChannel;
					await MessageUtils.send(webhookChannel, `"${dataJSON.message}"\nI have received a **${dataJSON.amount}$** **Ko-fi ☕ tip** from **${
						dataJSON.from_name
					}**. Thank you so much! 🥺\nIn return, you will ASAP receive **${parseInt(
						dataJSON.amount,
					)} Bento** 🍱 in return, as a huge thanks 💖`);
				}
			);
		});
	}
}
