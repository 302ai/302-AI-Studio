import { triplitClient } from "@renderer/client";
import { useQuery } from "@triplit/react";

interface TriplitQueryOptions {
  settings?: ReturnType<typeof triplitClient.query<"settings">>;
  threads?: ReturnType<typeof triplitClient.query<"threads">>;
  toolbox?: ReturnType<typeof triplitClient.query<"toolbox">>;
}

/**
 * @param options - The options for the triplit query.
 * @returns The triplit data.
 * @description This hook is used to fetch the data from the triplit database.
 */
export function useTriplit(options?: TriplitQueryOptions) {
  // * Settings Collection
  const settingsQuery = options?.settings || triplitClient.query("settings");
  const { results: settings, fetching: settingsFetching } = useQuery(
    triplitClient,
    settingsQuery,
  );

  // * Toolbox Collection
  const toolboxQuery = options?.toolbox || triplitClient.query("toolbox");
  const { results: toolbox, fetching: toolboxFetching } = useQuery(
    triplitClient,
    toolboxQuery,
  );

  // * Threads Collection
  const threadsQuery = options?.threads || triplitClient.query("threads");
  const { results: threads, fetching: threadsFetching } = useQuery(
    triplitClient,
    threadsQuery,
  );

  return {
    // * Settings Data
    settings,
    settingsFetching,

    // * Toolbox Data
    toolbox,
    toolboxFetching,

    // * Threads Data
    threads,
    threadsFetching,
  };
}
