# Деплой на demo.linkbit.live

Ручной деплой на тот же VPS, что и LinkBit (Caddy + Docker).  
На хосте Node не нужен — приложение в контейнере.

```bash
ssh -i ~/.ssh/linkbit_deploy root@104.234.174.168

git clone https://github.com/elkinegor/demo-messenger.git /opt/demo-messenger
cd /opt/demo-messenger
docker compose up -d --build

# Caddy: добавить блок из deploy/Caddyfile.snippet в /etc/caddy/Caddyfile
systemctl reload caddy
```

Альтернатива без Docker (если установлен Node 20+): unit `deploy/demo-messenger.service`.

Обновление:

```bash
cd /opt/demo-messenger
git pull
docker compose up -d --build
docker image prune -f
```

Проверка: `curl -s https://demo.linkbit.live/api/health`  
Логи приложения: `/opt/demo-messenger/logs/app.log`
