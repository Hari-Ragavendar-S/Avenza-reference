"""
Blockchain Monitor Service - Auto-detect External Deposits
Monitors blockchain for payments sent directly to public wallet address
Supports multiple networks: BSC, ETH, Polygon, etc.
Optimized for concurrent transaction detection
"""

import asyncio
from web3 import Web3
from decimal import Decimal
from datetime import datetime
import pytz
from typing import Optional
import requests

class BlockchainMonitor:
    """
    Monitors blockchain for external deposits to public wallet
    Automatically detects copy-paste payments and triggers distribution
    """
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.ist = pytz.timezone('Asia/Kolkata')
        self.networks = {}
        self.monitoring = False
        
    def get_ist_time(self):
        """Get current time in IST"""
        return datetime.now(self.ist)
    
    async def load_networks(self):
        """Load active networks from database"""
        cursor = self.db.cursor()
        
        try:
            cursor.execute("""
                SELECT network_name, chain_id, rpc_url, 
                       usdt_contract_address, native_currency,
                       conversion_rate_to_bep20
                FROM supported_networks
                WHERE is_active = TRUE
            """)
            
            networks = cursor.fetchall()
            
            for network in networks:
                try:
                    w3 = Web3(Web3.HTTPProvider(network['rpc_url']))
                    
                    # Test connection
                    if w3.is_connected():
                        self.networks[network['network_name']] = {
                            'w3': w3,
                            'chain_id': network['chain_id'],
                            'usdt_contract': network['usdt_contract_address'],
                            'native_currency': network['native_currency'],
                            'conversion_rate': Decimal(str(network['conversion_rate_to_bep20'])),
                            'last_block': None
                        }
                        print(f"✅ Connected to {network['network_name']} network")
                    else:
                        print(f"⚠️  Failed to connect to {network['network_name']}")
                        
                except Exception as e:
                    print(f"❌ Error connecting to {network['network_name']}: {e}")
            
            print(f"\n📊 Monitoring {len(self.networks)} networks: {', '.join(self.networks.keys())}\n")
            
        finally:
            cursor.close()
    
    async def get_public_wallet_address(self) -> Optional[str]:
        """Get active public wallet address"""
        cursor = self.db.cursor()
        
        try:
            cursor.execute("""
                SELECT wallet_address 
                FROM public_wallet_config 
                WHERE is_active = TRUE
            """)
            
            config = cursor.fetchone()
            return config['wallet_address'].lower() if config else None
            
        finally:
            cursor.close()
    
    async def get_token_price_usd(self, network_name: str) -> Decimal:
        """
        Get live token price in USD
        Used for converting native currencies to USDT equivalent
        """
        try:
            # Map network to CoinGecko IDs
            coin_ids = {
                'BSC': 'binancecoin',  # BNB
                'ETH': 'ethereum',     # ETH
                'POLYGON': 'matic-network',  # MATIC
                'TRON': 'tron'         # TRX
            }
            
            coin_id = coin_ids.get(network_name)
            if not coin_id:
                return Decimal('1.0')  # Default to 1:1 for unknown
            
            # Fetch from CoinGecko (free API)
            response = requests.get(
                f'https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd',
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                price = data.get(coin_id, {}).get('usd', 1.0)
                return Decimal(str(price))
            
        except Exception as e:
            print(f"⚠️  Failed to fetch {network_name} price: {e}")
        
        return Decimal('1.0')
    
    async def convert_to_bep20_usdt(
        self, 
        amount: Decimal, 
        network_name: str, 
        token_type: str
    ) -> Decimal:
        """
        Convert any amount to BEP20 USDT equivalent
        
        Args:
            amount: Amount received
            network_name: Network (BSC, ETH, etc.)
            token_type: 'USDT' or 'NATIVE'
            
        Returns:
            Amount in BEP20 USDT
        """
        # If already BEP20 USDT, return as-is
        if network_name == 'BSC' and token_type == 'USDT':
            return amount
        
        # For USDT on other networks, use conversion rate
        if token_type == 'USDT':
            conversion_rate = self.networks[network_name]['conversion_rate']
            return amount * conversion_rate
        
        # For native currency, fetch live price
        if token_type == 'NATIVE':
            price_usd = await self.get_token_price_usd(network_name)
            return amount * price_usd
        
        return amount
    
    async def is_transaction_recorded(self, tx_hash: str) -> bool:
        """Check if transaction already recorded"""
        cursor = self.db.cursor()
        
        try:
            cursor.execute("""
                SELECT 1 FROM public_deposits_external 
                WHERE transaction_hash = %s
                LIMIT 1
            """, (tx_hash.lower(),))
            
            return cursor.fetchone() is not None
            
        finally:
            cursor.close()
    
    async def record_external_deposit(
        self,
        network_name: str,
        tx_hash: str,
        sender_address: str,
        amount: Decimal,
        token_type: str,
        block_number: int
    ) -> Optional[dict]:
        """
        Record external deposit and trigger distribution
        
        Args:
            network_name: Network name
            tx_hash: Transaction hash
            sender_address: Sender wallet address
            amount: Amount received
            token_type: 'USDT' or 'NATIVE'
            block_number: Block number
            
        Returns:
            Result dict or None if failed
        """
        cursor = self.db.cursor()
        
        try:
            # Convert to BEP20 USDT equivalent
            amount_bep20 = await self.convert_to_bep20_usdt(
                amount, network_name, token_type
            )
            
            ist_now = self.get_ist_time()
            
            # Insert external deposit record
            cursor.execute("""
                INSERT INTO public_deposits_external
                (sender_address, amount_received, network, token_type,
                 amount_bep20_equivalent, transaction_hash, block_number,
                 detected_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                sender_address.lower(),
                amount,
                network_name,
                token_type,
                amount_bep20,
                tx_hash.lower(),
                block_number,
                ist_now
            ))
            
            deposit_id = cursor.fetchone()['id']
            self.db.commit()
            
            print(f"\n{'='*60}")
            print(f"💰 EXTERNAL DEPOSIT DETECTED!")
            print(f"{'='*60}")
            print(f"Network: {network_name}")
            print(f"From: {sender_address}")
            print(f"Amount: {amount} {token_type}")
            print(f"BEP20 Equivalent: ${amount_bep20} USDT")
            print(f"TX: {tx_hash}")
            print(f"Block: {block_number}")
            print(f"{'='*60}\n")
            
            # Queue for distribution
            from app.services.distribution_engine import get_distribution_engine
            
            distribution_engine = get_distribution_engine(self.db)
            await distribution_engine.queue_distribution(
                tx_hash.lower(),
                amount_bep20,
                'external'
            )
            
            # Process distribution immediately
            result = await distribution_engine.process_distribution(
                tx_hash.lower(),
                amount_bep20,
                'external'
            )
            
            return {
                'success': True,
                'deposit_id': deposit_id,
                'network': network_name,
                'amount_bep20': float(amount_bep20),
                'distribution': result
            }
            
        except Exception as e:
            self.db.rollback()
            print(f"❌ Error recording external deposit: {e}")
            return None
        finally:
            cursor.close()
    
    async def scan_block_for_deposits(
        self,
        network_name: str,
        network_config: dict,
        block_number: int,
        public_address: str
    ):
        """
        Scan a single block for deposits to public address
        
        Args:
            network_name: Network name
            network_config: Network configuration
            block_number: Block number to scan
            public_address: Public wallet address
        """
        w3 = network_config['w3']
        
        try:
            block = w3.eth.get_block(block_number, full_transactions=True)
            
            for tx in block.transactions:
                # Skip if no recipient
                if not tx['to']:
                    continue
                
                # Check if destination is public address
                if tx['to'].lower() != public_address:
                    continue
                
                # Check if already recorded
                if await self.is_transaction_recorded(tx['hash'].hex()):
                    continue
                
                # Native currency deposit (BNB, ETH, etc.)
                if tx['value'] > 0:
                    amount = w3.from_wei(tx['value'], 'ether')
                    
                    await self.record_external_deposit(
                        network_name,
                        tx['hash'].hex(),
                        tx['from'],
                        Decimal(str(amount)),
                        'NATIVE',
                        block_number
                    )
                
                # Check for USDT token transfers
                usdt_contract = network_config['usdt_contract']
                if tx['to'].lower() == usdt_contract.lower():
                    await self.check_token_transfer(
                        network_name,
                        network_config,
                        tx,
                        public_address,
                        block_number
                    )
                    
        except Exception as e:
            print(f"⚠️  Error scanning block {block_number} on {network_name}: {e}")
    
    async def check_token_transfer(
        self,
        network_name: str,
        network_config: dict,
        tx: dict,
        public_address: str,
        block_number: int
    ):
        """Check if transaction is USDT transfer to public address"""
        w3 = network_config['w3']
        
        try:
            receipt = w3.eth.get_transaction_receipt(tx['hash'])
            
            # ERC20 Transfer event signature
            TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
            
            for log in receipt['logs']:
                # Check if Transfer event
                if len(log['topics']) < 3:
                    continue
                
                if log['topics'][0].hex() != TRANSFER_EVENT_SIGNATURE:
                    continue
                
                # Decode 'to' address (topic[2])
                to_address = '0x' + log['topics'][2].hex()[-40:]
                
                if to_address.lower() != public_address:
                    continue
                
                # Decode amount (data field)
                amount_raw = int(log['data'].hex(), 16)
                amount = Decimal(amount_raw) / Decimal(10**6)  # USDT has 6 decimals
                
                # Decode 'from' address (topic[1])
                from_address = '0x' + log['topics'][1].hex()[-40:]
                
                # Check if already recorded
                if await self.is_transaction_recorded(tx['hash'].hex()):
                    continue
                
                await self.record_external_deposit(
                    network_name,
                    tx['hash'].hex(),
                    from_address,
                    amount,
                    'USDT',
                    block_number
                )
                
        except Exception as e:
            print(f"⚠️  Error checking token transfer: {e}")
    
    async def monitor_network(
        self,
        network_name: str,
        network_config: dict,
        public_address: str
    ):
        """
        Continuously monitor a specific network
        
        Args:
            network_name: Network name
            network_config: Network configuration
            public_address: Public wallet address to monitor
        """
        w3 = network_config['w3']
        
        # Get starting block
        if network_config['last_block'] is None:
            network_config['last_block'] = w3.eth.block_number
            print(f"🔍 Starting {network_name} monitor from block {network_config['last_block']}")
        
        while self.monitoring:
            try:
                current_block = w3.eth.block_number
                last_block = network_config['last_block']
                
                # Check new blocks
                if current_block > last_block:
                    for block_num in range(last_block + 1, current_block + 1):
                        await self.scan_block_for_deposits(
                            network_name,
                            network_config,
                            block_num,
                            public_address
                        )
                    
                    network_config['last_block'] = current_block
                
                # Wait before next check
                await asyncio.sleep(12)  # Check every 12 seconds
                
            except Exception as e:
                print(f"❌ Error monitoring {network_name}: {e}")
                await asyncio.sleep(30)  # Wait longer on error
    
    async def start_monitoring(self):
        """
        Start monitoring all networks
        Main entry point for blockchain monitoring
        """
        print("\n" + "="*60)
        print("🚀 STARTING BLOCKCHAIN MONITOR")
        print("="*60)
        
        # Load networks
        await self.load_networks()
        
        if not self.networks:
            print("❌ No networks available for monitoring")
            return
        
        # Get public wallet address
        public_address = await self.get_public_wallet_address()
        
        if not public_address:
            print("❌ No public wallet configured. Please configure in admin panel.")
            return
        
        print(f"📍 Monitoring Address: {public_address}")
        print(f"🌐 Networks: {', '.join(self.networks.keys())}")
        print("="*60 + "\n")
        
        self.monitoring = True
        
        # Create monitoring tasks for each network
        tasks = []
        for network_name, network_config in self.networks.items():
            task = self.monitor_network(
                network_name,
                network_config,
                public_address
            )
            tasks.append(task)
        
        # Run all monitors concurrently
        await asyncio.gather(*tasks)
    
    async def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring = False
        print("\n⏹️  Blockchain monitor stopped\n")


def get_blockchain_monitor(db_connection) -> BlockchainMonitor:
    """Factory function to create blockchain monitor"""
    return BlockchainMonitor(db_connection)


# Standalone script to run monitor
async def run_monitor():
    """Run blockchain monitor as standalone service"""
    from app.database.connection import get_db
    
    print("\n" + "="*60)
    print("   AVENZA BLOCKCHAIN MONITOR SERVICE")
    print("   Auto-detect External Deposits")
    print("="*60 + "\n")
    
    db_gen = get_db()
    db = next(db_gen)
    
    monitor = get_blockchain_monitor(db)
    
    try:
        await monitor.start_monitoring()
    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping monitor...")
        await monitor.stop_monitoring()
    finally:
        db.close()


if __name__ == "__main__":
    # Run as standalone service
    asyncio.run(run_monitor())
