import { Webhook } from '@top-gg/sdk';
import { Router } from 'express';
import router from 'express-promise-router';
import * as dotenv from 'dotenv';
dotenv.config();
import { Controller } from './controller.js';
import { ShardingManager } from 'discord.js';
import { CustomClient } from '../extensions/custom-client.js';

const webhook = new Webhook(process.env.topGGToken);

export class TopggVotingController implements Controller {
	public path = `/dblwebhook`;
	public router: Router = router();

	constructor(private shardManager: ShardingManager) {}

	public register(): void {
		this.router.post(
			`/`,
			webhook.listener(async (vote) => {
				const userID = vote.user;
				console.log(userID + ` has voted on top.gg`);
				await this.shardManager.broadcastEval(async (client) => {
					const CustomClient = client as CustomClient;
					return await CustomClient.topggVoting(userID, vote.isWeekend as boolean);
				});
			}),
		);
	}
}
