#!/bin/bash

# Binary Matching Cron Job Setup Script
# Sets up automated binary matching bonus calculations

echo "======================================================================"
echo "🚀 BINARY MATCHING CRON JOB SETUP"
echo "======================================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Create log directory if it doesn't exist
LOG_DIR="/var/log/avenza"
if [ ! -d "$LOG_DIR" ]; then
    echo "📁 Creating log directory: $LOG_DIR"
    mkdir -p "$LOG_DIR"
    chmod 755 "$LOG_DIR"
fi

# Create log file
LOG_FILE="$LOG_DIR/binary_matching.log"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

echo "✅ Log file created: $LOG_FILE"
echo ""

# Backend directory
BACKEND_DIR="/var/www/avenza/backend"
PYTHON_PATH="$BACKEND_DIR/venv/bin/python"
SCRIPT_PATH="$BACKEND_DIR/calculate_binary_matching.py"

# Verify paths exist
if [ ! -f "$PYTHON_PATH" ]; then
    echo "❌ Python virtual environment not found at: $PYTHON_PATH"
    exit 1
fi

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Binary matching script not found at: $SCRIPT_PATH"
    exit 1
fi

echo "✅ Verified paths:"
echo "   Python: $PYTHON_PATH"
echo "   Script: $SCRIPT_PATH"
echo ""

# Cron job entry
CRON_JOB="0 */6 * * * cd $BACKEND_DIR && $PYTHON_PATH $SCRIPT_PATH >> $LOG_FILE 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "calculate_binary_matching.py"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current cron entry:"
    crontab -l | grep "calculate_binary_matching.py"
    echo ""
    read -p "Do you want to replace it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 0
    fi
    
    # Remove old entry
    crontab -l | grep -v "calculate_binary_matching.py" | crontab -
    echo "✅ Removed old cron entry"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo ""
echo "======================================================================"
echo "📋 CRON JOB DETAILS"
echo "======================================================================"
echo ""
echo "Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00)"
echo "Command:  $CRON_JOB"
echo "Log File: $LOG_FILE"
echo ""
echo "======================================================================"
echo "🔍 VERIFICATION"
echo "======================================================================"
echo ""
echo "Current crontab entries:"
crontab -l
echo ""
echo "======================================================================"
echo "✅ SETUP COMPLETE!"
echo "======================================================================"
echo ""
echo "📝 Next Steps:"
echo "   1. Test manual execution:"
echo "      cd $BACKEND_DIR"
echo "      source venv/bin/activate"
echo "      python calculate_binary_matching.py"
echo ""
echo "   2. Monitor logs:"
echo "      tail -f $LOG_FILE"
echo ""
echo "   3. Check cron job is running:"
echo "      sudo systemctl status cron"
echo ""
echo "======================================================================"
