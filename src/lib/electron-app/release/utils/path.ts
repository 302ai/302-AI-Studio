import { dirname, normalize } from "node:path";

export function getDevFolder(path: string) {
  const [nodeModules, devFolder] = normalize(dirname(path)).split(/\/|\\/g);

  return [nodeModules, devFolder].join("/");
}
