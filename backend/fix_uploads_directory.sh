#!/bin/bash

# Fix uploads directory permissions
echo "Creating uploads directory..."
sudo mkdir -p /var/www/avenza/frontend/uploads

echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/avenza/frontend/uploads
sudo chmod -R 755 /var/www/avenza/frontend/uploads

echo "Verifying directory..."
ls -la /var/www/avenza/frontend/ | grep uploads

echo "✅ Uploads directory setup complete!"
echo ""
echo "Directory: /var/www/avenza/frontend/uploads"
echo "Owner: www-data:www-data"
echo "Permissions: 755"
