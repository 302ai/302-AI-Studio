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
}
