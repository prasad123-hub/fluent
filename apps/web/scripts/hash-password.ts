import bcrypt from "bcryptjs";

const pw = process.argv[2];
if (!pw || pw.length < 8) {
  console.error('Usage: pnpm --filter @fluent/web hash-password "<password of 8+ chars>"');
  process.exit(1);
}
const hash = bcrypt.hashSync(pw, 12);
console.log("\nAdd this to your .env:\n");
console.log(`OWNER_PASSWORD_HASH=${hash.replace(/\$/g, "\\$")}\n`);
console.log(
  "(for .env files the `$` signs are escaped as `\\$`; on hosting dashboards paste the raw hash below)\n",
);
console.log(hash + "\n");
