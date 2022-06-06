import { CommandInteraction, Message, PermissionString, User } from 'discord.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import { prisma } from '../../services/prisma.js';

export class RpsCommand implements Command {
	public name = `rps`;
	public slashDescription = `Play Rock, Paper, Scissors with ${config.botName}`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `rps`,
		description: `Play Rock, Paper, Scissors with ${config.botName}`,
		options: [
			{
				name: `weapon`,
				description: `Pick your weapon of choice`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: true,
				choices: [
					{
						name: `Rock`,
						value: `rock`,
					},
					{
						name: `Paper`,
						value: `paper`,
					},
					{
						name: `Scissors`,
						value: `scissors`,
					},
				],
			},
		],
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Play Rock 🪨, Paper 🧻, Scissors ✂️ with ${config.botName}.\nPick one of the options and see if you win.\n**Warning** ${config.botName} can get a bit sassy if they're winning hehe.`;
	public usage = `rps <rock, paper, scissors> | /rps <rock, paper, scissors>`;
	public website = `https://www.bentobot.xyz/commands#rps`;
	public category = `features`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const choice = intr.options.get(`weapon`)?.value as string;
		const user = intr.user;
		const command = await this.rpsCommand(choice, user);
		await InteractionUtils.send(intr, command);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const acceptedReplies = [`rock`, `paper`, `scissors`];
		const choice = args[0];
		if (!choice) {
			const guildData = await prisma.guild.findUnique({
				where: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					guildID: BigInt(msg.guild!.id),
				},
			});
			await MessageUtils.send(msg.channel, `How to play: \`${guildData?.prefix}rps <rock|paper|scissors>\``);
			return;
		}
		if (!acceptedReplies.includes(choice)) {
			await MessageUtils.send(msg.channel, `Only these responses are accepted: \`${acceptedReplies.join(`, `)}\``);
			return;
		}
		const user = msg.author;
		const command = await this.rpsCommand(choice, user);
		await MessageUtils.send(msg.channel, `${msg.author} ` + command);
		return;
	}

	private async rpsCommand(choice: string, user: User): Promise<string> {
		const acceptedReplies = [`rock`, `paper`, `scissors`];
		const bentoReplies = [`Rock 🪨`, `Paper 🧻`, `Scissors ✂️`];
		const random = Math.floor(Math.random() * acceptedReplies.length);
		const bentoResult = bentoReplies[random];
		const result = acceptedReplies[random];
		let message = ``;

		if (result === choice) {
			switch (choice) {
				case `rock`:
					{
						await prisma.rpsGame.upsert({
							create: {
								userID: BigInt(user.id),
								rockLosses: 0,
								rockWins: 0,
								rockTies: 1,
								paperLosses: 0,
								paperTies: 0,
								paperWins: 0,
								scissorWins: 0,
								scissorsLosses: 0,
								scissorsTies: 0,
							},
							update: {
								userID: BigInt(user.id),
								rockTies: {
									increment: 1,
								},
							},
							where: {
								userID: BigInt(user.id),
							},
						});
					}
					break;
				case `paper`:
					{
						await prisma.rpsGame.upsert({
							create: {
								userID: BigInt(user.id),
								rockLosses: 0,
								rockWins: 0,
								rockTies: 0,
								paperLosses: 0,
								paperTies: 1,
								paperWins: 0,
								scissorWins: 0,
								scissorsLosses: 0,
								scissorsTies: 0,
							},
							update: {
								userID: BigInt(user.id),
								paperTies: {
									increment: 1,
								},
							},
							where: {
								userID: BigInt(user.id),
							},
						});
					}
					break;
				case `scissors`: {
					{
						await prisma.rpsGame.upsert({
							create: {
								userID: BigInt(user.id),
								rockLosses: 0,
								rockWins: 0,
								rockTies: 0,
								paperLosses: 0,
								paperTies: 0,
								paperWins: 0,
								scissorWins: 0,
								scissorsLosses: 0,
								scissorsTies: 1,
							},
							update: {
								userID: BigInt(user.id),
								scissorsTies: {
									increment: 1,
								},
							},
							where: {
								userID: BigInt(user.id),
							},
						});
					}
				}
			}
			message = `Its a tie 👔! We had the same choice 😂`;
		}

		switch (choice) {
			case `rock`:
				{
					if (result === `paper`) {
						await prisma.rpsGame.upsert({
							create: {
								userID: BigInt(user.id),
								rockLosses: 1,
								rockWins: 0,
								rockTies: 0,
								paperLosses: 0,
								paperTies: 0,
								paperWins: 0,
								scissorWins: 0,
								scissorsLosses: 0,
								scissorsTies: 0,
							},
							update: {
								userID: BigInt(user.id),
								rockLosses: {
									increment: 1,
								},
							},
							where: {
								userID: BigInt(user.id),
							},
						});
						message = `I got ${bentoResult} I won! 🤣`;
					} else {
						await prisma.rpsGame.upsert({
							create: {
								userID: BigInt(user.id),
								rockLosses: 0,
								rockWins: 1,
								rockTies: 0,
								paperLosses: 0,
								paperTies: 0,
								paperWins: 0,
								scissorWins: 0,
								scissorsLosses: 0,
								scissorsTies: 0,
							},
							update: {
								userID: BigInt(user.id),
								rockWins: {
									increment: 1,
								},
							},
							where: {
								userID: BigInt(user.id),
							},
						});
						message = `I got ${bentoResult} You won! 😔`;
					}
				}
				break;
			case `paper`:
				{
					if (result === `scissors`) {
						await prisma.rpsGame.upsert({
							create: {
								userID: BigInt(user.id),
								rockLosses: 0,
								rockWins: 0,
								rockTies: 0,
								paperLosses: 1,
								paperTies: 0,
								paperWins: 0,
								scissorWins: 0,
								scissorsLosses: 0,
								scissorsTies: 0,
							},
							update: {
								userID: BigInt(user.id),
								paperLosses: {
									increment: 1,
								},
							},
							where: {
								userID: BigInt(user.id),
							},
						});
						message = `I got ${bentoResult} I won! 🤣`;
					} else {
						await prisma.rpsGame.upsert({
							create: {
								userID: BigInt(user.id),
								rockLosses: 0,
								rockWins: 0,
								rockTies: 0,
								paperLosses: 0,
								paperTies: 0,
								paperWins: 1,
								scissorWins: 0,
								scissorsLosses: 0,
								scissorsTies: 0,
							},
							update: {
								userID: BigInt(user.id),
								paperWins: {
									increment: 1,
								},
							},
							where: {
								userID: BigInt(user.id),
							},
						});
						message = `I got ${bentoResult} You won! 😔`;
					}
				}
				break;
			case `scissors`: {
				if (result === `rock`) {
					await prisma.rpsGame.upsert({
						create: {
							userID: BigInt(user.id),
							rockLosses: 0,
							rockWins: 0,
							rockTies: 0,
							paperLosses: 0,
							paperTies: 0,
							paperWins: 0,
							scissorWins: 0,
							scissorsLosses: 1,
							scissorsTies: 0,
						},
						update: {
							userID: BigInt(user.id),
							scissorsLosses: {
								increment: 1,
							},
						},
						where: {
							userID: BigInt(user.id),
						},
					});
					message = `I got ${bentoResult} I won! 🤣`;
				} else {
					await prisma.rpsGame.upsert({
						create: {
							userID: BigInt(user.id),
							rockLosses: 0,
							rockWins: 0,
							rockTies: 0,
							paperLosses: 0,
							paperTies: 0,
							paperWins: 0,
							scissorWins: 1,
							scissorsLosses: 0,
							scissorsTies: 0,
						},
						update: {
							userID: BigInt(user.id),
							scissorWins: {
								increment: 1,
							},
						},
						where: {
							userID: BigInt(user.id),
						},
					});
					message = `I got ${bentoResult} You won! 😔`;
				}
			}
		}

		return message;
	}
}
