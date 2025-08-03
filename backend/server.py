# /server.py

# code de https://auth0.com/docs/quickstart/backend/python/01-authorization#create-the-jwt-validation-decorator

import json
from six.moves.urllib.request import urlopen
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import cross_origin
import os
import jwt
from jwt import PyJWKClient

AUTH0_DOMAIN = os.environ.get('AUTH0_DOMAIN', 'dev-20ay5shrj23453un.us.auth0.com')
API_AUDIENCE = os.environ.get('AUTH0_AUDIENCE', 'https://civilium-api')
ALGORITHMS = ["RS256"]

APP = Flask(__name__)

# Error handler
class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code

@APP.errorhandler(AuthError)
def handle_auth_error(ex):
    response = jsonify(ex.error)
    response.status_code = ex.status_code
    return response

# Format error response and append status code
def get_token_auth_header():
    """Obtains the Access Token from the Authorization Header
    """
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError({"code": "authorization_header_missing",
                        "description":
                            "Authorization header is expected"}, 401)

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Authorization header must start with"
                            " Bearer"}, 401)
    elif len(parts) == 1:
        raise AuthError({"code": "invalid_header",
                        "description": "Token not found"}, 401)
    elif len(parts) > 2:
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Authorization header must be"
                            " Bearer token"}, 401)

    token = parts[1]
    return token

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_auth_header()

        try:
            jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
            jwk_client = PyJWKClient(jwks_url)
            signing_key = jwk_client.get_signing_key_from_jwt(token).key

            payload = jwt.decode(
                token,
                signing_key,
                algorithms=ALGORITHMS,
                audience=API_AUDIENCE,
                issuer=f"https://{AUTH0_DOMAIN}/"
            )
        except jwt.ExpiredSignatureError:
            raise AuthError({"code": "token_expired", "description": "token is expired"}, 401)
        except jwt.InvalidAudienceError:
            raise AuthError({"code": "invalid_audience", "description": "incorrect audience"}, 401)
        except jwt.InvalidIssuerError:
            raise AuthError({"code": "invalid_issuer", "description": "incorrect issuer"}, 401)
        except Exception as e:
            raise AuthError({"code": "invalid_token", "description": f"Token validation failed: {str(e)}"}, 401)

        g.top.current_user = payload
        print("JWT Payload:", payload)
        return f(*args, **kwargs)

    return decorated


def requires_scope(required_scope):
    """Determines if the required scope is present in the Access Token
    Args:
        required_scope (str): The scope required to access the resource
    """
    token = get_token_auth_header()
    unverified_claims = jwt.decode(token, options={"verify_signature": False})
    if unverified_claims.get("scope"):
            token_scopes = unverified_claims["scope"].split()
            for token_scope in token_scopes:
                if token_scope == required_scope:
                    return True
    return False

def init_auth(app):
    app.register_error_handler(AuthError, handle_auth_error)

