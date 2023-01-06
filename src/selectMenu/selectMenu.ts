import { Message, StringSelectMenuInteraction } from 'discord.js';

import { EventData } from '../models/internal-models.js';

export interface SelectMenu {
	ids: string[];
	deferType: SelectMenuDeferType;
	requireGuild: boolean;
	requireEmbedAuthorTag: boolean;
	execute(intr: StringSelectMenuInteraction, msg: Message, data: EventData): Promise<void>;
}

export enum SelectMenuDeferType {
	REPLY = `REPLY`,
	UPDATE = `UPDATE`,
	NONE = `NONE`,
}
