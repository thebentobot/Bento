import { Job } from './job.js';
import { config as Config } from '../config/config.js';
import { ShardingManager } from 'discord.js';
import { prisma } from '../services/prisma.js';
import { gfycatPosts } from '@prisma/client';

export class CheckRemindersJob implements Job {
	public name = `Delete expired gfycat posts`;
	public log = Config.jobs.deleteExpiredGfycatPosts.log;
	public schedule = Config.jobs.deleteExpiredGfycatPosts.schedule;

	constructor(private shardManager: ShardingManager) {}

	public async run(): Promise<void> {
		const gfycatPostsData: gfycatPosts[] = await prisma.$queryRaw`
            SELECT *
            FROM "gfycatPosts"
            WHERE "gfycatPosts".date < now()::timestamp at time zone 'utc';`;
		if (gfycatPostsData) {
			for (const gfycatPost of gfycatPostsData) {
				await prisma.gfycatPosts.delete({
					where: {
						id: gfycatPost.id
					}
				});
			}
		} else {
			return;
		}
	}
}
