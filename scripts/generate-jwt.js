const jwt = require("jsonwebtoken");

// 这些值需要与 src/shared/triplit/config.ts 中的配置匹配
const JWT_SECRET = "default-jwt-secret-change-in-production";
const PROJECT_ID = "chat-app-triplit";

// 生成匿名token
const anonToken = jwt.sign(
  {
    "x-triplit-token-type": "anon",
    "x-triplit-project-id": PROJECT_ID,
  },
  JWT_SECRET,
  { algorithm: "HS256" }
);

// 生成服务token (具有完全权限)
const serviceToken = jwt.sign(
  {
    "x-triplit-token-type": "secret",
    "x-triplit-project-id": PROJECT_ID,
  },
  JWT_SECRET,
  { algorithm: "HS256" }
);

console.log("=== Triplit JWT Tokens ===");
console.log("");
console.log("匿名Token (只读权限):");
console.log(anonToken);
console.log("");
console.log("服务Token (完全权限):");
console.log(serviceToken);
console.log("");
console.log("复制上面的token到客户端配置中");
