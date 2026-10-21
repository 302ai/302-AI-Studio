import { describe, expect, it } from "vitest";

import { mapV2UserInfo } from "./user";

describe("mapV2UserInfo", () => {
	it("maps the documented v2 success payload to minimal UserInfo", () => {
		const info = mapV2UserInfo({
			uid: 233818,
			sub_id: 890,
			email: "test@sub.302ai",
			name: "some-name",
			avatar: "https://example.com/a.png",
		});
		expect(info.uid).toBe(233818);
		expect(info.name).toBe("some-name");
		expect(info.email).toBe("test@sub.302ai");
		expect(info.avatar).toBe("https://example.com/a.png");
	});

	it("normalizes null fields to empty string", () => {
		const info = mapV2UserInfo({ uid: "123", email: null, name: null, avatar: null });
		expect(info.uid).toBe("123");
		expect(info.name).toBe("");
		expect(info.email).toBe("");
		expect(info.avatar).toBe("");
	});

	it("handles empty or null input gracefully", () => {
		const empty = mapV2UserInfo(null);
		expect(empty.name).toBe("");
		expect(empty.email).toBe("");
		expect(empty.avatar).toBe("");
	});

	it("preserves legacy user_name into name", () => {
		const info = mapV2UserInfo({ uid: 42, user_name: "old-v1-name" });
		expect(info.name).toBe("old-v1-name");
	});
});
