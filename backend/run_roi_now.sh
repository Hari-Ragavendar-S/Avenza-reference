#!/bin/bash
echo "============================================"
echo "Running ROI + Level Income NOW"
echo "============================================"
echo ""

cd /var/www/avenza/backend
source venv/bin/activate

echo "Starting daily profit calculation..."
echo ""

python cron_daily_profit.py

echo ""
echo "============================================"
echo "Done!"
echo "============================================"
