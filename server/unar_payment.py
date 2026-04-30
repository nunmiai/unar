# lambda_function.py
import json
import os
import hmac
import hashlib
import urllib.request
import base64
import boto3
from datetime import datetime
from decimal import Decimal

# Razorpay credentials - set as Lambda environment variables
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')

# DynamoDB setup
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'user_payment_details')
dynamodb = boto3.resource('dynamodb')
orders_table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# CORS headers
HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
        elif '/fetch-order' in path:
            return fetch_order(event)
        else:
            return response(404, {'error': 'Route not found', 'path': path})

    except Exception as e:
        print(f'Error: {str(e)}')
        return response(500, {'error': 'Internal server error', 'message': str(e)})


def create_order(event):
    """POST /create-order - Create Razorpay order and save to DynamoDB"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})
    amount = body.get('amount')
    currency = body.get('currency', 'INR')
    receipt = body.get('receipt', f'order_{int(datetime.now().timestamp())}')
    notes = body.get('notes', {})
    customer = body.get('customer', {})
    items = body.get('items', [])

    if not amount:
        return response(400, {'error': 'Amount is required'})

    # Validate phone number
    phone = notes.get('customer_phone') or customer.get('phone')
    if not phone:
        return response(400, {'error': 'Phone number is required'})

    # Prepare order data for Razorpay
    order_data = {
        'amount': int(amount * 100),  # Convert to paise
        'currency': currency,
        'receipt': receipt,
        'notes': notes
    }

    # Create order using Razorpay API
    try:
        result = razorpay_request('POST', '/v1/orders', order_data)
        order_id = result['id']

        # Save initial order to DynamoDB with 'pending' status
        try:
            create_order_in_dynamodb(
                phone=phone,
                order_id=order_id,
                customer=customer,
                notes=notes,
                items=items,
                amount=amount,
                currency=currency,
                receipt=receipt
            )
        except Exception as db_error:
            print(f'Failed to save initial order to DynamoDB: {str(db_error)}')
            # Continue even if DB save fails - order is still created in Razorpay

        return response(200, {
            'success': True,
            'order_id': order_id,
            'amount': result['amount'],
            'currency': result['currency'],
            'key_id': RAZORPAY_KEY_ID
        })

    except Exception as e:
        return response(500, {'error': 'Failed to create order', 'details': str(e)})


def create_order_in_dynamodb(phone, order_id, customer, notes, items, amount, currency, receipt):
    """Create initial order entry in DynamoDB with pending status"""

    timestamp = datetime.utcnow().isoformat()

    # Convert items to DynamoDB-compatible format
    items_data = []
    for item in items:
        items_data.append({
            'name': item.get('name', ''),
            'price': Decimal(str(item.get('price', 0))),
            'quantity': item.get('quantity', 1),
            'image': item.get('image', '')
        })

    # Create order record with pending status
    order_record = {
        'order_id': order_id,
        'payment_id': None,
        'customer_name': notes.get('customer_name') or customer.get('name', ''),
        'customer_email': notes.get('customer_email') or customer.get('email', ''),
        'mobile_number': phone,
        'address': notes.get('address') or customer.get('address', ''),
        'pincode': notes.get('pincode') or customer.get('pincode', ''),
        'items': items_data,
        'items_summary': notes.get('items', ''),
        'amount': Decimal(str(amount)),
        'currency': currency,
        'receipt': receipt,
        'payment_status': 'pending',
        'payment_method': None,
        'order_status': 'created',
        'created_at': timestamp,
        'updated_at': timestamp
    }

    # Check if phone exists and append or create
    try:
        existing = orders_table.get_item(Key={'order_id': order_id})

        if 'Item' in existing:
            # Phone exists - append to order history
            orders_table.update_item(
                Key={'order_id': order_id},
                UpdateExpression='SET orders = list_append(if_not_exists(orders, :empty_list), :new_order), updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':new_order': [order_record],
                    ':empty_list': [],
                    ':timestamp': timestamp
                }
            )
        else:
            # New phone - create record with orders list
            orders_table.put_item(Item={
                'order_id':order_id,
                'mobile_number': phone,
                'customer_name': order_record['customer_name'],
                'customer_email': order_record['customer_email'],
                'orders': [order_record],
                'created_at': timestamp,
                'updated_at': timestamp
            })
    except Exception as e:
        print(f'Create order DB error: {str(e)}')
        # Fallback: just put the item
        orders_table.put_item(Item={
            'mobile_number': phone,
            'customer_name': order_record['customer_name'],
            'customer_email': order_record['customer_email'],
            'orders': [order_record],
            'created_at': timestamp,
            'updated_at': timestamp
        })

    print(f'Order created in DynamoDB: mobile_number={phone}, order_id={order_id}, status=pending')
    return True


def fetch_order(event):
    """GET /fetch-order/<order_id> - Fetch order status from Razorpay"""

    # Get order_id from path or query params
    path = event.get('path') or event.get('rawPath') or ''
    query_params = event.get('queryStringParameters') or {}

    # Try to extract order_id from path: /fetch-order/order_xxx
    order_id = None
    if '/fetch-order/' in path:
        order_id = path.split('/fetch-order/')[-1].strip('/')

    # Fallback to query param: /fetch-order?order_id=order_xxx
    if not order_id:
        order_id = query_params.get('order_id')

    # Also check POST body
    if not order_id and event.get('body'):
        raw_body=event.get('body')
        body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})
        order_id = body.get('order_id')

    if not order_id:
        return response(400, {'error': 'order_id is required'})

    try:
        # Fetch order from Razorpay
        order = razorpay_request('GET', f'/v1/orders/{order_id}')

        return response(200, {
            'success': True,
            'order_id': order.get('id'),
            'amount': order.get('amount', 0) / 100,  # Convert paise to rupees
            'amount_paid': order.get('amount_paid', 0) / 100,
            'amount_due': order.get('amount_due', 0) / 100,
            'currency': order.get('currency'),
            'receipt': order.get('receipt'),
            'status': order.get('status'),  # created, attempted, paid
            'attempts': order.get('attempts'),
            'notes': order.get('notes'),
            'created_at': order.get('created_at')
        })

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        error_data = json.loads(error_body) if error_body else {}
        return response(e.code, {
            'success': False,
            'error': error_data.get('error', {}).get('description', 'Failed to fetch order'),
            'code': error_data.get('error', {}).get('code')
        })

    except Exception as e:
        return response(500, {'error': 'Failed to fetch order', 'details': str(e)})


def verify_payment(event):
    """POST /verify-payment - Verify payment signature and update order status in DynamoDB"""

    raw_body = event.get('body')
    body = json.loads(raw_body or '{}') if isinstance(raw_body, str) else (raw_body or {})

    razorpay_order_id = body.get('razorpay_order_id')
    razorpay_payment_id = body.get('razorpay_payment_id')
    razorpay_signature = body.get('razorpay_signature')
    order_details = body.get('order_details', {})

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return response(400, {'error': 'Missing payment verification parameters'})

    # Validate phone number is present
    customer = order_details.get('customer', {})
    phone = customer.get('phone')
    if not phone:
        return response(400, {'error': 'Phone number is required'})

    # Verify signature
    message = f'{razorpay_order_id}|{razorpay_payment_id}'
    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    is_valid = hmac.compare_digest(generated_signature, razorpay_signature)

    if not is_valid:
        # Update order status to failed
        try:
            update_order_status_in_dynamodb(
                phone=phone,
                order_id=razorpay_order_id,
                payment_id=razorpay_payment_id,
                payment_status='failed',
                payment_method=None,
                order_status='payment_failed'
            )
        except Exception as e:
            print(f'Failed to update failed status: {str(e)}')

        return response(400, {
            'success': False,
            'error': 'Invalid payment signature'
        })

    # Payment verified - log order details
    print(f'Payment verified: order_id={razorpay_order_id}, payment_id={razorpay_payment_id}')
    print(f'Order details: {json.dumps(order_details)}')

    # Fetch payment details from Razorpay
    try:
        payment_details = razorpay_request('GET', f'/v1/payments/{razorpay_payment_id}')
        payment_status = payment_details.get('status')
        payment_method = payment_details.get('method')
        amount = payment_details.get('amount', 0) / 100
    except Exception as e:
        print(f'Failed to fetch payment details: {str(e)}')
        payment_status = 'captured'
        payment_method = 'unknown'
        amount = order_details.get('total', 0)

    # Update order status in DynamoDB
    try:
        update_order_status_in_dynamodb(
            phone=phone,
            order_id=razorpay_order_id,
            payment_id=razorpay_payment_id,
            payment_status=payment_status,
            payment_method=payment_method,
            order_status='confirmed',
            amount=amount,
            items=order_details.get('items', [])
        )
    except Exception as e:
        print(f'Failed to update order in DynamoDB: {str(e)}')
        # Continue even if DB update fails - payment is still verified

    return response(200, {
        'success': True,
        'message': 'Payment verified successfully',
        'payment_id': razorpay_payment_id,
        'order_id': razorpay_order_id,
        'status': payment_status,
        'method': payment_method,
        'amount': amount
    })


def update_order_status_in_dynamodb(phone, order_id, payment_id, payment_status, payment_method, order_status, amount=None, items=None):
    """Update existing order status in DynamoDB"""

    timestamp = datetime.utcnow().isoformat()

    try:
        # Get existing record
        existing = orders_table.get_item(Key={'order_id': order_id})

        if 'Item' not in existing:
            print(f'No existing order found for mobile_number={phone}, order_id={order_id}')
            return False

        orders = existing['Item'].get('orders', [])

        # Find and update the matching order
        order_found = False
        for i, order in enumerate(orders):
            if order.get('order_id') == order_id:
                orders[i]['payment_id'] = payment_id
                orders[i]['payment_status'] = payment_status
                orders[i]['payment_method'] = payment_method
                orders[i]['order_status'] = order_status
                orders[i]['updated_at'] = timestamp

                # Update amount if provided
                if amount is not None:
                    orders[i]['amount'] = Decimal(str(amount))

                # Update items if provided
                if items:
                    items_data = []
                    for item in items:
                        items_data.append({
                            'name': item.get('name', ''),
                            'price': Decimal(str(item.get('price', 0))),
                            'quantity': item.get('quantity', 1),
                            'image': item.get('image', '')
                        })
                    orders[i]['items'] = items_data

                order_found = True
                break

        if not order_found:
            print(f'Order not found in list: mobile_number={phone}, order_id={order_id}')
            return False

        # Update the orders list in DynamoDB
        orders_table.update_item(
            Key={'order_id': order_id},
            UpdateExpression='SET orders = :orders, updated_at = :timestamp',
            ExpressionAttributeValues={
                ':orders': orders,
                ':timestamp': timestamp
            }
        )

        print(f'Order updated in DynamoDB: mobile_number={phone}, order_id={order_id}, status={order_status}')
        return True
        
    except Exception as e:
        print(f'Error updating order status: {str(e)}')
        raise e


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