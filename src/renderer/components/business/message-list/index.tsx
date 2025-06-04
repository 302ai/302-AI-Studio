import { useEffect } from "react";

export function MessageList() {
  useEffect(() => {
    console.log("MessageList");
  }, []);

  return <div>MessageList</div>;
}
