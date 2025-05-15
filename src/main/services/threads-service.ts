import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";

@ServiceRegister("threadsService")
export class ThreadsService {
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setActiveThread(threadId: string) {
    console.log("threadId", threadId);
  }

  getThread(threadId: string) {
    console.log("threadId", threadId);
  }
}
