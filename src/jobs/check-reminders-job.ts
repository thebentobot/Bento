import { Job } from './job.js';
import { config as Config } from '../config/config.js';
import { Client, EmbedBuilder, ShardingManager } from 'discord.js';
import { CustomClient } from '../extensions/custom-client.js';
import { prisma } from '../services/prisma.js';
import { reminder } from '@prisma/client';
import { ClientUtils } from '../utils/client-utils.js';
import { MessageUtils } from '../utils/message-utils.js';
import { stylingUtils } from '../utils/index.js';

export class CheckRemindersJob implements Job {
	public name = `Check Reminders`;
	public log = Config.jobs.checkReminders.log;
	public schedule = Config.jobs.checkReminders.schedule;

	constructor(private client: Client) {}

	public async run(): Promise<void> {
		const remindersData: reminder[] = await prisma.$queryRaw`
            SELECT *
            FROM "reminder"
            WHERE "reminder".date < now()::timestamp at time zone 'utc';`;
		if (remindersData) {
			for (const reminder of remindersData) {
				const user = await ClientUtils.getUser(this.client, `${reminder.userID}`);
				if (user) {
					const embed = new EmbedBuilder()
						.setColor(`#${await stylingUtils.urlToColours(user.avatarURL({ extension: `png` }) as string)}`)
						.setTitle(`Reminder`)
						.setDescription(reminder.reminder);
					await MessageUtils.send(user, embed);
					await prisma.reminder.delete({
						where: {
							id: reminder.id,
						},
					});
				} else {
					await prisma.reminder.delete({
						where: {
							id: reminder.id,
						},
					});
				}
			}
		} else {
			return;
		}
	}
}
