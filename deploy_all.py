import paramiko
import os
import time
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

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


def upload_dir(local_dir, remote_dir, extensions=None, exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = {"node_modules", ".git", "dist", "bin", "obj", ".vs"}
    for root, dirs, files in os.walk(local_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if extensions and not any(f.endswith(ext) for ext in extensions):
                continue
            local = os.path.join(root, f)
            rel = os.path.relpath(local, local_dir)
            remote = remote_dir + "/" + rel.replace("\\", "/")
            upload(local, remote)


def run_ssh(cmd, timeout_s=600):
    stdin, stdout, stderr = ssh.exec_command(
        f"cd {REMOTE_BASE} && sudo -S {cmd} 2>&1",
        timeout=timeout_s, get_pty=True
    )
    time.sleep(1)
    stdin.write(PASS + "\n")
    stdin.flush()
    output = ""
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            output += stdout.channel.recv(4096).decode()
        time.sleep(0.5)
    output += stdout.read().decode()
    code = stdout.channel.recv_exit_status()
    return code, output


# === FRONTEND ===
print("=== Uploading frontend ===")
upload_dir(
    os.path.join(LOCAL_BASE, "frontend", "src"),
    f"{REMOTE_BASE}/frontend/src",
    extensions=[".tsx", ".ts", ".css"]
)
for f in ["package.json", "package-lock.json", "vite.config.ts", "tsconfig.json", "postcss.config.js",
          "tailwind.config.js", ".env", ".dockerignore", "Dockerfile", "nginx.conf",
          "tsconfig.node.json", "index.html"]:
    local = os.path.join(LOCAL_BASE, "frontend", f)
    if os.path.exists(local):
        upload(local, f"{REMOTE_BASE}/frontend/{f}")
for f in ["fastbuy-logo.png"]:
    local = os.path.join(LOCAL_BASE, "frontend", "public", f)
    if os.path.exists(local):
        upload(local, f"{REMOTE_BASE}/frontend/public/{f}")

# Remove deleted files on remote
for deleted in ["Stock.tsx"]:
    print(f"\n  Removendo {deleted} do servidor...")
    try:
        sftp.remove(f"{REMOTE_BASE}/frontend/src/pages/{deleted}")
        print(f"  {deleted} removido.")
    except FileNotFoundError:
        print(f"  {deleted} já não existe.")

# === BACKEND ===
print("\n=== Uploading backend ===")
upload_dir(
    os.path.join(LOCAL_BASE, "backend", "FastBuy.API"),
    f"{REMOTE_BASE}/backend/FastBuy.API",
    extensions=[".cs", ".csproj", ".json", ".sln"]
)
for f in ["Dockerfile", ".dockerignore"]:
    local = os.path.join(LOCAL_BASE, "backend", "FastBuy.API", f)
    if os.path.exists(local):
        upload(local, f"{REMOTE_BASE}/backend/FastBuy.API/{f}")


# Docker compose
upload(
    os.path.join(LOCAL_BASE, "docker-compose.yml"),
    f"{REMOTE_BASE}/docker-compose.yml"
)

sftp.close()
print("\nUpload concluído.")

# === BUILD ===
print("\n=== Rebuilding backend ===")
code, output = run_ssh("docker compose build --no-cache backend")
if code == 0:
    print("Backend build: OK")
else:
    for l in output.split("\n")[-20:]:
        print(l)
    print(f"\nBackend build FALHOU (exit {code})")
    ssh.close()
    exit(1)

print("\n=== Rebuilding frontend ===")
code, output = run_ssh("docker compose build --no-cache frontend")
if code == 0:
    print("Frontend build: OK")
else:
    for l in output.split("\n")[-20:]:
        print(l)
    print(f"\nFrontend build FALHOU (exit {code})")
    ssh.close()
    exit(1)

# === RESTART ===
print("\n=== Restarting services ===")
code, output = run_ssh("docker compose up -d backend frontend", timeout_s=60)
print("Serviços reiniciados.")

# === VERIFY ===
time.sleep(5)
stdin, stdout, stderr = ssh.exec_command(
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/", timeout=10
)
status = stdout.read().decode().strip()
print(f"\nFrontend HTTP: {status}")

stdin, stdout, stderr = ssh.exec_command(
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/categories", timeout=10
)
status = stdout.read().decode().strip()
print(f"Backend HTTP: {status}")

print("\nDeploy concluído! Acesse http://192.168.1.16:3000")
ssh.close()
