import { PersistedState } from "$lib/hooks/persisted-state.svelte";
import { persistedModelState } from "$lib/stores/provider-state.svelte";
import type { Model } from "@shared/types";
import type { SessionMetadata } from "@shared/storage/session";

export const persistedSessionState = new PersistedState<SessionMetadata>(
	"SessionStorage:session-metadata",
	{
		latestUsedModel: null,
	},
);

$effect.root(() => {
	$effect(() => {
		if (!persistedSessionState.isHydrated || !persistedModelState.isHydrated) return;

		const latest = persistedSessionState.current.latestUsedModel as
			| (Model & { id?: unknown; providerId?: unknown })
			| null;
		if (!latest || typeof latest !== "object") return;
		if (typeof latest.id !== "string") return;

		const providerId = typeof latest.providerId === "string" ? latest.providerId : null;
		const exists = persistedModelState.current.some((m) =>
			providerId ? m.id === latest.id && m.providerId === providerId : m.id === latest.id,
		);

		if (!exists) {
			persistedSessionState.current.latestUsedModel = null;
		}
	});
});

class SessionState {
	get latestUsedModel(): Model | null {
		return persistedSessionState.current.latestUsedModel;
	}

	set latestUsedModel(value: Model | null) {
		persistedSessionState.current.latestUsedModel = value;
	}
}

export const sessionState = new SessionState();
