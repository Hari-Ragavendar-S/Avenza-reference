# Fix Nginx 502 Bad Gateway Error

## Problem
Frontend receives 502 errors even though backend returns 200 OK. This is an nginx proxy configuration issue.

## Root Cause
Nginx proxy settings need to be optimized for:
- Longer timeouts for file uploads
- Proper buffer sizes
- Keep-alive connections

## Solution

### Step 1: Edit Nginx Configuration
```bash
nano /etc/nginx/sites-available/avenza
```

### Step 2: Update the configuration with these settings

Replace the entire file with this optimized configuration:

```nginx
server {
    listen 80;
    server_name avenza.live www.avenza.live;

    # Redirect to HTTPS (if you have SSL)
    # return 301 https://$server_name$request_uri;

    # Root directory for frontend
    root /var/www/avenza/frontend/dist;
    index index.html;

    # Increase client body size for file uploads (10MB)
    client_max_body_size 10M;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/avenza/frontend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8028;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts (increased for file uploads)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Keep-alive
        proxy_set_header Connection "";
        
        # Don't cache API responses
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### Step 3: Test and Reload Nginx
```bash
# Test configuration
nginx -t

# If test passes, reload nginx
systemctl reload nginx

# Check nginx status
systemctl status nginx
```

### Step 4: Check Nginx Error Logs
```bash
# Watch nginx error log in real-time
tail -f /var/log/nginx/error.log
```

### Step 5: Verify Backend is Running
```bash
# Check backend status
systemctl status avenza

# Check backend logs
journalctl -u avenza -f --lines=50
```

### Step 6: Test the Fix

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Try uploading profile photo again
4. Check browser console for errors

## Additional Checks

### If still getting 502 errors:

1. **Check if backend is listening on correct port:**
```bash
netstat -tlnp | grep 8028
```

2. **Check SELinux (if enabled):**
```bash
getenforce
# If enforcing, temporarily disable:
setenforce 0
```

3. **Check firewall:**
```bash
ufw status
# If blocking, allow:
ufw allow 8028
```

4. **Restart both services:**
```bash
systemctl restart avenza
systemctl restart nginx
```

5. **Check disk space:**
```bash
df -h
```

## Expected Result

After applying the fix:
- ✅ No more 502 errors
- ✅ Profile photo uploads work
- ✅ All API calls return proper responses
- ✅ Faster response times

## Testing Commands

```bash
# Test backend directly (should return 200)
curl -I http://localhost:8028/api/user/profile -H "Authorization: Bearer YOUR_TOKEN"

# Test through nginx (should also return 200)
curl -I https://avenza.live/api/user/profile -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues

1. **Backend not running:** `systemctl start avenza`
2. **Wrong port:** Check backend is on 8028
3. **Firewall blocking:** Check `ufw status`
4. **SELinux blocking:** Check `getenforce`
5. **Out of memory:** Check `free -h`
