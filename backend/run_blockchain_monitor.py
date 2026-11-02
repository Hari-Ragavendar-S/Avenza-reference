#!/usr/bin/env python3
"""
Blockchain Monitor Runner
Runs as a separate service to monitor external deposits
Can be run alongside the main FastAPI server
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.blockchain_monitor import run_monitor

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║       AVENZA BLOCKCHAIN MONITOR SERVICE                  ║
║       Auto-Detect External Deposits                      ║
║                                                          ║
║  This service monitors blockchain networks for           ║
║  external payments sent to the public wallet address     ║
║                                                          ║
║  Press Ctrl+C to stop                                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    try:
        asyncio.run(run_monitor())
    except KeyboardInterrupt:
        print("\n\n✅ Monitor stopped gracefully")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
