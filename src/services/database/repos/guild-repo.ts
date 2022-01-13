import { guild } from "@prisma/client";
import { prisma } from "../../prisma";

export class GuildRepo {
	public async getGuild(discordId: string): Promise<guild> {
		const results = await prisma.guild.findUnique({where: {guildID: BigInt(discordId)}});
		return results as guild;
	}
}