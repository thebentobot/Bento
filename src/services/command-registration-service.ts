import { REST } from '@discordjs/rest';
import {
	APIApplicationCommand,
	RESTGetAPIApplicationCommandsResult,
	RESTPatchAPIApplicationCommandJSONBody,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	Routes,
} from 'discord-api-types/v10';
import { Logger } from './logger.js';
import { config as Config } from '../config/config.js';
import { logs as Logs } from '../lang/logs.js';

export class CommandRegistrationService {
	constructor(private rest: REST) {}

	public async process(
		localCmds: RESTPostAPIChatInputApplicationCommandsJSONBody[],
		args: string[]
	): Promise<void> {
		const remoteCmds = (await this.rest.get(
			Routes.applicationCommands(Config.client.id)
		)) as RESTGetAPIApplicationCommandsResult;

		const localCmdsOnRemote = localCmds.filter(localCmd =>
			remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
		);
		const localCmdsOnly = localCmds.filter(
			localCmd => !remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
		);
		const remoteCmdsOnly = remoteCmds.filter(
			remoteCmd => !localCmds.some(localCmd => localCmd.name === remoteCmd.name)
		);

		switch (args[3]) {
		case `view`: {
			Logger.info(
				Logs.info.commandActionView
					.replaceAll(
						`{LOCAL_AND_REMOTE_LIST}`,
						this.formatCommandList(localCmdsOnRemote)
					)
					.replaceAll(`{LOCAL_ONLY_LIST}`, this.formatCommandList(localCmdsOnly))
					.replaceAll(`{REMOTE_ONLY_LIST}`, this.formatCommandList(remoteCmdsOnly))
			);
			return;
		}
		case `register`: {
			if (localCmdsOnly.length > 0) {
				Logger.info(
					Logs.info.commandActionCreating.replaceAll(
						`{COMMAND_LIST}`,
						this.formatCommandList(localCmdsOnly)
					)
				);
				for (const localCmd of localCmdsOnly) {
					await this.rest.post(Routes.applicationCommands(Config.client.id), {
						body: localCmd,
					});
				}
				Logger.info(Logs.info.commandActionCreated);
			}

			if (localCmdsOnRemote.length > 0) {
				Logger.info(
					Logs.info.commandActionUpdating.replaceAll(
						`{COMMAND_LIST}`,
						this.formatCommandList(localCmdsOnRemote)
					)
				);
				for (const localCmd of localCmdsOnRemote) {
					await this.rest.post(Routes.applicationCommands(Config.client.id), {
						body: localCmd,
					});
				}
				Logger.info(Logs.info.commandActionUpdated);
			}

			return;
		}
		case `rename`: {
			const oldName = args[4];
			const newName = args[5];
			if (!(oldName && newName)) {
				Logger.error(Logs.error.commandActionRenameMissingArg);
				return;
			}

			const remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name === oldName);
			if (!remoteCmd) {
				Logger.error(
					Logs.error.commandActionNotFound.replaceAll(`{COMMAND_NAME}`, oldName)
				);
				return;
			}

			Logger.info(
				Logs.info.commandActionRenaming
					.replaceAll(`{OLD_COMMAND_NAME}`, remoteCmd.name)
					.replaceAll(`{NEW_COMMAND_NAME}`, newName)
			);
			const body: RESTPatchAPIApplicationCommandJSONBody = {
				name: newName,
			};
			await this.rest.patch(Routes.applicationCommand(Config.client.id, remoteCmd.id), {
				body,
			});
			Logger.info(Logs.info.commandActionRenamed);
			return;
		}
		case `delete`: {
			const name = args[4];
			if (!name) {
				Logger.error(Logs.error.commandActionDeleteMissingArg);
				return;
			}

			const remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name === name);
			if (!remoteCmd) {
				Logger.error(
					Logs.error.commandActionNotFound.replaceAll(`{COMMAND_NAME}`, name)
				);
				return;
			}

			Logger.info(
				Logs.info.commandActionDeleting.replaceAll(`{COMMAND_NAME}`, remoteCmd.name)
			);
			await this.rest.delete(Routes.applicationCommand(Config.client.id, remoteCmd.id));
			Logger.info(Logs.info.commandActionDeleted);
			return;
		}
		case `clear`: {
			Logger.info(
				Logs.info.commandActionClearing.replaceAll(
					`{COMMAND_LIST}`,
					this.formatCommandList(remoteCmds)
				)
			);
			await this.rest.put(Routes.applicationCommands(Config.client.id), { body: [] });
			Logger.info(Logs.info.commandActionCleared);
			return;
		}
		}
	}

	private formatCommandList(
		cmds: RESTPostAPIChatInputApplicationCommandsJSONBody[] | APIApplicationCommand[]
	): string {
		return cmds.length > 0
			? cmds.map((cmd: { name: string }) => `'${cmd.name}'`).join(`, `)
			: `N/A`;
	}
}