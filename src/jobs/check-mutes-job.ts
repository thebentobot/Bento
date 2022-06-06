import { Job } from './job.js';
import { config as Config } from '../config/config.js';
import { EmbedAuthorData, EmbedFooterData, MessageEmbed, ShardingManager, TextChannel } from 'discord.js';
import { CustomClient } from '../extensions/custom-client.js';
import { prisma } from '../services/prisma.js';
import { mute } from '@prisma/client';
import { ClientUtils } from '../utils/client-utils.js';
import { MessageUtils } from '../utils/message-utils.js';

export class CheckMutesJob implements Job {
	public name = `Check Mutes`;
	public log = Config.jobs.checkMutes.log;
	public schedule = Config.jobs.checkMutes.schedule;

	constructor(private shardManager: ShardingManager) {}

	// this job is only for mutes that includes the mute role
	// time outs are handled by the guildmember.update event
	public async run(): Promise<void> {
		const muteData: mute[] = await prisma.$queryRaw`
        SELECT *
        FROM mute
        WHERE mute."muteEnd" < now()::timestamp at time zone  'utc' AND mute."MuteStatus" = true AND "muteEnd" is not null;`;
		if (muteData) {
			for (const unmute of muteData) {
				await this.shardManager.broadcastEval(async (client) => {
					const customClient = client as CustomClient;
					const guild = customClient.guilds.cache.get(`${unmute.guildID}`);
					if (guild) {
						const member = await ClientUtils.findMember(guild, `${unmute.userID}`);
						if (member) {
							const roleData = await prisma.muteRole.findUnique({
								where: {
									guildID: BigInt(guild.id),
								},
							});
							const role = guild.roles.cache.get(`${roleData?.roleID}`);
							if (role) {
								const logChannelData = await prisma.modLog.findUnique({
									where: {
										guildID: BigInt(guild.id),
									},
								});
								let logChannel: TextChannel | undefined = undefined;
								if (logChannelData) {
									logChannel = client.channels.cache.get(`${logChannelData.channel}`) as TextChannel;
								}
								const embedAuthorData: EmbedAuthorData = {
									name: `${member.user.username + `#` + member.user.discriminator} (userID: ${member.id})`,
									iconURL: member.displayAvatarURL({ dynamic: true }),
								};

								const embedFooterData: EmbedFooterData = {
									text: `Mute Case Number: ${unmute.muteCase}`,
								};
								const embed = new MessageEmbed()
									.setColor(`#00ff4a`)
									.setAuthor(embedAuthorData)
									.setThumbnail(member?.user.avatarURL() as string)
									.setTitle(
										`${
											member.nickname
												? `${member.nickname} (${member.user.username}#${member.user.discriminator})`
												: `${member.user.username}#${member.user.discriminator}`
										} was unmuted!`,
									)
									.setDescription(`**Reason for unmute**\nMute expired`)
									.addField(`Username`, member.user.username + `#` + member.user.discriminator)
									.addField(`User ID`, member.id)
									.addField(
										`Muted by`,
										guild?.members.cache.get(`${unmute.actor}`)?.nickname
											? `${guild?.members.cache.get(`${unmute.actor}`)?.nickname} (${
												guild?.members.cache.get(`${unmute.actor}`)?.user.username
											  }#${guild?.members.cache.get(`${unmute.actor}`)?.user.discriminator})`
											: `${guild?.members.cache.get(`${unmute.actor}`)?.user.username}#${
												guild?.members.cache.get(`${unmute.actor}`)?.user.discriminator
											  }`,
									)
									.addField(
										`Mute date`,
										`<t:${Math.round(unmute.date.getTime() / 1000)}:R> (<t:${Math.round(
											unmute.date.getTime() / 1000,
										)}:F>`,
									)
									.addField(
										`Original mute end date`,
										unmute.muteEnd !== null
											? `<t:${Math.round(unmute.muteEnd.getTime() / 1000)}:R> (<t:${Math.round(
												unmute.muteEnd.getTime() / 1000,
											  )}:F>`
											: `The mute was on indefinite time`,
									)
									.addField(`Reason for mute`, unmute.reason === null ? `No reason specified for mute` : unmute.reason)
									.addField(`Notes about the mute case`, unmute.note ? unmute.note : `No notes made for this mute case`)
									.setFooter(embedFooterData)
									.setTimestamp();
								if (logChannel !== undefined) {
									await MessageUtils.send(logChannel, embed);
									return;
								}
								await MessageUtils.send(
									await client.users.fetch(`${unmute.userID}`),
									`🙏You were automatically \`unmuted\` from **${guild?.name}**`,
								);
								await member.roles.remove(role);
								await prisma.mute.update({
									where: {
										muteCase: BigInt(unmute.muteCase),
									},
									data: {
										MuteStatus: false,
									},
								});
								return;
							} else {
								return;
							}
						} else {
							return;
						}
					} else {
						return;
					}
				});
			}
		} else {
			return;
		}
	}
}
