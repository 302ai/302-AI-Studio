import type { ThreadItem } from "@shared/types/thread";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../../shared/reflect";

@ServiceRegister("threadsService")
export class ThreadsService {
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setActiveThreadId(_event: Electron.IpcMainEvent, threadId: string) {
    console.log("threadId", threadId);
  }

  getThreadId(_event: Electron.IpcMainEvent, threadId: string) {
    console.log("threadId", threadId);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  createThread(_event: Electron.IpcMainEvent, threadData: ThreadItem) {
    console.log("threadId", threadData);
  }
}
