# lambda_function.py
import json
import os
import hmac
import hashlib
import urllib.request
import base64
from datetime import datetime

# Razorpay credentials - set as Lambda environment variables
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')

# CORS headers
HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
}


def lambda_handler(event, context):
    """Main Lambda handler with path-based routing"""
    
    # Handle CORS preflight
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}
    
    # Get path
    path = event.get('path') or event.get('rawPath') or ''
    
    try:
        # Route based on path
        if path.endswith('/create-order'):
            return create_order(event)
        elif path.endswith('/verify-payment'):
            return verify_payment(event)
        else:
            return response(404, {'error': 'Route not found', 'path': path})
    
    except Exception as e:
        print(f'Error: {str(e)}')
        return response(500, {'error': 'Internal server error', 'message': str(e)})


def create_order(event):
    """POST /create-order - Create Razorpay order"""
    
    body = json.loads(event.get('body') or '{}')
    amount = body.get('amount')
    currency = body.get('currency', 'INR')
    receipt = body.get('receipt', f'order_{int(datetime.now().timestamp())}')
    notes = body.get('notes', {})
    
    if not amount:
        return response(400, {'error': 'Amount is required'})
    
    # Prepare order data
    order_data = {
        'amount': int(amount * 100),  # Convert to paise
        'currency': currency,
        'receipt': receipt,
        'notes': notes
    }
    
    # Create order using Razorpay API
    try:
        result = razorpay_request('POST', '/v1/orders', order_data)
        
        return response(200, {
            'success': True,
            'order_id': result['id'],
            'amount': result['amount'],
            'currency': result['currency'],
            'key_id': RAZORPAY_KEY_ID
        })
    
    except Exception as e:
        return response(500, {'error': 'Failed to create order', 'details': str(e)})


def verify_payment(event):
    """POST /verify-payment - Verify payment signature"""
    
    body = json.loads(event.get('body') or '{}')
    razorpay_order_id = body.get('razorpay_order_id')
    razorpay_payment_id = body.get('razorpay_payment_id')
    razorpay_signature = body.get('razorpay_signature')
    order_details = body.get('order_details', {})
    
    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return response(400, {'error': 'Missing payment verification parameters'})
    
    # Verify signature
    message = f'{razorpay_order_id}|{razorpay_payment_id}'
    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    is_valid = hmac.compare_digest(generated_signature, razorpay_signature)
    
    if not is_valid:
        return response(400, {
            'success': False,
            'error': 'Invalid payment signature'
        })
    
    # Payment verified - log order details (save to DB in production)
    print(f'Payment verified: order_id={razorpay_order_id}, payment_id={razorpay_payment_id}')
    print(f'Order details: {json.dumps(order_details)}')
    
    # Fetch payment details from Razorpay
    try:
        payment_details = razorpay_request('GET', f'/v1/payments/{razorpay_payment_id}')
        
        return response(200, {
            'success': True,
            'message': 'Payment verified successfully',
            'payment_id': razorpay_payment_id,
            'order_id': razorpay_order_id,
            'status': payment_details.get('status'),
            'method': payment_details.get('method'),
            'amount': payment_details.get('amount', 0) / 100
        })
    
    except Exception as e:
        # Still return success if signature verified, even if fetch fails
        return response(200, {
            'success': True,
            'message': 'Payment verified successfully',
            'payment_id': razorpay_payment_id,
            'order_id': razorpay_order_id
        })


def razorpay_request(method, endpoint, data=None):
    """Make authenticated request to Razorpay API"""
    
    url = f'https://api.razorpay.com{endpoint}'
    
    # Basic auth
    credentials = f'{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}'
    auth_header = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Basic {auth_header}'
    }
    
    # Prepare request
    if data:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    
    # Make request
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))


def response(status_code, body):
    """Helper to create Lambda response"""
    return {
        'statusCode': status_code,
        'headers': HEADERS,
        'body': json.dumps(body)
    }


      "body": "{\"success\": true, \"order_id\": \"order_SjHO9U29wdLJrf\", \"amount\": 129900, \"currency\": \"INR\", \"key_id\": \"rzp_test_SjFCQqG5RKXMK3\"}"
