import os
import requests
import base64
import json
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class IBKROAuthConfig:
    """Configuration for IBKR OAuth"""
    
    # These would typically be stored in environment variables or settings
    CLIENT_ID = os.environ.get('IBKR_CLIENT_ID', 'your_client_id')
    CLIENT_SECRET = os.environ.get('IBKR_CLIENT_SECRET', 'your_client_secret')
    REDIRECT_URI = os.environ.get('IBKR_REDIRECT_URI', 'http://localhost:8000/api/ibkr/oauth/callback')
    
    # OAuth endpoints
    AUTH_ENDPOINT = 'https://www.interactivebrokers.com/oauth/authorize'
    TOKEN_ENDPOINT = 'https://www.interactivebrokers.com/oauth/token'
    
    # Paths to key files
    PRIVATE_SIGNATURE_KEY_PATH = os.path.join(settings.BASE_DIR, 'oauth_keys', 'private_signature.pem')
    PRIVATE_ENCRYPTION_KEY_PATH = os.path.join(settings.BASE_DIR, 'oauth_keys', 'private_encryption.pem')
    
    @classmethod
    def load_private_key(cls, key_path):
        """Load a private key from file"""
        with open(key_path, 'rb') as key_file:
            private_key = load_pem_private_key(
                key_file.read(),
                password=None
            )
        return private_key
    
    @classmethod
    def sign_message(cls, message):
        """Sign a message using the private signature key"""
        private_key = cls.load_private_key(cls.PRIVATE_SIGNATURE_KEY_PATH)
        signature = private_key.sign(
            message.encode('utf-8'),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode('utf-8')
    
    @classmethod
    def encrypt_message(cls, message):
        """Encrypt a message using the private encryption key"""
        private_key = cls.load_private_key(cls.PRIVATE_ENCRYPTION_KEY_PATH)
        ciphertext = private_key.encrypt(
            message.encode('utf-8'),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return base64.b64encode(ciphertext).decode('utf-8')


class IBKROAuthInitiateView(APIView):
    """View to initiate the OAuth flow with IBKR"""
    
    def get(self, request):
        """Redirect the user to IBKR's authorization page"""
        auth_url = f"{IBKROAuthConfig.AUTH_ENDPOINT}?response_type=code&client_id={IBKROAuthConfig.CLIENT_ID}&redirect_uri={IBKROAuthConfig.REDIRECT_URI}"
        return redirect(auth_url)


class IBKROAuthCallbackView(APIView):
    """View to handle the OAuth callback from IBKR"""
    
    def get(self, request):
        """Exchange the authorization code for an access token"""
        code = request.GET.get('code')
        if not code:
            return Response({"error": "No authorization code provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare the token request
        token_request_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': IBKROAuthConfig.CLIENT_ID,
            'client_secret': IBKROAuthConfig.CLIENT_SECRET,
            'redirect_uri': IBKROAuthConfig.REDIRECT_URI
        }
        
        # Sign the request
        signature = IBKROAuthConfig.sign_message(json.dumps(token_request_data))
        
        # Make the token request
        headers = {
            'Content-Type': 'application/json',
            'X-Signature': signature
        }
        
        response = requests.post(
            IBKROAuthConfig.TOKEN_ENDPOINT,
            json=token_request_data,
            headers=headers
        )
        
        if response.status_code == 200:
            # Store the tokens in the session
            token_data = response.json()
            request.session['ibkr_access_token'] = token_data.get('access_token')
            request.session['ibkr_refresh_token'] = token_data.get('refresh_token')
            request.session['ibkr_token_expiry'] = token_data.get('expires_in')
            
            # Redirect to the frontend
            return redirect(f"{settings.FRONTEND_URL}/dashboard?auth=success")
        else:
            # Handle error
            return Response(
                {"error": "Failed to obtain access token", "details": response.text},
                status=status.HTTP_400_BAD_REQUEST
            )


class IBKRTokenRefreshView(APIView):
    """View to refresh the IBKR access token"""
    
    def post(self, request):
        """Refresh the access token using the refresh token"""
        refresh_token = request.session.get('ibkr_refresh_token')
        if not refresh_token:
            return Response({"error": "No refresh token available"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare the refresh request
        refresh_request_data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': IBKROAuthConfig.CLIENT_ID,
            'client_secret': IBKROAuthConfig.CLIENT_SECRET
        }
        
        # Sign the request
        signature = IBKROAuthConfig.sign_message(json.dumps(refresh_request_data))
        
        # Make the refresh request
        headers = {
            'Content-Type': 'application/json',
            'X-Signature': signature
        }
        
        response = requests.post(
            IBKROAuthConfig.TOKEN_ENDPOINT,
            json=refresh_request_data,
            headers=headers
        )
        
        if response.status_code == 200:
            # Update the tokens in the session
            token_data = response.json()
            request.session['ibkr_access_token'] = token_data.get('access_token')
            request.session['ibkr_refresh_token'] = token_data.get('refresh_token')
            request.session['ibkr_token_expiry'] = token_data.get('expires_in')
            
            return Response({"message": "Token refreshed successfully"})
        else:
            # Handle error
            return Response(
                {"error": "Failed to refresh token", "details": response.text},
                status=status.HTTP_400_BAD_REQUEST
            )


class IBKRTokenStatusView(APIView):
    """View to check the status of the IBKR access token"""
    
    def get(self, request):
        """Check if the user has a valid IBKR access token"""
        access_token = request.session.get('ibkr_access_token')
        if access_token:
            return Response({"authenticated": True})
        else:
            return Response({"authenticated": False})
