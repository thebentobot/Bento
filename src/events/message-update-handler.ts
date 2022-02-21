import { EmbedAuthorData, EmbedFooterData, Message, MessageEmbed, PartialMessage, TextChannel } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';
import { EventHandler } from './event-handler.js';

export class MessageUpdateHandler implements EventHandler {
	public async process(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
		if (oldMessage === null || newMessage === null) return;
		if (oldMessage.author === null || newMessage.author === null) return;
		if (oldMessage.author.bot || newMessage.author.bot) return;

		if (oldMessage.content === newMessage.content) return;

		const log = await prisma.messageLog.findUnique({
			where: { guildID: BigInt(oldMessage.guild?.id as string) },
		});
		const messageLogChannel: TextChannel = oldMessage.client.channels.cache.get(`${log?.channel}`) as TextChannel;
		if (!messageLogChannel.permissionsFor(oldMessage.client.user?.id as string)?.has(`VIEW_CHANNEL`)) return;
		if (!messageLogChannel.permissionsFor(oldMessage.client.user?.id as string)?.has(`SEND_MESSAGES`)) return;
		const embedAuthorData: EmbedAuthorData = {
			name: `${oldMessage.member?.displayName} (${oldMessage.author.username}#${oldMessage.author.discriminator})`,
			iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }),
		};

		const embedFooterData: EmbedFooterData = {
			text: `Edited at`,
		};
		const embed = new MessageEmbed()
			.setAuthor(embedAuthorData)
			.setColor(`#FFF000`)
			.setDescription(
				`[Message](${oldMessage.url}) edited in <#${oldMessage.channel.id}>\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`,
			)
			.addField(`Channel ID`, oldMessage.channel.id)
			.addField(`Message ID`, oldMessage.id)
			.setFooter(embedFooterData)
			.setTimestamp(newMessage.createdAt);

		await MessageUtils.send(messageLogChannel, embed);
	}
}
