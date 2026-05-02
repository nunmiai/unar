# unar_auth.py - Lambda function for user authentication with AWS Cognito
import json
import os
import boto3
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Cognito configuration - set as Lambda environment variables
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID')

# DynamoDB setup
USERS_TABLE_NAME = os.environ.get('USERS_TABLE_NAME', 'unar_users')
ORDERS_TABLE_NAME = os.environ.get('ORDERS_TABLE_NAME', 'user_payment_details')
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(USERS_TABLE_NAME)
orders_table = dynamodb.Table(ORDERS_TABLE_NAME)

# Cognito client
cognito_client = boto3.client('cognito-idp', region_name='us-east-1')

# CORS headers
HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}


def lambda_handler(event, context):
    """Main Lambda handler with path-based routing for authentication"""

    # Handle CORS preflight
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    # Get path
    path = event.get('path') or event.get('rawPath') or ''

    try:
        # Route based on path
        if path.endswith('/signup'):
            return signup(event)
        elif path.endswith('/verify-email'):
            return verify_email(event)
        elif path.endswith('/resend-code'):
            return resend_verification_code(event)
        elif path.endswith('/login'):
            return login(event)
        elif path.endswith('/logout'):
            return logout(event)
        elif path.endswith('/forgot-password'):
            return forgot_password(event)
        elif path.endswith('/reset-password'):
            return reset_password(event)
        elif path.endswith('/get-user'):
            return get_user(event)
        elif path.endswith('/refresh-token'):
            return refresh_token(event)
        elif path.endswith('/google-user'):
            return save_google_user(event)
        elif path.endswith('/user-orders'):
            return get_user_orders(event)
        else:
            return response(404, {'error': 'Route not found', 'path': path})

    except Exception as e:
        print(f'Error: {str(e)}')
        return response(500, {'error': 'Internal server error', 'message': str(e)})


def signup(event):
    """POST /signup - Register a new user"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    email = body.get('email', '').strip().lower()
    password = body.get('password', '')
    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()

    # Validation
    if not email:
        return response(400, {'error': 'Email is required'})
    if not password:
        return response(400, {'error': 'Password is required'})
    if len(password) < 8:
        return response(400, {'error': 'Password must be at least 8 characters'})
    if not name:
        return response(400, {'error': 'Name is required'})
    if not phone or len(phone) < 10:
        return response(400, {'error': 'Valid phone number is required'})

    try:
        # Generate unique username (since email is configured as alias)
        username = str(uuid.uuid4())

        # Create user in Cognito
        cognito_response = cognito_client.sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=username,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name},
                {'Name': 'phone_number', 'Value': f'+91{phone}'}  # India country code
            ]
        )

        user_sub = cognito_response.get('UserSub')
        print(f'User created in Cognito: {email}, username: {username}, sub: {user_sub}')

        # Store user info in DynamoDB (will be marked as verified after email confirmation)
        timestamp = datetime.utcnow().isoformat()
        users_table.put_item(Item={
            'cognito_user_id': user_sub,
            'cognito_username': username,
            'email': email,
            'name': name,
            'phone': phone,
            'email_verified': False,
            'created_at': timestamp,
            'updated_at': timestamp
        })

        print(f'User saved to DynamoDB: {user_sub}')

        return response(200, {
            'success': True,
            'message': 'Account created successfully. Please check your email for verification code.',
            'user_id': user_sub,
            'email': email
        })

    except cognito_client.exceptions.UsernameExistsException:
        return response(400, {'error': 'An account with this email already exists'})
    except cognito_client.exceptions.InvalidPasswordException as e:
        return response(400, {'error': 'Password does not meet requirements. Must include uppercase, lowercase, and numbers.'})
    except cognito_client.exceptions.InvalidParameterException as e:
        return response(400, {'error': str(e)})
    except Exception as e:
        print(f'Signup error: {str(e)}')
        return response(500, {'error': 'Failed to create account', 'details': str(e)})


def verify_email(event):
    """POST /verify-email - Verify email with confirmation code"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    email = body.get('email', '').strip().lower()
    code = body.get('code', '').strip()

    if not email:
        return response(400, {'error': 'Email is required'})
    if not code:
        return response(400, {'error': 'Verification code is required'})

    try:
        # Confirm signup in Cognito
        cognito_client.confirm_sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            ConfirmationCode=code
        )

        # Update user in DynamoDB to mark as verified
        # First, get the user by email to find cognito_user_id
        # We need to query by email, so let's use admin_get_user to get the sub
        user_info = cognito_client.admin_get_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=email
        )

        user_sub = None
        for attr in user_info.get('UserAttributes', []):
            if attr['Name'] == 'sub':
                user_sub = attr['Value']
                break

        if user_sub:
            timestamp = datetime.utcnow().isoformat()
            users_table.update_item(
                Key={'cognito_user_id': user_sub},
                UpdateExpression='SET email_verified = :verified, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':verified': True,
                    ':timestamp': timestamp
                }
            )
            print(f'User email verified: {email}, sub: {user_sub}')

        return response(200, {
            'success': True,
            'message': 'Email verified successfully. You can now sign in.'
        })

    except cognito_client.exceptions.CodeMismatchException:
        return response(400, {'error': 'Invalid verification code'})
    except cognito_client.exceptions.ExpiredCodeException:
        return response(400, {'error': 'Verification code has expired. Please request a new one.'})
    except cognito_client.exceptions.UserNotFoundException:
        return response(400, {'error': 'User not found'})
    except Exception as e:
        print(f'Verify email error: {str(e)}')
        return response(500, {'error': 'Verification failed', 'details': str(e)})


def resend_verification_code(event):
    """POST /resend-code - Resend email verification code"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    email = body.get('email', '').strip().lower()

    if not email:
        return response(400, {'error': 'Email is required'})

    try:
        cognito_client.resend_confirmation_code(
            ClientId=COGNITO_CLIENT_ID,
            Username=email
        )

        return response(200, {
            'success': True,
            'message': 'Verification code sent to your email'
        })

    except cognito_client.exceptions.UserNotFoundException:
        return response(400, {'error': 'User not found'})
    except cognito_client.exceptions.InvalidParameterException:
        return response(400, {'error': 'User is already verified'})
    except Exception as e:
        print(f'Resend code error: {str(e)}')
        return response(500, {'error': 'Failed to resend code', 'details': str(e)})


def login(event):
    """POST /login - Authenticate user and return tokens"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not email:
        return response(400, {'error': 'Email is required'})
    if not password:
        return response(400, {'error': 'Password is required'})

    try:
        # Authenticate with Cognito
        auth_response = cognito_client.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )

        auth_result = auth_response.get('AuthenticationResult', {})

        # Get user info from Cognito
        access_token = auth_result.get('AccessToken')
        user_info = cognito_client.get_user(AccessToken=access_token)

        # Extract user attributes
        user_data = {'email': email}
        for attr in user_info.get('UserAttributes', []):
            if attr['Name'] == 'sub':
                user_data['cognito_user_id'] = attr['Value']
            elif attr['Name'] == 'name':
                user_data['name'] = attr['Value']
            elif attr['Name'] == 'phone_number':
                user_data['phone'] = attr['Value'].replace('+91', '')
            elif attr['Name'] == 'email_verified':
                user_data['email_verified'] = attr['Value'] == 'true'

        # Update last login in DynamoDB
        if user_data.get('cognito_user_id'):
            timestamp = datetime.utcnow().isoformat()
            try:
                users_table.update_item(
                    Key={'cognito_user_id': user_data['cognito_user_id']},
                    UpdateExpression='SET last_login = :timestamp, updated_at = :timestamp',
                    ExpressionAttributeValues={
                        ':timestamp': timestamp
                    }
                )
            except Exception as db_error:
                print(f'Failed to update last login: {str(db_error)}')

        print(f'User logged in: {email}')

        return response(200, {
            'success': True,
            'message': 'Login successful',
            'user': user_data,
            'tokens': {
                'access_token': auth_result.get('AccessToken'),
                'refresh_token': auth_result.get('RefreshToken'),
                'id_token': auth_result.get('IdToken'),
                'expires_in': auth_result.get('ExpiresIn')
            }
        })

    except cognito_client.exceptions.NotAuthorizedException:
        return response(401, {'error': 'Incorrect email or password'})
    except cognito_client.exceptions.UserNotConfirmedException:
        return response(403, {
            'error': 'Email not verified',
            'code': 'USER_NOT_CONFIRMED',
            'message': 'Please verify your email before signing in'
        })
    except cognito_client.exceptions.UserNotFoundException:
        return response(401, {'error': 'No account found with this email'})
    except Exception as e:
        print(f'Login error: {str(e)}')
        return response(500, {'error': 'Login failed', 'details': str(e)})


def logout(event):
    """POST /logout - Sign out user (invalidate tokens)"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    access_token = body.get('access_token', '')

    if not access_token:
        # Check Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        if auth_header.startswith('Bearer '):
            access_token = auth_header[7:]

    if not access_token:
        return response(400, {'error': 'Access token is required'})

    try:
        # Global sign out - invalidates all tokens for the user
        cognito_client.global_sign_out(AccessToken=access_token)

        return response(200, {
            'success': True,
            'message': 'Logged out successfully'
        })

    except cognito_client.exceptions.NotAuthorizedException:
        # Token already invalid/expired - still consider it a successful logout
        return response(200, {
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        print(f'Logout error: {str(e)}')
        return response(500, {'error': 'Logout failed', 'details': str(e)})


def forgot_password(event):
    """POST /forgot-password - Initiate password reset"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    email = body.get('email', '').strip().lower()

    if not email:
        return response(400, {'error': 'Email is required'})

    try:
        cognito_client.forgot_password(
            ClientId=COGNITO_CLIENT_ID,
            Username=email
        )

        return response(200, {
            'success': True,
            'message': 'Password reset code sent to your email'
        })

    except cognito_client.exceptions.UserNotFoundException:
        # Don't reveal if user exists or not for security
        return response(200, {
            'success': True,
            'message': 'If an account exists with this email, a reset code has been sent'
        })
    except cognito_client.exceptions.InvalidParameterException:
        return response(400, {'error': 'Cannot reset password. Please verify your email first.'})
    except Exception as e:
        print(f'Forgot password error: {str(e)}')
        return response(500, {'error': 'Failed to send reset code', 'details': str(e)})


def reset_password(event):
    """POST /reset-password - Reset password with confirmation code"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    email = body.get('email', '').strip().lower()
    code = body.get('code', '').strip()
    new_password = body.get('new_password', '')

    if not email:
        return response(400, {'error': 'Email is required'})
    if not code:
        return response(400, {'error': 'Reset code is required'})
    if not new_password or len(new_password) < 8:
        return response(400, {'error': 'New password must be at least 8 characters'})

    try:
        cognito_client.confirm_forgot_password(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            ConfirmationCode=code,
            Password=new_password
        )

        return response(200, {
            'success': True,
            'message': 'Password reset successfully. You can now sign in with your new password.'
        })

    except cognito_client.exceptions.CodeMismatchException:
        return response(400, {'error': 'Invalid reset code'})
    except cognito_client.exceptions.ExpiredCodeException:
        return response(400, {'error': 'Reset code has expired. Please request a new one.'})
    except cognito_client.exceptions.InvalidPasswordException:
        return response(400, {'error': 'Password does not meet requirements. Must include uppercase, lowercase, and numbers.'})
    except Exception as e:
        print(f'Reset password error: {str(e)}')
        return response(500, {'error': 'Password reset failed', 'details': str(e)})


def get_user(event):
    """POST /get-user - Get user info from access token"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    access_token = body.get('access_token', '')

    if not access_token:
        # Check Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        if auth_header.startswith('Bearer '):
            access_token = auth_header[7:]

    if not access_token:
        return response(400, {'error': 'Access token is required'})

    try:
        # Get user info from Cognito
        user_info = cognito_client.get_user(AccessToken=access_token)

        # Extract user attributes
        user_data = {}
        for attr in user_info.get('UserAttributes', []):
            if attr['Name'] == 'sub':
                user_data['cognito_user_id'] = attr['Value']
            elif attr['Name'] == 'email':
                user_data['email'] = attr['Value']
            elif attr['Name'] == 'name':
                user_data['name'] = attr['Value']
            elif attr['Name'] == 'phone_number':
                user_data['phone'] = attr['Value'].replace('+91', '')
            elif attr['Name'] == 'email_verified':
                user_data['email_verified'] = attr['Value'] == 'true'

        # Get additional info from DynamoDB
        if user_data.get('cognito_user_id'):
            try:
                db_user = users_table.get_item(Key={'cognito_user_id': user_data['cognito_user_id']})
                if 'Item' in db_user:
                    user_data['created_at'] = db_user['Item'].get('created_at')
                    user_data['last_login'] = db_user['Item'].get('last_login')
            except Exception as db_error:
                print(f'Failed to get user from DynamoDB: {str(db_error)}')

        return response(200, {
            'success': True,
            'user': user_data
        })

    except cognito_client.exceptions.NotAuthorizedException:
        return response(401, {'error': 'Invalid or expired token'})
    except Exception as e:
        print(f'Get user error: {str(e)}')
        return response(500, {'error': 'Failed to get user info', 'details': str(e)})


def refresh_token(event):
    """POST /refresh-token - Refresh access token"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    refresh_token_value = body.get('refresh_token', '')

    if not refresh_token_value:
        return response(400, {'error': 'Refresh token is required'})

    try:
        auth_response = cognito_client.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': refresh_token_value
            }
        )

        auth_result = auth_response.get('AuthenticationResult', {})

        return response(200, {
            'success': True,
            'tokens': {
                'access_token': auth_result.get('AccessToken'),
                'id_token': auth_result.get('IdToken'),
                'expires_in': auth_result.get('ExpiresIn')
            }
        })

    except cognito_client.exceptions.NotAuthorizedException:
        return response(401, {'error': 'Invalid or expired refresh token. Please sign in again.'})
    except Exception as e:
        print(f'Refresh token error: {str(e)}')
        return response(500, {'error': 'Failed to refresh token', 'details': str(e)})


def save_google_user(event):
    """POST /google-user - Save Google OAuth user to DynamoDB"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    cognito_user_id = body.get('cognito_user_id', '').strip()
    email = body.get('email', '').strip().lower()
    name = body.get('name', '').strip()

    if not cognito_user_id:
        return response(400, {'error': 'Cognito user ID is required'})
    if not email:
        return response(400, {'error': 'Email is required'})

    try:
        timestamp = datetime.utcnow().isoformat()

        # Check if user already exists
        existing_user = users_table.get_item(Key={'cognito_user_id': cognito_user_id})

        if 'Item' in existing_user:
            # Update last login
            users_table.update_item(
                Key={'cognito_user_id': cognito_user_id},
                UpdateExpression='SET last_login = :timestamp, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':timestamp': timestamp
                }
            )
            print(f'Google user login updated: {email}')
        else:
            # Create new user
            users_table.put_item(Item={
                'cognito_user_id': cognito_user_id,
                'email': email,
                'name': name,
                'phone': 919789259032,
                'auth_provider': 'google',
                'email_verified': True,
                'created_at': timestamp,
                'updated_at': timestamp,
                'last_login': timestamp
            })
            print(f'Google user created: {email}, sub: {cognito_user_id}')

        return response(200, {
            'success': True,
            'message': 'User saved successfully'
        })

    except Exception as e:
        print(f'Save Google user error: {str(e)}')
        return response(500, {'error': 'Failed to save user', 'details': str(e)})


def get_user_orders(event):
    """POST /user-orders - Get all orders for a user"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    user_id = body.get('user_id', '').strip()

    if not user_id:
        return response(400, {'error': 'User ID is required'})

    try:
        # Scan orders table for orders with this user_id
        # Note: For production, consider adding a GSI on user_id for better performance
        scan_response = orders_table.scan(
            FilterExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )

        orders = scan_response.get('Items', [])

        # Also check nested orders in items
        all_orders = []
        for item in orders:
            if 'orders' in item:
                for order in item['orders']:
                    if order.get('user_id') == user_id:
                        all_orders.append(order)
            else:
                all_orders.append(item)

        # Sort by created_at descending (newest first)
        all_orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        # Convert Decimal to float for JSON serialization
        def convert_decimals(obj):
            if isinstance(obj, list):
                return [convert_decimals(i) for i in obj]
            elif isinstance(obj, dict):
                return {k: convert_decimals(v) for k, v in obj.items()}
            elif hasattr(obj, '__float__'):
                return float(obj)
            return obj

        orders_json = convert_decimals(all_orders)

        return response(200, {
            'success': True,
            'orders': orders_json,
            'count': len(orders_json)
        })

    except Exception as e:
        print(f'Get user orders error: {str(e)}')
        return response(500, {'error': 'Failed to fetch orders', 'details': str(e)})


def response(status_code, body):
    """Helper to create Lambda response"""
    return {
        'statusCode': status_code,
        'headers': HEADERS,
        'body': json.dumps(body)
    }
