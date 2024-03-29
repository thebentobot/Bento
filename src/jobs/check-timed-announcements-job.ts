import { Job } from './job.js';
import { config as Config } from '../config/config.js';
import { Client, Guild, ShardingManager } from 'discord.js';
import { CustomClient } from '../extensions/custom-client.js';
import { prisma } from '../services/prisma.js';
import { announcementTime } from '@prisma/client';
import { ClientUtils } from '../utils/client-utils.js';
import { MessageUtils } from '../utils/message-utils.js';
import { DateTime, Duration, DurationLikeObject } from 'luxon';

export class CheckTimedAnnouncementsJob implements Job {
	public name = `Check Timed Announcements`;
	public log = Config.jobs.checkTimedAnnouncements.log;
	public schedule = Config.jobs.checkTimedAnnouncements.schedule;

	constructor(private client: Client) {}

	public async run(): Promise<void> {
		const timedAnnouncementsData = await prisma.announcementTime.findMany({
			where: {
				date: {
					lt: new Date(),
				},
			},
		});
		if (timedAnnouncementsData) {
			for (const announcement of timedAnnouncementsData) {
				const guild = this.client.guilds.cache.get(`${announcement.guildID}`);
				if (guild) {
					const channel = await ClientUtils.findTextChannel(guild, `${announcement.channelID}`);
					if (channel) {
						await MessageUtils.send(channel, announcement.message);
						let timeframe: DurationLikeObject;
						if (announcement.timeframe === `year` || `years` || `y`) {
							timeframe = { years: announcement.amountOfTime };
						} else if (announcement.timeframe === `month` || `months` || `M`) {
							timeframe = { months: announcement.amountOfTime };
						} else if (announcement.timeframe === `week` || `weeks` || `w`) {
							timeframe = { weeks: announcement.amountOfTime };
						} else if (announcement.timeframe === `day` || `days` || `d`) {
							timeframe = { days: announcement.amountOfTime };
						} else if (announcement.timeframe === `hour` || `hours` || `h`) {
							timeframe = { hours: announcement.amountOfTime };
						} else if (announcement.timeframe === `minute` || `minutes` || `m`) {
							timeframe = { minutes: announcement.amountOfTime };
						} else if (announcement.timeframe === `second` || `seconds` || `s`) {
							timeframe = { minutes: announcement.amountOfTime };
						} else {
							return;
						}
						await prisma.announcementTime.update({
							where: {
								id: announcement.id,
							},
							data: {
								date: DateTime.fromJSDate(announcement.date).plus(Duration.fromObject(timeframe)).toJSDate(),
							},
						});
						return;
					} else {
						await prisma.announcementTime.delete({
							where: {
								id: announcement.id,
							},
						});
						return;
					}
				} else {
					await prisma.announcementTime.delete({
						where: {
							id: announcement.id,
						},
					});
					return;
				}
			}
		} else {
			return;
		}
	}
}
