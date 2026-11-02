#!/bin/bash
echo "============================================"
echo "Setting Up Cron Jobs for Avenza"
echo "============================================"
echo ""

# Check if cron jobs exist
echo "Checking existing cron jobs..."
crontab -l 2>/dev/null | grep -q "cron_daily_profit"
if [ $? -eq 0 ]; then
    echo "✅ Daily profit cron job already exists"
else
    echo "❌ Daily profit cron job NOT found"
fi

echo ""
echo "============================================"
echo "Installing Cron Jobs"
echo "============================================"
echo ""

# Backup existing crontab
echo "Backing up existing crontab..."
crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null

# Remove old Avenza cron jobs
crontab -l 2>/dev/null | grep -v "cron_daily_profit" | grep -v "calculate_binary_matching" > /tmp/new_crontab.txt

# Add new cron jobs
echo "" >> /tmp/new_crontab.txt
echo "# Avenza MLM System Cron Jobs" >> /tmp/new_crontab.txt
echo "" >> /tmp/new_crontab.txt

# Daily profit calculation - Runs every day at 12:01 AM IST
echo "# Daily ROI + Level Income Distribution (12:01 AM IST daily)" >> /tmp/new_crontab.txt
echo "1 0 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python cron_daily_profit.py >> /var/log/avenza_daily_profit.log 2>&1" >> /tmp/new_crontab.txt
echo "" >> /tmp/new_crontab.txt

# Binary matching calculation - Runs every day at 12:05 AM IST
echo "# Binary Matching Bonus Calculation (12:05 AM IST daily)" >> /tmp/new_crontab.txt
echo "5 0 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python calculate_binary_matching.py >> /var/log/avenza_binary_matching.log 2>&1" >> /tmp/new_crontab.txt
echo "" >> /tmp/new_crontab.txt

# Install new crontab
crontab /tmp/new_crontab.txt

echo "✅ Cron jobs installed successfully!"
echo ""
echo "Installed jobs:"
crontab -l | grep -A 1 "Avenza"
echo ""

# Create log files if they don't exist
touch /var/log/avenza_daily_profit.log
touch /var/log/avenza_binary_matching.log
chmod 666 /var/log/avenza_daily_profit.log
chmod 666 /var/log/avenza_binary_matching.log

echo "✅ Log files created"
echo ""
echo "============================================"
echo "Testing Cron Jobs"
echo "============================================"
echo ""

# Test daily profit script
echo "Testing daily profit calculation..."
cd /var/www/avenza/backend
source venv/bin/activate
python cron_daily_profit.py

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Cron Schedule:"
echo "- Daily ROI + Level Income: Every day at 12:01 AM IST"
echo "- Binary Matching: Every day at 12:05 AM IST"
echo ""
echo "Log Files:"
echo "- /var/log/avenza_daily_profit.log"
echo "- /var/log/avenza_binary_matching.log"
echo ""
echo "To check cron jobs: crontab -l"
echo "To view logs: tail -f /var/log/avenza_daily_profit.log"
echo ""
