import {
	Client,
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
	ButtonInteraction,
	CommandInteraction,
	PartialMessage,
	SelectMenuInteraction,
	Events,
	RESTEvents,
} from 'discord.js';
import { config as Config } from './config/config.js';
import { debug as Debug } from './config/debug.js';

import {
	GuildMemberUpdateHandler,
	UserUpdateHandler,
	ButtonHandler,
	MessageDeleteHandler,
	MessageUpdateHandler,
	CommandHandler,
	GuildJoinHandler,
	GuildLeaveHandler,
	MessageHandler,
	ReactionHandler,
	GuildMemberAddHandler,
	GuildMemberRemoveHandler,
	SelectMenuHandler,
} from './events';
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
		private buttonHandler: ButtonHandler,
		private reactionHandler: ReactionHandler,
		private jobService: JobService,
		private guildMemberAddHandler: GuildMemberAddHandler,
		private guildMemberRemoveHandler: GuildMemberRemoveHandler,
		private messageDeleteHandler: MessageDeleteHandler,
		private messageUpdateHandler: MessageUpdateHandler,
		private guildMemberUpdateHandler: GuildMemberUpdateHandler,
		private userUpdateHandler: UserUpdateHandler,
		private SelectMenuHandler: SelectMenuHandler,
	) {}

	public async start(): Promise<void> {
		this.registerListeners();
		await this.login(this.token);
	}

	private registerListeners(): void {
		this.client.on(Events.ClientReady, () => this.onReady());
		this.client.on(Events.ShardReady, (shardId: number, unavailableGuilds: Set<string> | undefined) =>
			this.onShardReady(shardId, unavailableGuilds),
		);
		this.client.on(Events.GuildCreate, (guild: Guild) => this.onGuildJoin(guild));
		this.client.on(Events.GuildDelete, (guild: Guild) => this.onGuildLeave(guild));
		this.client.on(Events.MessageCreate, (msg: Message) => this.onMessage(msg));
		this.client.on(Events.InteractionCreate, (intr: Interaction) => this.onInteraction(intr));
		this.client.on(
			Events.MessageReactionAdd,
			(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) =>
				this.onReaction(messageReaction, user),
		);
		this.client.rest.on(RESTEvents.RateLimited, (rateLimitData: RateLimitData) => this.onRateLimit(rateLimitData));
		this.client.on(Events.GuildMemberAdd, (member: GuildMember) => this.onGuildMemberAdd(member));
		this.client.on(Events.GuildMemberRemove, (member: GuildMember | PartialGuildMember) =>
			this.onGuildMemberRemove(member),
		);
		this.client.on(Events.MessageDelete, (message: Message | PartialMessage) => this.onMessageDelete(message));
		this.client.on(
			Events.MessageUpdate,
			(oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage) =>
				this.onMessageUpdate(oldMessage, newMessage),
		);
		this.client.on(Events.GuildMemberUpdate, (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) =>
			this.onGuildMemberUpdate(oldMember, newMember),
		);
		this.client.on(Events.UserUpdate, (oldUser: User | PartialUser, newUser: User) =>
			this.onUserUpdate(oldUser, newUser),
		);
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

		msg = (await PartialUtils.fillMessage(msg)) as Message;
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
		if (!this.ready || (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(intr.user.id))) {
			return;
		}

		if (intr instanceof CommandInteraction) {
			try {
				await this.commandHandler.processIntr(intr);
			} catch (error) {
				Logger.error(Logs.error.command, error);
			}
		} else if (intr instanceof ButtonInteraction) {
			try {
				await this.buttonHandler.process(intr, intr.message as Message);
			} catch (error) {
				Logger.error(Logs.error.button, error);
			}
		} else if (intr instanceof SelectMenuInteraction) {
			try {
				await this.SelectMenuHandler.process(intr, intr.message as Message);
			} catch (error) {
				Logger.error(Logs.error.selectMenu, error);
			}
		}
	}

	private async onReaction(
		msgReaction: MessageReaction | PartialMessageReaction,
		reactor: User | PartialUser,
	): Promise<void> {
		if (!this.ready || (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(reactor.id))) {
			return;
		}

		msgReaction = (await PartialUtils.fillReaction(msgReaction)) as MessageReaction;
		if (!msgReaction) {
			return;
		}

		reactor = (await PartialUtils.fillUser(reactor)) as User;
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
		if (rateLimitData.timeToReset >= Config.logging.rateLimit.minTimeout * 1000) {
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

	private async onMessageDelete(message: Message | PartialMessage): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.messageDeleteHandler.process(message);
		} catch (error) {
			Logger.error(Logs.error.messageDelete, error);
		}
	}

	private async onMessageUpdate(
		oldMessage: Message | PartialMessage,
		newMessage: Message | PartialMessage,
	): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.messageUpdateHandler.process(oldMessage, newMessage);
		} catch (error) {
			Logger.error(Logs.error.messageUpdate, error);
		}
	}

	private async onGuildMemberUpdate(
		oldMember: GuildMember | PartialGuildMember,
		newMember: GuildMember,
	): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.guildMemberUpdateHandler.process(oldMember, newMember);
		} catch (error) {
			Logger.error(Logs.error.guildMemberUpdate, error);
		}
	}

	private async onUserUpdate(oldUser: User | PartialUser, newUser: User): Promise<void> {
		if (!this.ready || Debug.dummyMode.enabled) {
			return;
		}

		try {
			await this.userUpdateHandler.process(oldUser, newUser);
		} catch (error) {
			Logger.error(Logs.error.userUpdate, error);
		}
	}
}
