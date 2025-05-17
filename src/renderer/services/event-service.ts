import mitt from "mitt";

export enum EventNames {
  THREAD_RENAME = "thread:rename",
}

type Events = {
  [EventNames.THREAD_RENAME]: {
    threadId: string;
    newTitle: string;
  };
};

export const emitter = mitt<Events>();
