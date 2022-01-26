import {
	Client,
	Constants,
	Guild,
	GuildMember,
	Interaction,
	Message,
	MessageReaction,
	PartialGuildMember,
	PartialMessageReaction,
	PartialUser,
	RateLimitData,
	User,
} from 'discord.js';
import { config as Config } from './config/config.js';
import { debug as Debug } from './config/debug.js';

import { CommandHandler, GuildJoinHandler, GuildLeaveHandler, MessageHandler, ReactionHandler, GuildMemberAddHandler, GuildMemberRemoveHandler } from './events';
import { logs as Logs } from './lang/logs.js';
import { JobService, Logger } from './services/index.js';
import { PartialUtils } from './utils/index.js';

export class Bot {
	private ready = false;

	constructor(
		private token: string,
		private client: Client,
		private guildJoinHandler: GuildJoinHandler,
		private guildLeaveHandler: GuildLeaveHandler,
		private messageHandler: MessageHandler,
		private commandHandler: CommandHandler,
		private reactionHandler: ReactionHandler,
		private jobService: JobService,
		private guildMemberAddHandler: GuildMemberAddHandler,
		private guildMemberRemoveHandler: GuildMemberRemoveHandler
	) {}

	public async start(): Promise<void> {
		this.registerListeners();
		await this.login(this.token);
	}

	private registerListeners(): void {
		this.client.on(Constants.Events.CLIENT_READY, () => this.onReady());
		this.client.on(Constants.Events.SHARD_READY, (shardId: number, unavailableGuilds: Set<string> | undefined) =>
			this.onShardReady(shardId, unavailableGuilds),
		);
		this.client.on(Constants.Events.GUILD_CREATE, (guild: Guild) => this.onGuildJoin(guild));
		this.client.on(Constants.Events.GUILD_DELETE, (guild: Guild) => this.onGuildLeave(guild));
		this.client.on(Constants.Events.MESSAGE_CREATE, (msg: Message) => this.onMessage(msg));
		this.client.on(Constants.Events.INTERACTION_CREATE, (intr: Interaction) => this.onInteraction(intr));
		this.client.on(
			Constants.Events.MESSAGE_REACTION_ADD,
			(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) =>
				this.onReaction(messageReaction, user),
		);
		this.client.on(Constants.Events.RATE_LIMIT, (rateLimitData: RateLimitData) => this.onRateLimit(rateLimitData));
		this.client.on(Constants.Events.GUILD_MEMBER_ADD, (member: GuildMember) => this.onGuildMemberAdd(member));
		this.client.on(Constants.Events.GUILD_MEMBER_REMOVE, (member: GuildMember | PartialGuildMember) => this.onGuildMemberRemove(member));
	}

	private async login(token: string): Promise<void> {
		try {
			await this.client.login(token);
		} catch (error) {
			Logger.error(Logs.error.clientLogin, error);
			return;
		}
	}

	private async onReady(): Promise<void> {
		const userTag = this.client.user?.tag;
		Logger.info(Logs.info.clientLogin.replaceAll(`{USER_TAG}`, userTag as string));

		if (!Debug.dummyMode.enabled) {
			this.jobService.start();
		}

		this.ready = true;
		Logger.info(Logs.info.clientReady);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private onShardReady(shardId: number, _unavailableGuilds: Set<string> | undefined): void {
		Logger.setShardId(shardId);
	}

	private async onGuildJoin(guild: Guild): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.guildJoinHandler.process(guild);
		} catch (error) {
			Logger.error(Logs.error.guildJoin, error);
		}
	}

	private async onGuildLeave(guild: Guild): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.guildLeaveHandler.process(guild);
		} catch (error) {
			Logger.error(Logs.error.guildLeave, error);
		}
	}

	private async onMessage(msg: Message): Promise<void> {
		if (!this.ready || (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(msg.author.id))) {
			return;
		}

		msg = await PartialUtils.fillMessage(msg) as Message;
		if (!msg) {
			return;
		}

		try {
			await this.messageHandler.process(msg);
		} catch (error) {
			Logger.error(Logs.error.message, error);
		}
	}

	private async onInteraction(intr: Interaction): Promise<void> {
		if (
			!intr.isCommand() ||
			!this.ready ||
			(Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(intr.user.id))
		) {
			return;
		}

		try {
			await this.commandHandler.processIntr(intr);
		} catch (error) {
			Logger.error(Logs.error.command, error);
		}
	}

	private async onReaction(
		msgReaction: MessageReaction | PartialMessageReaction,
		reactor: User | PartialUser,
	): Promise<void> {
		if (!this.ready || (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(reactor.id))) {
			return;
		}

		msgReaction = await PartialUtils.fillReaction(msgReaction) as MessageReaction;
		if (!msgReaction) {
			return;
		}

		reactor = await PartialUtils.fillUser(reactor) as User;
		if (!reactor) {
			return;
		}

		try {
			await this.reactionHandler.process(msgReaction, msgReaction.message as Message, reactor);
		} catch (error) {
			Logger.error(Logs.error.reaction, error);
		}
	}

	private async onRateLimit(rateLimitData: RateLimitData): Promise<void> {
		if (rateLimitData.timeout >= Config.logging.rateLimit.minTimeout * 1000) {
			Logger.error(Logs.error.apiRateLimit, rateLimitData);
		}
	}

	private async onGuildMemberAdd(member: GuildMember): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.guildMemberAddHandler.process(member);
		} catch (error) {
			Logger.error(Logs.error.guildMemberAdd, error);
		}
	}

	private async onGuildMemberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.guildMemberRemoveHandler.process(member);
		} catch (error) {
			Logger.error(Logs.error.guildMemberRemove, error);
		}
	}
}
