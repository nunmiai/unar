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

# SES Email configuration
SES_SENDER_EMAIL = os.environ.get('SES_SENDER_EMAIL', 'no-reply@unar.in')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'unar.consciousliving@gmail.com')
ses_client = boto3.client('ses', region_name='us-east-1')

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
    user_id = body.get('user_id')  # Cognito user ID if logged in

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
                receipt=receipt,
                user_id=user_id
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


def create_order_in_dynamodb(phone, order_id, customer, notes, items, amount, currency, receipt, user_id=None):
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
        'user_id': user_id,  # Link to user if logged in
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

    # Send confirmation emails
    try:
        customer_email = order_details.get('customer', {}).get('email') or order_details.get('notes', {}).get('customer_email')
        customer_name = order_details.get('customer', {}).get('name') or order_details.get('notes', {}).get('customer_name', 'Customer')
        customer_address = order_details.get('customer', {}).get('address') or order_details.get('notes', {}).get('address', '')
        customer_pincode = order_details.get('customer', {}).get('pincode') or order_details.get('notes', {}).get('pincode', '')
        items = order_details.get('items', [])
        
        # Send email to customer
        if customer_email:
            send_customer_email(
                customer_email=customer_email,
                customer_name=customer_name,
                order_id=razorpay_order_id,
                payment_id=razorpay_payment_id,
                items=items,
                amount=amount,
                address=customer_address,
                pincode=customer_pincode,
                phone=phone
            )
        
        # Send email to admin
        send_admin_email(
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=phone,
            order_id=razorpay_order_id,
            payment_id=razorpay_payment_id,
            items=items,
            amount=amount,
            address=customer_address,
            pincode=customer_pincode,
            payment_method=payment_method
        )
    except Exception as e:
        print(f'Failed to send emails: {str(e)}')
        # Continue even if email fails - payment is still verified

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


def send_customer_email(customer_email, customer_name, order_id, payment_id, items, amount, address, pincode, phone):
    """Send order confirmation email to customer"""
    
    # Build items HTML
    items_html = ''
    for item in items:
        item_name = item.get('name', 'Product')
        item_qty = item.get('quantity', 1)
        item_price = item.get('price', 0)
        items_html += f'''
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e8e0d5;">{item_name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e8e0d5; text-align: center;">{item_qty}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e8e0d5; text-align: right;">₹{item_price}</td>
        </tr>'''
    
    first_name = customer_name.split()[0] if customer_name else 'Customer'
    order_short = order_id[-8:].upper() if order_id else ''
    
    html_body = f'''
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #faf8f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #5a7c65 0%, #4a6b55 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 3px;">UNAR</h1>
                <p style="color: #d4a574; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 2px;">NATURAL SOLID PERFUMES</p>
            </div>
            
            <div style="padding: 40px 30px 20px 30px;">
                <h2 style="color: #5a7c65; margin: 0 0 10px 0;">Thank you, {first_name}!</h2>
                <p style="color: #6b6b6b; line-height: 1.6;">Your order has been confirmed. Here's your order summary:</p>
            </div>
            
            <div style="background-color: #faf8f5; margin: 0 30px; padding: 20px; border-radius: 8px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #888; font-size: 13px;">Order ID</td>
                        <td style="color: #333; font-size: 13px; text-align: right; font-weight: bold;">#{order_short}</td>
                    </tr>
                    <tr>
                        <td style="color: #888; font-size: 13px; padding-top: 8px;">Payment ID</td>
                        <td style="color: #333; font-size: 13px; text-align: right; padding-top: 8px;">{payment_id}</td>
                    </tr>
                    <tr>
                        <td style="color: #888; font-size: 13px; padding-top: 8px;">Date</td>
                        <td style="color: #333; font-size: 13px; text-align: right; padding-top: 8px;">{datetime.utcnow().strftime('%d %B %Y')}</td>
                    </tr>
                </table>
            </div>
            
            <div style="padding: 30px;">
                <h3 style="color: #5a7c65; margin: 0 0 15px 0; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #faf8f5;">
                            <th style="padding: 12px; text-align: left; color: #5a7c65;">Item</th>
                            <th style="padding: 12px; text-align: center; color: #5a7c65;">Qty</th>
                            <th style="padding: 12px; text-align: right; color: #5a7c65;">Price</th>
                        </tr>
                    </thead>
                    <tbody>{items_html}</tbody>
                </table>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e8e0d5; text-align: right;">
                    <span style="color: #5a7c65; font-size: 20px; font-weight: bold;">Total: ₹{amount:.0f}</span>
                </div>
            </div>
            
            <div style="background-color: #faf8f5; margin: 0 30px; padding: 20px; border-radius: 8px;">
                <h4 style="color: #5a7c65; margin: 0 0 10px 0; font-size: 14px;">DELIVERY ADDRESS</h4>
                <p style="color: #333; margin: 0; line-height: 1.6;">
                    {customer_name}<br>{address}<br>Pincode: {pincode}<br>Phone: {phone}
                </p>
            </div>
            
            <div style="padding: 30px; text-align: center;">
                <p style="color: #d4a574; font-style: italic;">"Embrace nature's essence, one fragrance at a time."</p>
            </div>
            
            <div style="background-color: #5a7c65; padding: 25px; text-align: center;">
                <p style="color: #ffffff; margin: 0 0 5px 0; font-size: 14px;">Need help? Contact us at</p>
                <a href="mailto:unar.consciousliving@gmail.com" style="color: #d4a574; text-decoration: none;">unar.consciousliving@gmail.com</a>
                <p style="color: rgba(255,255,255,0.7); margin: 15px 0 0 0; font-size: 11px;">100% Natural | Zero Waste | Cruelty Free</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    try:
        ses_client.send_email(
            Source=f'Unar <{SES_SENDER_EMAIL}>',
            Destination={'ToAddresses': [customer_email]},
            Message={
                'Subject': {'Data': f'Order Confirmed! Your Unar Order #{order_short}', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                }
            }
        )
        print(f'Customer email sent to {customer_email}')
    except Exception as e:
        print(f'Failed to send customer email: {str(e)}')
        raise e


def send_admin_email(customer_name, customer_email, customer_phone, order_id, payment_id, items, amount, address, pincode, payment_method):
    """Send order notification email to admin"""
    
    items_text = '\n'.join([f"  - {item.get('name')} x {item.get('quantity')} @ ₹{item.get('price')}" for item in items])
    order_short = order_id[-8:].upper() if order_id else ''
    
    html_body = f'''
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #5a7c65; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px;">🛒 New Order Received!</h1>
            </div>
            
            <div style="padding: 25px;">
                <div style="background-color: #f0f7f2; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #5a7c65; margin: 0 0 10px 0; font-size: 16px;">Order #{order_short}</h2>
                    <p style="margin: 5px 0; color: #666;"><strong>Payment ID:</strong> {payment_id}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Method:</strong> {payment_method}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> <span style="font-size: 18px; color: #5a7c65; font-weight: bold;">₹{amount:.0f}</span></p>
                </div>
                
                <h3 style="color: #333; border-bottom: 2px solid #d4a574; padding-bottom: 8px;">Customer Details</h3>
                <table style="width: 100%; margin-bottom: 20px;">
                    <tr><td style="padding: 8px 0; color: #666; width: 100px;">Name:</td><td style="padding: 8px 0; color: #333; font-weight: bold;">{customer_name}</td></tr>
                    <tr><td style="padding: 8px 0; color: #666;">Phone:</td><td style="padding: 8px 0; color: #333; font-weight: bold;">{customer_phone}</td></tr>
                    <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0; color: #333;">{customer_email}</td></tr>
                    <tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Address:</td><td style="padding: 8px 0; color: #333;">{address}<br>Pincode: {pincode}</td></tr>
                </table>
                
                <h3 style="color: #333; border-bottom: 2px solid #d4a574; padding-bottom: 8px;">Products Ordered</h3>
                <ul style="color: #333; line-height: 1.8;">
                    {''.join([f"<li><strong>{item.get('name')}</strong> x {item.get('quantity')} @ ₹{item.get('price')}</li>" for item in items])}
                </ul>
                
                <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">
                    Order received on {datetime.utcnow().strftime('%d %B %Y at %H:%M UTC')}
                </p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    try:
        ses_client.send_email(
            Source=f'Unar Orders <{SES_SENDER_EMAIL}>',
            Destination={'ToAddresses': [ADMIN_EMAIL]},
            Message={
                'Subject': {'Data': f'🛒 New Order #{order_short} - ₹{amount:.0f} from {customer_name}', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                }
            }
        )
        print(f'Admin email sent to {ADMIN_EMAIL}')
    except Exception as e:
        print(f'Failed to send admin email: {str(e)}')
        raise e


def response(status_code, body):
    """Helper to create Lambda response"""
    return {
        'statusCode': status_code,
        'headers': HEADERS,
        'body': json.dumps(body)
    }