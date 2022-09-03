import { ActivityType, ShardingManager } from 'discord.js';
import { botSites as BotSites } from '../config/bot-sites.js';
import { config as Config } from '../config/config.js';

import { CustomClient } from '../extensions/index.js';
import { logs as Logs } from '../lang/logs.js';
import { BotSite } from '../models/config-models.js';
import { HttpService, Logger } from '../services/index.js';
import { ShardUtils } from '../utils/index.js';
import { Job } from './job.js';

export class UpdateServerCountJob implements Job {
	public name = `Update Server Count`;
	public schedule: string = Config.jobs.updateServerCount.schedule;
	public log: boolean = Config.jobs.updateServerCount.log;

	private botSites: BotSite[];

	constructor(private shardManager: ShardingManager, private httpService: HttpService) {
		this.botSites = BotSites.filter((botSite) => botSite.enabled);
	}

	public async run(): Promise<void> {
		const serverCount = await ShardUtils.serverCount(this.shardManager);

		const type = ActivityType.Streaming;
		const name = `to ${serverCount.toLocaleString()} servers`;
		const url = `https://youtu.be/eBPsaa0_RtQ`;

		await this.shardManager.broadcastEval(
			(client, context) => {
				const customClient = client as CustomClient;
				return customClient.setPresence(context.type, context.name, context.url);
			},
			{ context: { type, name, url } },
		);

		Logger.info(Logs.info.updatedServerCount.replaceAll(`{SERVER_COUNT}`, serverCount.toLocaleString()));

		for (const botSite of this.botSites) {
			try {
				const body = JSON.parse(botSite.body.replaceAll(`{{SERVER_COUNT}}`, serverCount.toString()));
				const res = await this.httpService.post(botSite.url, botSite.authorization, body);
				if (res.status >= 200 && res.status <= 299 === false) {
					throw res;
				}
			} catch (error) {
				Logger.error(Logs.error.updatedServerCountSite.replaceAll(`{BOT_SITE}`, botSite.name), error);
				continue;
			}

			Logger.info(Logs.info.updatedServerCountSite.replaceAll(`{BOT_SITE}`, botSite.name));
		}
	}
}
