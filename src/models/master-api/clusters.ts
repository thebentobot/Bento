import { Type } from 'class-transformer';
import { IsDefined, IsInt, IsPositive, IsString, IsUrl, Length, ValidateNested } from 'class-validator';

export class Callback {
	@IsDefined()
	@IsUrl({ require_tld: false })
	url: string | undefined;

	@IsDefined()
	@IsString()
	@Length(5, 2000)
	token: string | undefined;
}

export class RegisterClusterRequest {
	@IsDefined()
	@IsInt()
	@IsPositive()
	shardCount: number | undefined;

	@IsDefined()
	@ValidateNested()
	@Type(() => Callback)
	callback: Callback | undefined;
}

export interface RegisterClusterResponse {
	id: string;
}

export interface LoginClusterResponse {
	shardList: number[];
	totalShards: number;
}
