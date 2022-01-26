/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as dotenv from 'dotenv';
dotenv.config();

export const botSites = [
	{
		"name": `top.gg`,
		"enabled": process.env.NODE_ENV === `production` ? true : false,
		"url": `https://top.gg/api/bots/${process.env.botId}/stats`,
		"authorization": `${process.env.topGGToken}`,
		"body": `{"server_count":{{SERVER_COUNT}}}`
	},
];
/*
export default
[
	{
		"name": `top.gg`,
		"enabled": process.env.NODE_ENV === `production` ? true : false,
		"url": `https://top.gg/api/bots/${process.env.botId}/stats`,
		"authorization": `${process.env.topGGToken}`,
		"body": `{"server_count":{{SERVER_COUNT}}}`
	},
];
*/