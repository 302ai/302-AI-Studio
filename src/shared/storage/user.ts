export interface UserInfo {
	uid: number;
	user_name: string;
	email: string;
	phone: string;
	avatar: string;
	balance: number;
	api_key: string;
	has_pwd: boolean;
	is_new_user: boolean;
	region: number;
	total_balance: number;
	gpt_cost: number;
	gpt_request_times: number;
	invite_code: string;
	invitation_link: string;
	ref: string;
	has_gift: boolean;
	inv_switch: boolean;
	question_switch: boolean;
	show_questionnaire_windows: boolean;
	to_band_phone: boolean;
	total_earning: number;
	today_earning: number;
	total_app: number;
	is_developer: number;
	resource_area: number;
	register_from: string;
	/** 是否为子账户 */
	is_sub_account: boolean;
}

export interface UserState {
	token: string | null;
	userInfo: UserInfo | null;
	isLoggedIn: boolean;
	/** The original API key obtained from SSO login, used to track association */
	ssoApiKey: string | null;
}

/**
 * Map dash-api /user/v2/info response data to the legacy UserInfo shape.
 *
 * shortcut: v2 only returns uid/sub_id/email/name/avatar; balance, api_key,
 * invite_code etc. are zero-filled. Revisit when the UI needs real values.
 */
export function mapV2UserInfo(data: unknown): UserInfo {
	const d = (data ?? {}) as Record<string, unknown>;
	const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
	const num = (v: unknown) => {
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	};
	// v2: null/0/absent sub_id = parent account, positive = sub-account
	const subId = d.sub_id == null ? 0 : num(d.sub_id);

	return {
		uid: num(d.uid),
		// v2 叫 name；历史持久化数据（v1 或未映射的原始 v2）可能只有 user_name
		user_name: str(d.name ?? d.user_name),
		email: str(d.email),
		phone: "",
		avatar: str(d.avatar),
		balance: 0,
		api_key: "",
		has_pwd: false,
		is_new_user: false,
		region: 0,
		total_balance: 0,
		gpt_cost: 0,
		gpt_request_times: 0,
		invite_code: "",
		invitation_link: "",
		ref: "",
		has_gift: false,
		inv_switch: false,
		question_switch: false,
		show_questionnaire_windows: false,
		to_band_phone: false,
		total_earning: 0,
		today_earning: 0,
		total_app: 0,
		is_developer: 0,
		resource_area: 0,
		register_from: "",
		is_sub_account: subId > 0 || d.is_sub_account === true,
	};
}
