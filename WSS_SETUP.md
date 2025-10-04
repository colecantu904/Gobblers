# WSS Setup with Caddy Reverse Proxy

This guide explains how to set up WebSocket Secure (WSS) for your Gobblers game using Caddy as a reverse proxy on port 443.

## Prerequisites

1. A domain name pointing to your server (replace `yourdomain.com` in the configuration)
2. Server with ports 80, 443, and 3000 accessible
3. Caddy web server installed

## Installation Steps

### 1. Install Caddy

**On macOS (using Homebrew):**

```bash
brew install caddy
```

**On Ubuntu/Debian:**

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**On CentOS/RHEL/Fedora:**

```bash
dnf install 'dnf-command(copr)'
dnf copr enable @caddy/caddy
dnf install caddy
```

### 2. Configure Domain

Update the `Caddyfile` in your project root:

- Replace `yourdomain.com` with your actual domain
- Update the Socket.IO CORS origins in `server/index.js` to match your domain

### 3. SSL Certificate Options

#### Option A: Automatic Let's Encrypt (Production)

Caddy will automatically obtain and renew SSL certificates when you use a real domain.

#### Option B: Self-signed for Development

For local development, uncomment the localhost section in the Caddyfile and use:

```bash
caddy trust
```

### 4. Start the Services

#### Development Mode

```bash
# Terminal 1: Start your Node.js server
npm run dev

# Terminal 2: Start Caddy (from project root)
caddy run

# Or run Caddy in background
sudo caddy start
```

#### Production Mode

```bash
# Build your application
npm run build

# Start your Node.js server
npm start

# Start Caddy (as a service)
sudo systemctl enable caddy
sudo systemctl start caddy
```

### 5. Verify Setup

1. **Check Node.js server**: Visit `http://localhost:3000`
2. **Check Caddy proxy**: Visit `https://yourdomain.com` (or `https://localhost:8443` for development)
3. **Test WebSockets**: Open browser developer tools and check WebSocket connections show as `wss://`

## Firewall Configuration

Ensure these ports are open:

- Port 80 (HTTP, for Let's Encrypt challenges)
- Port 443 (HTTPS/WSS)
- Port 3000 (internal, for Caddy to proxy to Node.js)

```bash
# Ubuntu/Debian with ufw
sudo ufw allow 80
sudo ufw allow 443

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Environment Variables

Create a `.env` file for production:

```env
NODE_ENV=production
PORT=3000
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**

   - Ensure your domain DNS is properly configured
   - Check Caddy logs: `sudo journalctl -u caddy -f`

2. **WebSocket Connection Failed**

   - Verify Caddy is properly proxying WebSocket upgrades
   - Check browser developer tools for connection errors
   - Ensure CORS origins are correctly configured

3. **Mixed Content Warnings**
   - Ensure all resources are loaded over HTTPS
   - Check that Socket.IO client is connecting to `wss://` not `ws://`

### Log Files

- **Caddy logs**: `/var/log/caddy/gobblers.log` (if configured)
- **Node.js logs**: Check terminal output or configure logging
- **System logs**: `sudo journalctl -u caddy -f`

### Testing WebSocket Connection

You can test the WebSocket connection using browser developer tools:

```javascript
// Open browser console on your site
const socket = io();
socket.on("connect", () => console.log("Connected via WSS"));
```

## Security Considerations

1. **Firewall**: Only expose necessary ports (80, 443)
2. **CORS**: Restrict origins to your domain only in production
3. **Headers**: Caddy configuration includes security headers
4. **SSL**: Always use strong SSL/TLS configurations

## Performance Optimization

1. **Compression**: Enabled in Caddyfile (`encode gzip`)
2. **Connection Persistence**: Socket.IO configured with `rememberUpgrade`
3. **Transport Priority**: WebSocket preferred over polling

## Deployment Checklist

- [ ] Domain DNS configured
- [ ] Caddyfile updated with correct domain
- [ ] CORS origins updated in server code
- [ ] Firewall ports opened
- [ ] Application built for production
- [ ] Caddy service enabled and started
- [ ] Node.js server started
- [ ] SSL certificate obtained and working
- [ ] WebSocket connections using WSS protocol

## Additional Resources

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Socket.IO Behind Reverse Proxy](https://socket.io/docs/v4/reverse-proxy/)
- [Let's Encrypt SSL](https://letsencrypt.org/)
