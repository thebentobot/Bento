import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/rest/v9';
import { Options } from 'discord.js';

import { Bot } from './bot';
import { Command, DevCommand, HelpCommand, InfoCommand, LinkCommand, TestCommand } from './commands';
import {
	CommandHandler,
	GuildJoinHandler,
	GuildLeaveHandler,
	MessageHandler,
	ReactionHandler,
	TriggerHandler,
} from './events';
import { CustomClient } from './extensions';
import { Job } from './jobs';
import { Reaction } from './reactions';
import { JobService, Logger } from './services';
import { GuildRepo } from './services/database/repos/guild-repo';
import { Trigger } from './triggers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Config = require(`../config/config.json`);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Logs = require(`../lang/logs.json`);

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
		new InfoCommand(),
		new LinkCommand(),
		new TestCommand(),
		// TODO: Add new commands here
	].sort((a, b) => (a.metadata.name > b.metadata.name ? 1 : -1));

	const helpCommand = new HelpCommand();
	//const guildRepo = new GuildRepo();

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

	// Jobs
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
		reactionHandler,
		new JobService(jobs),
	);

	// Register
	if (process.argv[2] === `--register`) {
		await registerCommands(commands);
		process.exit();
	}

	await bot.start();
}

async function registerCommands(commands: Command[]): Promise<void> {
	const cmdDatas = commands.map((cmd) => cmd.metadata);
	const cmdNames = cmdDatas.map((cmdData) => cmdData.name);

	Logger.info(
		Logs.info.commandsRegistering.replaceAll(`{COMMAND_NAMES}`, cmdNames.map((cmdName) => `'${cmdName}'`).join(`, `)),
	);

	try {
		const rest = new REST({ version: `9` }).setToken(Config.client.token);
		await rest.put(Routes.applicationCommands(Config.client.id), { body: [] });
		await rest.put(Routes.applicationCommands(Config.client.id), { body: cmdDatas });
	} catch (error) {
		Logger.error(Logs.error.commandsRegistering, error);
		return;
	}

	Logger.info(Logs.info.commandsRegistered);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
process.on(`unhandledRejection`, (reason, _promise) => {
	Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch((error) => {
	Logger.error(Logs.error.unspecified, error);
});
