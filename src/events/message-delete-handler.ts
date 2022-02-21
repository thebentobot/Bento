import { EmbedAuthorData, EmbedFooterData, Message, MessageEmbed, PartialMessage, TextChannel } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';
import { EventHandler } from './event-handler.js';

export class MessageDeleteHandler implements EventHandler {
	public async process(message: Message | PartialMessage): Promise<void> {
		if (message === null) return;
		if (message.author === null) return;
		if (message.author.bot) return;

		const log = await prisma.messageLog.findUnique({
			where: { guildID: BigInt(message.guild?.id as string) },
		});
		const messageLogChannel: TextChannel = message.client.channels.cache.get(`${log?.channel}`) as TextChannel;
		if (!messageLogChannel.permissionsFor(message.client.user?.id as string)?.has(`VIEW_CHANNEL`)) return;
		if (!messageLogChannel.permissionsFor(message.client.user?.id as string)?.has(`SEND_MESSAGES`)) return;
		const embedAuthorData: EmbedAuthorData = {
			name: `${message.member?.displayName} (${message.author.username}#${message.author.discriminator})`,
			iconURL: message.author.displayAvatarURL({ dynamic: true }),
		};

		const embedFooterData: EmbedFooterData = {
			text: `Deleted at`,
		};
		const embed = new MessageEmbed()
			.setAuthor(embedAuthorData)
			.setColor(`#FF2D00`)
			.setDescription(`Message deleted in <#${message.channel.id}>\n**Deleted message:**\n${message.content}`)
			.addField(`Channel ID`, message.channel.id)
			.addField(`Message ID`, message.id)
			.setFooter(embedFooterData)
			.setTimestamp(message.createdAt);

		await MessageUtils.send(messageLogChannel, embed);
	}
}
