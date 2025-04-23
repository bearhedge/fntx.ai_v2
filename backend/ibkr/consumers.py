import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async
import asyncio
import logging

logger = logging.getLogger(__name__)

class OptionsDataConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for streaming real-time options data"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Get user from scope
        self.user = self.scope["user"]
        
        # Anonymous users can't connect
        if self.user.is_anonymous:
            await self.close()
            return
            
        # Get user ID for channel group
        self.user_id = await self.get_user_id()
        self.group_name = f"options_data_{self.user_id}"
        
        # Join the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        logger.info(f"WebSocket connected for user {self.user_id}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave the group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        logger.info(f"WebSocket disconnected for user {self.user_id}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            # Parse the message
            data = json.loads(text_data)
            ticker = data.get('ticker')
            expiry = data.get('expiry')
            strike_range = data.get('strike_range')
            
            if not ticker:
                await self.send(json.dumps({
                    'error': 'Ticker is required'
                }))
                return
                
            # Start streaming data
            await self.start_streaming(ticker, expiry, strike_range)
            
        except json.JSONDecodeError:
            await self.send(json.dumps({
                'error': 'Invalid JSON'
            }))
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send(json.dumps({
                'error': f'Error processing request: {str(e)}'
            }))

    async def start_streaming(self, ticker, expiry=None, strike_range=None):
        """Start streaming options data"""
        # Send initial message
        await self.send(json.dumps({
            'type': 'stream_started',
            'ticker': ticker,
            'expiry': expiry,
            'strike_range': strike_range
        }))
        
        # Store streaming parameters in instance variables
        self.streaming_ticker = ticker
        self.streaming_expiry = expiry
        self.streaming_strike_range = strike_range
        
        # Start the streaming task
        self.streaming_task = asyncio.create_task(
            self.stream_data_loop(ticker, expiry, strike_range)
        )

    async def stream_data_loop(self, ticker, expiry=None, strike_range=None):
        """Loop to continuously stream options data"""
        try:
            # Continue streaming until disconnected
            while True:
                # Get options data
                options_data = await self.get_options_data(ticker, expiry, strike_range)
                
                # Send the data
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'send_options_data',
                        'message': options_data
                    }
                )
                
                # Wait before sending next update
                await asyncio.sleep(1)  # 1 second interval
                
        except asyncio.CancelledError:
            # Task was cancelled, clean up
            logger.info(f"Streaming task cancelled for {ticker}")
        except Exception as e:
            logger.error(f"Error in stream_data_loop: {str(e)}")
            await self.send(json.dumps({
                'error': f'Streaming error: {str(e)}'
            }))

    async def send_options_data(self, event):
        """Send options data to WebSocket"""
        message = event['message']
        await self.send(text_data=json.dumps(message))

    @database_sync_to_async
    def get_user_id(self):
        """Get user ID from user object"""
        return self.user.id

    @sync_to_async
    def get_options_data(self, ticker, expiry=None, strike_range=None):
        """
        Get options data for a ticker
        
        In a real implementation, this would fetch data from IBKR API
        using OAuth tokens. For now, we'll generate mock data.
        """
        # Mock data structure
        strikes = [
            str(round(100 + i * 5, 2)) for i in range(10)
        ]
        
        calls = []
        puts = []
        
        for strike in strikes:
            # Generate mock call option
            call = {
                'strike': strike,
                'lastPrice': str(round(float(strike) * 0.05 + (0.5 - float(strike) * 0.001), 2)),
                'change': str(round((0.5 - float(strike) * 0.001) * 2 * (0.5 - float(strike) * 0.0005), 2)),
                'volume': str(int(1000 * (1 + float(strike) * 0.01))),
                'openInterest': str(int(3000 * (1 + float(strike) * 0.005)))
            }
            calls.append(call)
            
            # Generate mock put option
            put = {
                'strike': strike,
                'lastPrice': str(round(float(strike) * 0.05 - (0.5 - float(strike) * 0.001), 2)),
                'change': str(round((0.5 - float(strike) * 0.001) * -2 * (0.5 - float(strike) * 0.0005), 2)),
                'volume': str(int(800 * (1 + float(strike) * 0.01))),
                'openInterest': str(int(2500 * (1 + float(strike) * 0.005)))
            }
            puts.append(put)
        
        # Return the data
        return {
            'ticker': ticker,
            'expiry': expiry or '2025-05-16',
            'timestamp': '2025-04-23T07:35:00.000Z',
            'strikes': strikes,
            'calls': calls,
            'puts': puts
        }
