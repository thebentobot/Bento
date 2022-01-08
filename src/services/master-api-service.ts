import { URL } from 'url';

import { HttpService } from '.';
import { LoginClusterResponse, RegisterClusterRequest, RegisterClusterResponse } from '../models/master-api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Config = require(`../../config/config.json`);

export class MasterApiService {
	/*
	Property 'clusterId' has no initializer and is not definitely assigned in the constructor.ts(2564)
	*/
	private clusterId: string | undefined;

	constructor(private httpService: HttpService) {}

	public async register(): Promise<void> {
		const reqBody: RegisterClusterRequest = {
			shardCount: Config.clustering.shardCount,
			callback: {
				url: Config.clustering.callbackUrl,
				token: Config.api.secret,
			},
		};

		const res = await this.httpService.post(
			new URL(`/clusters`, Config.clustering.masterApi.url),
			Config.clustering.masterApi.token,
			reqBody,
		);

		if (res.status >= 200 && res.status <= 299 === false) {
			throw res;
		}

		const resBody: RegisterClusterResponse = await res.data.json() as RegisterClusterResponse;
		this.clusterId = resBody.id;
	}

	public async login(): Promise<LoginClusterResponse> {
		const res = await this.httpService.put(
			new URL(`/clusters/${this.clusterId}/login`, Config.clustering.masterApi.url),
			Config.clustering.masterApi.token,
		);

		if (res.status >= 200 && res.status <= 299 === false) {
			throw res;
		}

		return res.data.json() as Promise<LoginClusterResponse>;
	}

	public async ready(): Promise<void> {
		const res = await this.httpService.put(
			new URL(`/clusters/${this.clusterId}/ready`, Config.clustering.masterApi.url),
			Config.clustering.masterApi.token,
		);

		if (res.status >= 200 && res.status <= 299 === false) {
			throw res;
		}
	}
}
