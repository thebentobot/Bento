import { CommandInteraction, Message, EmbedBuilder, PermissionsString, escapeMarkdown } from 'discord.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { EventData } from '../../models/internal-models.js';
import { CommandUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import { prisma } from '../../services/prisma.js';
import { DateTime, DurationObjectUnits } from 'luxon';

const momentTimeUnitBases = [
	`year`,
	`years`,
	`y`,
	`month`,
	`months`,
	`M`,
	`week`,
	`weeks`,
	`w`,
	`day`,
	`days`,
	`d`,
	`hour`,
	`hours`,
	`h`,
	`minute`,
	`minutes`,
	`m`,
	`second`,
	`seconds`,
	`s`,
	`millisecond`,
	`milliseconds`,
	`ms`,
];

export class RemindCommand implements Command {
	public name = `remind`;
	public aliases = [`reminder`];
	public slashDescription = `Get a reminder from ${config.botName}`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `remind`,
		description: this.slashDescription,
		/* you can add years, months, days, hours and minutes */
		// a sub command that directly schedules by date
		options: [
			{
				name: `input`,
				description: `What you're asking ${config.botName} about`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: true,
			},
		],
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Create reminders and you will receive a message reminder from Bento at your desired time.\nYou can either use time and say remind me in a day, or use schedule to specify a specific time. Use list to see a list of your reminders.`;
	public usage = `**reminder time <amount of time> <timeframe> <reminder>** E.g. reminder time 1 day eat cake\n**reminder schedule <DD-MM-YYYY> <HH:mm> <timezone offset> <reminder>** E.g. reminder schedule 25-11-2021 08:00 +02:00 eat cake\n**remind list** to see a list of your reminders | /remind`;
	public website = `https://www.bentobot.xyz/commands#remind`;
	public category = `user`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = this.remindCommand();
		const embed = new EmbedBuilder()
			.setColor(`#${await stylingUtils.urlToColours(intr.client.user?.avatarURL({ extension: `png` }) as string)}`)
			.setDescription(
				`${intr.user} **asked:** ${intr.options.get(`input`)?.value}\n${intr.client.user} **answers:** ${command}`,
			);
		await InteractionUtils.send(intr, embed);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<Message | void> {
		const guildData = await prisma.guild.findUnique({
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			where: { guildID: BigInt(msg.guild!.id) },
		});

		if (args[0] === `time`) {
			return remindTime(msg, args[1], args[2], args.slice(3).join(` `));
		} else if (args[0] === `schedule`) {
			return remindSchedule(msg, args[1], args[2], args[3], args.slice(4).join(` `));
		} else if (args[0] === `list`) {
			return remindList(msg);
		} else if (args[0]) {
			return msg.channel.send(
				`Invalid reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
			);
		} else {
			return MessageUtils.send(
				msg.channel,
				`If you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
			);
		}

		async function remindTime(message: Message, amountOfTime: string, timeframe: string, reminder?: string) {
			try {
				if (!amountOfTime) {
					return MessageUtils.send(
						message.channel,
						`You haven't specified the amount of time.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					);
				}

				if (!timeframe) {
					return MessageUtils.send(
						message.channel,
						`You haven't specified the timeframe after ${amountOfTime}.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					);
				}

				if (!momentTimeUnitBases.includes(timeframe)) {
					return MessageUtils.send(
						message.channel,
						`Your specified timeframe \`${timeframe}\` is invalid.\nUse the help command with reminder to check options when using the reminder command.`,
					);
				}

				if (!reminder) {
					return MessageUtils.send(msg.channel, `Please set a reminder`);
				}

				if (reminder) {
					if (reminder.length > 2000) {
						return MessageUtils.send(msg.channel, `Your reminder is too long. Maximum is 2000 characters.`);
					}
				}

				let files: string | undefined;
				let text: string | undefined;
				let reminderContent: string | undefined;

				if ([...message.attachments.values()].length) {
					const getUrl = [...message.attachments.values()];
					files = getUrl[0] ? getUrl.join(`, `) : ``;
				}

				if (reminder) {
					text = reminder;
				}

				if (files && text) {
					reminderContent = `${escapeMarkdown(text)}\n${files}`;
				} else if (text && !files) {
					reminderContent = escapeMarkdown(text);
				} else if (!text && files) {
					reminderContent = files;
				} else if (!text && !files) {
					return MessageUtils.send(msg.channel, `You didn't attach any content for your reminder`);
				}

				if ((reminderContent?.length as number) > 2000) {
					return MessageUtils.send(msg.channel, `Your tag content is too long for me to be able to send it, sorry 😔`);
				}

				const remindDate = DateTime.fromJSDate(new Date())
					.plus({ [timeframe as string]: amountOfTime })
					.toJSDate();
				const now: Date = new Date();
				const diff: number = remindDate.getTime() - now.getTime();
				if (diff < 10000) {
					return MessageUtils.send(msg.channel, `Your reminder must be more than 10 seconds into the future`);
				}

				if (diff > 157784760000) {
					return MessageUtils.send(msg.channel, `Your reminder must be less than 5 years into the future`);
				}

				// create or upsert? hellere upsert, men så skal vi fetch data først lol, pga. unique id shit grr
				const reminderData = await prisma.reminder.create({
					data: {
						reminder: reminder,
						date: remindDate,
						userID: BigInt(message.author.id),
					},
				});

				if (reminderData[1] === false) {
					return message.channel.send(`Your already have a reminder set with the following: \`${reminder}\``);
				}

				try {
					await client.users.cache
						.get(message.author.id)
						?.send(
							`Your reminder has been set!\n${capitalize(
								moment(now).to(remindDate),
							)} you will be reminded to \`${reminder}\`.\nDate for reminder: approx. <t:${moment(remindDate).format(
								`X`,
							)}:F>`,
						);
					return await message.channel.send(`Your reminder has been set.`);
				} catch {
					await remindDB.destroy({
						where: {
							userID: message.author.id,
							reminder: reminder,
							date: remindDate,
						},
					});
					return await message.channel.send(
						`Reminder hasn't been set, because I can't send DM's to you.\nPlease check your privacy settings and try again.`,
					);
				}
			} catch (err) {
				console.log(`Error at reminder.ts' time function, server ${message.guild?.id}\n\n${err}`);
			}
		}

		async function remindSchedule(message: Message, date: string, time: string, utc: string, reminder: string) {
			try {
				if (!date) {
					return message.channel.send(
						`You haven't specified the date for your reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					);
				}

				if (!time) {
					return message.channel.send(
						`You haven't specified the time for your reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					);
				}

				if (!utc) {
					return message.channel.send(
						`You haven't specified the timezone for your reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					);
				}

				if (reminder) {
					if (reminder.length > 2000) {
						return message.channel.send(`Your reminder is too long. Maximum is 2000 characters.`);
					}
				}

				let files: string | undefined;
				let text: string | undefined;
				let reminderContent: string | undefined;

				if (message.attachments.array() !== undefined) {
					const getUrl = message.attachments.array();
					files = getUrl[0] ? getUrl.join(`, `) : ``;
				}

				if (reminder) {
					text = reminder;
				}

				if (files && text) {
					reminderContent = `${Util.escapeMarkdown(text)}\n${files}`;
				} else if (text && !files) {
					reminderContent = Util.escapeMarkdown(text);
				} else if (!text && files) {
					reminderContent = files;
				} else if (!text && !files) {
					return message.channel.send(`You didn't attach any content for your reminder`);
				}

				if ((reminderContent?.length as number) > 2000) {
					return message.channel.send(`Your tag content is too long for me to be able to send it, sorry 😔`);
				}

				const remindDateGathered = `${date} ${time} ${utc}`;

				if (moment(remindDateGathered, `DD-MM-YYYY HH:mm Z`, true).isValid() === false) {
					return message.channel.send(
						`You need to specify a valid date to create a scheduled reminder. The format is DD-MM-YYYY HH:mm Z.\nE.g. \`25-11-2021 08:00 +02:00\``,
					);
				}

				const remindDate = moment.utc(remindDateGathered, `DD-MM-YYYY HH:mm Z`).toDate();
				const now: Date = new Date(moment().format());
				if (remindDate.getTime() < now.getTime())
					return message.channel.send(`Your reminder date has already been passed.`);
				const diff: number = remindDate.getTime() - now.getTime();
				if (diff < 10000) {
					return message.channel.send(`Your reminder must be scheduled to more than 10 seconds into the future`);
				}

				if (diff > 157784760000) {
					return message.channel.send(`Your reminder must be scheduled to less than 5 years into the future`);
				}

				const reminderAttr: reminderCreationAttributes = {
					userID: BigInt(message.author.id),
					reminder: reminderContent as string,
					date: remindDate,
				};

				const reminderData = (await remindDB
					.findOrCreate({
						raw: true,
						where: { userID: message.author.id, reminder: reminder },
						defaults: reminderAttr,
					})
					.catch(console.error)) as [remindDB, boolean];

				if (reminderData[1] === false) {
					return message.channel.send(`Your already have a reminder set with the following: \`${reminder}\``);
				}

				try {
					await client.users.cache
						.get(message.author.id)
						?.send(
							`Your reminder has been set!\n${capitalize(
								moment(now).to(remindDate),
							)} you will be reminded to \`${reminder}\`.\nDate for reminder: approx. <t:${moment(remindDate).format(
								`X`,
							)}:F>`,
						);
					return await message.channel.send(`Your reminder has been set.`);
				} catch {
					await remindDB.destroy({
						where: {
							userID: message.author.id,
							reminder: reminder,
							date: remindDate,
						},
					});
					return await message.channel.send(
						`Reminder hasn't been set, because I can't send DM's to you.\nPlease check your privacy settings and try again.`,
					);
				}
			} catch (err) {
				console.log(`Error at reminder.ts' schedule function, server ${message.guild?.id}\n\n${err}`);
			}
		}

		async function remindList(message: Message) {
			try {
				const reminderData = await remindDB.findAll({
					raw: true,
					where: { userID: message.author.id },
					order: [[`date`, `DESC`]],
				});

				const now: Date = new Date();

				if (!reminderData.length) {
					return message.channel.send(
						`You haven't set any reminders.\nUse \`${guildData?.prefix}help reminder\` if you need help with setting a reminder`,
					);
				}

				const embeds = await generateCaseEmbedding(reminderData);
				try {
					embeds.forEach(async (embed) => await client.users.cache.get(message.author.id)?.send(embed));
				} catch (err) {
					return message.channel.send(
						`Reminder list hasn't been sent, because I can't send DM's to you.\nPlease check your privacy settings and try again.`,
					);
				}

				// eslint-disable-next-line no-inner-declarations
				async function generateCaseEmbedding(input: remindDB[]) {
					const embeds = [];
					for (let i = 0; i < input.length; i += 1) {
						const current = input[i];

						const embed = new MessageEmbed();
						embed.setAuthor(`Reminder`, client.user?.avatarURL({ format: `png` }) as string);
						embed.setColor(`${await urlToColours(message.author.avatarURL({ format: `png` }) as string)}`);
						embed.setDescription(`${current.reminder}\n\nRemind Date: <t:${moment(current.date).format(`X`)}:R>`);
						embed.setTitle(`${capitalize(moment(now).to(current.date))}`);
						embed.setThumbnail(
							message.author.avatarURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						);
						embeds.push(embed);
					}
					return embeds;
				}
			} catch (err) {
				console.log(`Error at reminder.ts' schedule function, server ${message.guild?.id}\n\n${err}`);
			}
		}
	}
	// solely executeIntr() no msg shit
	private remindCommand(): string {
		const answers = CommandUtils.ball8Answers();
		return answers[Math.floor(Math.random() * answers.length)];
	}
}
