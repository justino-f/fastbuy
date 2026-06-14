import paramiko
import os
import time

HOST = "192.168.1.16"
USER = "ubuntu"
PASS = "awdr"
REMOTE_BASE = "/home/ubuntu/fastbuy"
LOCAL_BASE = r"E:\Shared\projects\fastbuy"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=10)
sftp = ssh.open_sftp()
print("Conectado.\n")

def ensure_remote_dir(remote_dir):
    parts = []
    d = remote_dir
    while d and d != "/":
        parts.insert(0, d)
        d = os.path.dirname(d)
    for p in parts:
        try:
            sftp.stat(p)
        except FileNotFoundError:
            sftp.mkdir(p)

def upload(local, remote):
    ensure_remote_dir(os.path.dirname(remote))
    sftp.put(local, remote)
    print(f"  {remote}")

def upload_dir(local_dir, remote_dir, extensions=None):
    for root, dirs, files in os.walk(local_dir):
        for f in files:
            if extensions and not any(f.endswith(ext) for ext in extensions):
                continue
            if "node_modules" in root or ".git" in root or "dist" in root:
                continue
            local = os.path.join(root, f)
            rel = os.path.relpath(local, local_dir)
            remote = remote_dir + "/" + rel.replace("\\", "/")
            upload(local, remote)

print("=== Uploading frontend ===")
# Upload all frontend source files
upload_dir(
    os.path.join(LOCAL_BASE, "frontend", "src"),
    f"{REMOTE_BASE}/frontend/src",
    extensions=[".tsx", ".ts", ".css"]
)

# Config files
for f in ["package.json", "vite.config.ts", "tsconfig.json", "postcss.config.js", "tailwind.config.js", ".env", ".dockerignore", "Dockerfile", "nginx.conf"]:
    local = os.path.join(LOCAL_BASE, "frontend", f)
    if os.path.exists(local):
        upload(local, f"{REMOTE_BASE}/frontend/{f}")

# Public assets
for f in ["fastbuy-logo.png"]:
    local = os.path.join(LOCAL_BASE, "frontend", "public", f)
    if os.path.exists(local):
        upload(local, f"{REMOTE_BASE}/frontend/public/{f}")

# tsconfig.node.json
local = os.path.join(LOCAL_BASE, "frontend", "tsconfig.node.json")
if os.path.exists(local):
    upload(local, f"{REMOTE_BASE}/frontend/tsconfig.node.json")

# index.html
local = os.path.join(LOCAL_BASE, "frontend", "index.html")
if os.path.exists(local):
    upload(local, f"{REMOTE_BASE}/frontend/index.html")

sftp.close()
print("\nUpload concluido.")

# Rebuild
print("\n=== Rebuilding frontend container ===")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {REMOTE_BASE} && sudo -S docker compose build --no-cache frontend 2>&1",
    timeout=600, get_pty=True
)
time.sleep(1)
stdin.write(PASS + "\n")
stdin.flush()

output = ""
while not stdout.channel.exit_status_ready():
    if stdout.channel.recv_ready():
        chunk = stdout.channel.recv(4096).decode()
        output += chunk
    time.sleep(0.5)
remaining = stdout.read().decode()
output += remaining
code = stdout.channel.recv_exit_status()

if code == 0:
    print("Build: OK")
else:
    lines = [l for l in output.split("\n") if l.strip()]
    for l in lines[-20:]:
        print(l)
    print(f"\nBuild FALHOU (exit {code})")
    ssh.close()
    exit(1)

# Restart
print("\n=== Restarting frontend ===")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {REMOTE_BASE} && sudo -S docker compose up -d frontend 2>&1",
    timeout=60, get_pty=True
)
time.sleep(1)
stdin.write(PASS + "\n")
stdin.flush()
stdout.channel.recv_exit_status()
print("Frontend reiniciado.")

# Verify
time.sleep(3)
stdin, stdout, stderr = ssh.exec_command(
    """curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/""",
    timeout=10
)
status = stdout.read().decode().strip()
print(f"\nHTTP status: {status}")

stdin, stdout, stderr = ssh.exec_command(
    """curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@fastbuy.com","password":"admin123"}' | head -c 20""",
    timeout=10
)
resp = stdout.read().decode().strip()
print(f"Login test: {'OK' if 'token' in resp else resp}")

print("\nDeploy concluido! Acesse http://192.168.1.16:3000")
ssh.close()
