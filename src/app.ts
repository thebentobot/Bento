import { ShardingManager } from 'discord.js';
import { Api } from './api.js';
import { config as Config } from './config/config.js';
import { debug as Debug } from './config/debug.js';
import { GuildsController, RootController, ShardsController } from './controllers/index.js';
import { Job, UpdateServerCountJob } from './jobs/index.js';
import { logs as Logs } from './lang/logs.js';
import { Manager } from './manager.js';
import { HttpService, JobService, Logger, MasterApiService } from './services/index.js';
import { MathUtils, ShardUtils } from './utils/index.js';

async function start(): Promise<void> {
	Logger.info(Logs.info.appStarted);

	// Dependencies
	const httpService = new HttpService();
	const masterApiService = new MasterApiService(httpService);
	if (Config.clustering.enabled) {
		await masterApiService.register();
	}

	// Sharding
	let shardList: number[];
	let totalShards: number;
	try {
		if (Config.clustering.enabled) {
			const resBody = await masterApiService.login();
			shardList = resBody.shardList;
			const requiredShards = await ShardUtils.requiredShardCount(Config.client.token);
			totalShards = Math.max(requiredShards, resBody.totalShards);
		} else {
			const recommendedShards = await ShardUtils.recommendedShardCount(
				Config.client.token,
				Config.sharding.serversPerShard,
			);
			shardList = MathUtils.range(0, recommendedShards);
			totalShards = recommendedShards;
		}
	} catch (error) {
		Logger.error(Logs.error.retrieveShards, error);
		return;
	}

	if (shardList.length === 0) {
		Logger.warn(Logs.warn.managerNoShards);
		return;
	}

	const shardManager = new ShardingManager(`dist/start.js`, {
		token: Config.client.token,
		mode: Debug.override.shardMode.enabled ? Debug.override.shardMode.value : `worker`,
		respawn: true,
		totalShards,
		shardList,
	});

	// Jobs
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore: Unreachable code error
	const jobs: Job[] = [
		Config.clustering.enabled ? undefined : new UpdateServerCountJob(shardManager, httpService),
		// TODO: Add new jobs here
	].filter(Boolean);

	const manager = new Manager(shardManager, new JobService(jobs));

	// API
	const guildsController = new GuildsController(shardManager);
	const shardsController = new ShardsController(shardManager);
	const rootController = new RootController();
	const api = new Api([guildsController, shardsController, rootController]);

	// Start
	await manager.start();
	await api.start();
	if (Config.clustering.enabled) {
		await masterApiService.ready();
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
process.on(`unhandledRejection`, (reason, _promise) => {
	Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch((error) => {
	Logger.error(Logs.error.unspecified, error);
});
