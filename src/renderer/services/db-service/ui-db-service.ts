import { triplitClient } from "@shared/triplit/client";
import type { Provider } from "@shared/triplit/types";

export async function updateActiveProviderId(providerId: string) {
  try {
    // Check if UI record exists
    const query = triplitClient.query("ui");
    const ui = await triplitClient.fetch(query);

    if (ui.length === 0) {
      // Create initial UI record
      await triplitClient.insert("ui", {
        activeProviderId: providerId || "",
      });
    } else {
      // Update existing UI record
      await triplitClient.update("ui", ui[0].id, {
        activeProviderId: providerId || "",
      });
    }
  } catch (error) {
    console.error("Error updating active provider ID:", error);
  }
}

export async function getActiveProviderId(): Promise<string> {
  try {
    const query = triplitClient.query("ui");
    const ui = await triplitClient.fetch(query);

    if (ui.length === 0) {
      return "";
    }

    return ui[0].activeProviderId || "";
  } catch (error) {
    console.error("Error getting active provider ID:", error);
    return "";
  }
}

export async function getActiveProvider(): Promise<Provider | null> {
  try {
    const activeProviderId = await getActiveProviderId();

    if (!activeProviderId) {
      return null;
    }

    const query = triplitClient
      .query("providers")
      .Where("id", "=", activeProviderId);
    const providers = await triplitClient.fetch(query);

    return providers[0] || null;
  } catch (error) {
    console.error("Error getting active provider:", error);
    return null;
  }
}

export async function clearActiveProvider() {
  await updateActiveProviderId("");
}