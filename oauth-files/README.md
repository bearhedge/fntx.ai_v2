# OAuth Integration for FNTX.ai v2

This directory contains the necessary files for implementing OAuth authentication with Interactive Brokers (IBKR).

## Files

- `private_encryption.pem` - Private key for encryption
- `public_encryption.pem` - Public key for encryption
- `private_signature.pem` - Private key for signing requests
- `public_signature.pem` - Public key for signature verification
- `dhparam.pem` - Diffie-Hellman parameters for secure key exchange

## Implementation Notes

These files should be kept secure and not committed to public repositories. In a production environment, these should be stored as environment variables or in a secure vault.

For local development, these files can be used directly, but ensure they are added to .gitignore to prevent accidental commits.

## IBKR OAuth Flow

1. User initiates authentication
2. Application redirects to IBKR OAuth endpoint
3. User authenticates with IBKR
4. IBKR redirects back to application with authorization code
5. Application exchanges code for access token using client credentials and these keys
6. Application uses access token for API requests

## Security Considerations

- Always use HTTPS for all OAuth-related communications
- Store tokens securely
- Implement token refresh mechanism
- Validate all tokens and signatures
