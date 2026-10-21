export interface UserInfo {
	name: string;
	email: string;
	status: number;
	avatar: string;
}

export interface UserState {
	token: string | null;
	userInfo: UserInfo | null;
	isLoggedIn: boolean;
	/** The original API key obtained from SSO login, used to track association */
	ssoApiKey: string | null;
}
