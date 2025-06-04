// import { Link } from "react-router-dom";
import { NewThread } from "./new-thread";

export function HomePage() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-9">
      <NewThread />
      {/* <div className="flex gap-4">
        <Link
          to="/test"
          className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          🧪 测试 Triplit 数据库
        </Link>
      </div> */}
    </div>
  );
}
