# Fix Profile Photo Upload Issue

## Problem
Profile photo upload is failing because the uploads directory doesn't exist or has incorrect permissions.

## Solution

### Step 1: Connect to VPS
```bash
ssh root@148.135.138.145
```

### Step 2: Create and Configure Uploads Directory
```bash
# Create directory
mkdir -p /var/www/avenza/frontend/uploads

# Set ownership to www-data (nginx/web server user)
chown -R www-data:www-data /var/www/avenza/frontend/uploads

# Set permissions (755 allows read/write for owner, read for others)
chmod -R 755 /var/www/avenza/frontend/uploads

# Verify
ls -la /var/www/avenza/frontend/ | grep uploads
```

### Step 3: Configure Nginx to Serve Upload Files

Edit nginx config:
```bash
nano /etc/nginx/sites-available/avenza
```

Add this location block inside the `server` block (if not already present):
```nginx
    # Serve uploaded files
    location /uploads/ {
        alias /var/www/avenza/frontend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
```

### Step 4: Test Nginx Config and Reload
```bash
# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Step 5: Verify Setup
```bash
# Check directory exists
ls -la /var/www/avenza/frontend/uploads

# Check permissions
stat /var/www/avenza/frontend/uploads

# Test file creation
touch /var/www/avenza/frontend/uploads/test.txt
rm /var/www/avenza/frontend/uploads/test.txt
```

## Expected Output

Directory should show:
- Owner: `www-data:www-data`
- Permissions: `drwxr-xr-x` (755)

## Test Upload

After fixing, try uploading a profile photo from the user dashboard. It should:
1. Upload successfully
2. Show success message
3. Display the new photo immediately
4. Photo URL format: `https://avenza.live/uploads/profile_[userid]_[random].jpg`

## Troubleshooting

If still failing, check:
1. SELinux status: `getenforce` (should be disabled or permissive)
2. Nginx error logs: `tail -f /var/log/nginx/error.log`
3. Backend logs: `journalctl -u avenza -f`
4. Disk space: `df -h`
