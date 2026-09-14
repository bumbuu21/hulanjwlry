import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env.local")) {
  console.log(".env.local already exists. Kept existing configuration.");
} else {
  writeFileSync(
    ".env.local",
    `SESSION_SECRET=${randomBytes(48).toString("hex")}\nADMIN_PASSWORD=${randomBytes(18).toString("base64url")}\nBANK_NAME=\nBANK_ACCOUNT=\nBANK_HOLDER=\nALLOW_PREVIEW_ORDERS=true\n`,
  );
  console.log(
    "Created .env.local with random local credentials. Open it to see ADMIN_PASSWORD. Configure bank details before launch.",
  );
}
