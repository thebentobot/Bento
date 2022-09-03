import { Job } from './job.js';
import { config as Config } from '../config/config.js';
import { Client, ShardingManager } from 'discord.js';
import { CustomClient } from '../extensions/custom-client.js';
import { prisma } from '../services/prisma.js';
import { announcementSchedule } from '@prisma/client';
import { ClientUtils } from '../utils/client-utils.js';
import { MessageUtils } from '../utils/message-utils.js';

export class CheckScheduledAnnouncementsJob implements Job {
	public name = `Check Scheduled Announcements`;
	public log = Config.jobs.checkScheduledAnnouncements.log;
	public schedule = Config.jobs.checkScheduledAnnouncements.schedule;

	constructor(private client: Client) {}

	public async run(): Promise<void> {
		const scheduledAnnouncementsData = await prisma.announcementSchedule.findMany({
			where: {
				date: {
					lt: new Date(),
				},
			},
		});
		if (scheduledAnnouncementsData) {
			for (const announcement of scheduledAnnouncementsData) {
				const guild = this.client.guilds.cache.get(`${announcement.guildID}`);
				if (guild) {
					const channel = await ClientUtils.findTextChannel(guild, `${announcement.channelID}`);
					if (channel) {
						await MessageUtils.send(channel, announcement.message);
						await prisma.announcementSchedule.delete({
							where: {
								id: announcement.id,
							},
						});
						return;
					} else {
						await prisma.announcementSchedule.delete({
							where: {
								id: announcement.id,
							},
						});
						return;
					}
				} else {
					await prisma.announcementSchedule.delete({
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
