import { triplitClient } from "@renderer/client";
import { useQuery } from "@triplit/react";

export function useTriplit() {
  // * Settings Collection
  const settingsQuery = triplitClient.query("settings");
  const { results: settings, fetching: settingsFetching } = useQuery(
    triplitClient,
    settingsQuery,
  );

  // * Toolbox Collection
  const toolboxQuery = triplitClient.query("toolbox");
  const { results: toolbox, fetching: toolboxFetching } = useQuery(
    triplitClient,
    toolboxQuery,
  );

  return {
    // * Settings
    settings,
    settingsFetching,

    // * Toolbox
    toolbox,
    toolboxFetching,
  };
}
