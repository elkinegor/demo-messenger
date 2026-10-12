# Деплой на demo.linkbit.live

Ручной деплой на тот же VPS, что и LinkBit (Caddy + systemd).

```bash
ssh -i ~/.ssh/linkbit_deploy root@104.234.174.168

git clone https://github.com/elkinegor/demo-messenger.git /opt/demo-messenger
cd /opt/demo-messenger
# Node 20+
npm ci
npm run build

cp deploy/demo-messenger.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now demo-messenger

# Caddy: добавить блок из deploy/Caddyfile.snippet
systemctl reload caddy
```

Обновление:

```bash
cd /opt/demo-messenger
git pull
npm ci
npm run build
systemctl restart demo-messenger
```

Проверка: `curl -s https://demo.linkbit.live/api/health`
