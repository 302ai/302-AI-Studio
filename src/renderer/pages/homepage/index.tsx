import { NewThread } from "./new-thread";

export function HomePage() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-9">
      <NewThread />
    </div>
  );
}
