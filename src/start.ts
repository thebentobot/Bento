import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/rest/v9';
import { Options } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();
import { Bot } from './bot.js';
import { Button } from './buttons/index.js';
import { 
	EightBallCommand,
	DogCommand,
	CatCommand, 
	Command, 
	DevCommand, 
	HelpCommand, 
	LinkCommand,
	ChooseCommand,
	RollCommand,
	MemberCommand,
	UserCommand,
	AvatarCommand,
	WhoIsCommand,
	ServerCommand
} from './commands/index.js';
import { config as Config } from './config/config.js';
import {
	CommandHandler,
	GuildJoinHandler,
	GuildLeaveHandler,
	GuildMemberAddHandler,
	GuildMemberRemoveHandler,
	MessageHandler,
	ReactionHandler,
	TriggerHandler,
	ButtonHandler,
	MessageDeleteHandler,
	MessageUpdateHandler,
	GuildBanAddHandler,
	GuildBanRemoveHandler,
	GuildMemberUpdateHandler,
	GuildRoleDeleteHandler,
	GuildRoleUpdateHandler,
	UserUpdateHandler,
} from './events/index.js';
import { CustomClient } from './extensions/index.js';
import { Job } from './jobs/index.js';
import { logs as Logs } from './lang/logs.js';
import { Reaction } from './reactions/index';
import { JobService, Logger } from './services/index.js';
import { Trigger } from './triggers/index.js';

async function start(): Promise<void> {
	// Client
	const client = new CustomClient({
		intents: Config.client.intents,
		partials: Config.client.partials,
		makeCache: Options.cacheWithLimits({
			// Keep default caching behavior
			...Options.defaultMakeCacheSettings,
			// Override specific options from config
			...Config.client.caches,
		}),
	});

	// Commands
	const commands: Command[] = [
		new DevCommand(),
		new HelpCommand(),
		new LinkCommand(),
		new EightBallCommand(),
		new CatCommand(),
		new DogCommand(),
		new ChooseCommand(),
		new RollCommand(),
		new MemberCommand(),
		new UserCommand(),
		new AvatarCommand(),
		new WhoIsCommand(),
		new ServerCommand()
		// TODO: Add new commands here
	];
	//.sort((a, b) => (a.metadata?.name > b.metadata?.name ? 1 : -1));

	const helpCommand = new HelpCommand();
	//const guildRepo = new GuildRepo();

	// Buttons
	const buttons: Button[] = [
		// TODO: Add new buttons here
	];

	// Reactions
	const reactions: Reaction[] = [
		// TODO: Add new reactions here
	];

	// Triggers
	const triggers: Trigger[] = [
		// TODO: Add new triggers here
	];

	// Event handlers
	const guildJoinHandler = new GuildJoinHandler();
	const guildLeaveHandler = new GuildLeaveHandler();
	const commandHandler = new CommandHandler(helpCommand, commands);
	const triggerHandler = new TriggerHandler(triggers);
	const messageHandler = new MessageHandler(commandHandler, triggerHandler);
	const reactionHandler = new ReactionHandler(reactions);
	const guildMemberAddHandler = new GuildMemberAddHandler();
	const guildMemberRemoveHandler = new GuildMemberRemoveHandler();
	const buttonHandler = new ButtonHandler(buttons);
	const messageDeleteHandler = new MessageDeleteHandler();
	const messageUpdateHandler = new MessageUpdateHandler();
	const guildBanAddHandler = new GuildBanAddHandler();
	const guildBanRemoveHandler = new GuildBanRemoveHandler();
	const guildMemberUpdateHandler = new GuildMemberUpdateHandler();
	const guildRoleDeleteHandler = new GuildRoleDeleteHandler();
	const guildRoleUpdateHandler = new GuildRoleUpdateHandler();
	const userUpdateHandler = new UserUpdateHandler();

	// Jobs
	// reminder: this is shard-level jobs. For globals check app.ts
	const jobs: Job[] = [
		// TODO: Add new jobs here
	];

	// Bot
	const bot = new Bot(
		Config.client.token,
		client,
		guildJoinHandler,
		guildLeaveHandler,
		messageHandler,
		commandHandler,
		buttonHandler,
		reactionHandler,
		new JobService(jobs),
		guildMemberAddHandler,
		guildMemberRemoveHandler,
		messageDeleteHandler,
		messageUpdateHandler,
		guildBanAddHandler,
		guildBanRemoveHandler,
		guildMemberUpdateHandler,
		guildRoleDeleteHandler,
		guildRoleUpdateHandler,
		userUpdateHandler,
	);

	// Register
	if (process.argv[2] === `--register`) {
		await registerCommands(commands);
		process.exit();
	} else if (process.argv[2] === `--clear`) {
		await clearCommands();
		process.exit();
	}

	await bot.start();
}

const botDevServer = `790353119795871744`;

async function registerCommands(commands: Command[]): Promise<void> {
	const cmdFilter = commands.filter((cmd) => cmd.metadata);
	const cmdDatas = cmdFilter.map((cmd) => cmd.metadata);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const cmdNames = cmdDatas.map((cmdData) => cmdData!.name);

	Logger.info(
		Logs.info.commandsRegistering.replaceAll(`{COMMAND_NAMES}`, cmdNames.map((cmdName) => `'${cmdName}'`).join(`, `)),
	);

	try {
		const rest = new REST({ version: `9` }).setToken(Config.client.token);
		if (process.env.NODE_ENV === `development`) {
			await rest.put(Routes.applicationGuildCommands(Config.client.id, botDevServer), { body: [] });
			await rest.put(Routes.applicationGuildCommands(Config.client.id, botDevServer), { body: cmdDatas });
		} else {
			await rest.put(Routes.applicationCommands(Config.client.id), { body: [] });
			await rest.put(Routes.applicationCommands(Config.client.id), { body: cmdDatas });
		}
	} catch (error) {
		Logger.error(Logs.error.commandsRegistering, error);
		return;
	}

	Logger.info(Logs.info.commandsRegistered);
}

async function clearCommands(): Promise<void> {
	Logger.info(Logs.info.commandsClearing);

	try {
		const rest = new REST({ version: `9` }).setToken(Config.client.token);
		await rest.put(Routes.applicationCommands(Config.client.id), { body: [] });
	} catch (error) {
		Logger.error(Logs.error.commandsClearing, error);
		return;
	}

	Logger.info(Logs.info.commandsCleared);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
process.on(`unhandledRejection`, (reason, _promise) => {
	console.log(reason);
	Logger.error(`An unhandled promise rejection ocurred.`, reason);
});

start().catch((error) => {
	Logger.error(`An unspecified error ocurred.`, error);
});
