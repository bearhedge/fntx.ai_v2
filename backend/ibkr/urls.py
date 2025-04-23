from django.urls import path
from .oauth import (
    IBKROAuthInitiateView,
    IBKROAuthCallbackView,
    IBKRTokenRefreshView,
    IBKRTokenStatusView
)
from .real_time_data import (
    OptionsDataView,
    StreamOptionsDataView
)

urlpatterns = [
    # OAuth endpoints
    path('oauth/initiate', IBKROAuthInitiateView.as_view(), name='ibkr-oauth-initiate'),
    path('oauth/callback', IBKROAuthCallbackView.as_view(), name='ibkr-oauth-callback'),
    path('oauth/refresh', IBKRTokenRefreshView.as_view(), name='ibkr-oauth-refresh'),
    path('oauth/status', IBKRTokenStatusView.as_view(), name='ibkr-oauth-status'),
    
    # Real-time data endpoints
    path('options-data', OptionsDataView.as_view(), name='ibkr-options-data'),
    path('stream-options-data', StreamOptionsDataView.as_view(), name='ibkr-stream-options-data'),
    
    # Existing endpoints will remain here
]
