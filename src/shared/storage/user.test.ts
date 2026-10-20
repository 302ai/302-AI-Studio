import { describe, expect, it } from "vitest";

import { mapV2UserInfo } from "./user";

describe("mapV2UserInfo", () => {
	it("maps the documented v2 success payload", () => {
		const info = mapV2UserInfo({
			uid: 233818,
			sub_id: 890,
			email: "huangjunjia3734343297@sub.302ai",
			name: "some-name",
			avatar: "https://example.com/a.png",
		});
		expect(info.uid).toBe(233818);
		expect(info.user_name).toBe("some-name");
		expect(info.email).toBe("huangjunjia3734343297@sub.302ai");
		expect(info.avatar).toBe("https://example.com/a.png");
		expect(info.is_sub_account).toBe(true);
	});

	it("normalizes string uid and treats missing sub_id as parent account", () => {
		const info = mapV2UserInfo({ uid: "123", email: null, name: null, avatar: null });
		expect(info.uid).toBe(123);
		expect(info.user_name).toBe("");
		expect(info.email).toBe("");
		expect(info.avatar).toBe("");
		expect(info.is_sub_account).toBe(false);
	});

	it("treats sub_id 0 as parent account and fills defaults for null data", () => {
		expect(mapV2UserInfo({ uid: 1, sub_id: 0 }).is_sub_account).toBe(false);
		const empty = mapV2UserInfo(null);
		expect(empty.uid).toBe(0);
		expect(empty.user_name).toBe("");
		expect(empty.balance).toBe(0);
		expect(empty.is_sub_account).toBe(false);
	});

	it("preserves legacy v1 persisted fields (user_name, is_sub_account)", () => {
		const info = mapV2UserInfo({ uid: 42, user_name: "old-v1-name", is_sub_account: true });
		expect(info.user_name).toBe("old-v1-name");
		expect(info.is_sub_account).toBe(true);
	});
});
