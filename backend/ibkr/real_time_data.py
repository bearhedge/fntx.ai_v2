import os
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .oauth import IBKROAuthConfig

class RealTimeOptionsDataService:
    """Service for fetching real-time options data from IBKR"""
    
    @staticmethod
    def get_headers(request):
        """Get headers with OAuth token for IBKR API requests"""
        access_token = request.session.get('ibkr_access_token')
        if not access_token:
            raise ValueError("No access token available")
        
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    @staticmethod
    def fetch_options_data(request, ticker, expiry=None, strike_range=None):
        """
        Fetch real-time options data from IBKR
        
        Args:
            request: The HTTP request object (for session access)
            ticker: The stock ticker symbol
            expiry: Optional expiry date (YYYY-MM-DD)
            strike_range: Optional range around current price (e.g., 5 for ±5)
        
        Returns:
            Options data from IBKR
        """
        try:
            headers = RealTimeOptionsDataService.get_headers(request)
            
            # Construct the API endpoint
            api_url = f"https://api.interactivebrokers.com/v1/portal/iserver/secdef/search"
            
            # Prepare the request parameters
            params = {
                "symbol": ticker,
                "secType": "OPT"
            }
            
            # Add optional parameters if provided
            if expiry:
                params["expiryDate"] = expiry
                
            # Make the initial request to get available contracts
            response = requests.get(api_url, headers=headers, params=params)
            
            if response.status_code != 200:
                return {
                    "status": False,
                    "error": f"Failed to fetch options data: {response.text}"
                }
            
            # Process the response to filter by strike range if needed
            options_data = response.json()
            
            if strike_range and options_data.get("data"):
                # Get the current stock price
                stock_price_response = requests.get(
                    f"https://api.interactivebrokers.com/v1/portal/iserver/marketdata/snapshot?conids={ticker}",
                    headers=headers
                )
                
                if stock_price_response.status_code == 200:
                    stock_data = stock_price_response.json()
                    if stock_data and len(stock_data) > 0:
                        current_price = stock_data[0].get("31", 0)  # "31" is the field for last price
                        
                        # Filter options by strike range
                        min_strike = float(current_price) - float(strike_range)
                        max_strike = float(current_price) + float(strike_range)
                        
                        options_data["data"] = [
                            option for option in options_data["data"]
                            if min_strike <= float(option.get("strike", 0)) <= max_strike
                        ]
            
            return {
                "status": True,
                "data": options_data
            }
            
        except Exception as e:
            return {
                "status": False,
                "error": str(e)
            }
    
    @staticmethod
    def stream_options_data(user_id, ticker, expiry=None, strike_range=None):
        """
        Stream real-time options data to the WebSocket
        
        Args:
            user_id: The user ID for the WebSocket channel
            ticker: The stock ticker symbol
            expiry: Optional expiry date (YYYY-MM-DD)
            strike_range: Optional range around current price (e.g., 5 for ±5)
        """
        channel_layer = get_channel_layer()
        
        # This would be replaced with actual streaming implementation
        # For now, we'll simulate it with a one-time send
        async_to_sync(channel_layer.group_send)(
            f"options_data_{user_id}",
            {
                "type": "send_options_data",
                "message": {
                    "ticker": ticker,
                    "expiry": expiry,
                    "strike_range": strike_range,
                    "data": "Real-time options data would stream here"
                }
            }
        )


class OptionsDataView(APIView):
    """API view for fetching options data"""
    
    def get(self, request):
        """Get options data for a specific ticker"""
        ticker = request.GET.get('ticker')
        expiry = request.GET.get('expiry')
        strike_range = request.GET.get('strike_range')
        
        if not ticker:
            return Response({"error": "Ticker is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = RealTimeOptionsDataService.fetch_options_data(
            request, ticker, expiry, strike_range
        )
        
        if result.get("status"):
            return Response(result.get("data"))
        else:
            return Response({"error": result.get("error")}, status=status.HTTP_400_BAD_REQUEST)


class StreamOptionsDataView(APIView):
    """API view for streaming options data"""
    
    def post(self, request):
        """Start streaming options data for a specific ticker"""
        ticker = request.data.get('ticker')
        expiry = request.data.get('expiry')
        strike_range = request.data.get('strike_range')
        user_id = request.user.id
        
        if not ticker:
            return Response({"error": "Ticker is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return Response({"error": "User must be authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Start streaming data
        RealTimeOptionsDataService.stream_options_data(
            user_id, ticker, expiry, strike_range
        )
        
        return Response({"message": f"Streaming options data for {ticker}"})
