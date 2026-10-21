export interface UserInfo {
	uid?: number | string;
	name: string;
	email: string;
	avatar: string;
	status?: number;
}

export interface UserState {
	token: string | null;
	userInfo: UserInfo | null;
	isLoggedIn: boolean;
	/** The original API key obtained from SSO login, used to track association */
	ssoApiKey: string | null;
}

/**
 * Map dash-api /user/v2/info response data to the minimal UserInfo shape.
 */
export function mapV2UserInfo(data: unknown): UserInfo {
	const d = (data ?? {}) as Record<string, unknown>;
	return {
		uid: d.uid as number | string | undefined,
		name: String(d.name ?? d.user_name ?? ""),
		email: String(d.email ?? ""),
		avatar: String(d.avatar ?? ""),
		status: typeof d.status === "number" ? d.status : 1,
	};
}
