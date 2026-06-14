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

def upload(local, remote):
    remote_dir = os.path.dirname(remote)
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
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
    sftp.put(local, remote)
    print(f"  {remote}")

files = [
    # Frontend
    "frontend/src/App.tsx",
    "frontend/src/components/Sidebar.tsx",
    "frontend/src/pages/Products.tsx",
    "frontend/src/pages/Dashboard.tsx",
    "frontend/src/pages/Reports.tsx",
    "frontend/src/services/api.ts",
    "frontend/.env",
    # Desktop (not deployed to server, but keeping api.ts synced)
    # Backend stays the same - data structures already exist
]

print("Uploading frontend files...")
for f in files:
    local = os.path.join(LOCAL_BASE, f.replace("/", os.sep))
    remote = f"{REMOTE_BASE}/{f}"
    if os.path.exists(local):
        upload(local, remote)
    else:
        print(f"  SKIP (not found): {local}")

sftp.close()
print("\nUpload concluido.")

# Rebuild frontend
print("\nRebuilding frontend container...")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {REMOTE_BASE} && sudo -S docker compose build --no-cache frontend 2>&1",
    timeout=300, get_pty=True
)
time.sleep(1)
stdin.write(PASS + "\n")
stdin.flush()
code = stdout.channel.recv_exit_status()
out = stdout.read().decode()
if code == 0:
    print("Build: OK")
else:
    lines = [l for l in out.split("\n") if l.strip()]
    for l in lines[-15:]:
        print(l)
    print(f"Build FALHOU (exit {code})")
    ssh.close()
    exit(1)

# Restart frontend
print("\nRestarting frontend...")
stdin, stdout, stderr = ssh.exec_command(
    f"cd {REMOTE_BASE} && sudo -S docker compose up -d frontend 2>&1",
    timeout=60, get_pty=True
)
time.sleep(1)
stdin.write(PASS + "\n")
stdin.flush()
stdout.channel.recv_exit_status()
print("Frontend reiniciado.")

# Verify no localhost in JS
time.sleep(3)
stdin, stdout, stderr = ssh.exec_command(
    "docker exec fastbuy-web grep -c 'localhost' /usr/share/nginx/html/assets/*.js 2>/dev/null || echo '0'",
    timeout=10
)
count = stdout.read().decode().strip()
print(f"\nVerificacao: 'localhost' no JS = {count}")

# Test login
stdin, stdout, stderr = ssh.exec_command(
    """curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@fastbuy.com","password":"admin123"}'""",
    timeout=10
)
resp = stdout.read().decode().strip()
if "token" in resp:
    print("Login via web: OK")
else:
    print(f"Login: {resp}")

print("\nDeploy concluido!")
ssh.close()
