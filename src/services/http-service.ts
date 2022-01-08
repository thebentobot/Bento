import axios, { AxiosResponse } from 'axios';
import { URL } from 'url';

export class HttpService {
	public async get(url: string | URL, authorization: string): Promise<AxiosResponse> {
		return axios.get(`${url}`, {
			method: `get`,
			headers: {
				Authorization: authorization,
				Accept: `application/json`,
			},
		});
	}

	public async post(url: string | URL, authorization: string, body?: object): Promise<AxiosResponse> {
		return axios.post(`${url}`, {
			method: `post`,
			headers: {
				Authorization: authorization,
				'Content-Type': `application/json`,
				Accept: `application/json`,
			},
			data: body ? JSON.stringify(body) : undefined,
		});
	}

	public async put(url: string | URL, authorization: string, body?: object): Promise<AxiosResponse> {
		return axios.put(`${url}`, {
			method: `put`,
			headers: {
				Authorization: authorization,
				'Content-Type': `application/json`,
				Accept: `application/json`,
			},
			data: body ? JSON.stringify(body) : undefined,
		});
	}

	public async delete(url: string | URL, authorization: string, body?: object): Promise<AxiosResponse> {
		return axios.delete(`${url}`, {
			method: `delete`,
			headers: {
				Authorization: authorization,
				'Content-Type': `application/json`,
				Accept: `application/json`,
			},
			data: body ? JSON.stringify(body) : undefined,
		});
	}
}
