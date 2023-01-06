import { REST } from '@discordjs/rest';
import { Options } from 'discord.js';
import * as dotenv from 'dotenv';
import { Autocomplete } from './autocompletes/autocomplete.js';
dotenv.config();
import { Bot } from './bot.js';
import { Button, GfycatSearchButton, GfycatUserFeedButton } from './buttons/index.js';
import {
	EightBallCommand,
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
	ServerCommand,
	PingCommand,
	ServerInfoCommand,
	RolesCommand,
	EmotesCommand,
	BannerCommand,
	RpsCommand,
	UrbanCommand,
	AboutCommand,
	StreamableCommand,
	WeatherCommand,
	ColourCommand,
	GfycatCommand,
	HoroscopeCommand,
	TagCommand,
	BentoCommand,
	ProfileCommand,
	LastfmCommand,
} from './commands/index.js';
import { config as Config } from './config/config.js';
import {
	AutocompleteHandler,
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
	GuildMemberUpdateHandler,
	UserUpdateHandler,
	SelectMenuHandler,
} from './events/index.js';
import { CustomClient } from './extensions/index.js';
import {
	CheckRemindersJob,
	CheckScheduledAnnouncementsJob,
	CheckTimedAnnouncementsJob,
	DeleteExpiredGfycatPosts,
	Job,
} from './jobs/index.js';
import { logs as Logs } from './lang/logs.js';
import { Reaction } from './reactions/index';
import { HelpSelectMenu } from './selectMenu/help-selectMenu.js';
import { SelectMenu } from './selectMenu/selectMenu.js';
import { JobService, Logger, CommandRegistrationService, EventDataService } from './services/index.js';
import { Trigger } from './triggers/index.js';

export const commands: Command[] = [
	new DevCommand(),
	new HelpCommand(),
	new LinkCommand(),
	new EightBallCommand(),
	new ChooseCommand(),
	new RollCommand(),
	new MemberCommand(),
	new UserCommand(),
	new AvatarCommand(),
	new WhoIsCommand(),
	new ServerCommand(),
	new PingCommand(),
	new EmotesCommand(),
	new RolesCommand(),
	new ServerInfoCommand(),
	new BannerCommand(),
	new RpsCommand(),
	new UrbanCommand(),
	new AboutCommand(),
	new StreamableCommand(),
	new WeatherCommand(),
	new ColourCommand(),
	new GfycatCommand(),
	new HoroscopeCommand(),
	new TagCommand(),
	new BentoCommand(),
	new ProfileCommand(),
	new LastfmCommand(),
	// TODO: Add new commands here
];

async function start(): Promise<void> {
	// Services
	const eventDataService = new EventDataService();

	// Client
	const client = new CustomClient({
		intents: Config.client.intents,
		partials: Config.client.partials,
		makeCache: Options.cacheWithLimits({
			// Keep default caching behavior
			...Options.DefaultMakeCacheSettings,
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
		new ChooseCommand(),
		new RollCommand(),
		new MemberCommand(),
		new UserCommand(),
		new AvatarCommand(),
		new WhoIsCommand(),
		new ServerCommand(),
		new PingCommand(),
		new EmotesCommand(),
		new RolesCommand(),
		new ServerInfoCommand(),
		new BannerCommand(),
		new RpsCommand(),
		new UrbanCommand(),
		new AboutCommand(),
		new StreamableCommand(),
		new WeatherCommand(),
		new ColourCommand(),
		new GfycatCommand(),
		new HoroscopeCommand(),
		new TagCommand(),
		new BentoCommand(),
		new ProfileCommand(),
		new LastfmCommand(),
		// TODO: Add new commands here
	];
	//.sort((a, b) => (a.metadata?.name > b.metadata?.name ? 1 : -1));

	const helpCommand = new HelpCommand();
	//const guildRepo = new GuildRepo();

	// Buttons
	const buttons: Button[] = [
		new GfycatUserFeedButton(),
		new GfycatSearchButton(),
		// TODO: Add new buttons here
	];

	// Select Menus replies
	const selectMenus: SelectMenu[] = [
		new HelpSelectMenu(),
		// TODO: Add new Select Menus here
	];

	// Autocompletes
	const autocompletes: Autocomplete[] = [
		// TODO: Add new autocompletes here
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
	const commandHandler = new CommandHandler(helpCommand, commands, eventDataService);
	const triggerHandler = new TriggerHandler(triggers, eventDataService);
	const messageHandler = new MessageHandler(commandHandler, triggerHandler);
	const reactionHandler = new ReactionHandler(reactions, eventDataService);
	const guildMemberAddHandler = new GuildMemberAddHandler();
	const guildMemberRemoveHandler = new GuildMemberRemoveHandler();
	const buttonHandler = new ButtonHandler(buttons, eventDataService);
	const messageDeleteHandler = new MessageDeleteHandler();
	const messageUpdateHandler = new MessageUpdateHandler();
	const guildMemberUpdateHandler = new GuildMemberUpdateHandler();
	const userUpdateHandler = new UserUpdateHandler();
	const selectMenuHandler = new SelectMenuHandler(selectMenus, eventDataService);
	const autocompleteHandler = new AutocompleteHandler(autocompletes, eventDataService);

	// Jobs
	// reminder: this is shard-level jobs. For globals check app.ts
	const jobs: Job[] = [
		// TODO: Add new jobs here
		new CheckRemindersJob(client),
		new CheckScheduledAnnouncementsJob(client),
		new CheckTimedAnnouncementsJob(client),
		new DeleteExpiredGfycatPosts(),
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
		autocompleteHandler,
		guildMemberAddHandler,
		guildMemberRemoveHandler,
		messageDeleteHandler,
		messageUpdateHandler,
		guildMemberUpdateHandler,
		userUpdateHandler,
		selectMenuHandler,
	);

	// Register
	if (process.argv[2] === `commands`) {
		try {
			const rest = new REST({ version: `10` }).setToken(Config.client.token);
			const commandRegistrationService = new CommandRegistrationService(rest);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const localCmds = commands.filter((cmd) => cmd.metadata).map((cmd) => cmd.metadata!);
			await commandRegistrationService.process(localCmds, process.argv);
		} catch (error) {
			Logger.error(Logs.error.commandAction, error);
		}
		process.exit();
	}

	await bot.start();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
process.on(`unhandledRejection`, (reason, _promise) => {
	console.log(reason);
	Logger.error(`An unhandled promise rejection ocurred.`, reason);
});

start().catch((error) => {
	Logger.error(`An unspecified error ocurred.`, error);
});
