import { Job } from './job.js';
import { config as Config } from '../config/config.js';
import { Client } from 'discord.js';
import { prisma } from '../services/prisma.js';
import { CommandUtils } from '../utils/index.js';

export class UpdateServerMemberCountJob implements Job {
	public name = `Update server membercount`;
	public log = Config.jobs.updateServerMemberCount.log;
	public schedule = Config.jobs.updateServerMemberCount.schedule;

	constructor(private client: Client) {}

	public async run(): Promise<void> {
		const guildsData = await prisma.guild.findMany();
		for (const guild of guildsData) {
			const getGuild = await this.client.guilds.fetch(BigInt(guild.guildID).toString());
			if (getGuild) {
				await prisma.guild.update({
					where: {
						guildID: BigInt(guild.guildID),
					},
					data: {
						memberCount: getGuild.memberCount,
						icon: getGuild.iconURL({ forceStatic: false, extension: `webp` }),
					},
				});
				// 3 seconds
				await CommandUtils.sleep(3000);
				return;
			} else {
				/*
				await prisma.guild.delete({
					where: {
						guildID: BigInt(guild.guildID),
					},
				});
				await CommandUtils.sleep(3000);
                */
				return;
			}
		}
	}
}
