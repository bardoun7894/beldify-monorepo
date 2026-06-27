const { execSync } = require("child_process");
const run = (cmd) => {
  try {
    return execSync(cmd, { timeout: 60000, shell: "/bin/bash" }).toString();
  } catch (e) {
    return (e.stderr || e.message || "").toString();
  }
};

const SSH = `ssh -o StrictHostKeyChecking=no MyContabo`;
const MONO = `/var/local/beldify-monorepo`;

console.log("=== restore backups ===");
console.log(run(`${SSH} "cp -r /tmp/beldify-backup/* ${MONO}/ 2>/dev/null; true"`));

console.log("=== restart docker ===");
console.log(run(`${SSH} "cd ${MONO} && docker compose -f docker-compose.backend.yml restart app nginx"`));

console.log("=== migrate ===");
console.log(run(`${SSH} "docker exec beldify-backend php artisan migrate --force"`));

console.log("=== cache ===");
console.log(run(`${SSH} "docker exec beldify-backend php artisan optimize:clear 2>&1"`));
console.log(run(`${SSH} "docker exec beldify-backend php artisan config:cache 2>&1"`));
console.log(run(`${SSH} "docker exec beldify-backend php artisan route:cache 2>&1"`));

console.log("=== health ===");
console.log(run(`${SSH} "curl -s http://localhost:7894/api/health"`));

console.log("=== DONE ===");
