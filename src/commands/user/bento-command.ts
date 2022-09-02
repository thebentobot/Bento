import { CommandInteraction, EmbedBuilder, GuildMember, Message, PermissionsString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { prisma } from '../../services/prisma.js';
import { DateTime, Interval } from 'luxon';
import { botColours } from '../../utils/styling-utils.js';

export class BentoCommand implements Command {
	public name = `bento`;
	public aliases = [`bentobox`, `🍱`];
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Give a Bento Box 🍱 to your friend every 12th hour :D.\nIf you write/use the command after handing out a Bento, it shows when you can give a Bento Box 🍱 again.`;
	public slashDescription = `Give your friend a Bento Box`;
	public commandType = CommandType.Both;
	public usage = `bento [<user>] | /bento`;
	public website = `https://www.bentobot.xyz/commands#bento`;
	public category = `user`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `bento`,
		description: this.slashDescription,
		options: [
			{
				name: `serve`,
				description: `Serve your friend a Bento Box`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `friend`,
						description: `Your friend to receive a Bento Box`,
						type: ApplicationCommandOptionType.User.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `status`,
				description: `Check when you can serve Bentos again`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		let cmd: EmbedBuilder | string = ``;
		if (intr.options.data[0].name === `serve`) {
			cmd = await this.giveBento(intr, intr.options.get(`friend`, true).member as GuildMember);
		}
		if (intr.options.data[0].name === `status`) {
			cmd = await this.checkBento(intr);
		}
		await InteractionUtils.send(intr, cmd);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		await MessageUtils.send(msg.channel, `Yay message commands works again.\nBento message command coming soon™️`);
		return;
	}

	private async giveBento(intr: CommandInteraction, member: GuildMember): Promise<EmbedBuilder> {
		if (member.user.bot)
			return new EmbedBuilder()
				.setColor(botColours.error)
				.setDescription(`Sorry, Discord bots doesn't like Bento Boxes 😭`);
		if (member.user.id === intr.user.id)
			return new EmbedBuilder()
				.setColor(botColours.error)
				.setDescription(`You're supposed to serve a Bento Box 🍱 to someone else, not yourself 🤨`);
		const bentoServerData = await prisma.bento.findUnique({
			where: {
				userID: BigInt(intr.user.id),
			},
		});
		let then: DateTime;
		const now = DateTime.now();
		if (bentoServerData !== null) {
			then = DateTime.fromJSDate(bentoServerData.bentoDate);
		} else {
			then = DateTime.now().minus({ hours: 12 });
		}
		const diff = Interval.fromDateTimes(then, now);
		if (diff.length(`hours`) < 12) {
			return new EmbedBuilder()
				.setColor(botColours.bento)
				.setTitle(`Sorry 😔`)
				.setDescription(
					`<t:${Math.round(
						then.plus({ hours: 12 }).toSeconds().valueOf(),
					)}:R> you can serve a Bento Box 🍱 to a friend again`,
				);
		} else {
			const bentoServeUpsert = await prisma.bento.upsert({
				where: {
					userID: BigInt(intr.user.id),
				},
				update: {
					bentoDate: new Date(),
				},
				create: {
					userID: BigInt(intr.user.id),
					bento: 0,
					bentoDate: new Date(),
				},
			});
			const patreonData = await prisma.patreon.findUnique({
				where: {
					userID: BigInt(member.user.id),
				},
			});
			let incrementValue = 1;
			let bentoReceiverType = ``;
			if (patreonData === null) {
				incrementValue = 1;
				bentoReceiverType = `${member.displayName}`;
			} else if (patreonData.follower) {
				incrementValue = 2;
				bentoReceiverType = `🌟 Official Patreon Bento 🍱 Follower 🌟 ${member}`;
			} else if (patreonData.enthusiast) {
				incrementValue = 3;
				bentoReceiverType = `🌟 Official Patreon Bento 🍱 Enthusiast 🌟 ${member}`;
			} else if (patreonData.disciple) {
				incrementValue = 4;
				bentoReceiverType = `🌟 Official Patreon Bento 🍱 Disciple 🌟 ${member}`;
			} else if (patreonData.sponsor) {
				incrementValue = 5;
				bentoReceiverType = `🌟 Official Patreon Bento 🍱 Sponsor 🌟 ${member}`;
			}
			const bentoReceiver = await prisma.bento.upsert({
				where: {
					userID: BigInt(member.user.id),
				},
				update: {
					bento: {
						increment: incrementValue,
					},
				},
				create: {
					userID: BigInt(member.user.id),
					bento: incrementValue,
					bentoDate: new Date(),
				},
			});
			return new EmbedBuilder()
				.setColor(botColours.bento)
				.setDescription(
					`${intr.user} just gave **${incrementValue} Bento ${
						incrementValue > 1 ? `Boxes` : `Box`
					}** to ${bentoReceiverType}\n${member} has received **${bentoReceiver.bento} ${
						bentoReceiver.bento > 1 ? `Bento Boxes` : `Bento Box`
					}**🍱 over time 😋\n${intr.user} can serve a Bento Box again <t:${Math.round(
						DateTime.fromJSDate(bentoServeUpsert.bentoDate).plus({ hours: 12 }).toSeconds().valueOf(),
					)}:R>`,
				);
		}
	}

	private async checkBento(intr: CommandInteraction): Promise<EmbedBuilder> {
		const bentoServerData = await prisma.bento.findUnique({
			where: {
				userID: BigInt(intr.user.id),
			},
		});
		if (bentoServerData === null) {
			return new EmbedBuilder()
				.setColor(botColours.bento)
				.setDescription(
					`You've never served a Bento to someone before 😳\nTry it! Try to serve a Bento Box 🍱 to a friend, I'm sure they'll be happy ☺️`,
				);
		} else {
			const then = DateTime.fromJSDate(bentoServerData.bentoDate);
			const now = DateTime.now();
			const diff = Interval.fromDateTimes(then, now);
			if (diff.length(`hours`) < 12) {
				return new EmbedBuilder()
					.setColor(botColours.bento)
					.setTitle(`Sorry 😔`)
					.setDescription(
						`<t:${Math.round(
							then.plus({ hours: 12 }).toSeconds().valueOf(),
						)}:R> you can serve a Bento Box 🍱 to a friend again`,
					);
			} else {
				return new EmbedBuilder()
					.setColor(botColours.bento)
					.setTitle(`Ayy!`)
					.setDescription(`You can serve a friend a Bento Box 🍱 again 😋\nGo make someone's day!`);
			}
		}
	}
}
