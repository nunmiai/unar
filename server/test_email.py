"""
Local test script for SES email functionality
Run: python test_email.py

Before running:
1. Configure AWS credentials (aws configure) or set environment variables:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_DEFAULT_REGION=us-east-1

2. Make sure sender email is verified in SES
3. If in SES sandbox, recipient emails must also be verified
"""

import boto3
from datetime import datetime

# Configuration - UPDATE THESE
SES_SENDER_EMAIL = 'no-reply@unar.in'  # Must be verified in SES
ADMIN_EMAIL = 'unar@unar.in'  # Your admin email
TEST_CUSTOMER_EMAIL = 'unar.consciousliving@gmail.com'  # Test customer email (must be verified if in sandbox)

# Initialize SES client
ses_client = boto3.client('ses', region_name='us-east-1')


def send_test_customer_email():
    """Send test customer order confirmation email"""
    
    # Sample order data
    customer_name = "Dhilip"
    order_id = "order_SkT9FhJnC1YErG"
    payment_id = "pay_TEST123456"
    phone = "9789259032"
    address = "123 Test Street, Chennai"
    pincode = "600001"
    amount = 499
    items = [
        {'name': 'Jasmine Solid Perfume', 'quantity': 1, 'price': 499}
    ]
    
    # Build items HTML
    items_html = ''
    for item in items:
        items_html += f'''
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e8e0d5;">{item['name']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e8e0d5; text-align: center;">{item['quantity']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e8e0d5; text-align: right;">₹{item['price']}</td>
        </tr>'''
    
    first_name = customer_name.split()[0]
    order_short = order_id[-8:].upper()
    
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
                    <span style="color: #5a7c65; font-size: 20px; font-weight: bold;">Total: ₹{amount}</span>
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
        response = ses_client.send_email(
            Source=f'Unar <{SES_SENDER_EMAIL}>',
            Destination={'ToAddresses': [TEST_CUSTOMER_EMAIL]},
            Message={
                'Subject': {'Data': f'Order Confirmed! Your Unar Order #{order_short}', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                }
            }
        )
        print(f'✅ Customer email sent successfully!')
        print(f'   Message ID: {response["MessageId"]}')
        print(f'   Sent to: {TEST_CUSTOMER_EMAIL}')
        return True
    except Exception as e:
        print(f'❌ Failed to send customer email: {str(e)}')
        return False


def send_test_admin_email():
    """Send test admin notification email"""
    
    # Sample order data
    customer_name = "Dhilip"
    customer_email = TEST_CUSTOMER_EMAIL
    customer_phone = "9789259032"
    order_id = "order_SkT9FhJnC1YErG"
    payment_id = "pay_TEST123456"
    address = "123 Test Street, Chennai"
    pincode = "600001"
    amount = 499
    payment_method = "upi"
    items = [
        {'name': 'Jasmine Solid Perfume', 'quantity': 1, 'price': 499}
    ]
    
    order_short = order_id[-8:].upper()
    
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
                    <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> <span style="font-size: 18px; color: #5a7c65; font-weight: bold;">₹{amount}</span></p>
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
                    {''.join([f"<li><strong>{item['name']}</strong> x {item['quantity']} @ ₹{item['price']}</li>" for item in items])}
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
        response = ses_client.send_email(
            Source=f'Unar Orders <{SES_SENDER_EMAIL}>',
            Destination={'ToAddresses': [ADMIN_EMAIL]},
            Message={
                'Subject': {'Data': f'🛒 New Order #{order_short} - ₹{amount} from {customer_name}', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                }
            }
        )
        print(f'✅ Admin email sent successfully!')
        print(f'   Message ID: {response["MessageId"]}')
        print(f'   Sent to: {ADMIN_EMAIL}')
        return True
    except Exception as e:
        print(f'❌ Failed to send admin email: {str(e)}')
        return False


def check_ses_status():
    """Check SES account status and verified emails"""
    print("\n📧 Checking SES Status...")
    print("-" * 40)
    
    try:
        # Get send quota
        quota = ses_client.get_send_quota()
        print(f"Send Quota: {quota['Max24HourSend']:.0f} emails/day")
        print(f"Sent Last 24h: {quota['SentLast24Hours']:.0f}")
        print(f"Send Rate: {quota['MaxSendRate']:.0f} emails/sec")
        
        # List verified identities
        identities = ses_client.list_identities(IdentityType='EmailAddress')
        print(f"\nVerified Emails:")
        for email in identities.get('Identities', []):
            print(f"  ✓ {email}")
        
        if not identities.get('Identities'):
            print("  (No verified emails found)")
            print("\n⚠️  You need to verify at least the sender email!")
            
    except Exception as e:
        print(f"❌ Error checking SES status: {str(e)}")
        print("\nMake sure you have AWS credentials configured:")
        print("  aws configure")


if __name__ == '__main__':
    print("=" * 50)
    print("  UNAR Email Test Script")
    print("=" * 50)
    
    # Check SES status first
    check_ses_status()
    
    print("\n" + "=" * 50)
    print("  Sending Test Emails")
    print("=" * 50 + "\n")
    
    # Ask user which email to send
    print("Which email would you like to test?")
    print("1. Customer confirmation email")
    print("2. Admin notification email")
    print("3. Both emails")
    print("4. Exit")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    print()
    
    if choice == '1':
        send_test_customer_email()
    elif choice == '2':
        send_test_admin_email()
    elif choice == '3':
        send_test_customer_email()
        print()
        send_test_admin_email()
    elif choice == '4':
        print("Exiting...")
    else:
        print("Invalid choice")
    
    print("\n" + "=" * 50)
