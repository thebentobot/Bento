export interface gfycatUserDataInterface {
	name: string
	profileImageUrl: string
	url: string
	username: string
	followers: number
	subscription: number
	following: number
	profileUrl: string
	views: number
	verified: false
	description?: string
	publishedGfycats: number
	publishedAlbums: number
	createDate: number
}

interface gfycatContentInterface {
	url: string
	size: number
	height: number
	width: number
}

interface gfycatContentURLsInterface {
	mp4: gfycatContentInterface
	webm: gfycatContentInterface
	largeGif: gfycatContentInterface
}

export interface gfycatSingleGfycatInterface {
	userData: gfycatUserDataInterface
	frameRate: number
	likes: number
	height: number
	userProfileImageUrl: string
	avgColor: string
	dislikes: number
	tags: string[]
	gfySlug: string
	description: string
	title: string
	gfyName: string
	views: number
	createDate: number
	nsfw: string | number
	width: number
	content_urls: gfycatContentURLsInterface
	mp4Url: string
	mobileUrl: string
	max5mbGif: string
}

export interface gfycatUserFeedInterface {
	gfycats: gfycatSingleGfycatInterface[]
}

export interface gfycatSearchInterface {
	cursor: string
	gfycats: gfycatSingleGfycatInterface[]
	related: string[]
	found: number
}

export interface gfycatErrorMessage {
	code: string
	description: string
}