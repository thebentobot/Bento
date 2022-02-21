import { ActivityType, ShardingManager } from 'discord.js';
import { Request, Response, Router } from 'express';
import router from 'express-promise-router';
import { config as Config } from '../config/config.js';

import { CustomClient } from '../extensions/index.js';
import { logs as Logs } from '../lang/logs.js';
import { mapClass } from '../middleware/index.js';
import { GetShardsResponse, SetShardPresencesRequest, ShardInfo, ShardStats } from '../models/cluster-api/index.js';
import { Logger } from '../services/index.js';
import { Controller } from './controller.js';

export class ShardsController implements Controller {
	public path = `/shards`;
	public router: Router = router();
	public authToken: string = Config.api.secret;

	constructor(private shardManager: ShardingManager) {}

	public register(): void {
		this.router.get(`/`, (req, res) => this.getShards(req, res));
		this.router.put(`/presence`, mapClass(SetShardPresencesRequest), (req, res) => this.setShardPresences(req, res));
	}

	private async getShards(_req: Request, res: Response): Promise<void> {
		const shardDatas = await Promise.all(
			this.shardManager.shards.map(async (shard) => {
				const shardInfo: ShardInfo = {
					id: shard.id,
					ready: shard.ready,
					error: false,
				};

				try {
					const uptime = (await shard.fetchClientValue(`uptime`)) as number;
					shardInfo.uptimeSecs = Math.floor(uptime / 1000);
				} catch (error) {
					Logger.error(Logs.error.managerShardInfo, error);
					shardInfo.error = true;
				}

				return shardInfo;
			}),
		);

		const stats: ShardStats = {
			shardCount: this.shardManager.shards.size,
			uptimeSecs: Math.floor(process.uptime()),
		};

		const resBody: GetShardsResponse = {
			shards: shardDatas,
			stats,
		};
		res.status(200).json(resBody);
	}

	private async setShardPresences(_req: Request, res: Response): Promise<void> {
		const reqBody: SetShardPresencesRequest = res.locals.input;

		await this.shardManager.broadcastEval(
			(client, context) => {
				const customClient = client as CustomClient;
				return customClient.setPresence(context.type as ActivityType, context.name as string, context.url as string);
			},
			{ context: { type: reqBody.type, name: reqBody.name, url: reqBody.url } },
		);

		res.sendStatus(200);
	}
}
