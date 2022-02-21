import { Shard, ShardingManager } from 'discord.js';
import { config as Config } from './config/config.js';
import { debug as Debug } from './config/debug.js';
import { logs as Logs } from './lang/logs.js';

import { JobService, Logger } from './services/index.js';

export class Manager {
	constructor(private shardManager: ShardingManager, private jobService: JobService) {}

	public async start(): Promise<void> {
		this.registerListeners();

		const shardList = this.shardManager.shardList as number[];

		try {
			Logger.info(
				Logs.info.managerSpawningShards
					.replaceAll(`{SHARD_COUNT}`, shardList.length.toLocaleString())
					.replaceAll(`{SHARD_LIST}`, shardList.join(`, `)),
			);
			await this.shardManager.spawn({
				amount: this.shardManager.totalShards,
				delay: Config.sharding.spawnDelay * 1000,
				timeout: Config.sharding.spawnTimeout * 1000,
			});
			Logger.info(Logs.info.managerAllShardsSpawned);
		} catch (error) {
			Logger.error(Logs.error.managerSpawningShards, error);
			return;
		}

		if (Debug.dummyMode.enabled) {
			return;
		}

		this.jobService.start();
	}

	private registerListeners(): void {
		this.shardManager.on(`shardCreate`, (shard) => this.onShardCreate(shard));
	}

	private onShardCreate(shard: Shard): void {
		Logger.info(Logs.info.managerLaunchedShard.replaceAll(`{SHARD_ID}`, shard.id.toString()));
	}
}
