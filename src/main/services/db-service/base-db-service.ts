import { triplitClient } from "@main/triplit/client";
import type { Schema } from "@shared/triplit/schema";
import type { CollectionNameFromModels } from "@triplit/client";

export abstract class BaseDbService {
  constructor(collectionName: CollectionNameFromModels<Schema>) {
    this.init(collectionName);
  }

  private init(collectionName: CollectionNameFromModels<Schema>) {
    if (triplitClient.connectionStatus !== "OPEN") {
      triplitClient.connect();
    }

    const initQuery = triplitClient.query(collectionName);

    // biome-ignore lint/suspicious/noExplicitAny: unknown type
    triplitClient.fetch<any>(initQuery, {
      policy: "remote-first",
    });
  }
}
