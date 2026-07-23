# unar_coupon.py — Coupon Management Lambda
#
# Deploy this as a SEPARATE Lambda function with its own Function URL.
#
# DynamoDB Table: unar_coupons
#   PK: coupon_code (String)
#
# Environment Variables (set on this Lambda):
#   COUPONS_TABLE_NAME  — default: "unar_coupons"
#   ADMIN_SECRET_KEY    — secret for X-Admin-Key header (admin routes)
#
# Routes:
#   GET  /coupon/list-default — Public: list all active default coupons for display in UI
#   POST /coupon/create       — Admin: create a new coupon
#   POST /coupon/assign       — Admin: assign coupon to specific email(s)
#   POST /coupon/validate     — Public: validate coupon before checkout
#   POST /coupon/mark-used    — Admin (called by payment Lambda): record usage
#
# Default coupon behaviour:
#   is_default=true  → usable by ANYONE, UNLIMITED times (never locked)
#   is_default=false → user-specific, single-use (locked after first redemption)

import json
import os
import hmac
import secrets
import boto3
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

# ── DynamoDB ──────────────────────────────────────────────────────────────────
COUPONS_TABLE_NAME = os.environ.get('COUPONS_TABLE_NAME', 'unar_coupons')
dynamodb = boto3.resource('dynamodb')
coupons_table = dynamodb.Table(COUPONS_TABLE_NAME)

# ── Admin key ─────────────────────────────────────────────────────────────────
ADMIN_SECRET_KEY = os.environ.get('ADMIN_SECRET_KEY', '')

# ── CORS headers ─────────────────────────────────────────────────────────────
HEADERS = {
    # 'Content-Type': 'application/json',
    # 'Access-Control-Allow-Origin': '*',
    # 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Key',
    # 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}


# ── Main handler ──────────────────────────────────────────────────────────────

def lambda_handler(event, context):
    """Main Lambda handler with path-based routing."""

    # Handle CORS preflight
    http_method = (
        event.get('httpMethod')
        or event.get('requestContext', {}).get('http', {}).get('method', '')
    )
    if http_method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    path = event.get('path') or event.get('rawPath') or ''

    try:
        if path.endswith('/coupon/list-default'):
            return list_default_coupons(event)
        elif path.endswith('/coupon/list-all'):
            return list_all_coupons(event)
        elif path.endswith('/coupon/create'):
            return create_coupon(event)
        elif path.endswith('/coupon/assign'):
            return assign_coupon(event)
        elif path.endswith('/coupon/update'):
            return update_coupon(event)
        elif path.endswith('/coupon/validate'):
            return validate_coupon(event)
        elif path.endswith('/coupon/mark-used'):
            return mark_coupon_used(event)
        else:
            return response(404, {'error': 'Route not found', 'path': path})

    except Exception as e:
        print(f'Unhandled error: {str(e)}')
        return response(500, {'error': 'Internal server error', 'message': str(e)})


# ── Admin key check ───────────────────────────────────────────────────────────

def _check_admin_key(event):
    """Return True if the request carries a valid X-Admin-Key header."""
    if not ADMIN_SECRET_KEY:
        # No key configured — deny all admin routes for safety
        return False
    headers = event.get('headers') or {}
    # API Gateway may lowercase header names
    provided = headers.get('X-Admin-Key') or headers.get('x-admin-key') or ''
    return hmac.compare_digest(provided, ADMIN_SECRET_KEY)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_body(event):
    raw = event.get('body')
    return json.loads(raw or '{}') if isinstance(raw, str) else (raw or {})


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Route: POST /coupon/create ────────────────────────────────────────────────

def create_coupon(event):
    """
    Admin-only (requires X-Admin-Key header).

    Body:
      coupon_code      (optional) — 10-char hex; auto-generated if absent
      discount_percent (required) — integer 1-100
      valid_until      (required) — ISO 8601 UTC e.g. "2026-12-31T23:59:59"
      is_default       (optional, default true)  — true = any user can use it
      assigned_emails  (optional, default [])    — restrict to these emails
      description      (optional) — human-readable label

    Returns:
      { success, coupon_code, discount_percent, valid_until, is_default, description }
    """
    if not _check_admin_key(event):
        return response(403, {'error': 'Forbidden — invalid or missing admin key'})

    body = _parse_body(event)

    discount_percent = body.get('discount_percent')
    valid_until = body.get('valid_until')

    if discount_percent is None or valid_until is None:
        return response(400, {'error': '"discount_percent" and "valid_until" are required'})

    try:
        discount_int = int(discount_percent)
        if not (1 <= discount_int <= 100):
            raise ValueError
    except (ValueError, TypeError):
        return response(400, {'error': '"discount_percent" must be an integer between 1 and 100'})

    # Validate valid_until is a parseable date
    try:
        datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
    except Exception:
        return response(400, {'error': '"valid_until" must be a valid ISO 8601 datetime string'})

    is_default = body.get('is_default', True)
    assigned_emails = [e.strip().lower() for e in body.get('assigned_emails', [])]
    description = body.get('description', '').strip()

    # Auto-generate a 10-character uppercase hex code if not provided
    coupon_code = (body.get('coupon_code') or '').strip().upper()
    if not coupon_code:
        coupon_code = secrets.token_hex(5).upper()  # e.g. "A1B2C3D4E5"

    # Reject duplicate coupon codes
    existing = coupons_table.get_item(Key={'coupon_code': coupon_code})
    if 'Item' in existing:
        return response(409, {'error': f'Coupon code "{coupon_code}" already exists'})

    item = {
        'coupon_code': coupon_code,
        'discount_percent': Decimal(str(discount_int)),
        'valid_until': valid_until,
        'is_default': is_default,
        'assigned_emails': assigned_emails,
        'is_redeemed': False,
        'redeemed_by': None,
        'redeemed_at': None,
        'description': description,
        'created_at': _now_iso(),
    }
    coupons_table.put_item(Item=item)
    print(f'[create_coupon] Created {coupon_code} | {discount_int}% off | valid until {valid_until}')

    return response(200, {
        'success': True,
        'coupon_code': coupon_code,
        'discount_percent': discount_int,
        'valid_until': valid_until,
        'is_default': is_default,
        'description': description,
    })


# ── Route: POST /coupon/assign ────────────────────────────────────────────────

def assign_coupon(event):
    """
    Admin-only (requires X-Admin-Key header).
    Appends email(s) to a coupon's assigned_emails list and makes it user-specific.

    Body:
      coupon_code (required)
      emails      (required) — list of email strings

    Returns:
      { success, coupon_code, assigned_emails }
    """
    if not _check_admin_key(event):
        return response(403, {'error': 'Forbidden — invalid or missing admin key'})

    body = _parse_body(event)
    coupon_code = (body.get('coupon_code') or '').strip().upper()
    new_emails = [e.strip().lower() for e in body.get('emails', [])]

    if not coupon_code or not new_emails:
        return response(400, {'error': '"coupon_code" and "emails" are required'})

    existing = coupons_table.get_item(Key={'coupon_code': coupon_code})
    if 'Item' not in existing:
        return response(404, {'error': f'Coupon "{coupon_code}" not found'})

    current_emails = [e.lower() for e in existing['Item'].get('assigned_emails', [])]
    merged = list(set(current_emails) | set(new_emails))

    coupons_table.update_item(
        Key={'coupon_code': coupon_code},
        UpdateExpression='SET assigned_emails = :emails, is_default = :is_def',
        ExpressionAttributeValues={
            ':emails': merged,
            ':is_def': False,  # Assigning to users makes it user-specific
        }
    )
    print(f'[assign_coupon] {coupon_code} assigned to: {new_emails}')

    return response(200, {
        'success': True,
        'coupon_code': coupon_code,
        'assigned_emails': merged,
    })


# ── Route: POST /coupon/validate ──────────────────────────────────────────────

def validate_coupon(event):
    """
    Public route — no auth required (called from the checkout UI).

    Body:
      coupon_code (required)
      email       (optional) — user's email, needed for user-specific coupons

    Validation order:
      1. Coupon exists
      2. Not expired (valid_until > now)
      3. If user-specific: email must be in assigned_emails
      4. Not already redeemed globally (is_redeemed == false)

    Returns on success:
      { success: true, coupon_code, discount_percent, description }

    Returns on failure:
      { success: false, error: "<message>", reason: "<code>" }
      reason values: "not_found" | "expired" | "not_assigned" | "already_redeemed"
    """
    body = _parse_body(event)
    coupon_code = (body.get('coupon_code') or '').strip().upper()
    email = (body.get('email') or '').strip().lower()

    if not coupon_code:
        return response(400, {'error': '"coupon_code" is required'})

    # 1. Fetch coupon
    result = coupons_table.get_item(Key={'coupon_code': coupon_code})
    if 'Item' not in result:
        return response(200, {
            'success': False,
            'error': 'Invalid coupon code',
            'reason': 'not_found',
        })

    coupon = result['Item']

    # 2. Expiry check
    try:
        valid_until_dt = datetime.fromisoformat(
            coupon['valid_until'].replace('Z', '+00:00')
        )
        if datetime.now(timezone.utc) > valid_until_dt:
            return response(200, {
                'success': False,
                'error': 'This coupon has expired',
                'reason': 'expired',
            })
    except Exception as e:
        print(f'[validate_coupon] Date parse error: {e} — skipping expiry check')

    # 3. User-specific check
    is_default = coupon.get('is_default', True)
    if not is_default:
        assigned_emails = [e.lower() for e in coupon.get('assigned_emails', [])]
        if not email or email not in assigned_emails:
            return response(200, {
                'success': False,
                'error': 'This coupon is not valid for your account',
                'reason': 'not_assigned',
            })

    # 4. Single-use check — ONLY for user-specific coupons.
    #    Default coupons (is_default=True) are UNLIMITED — skip this check.
    if not is_default and coupon.get('is_redeemed', False):
        return response(200, {
            'success': False,
            'error': 'This coupon has already been redeemed',
            'reason': 'already_redeemed',
        })

    discount_percent = int(coupon.get('discount_percent', 0))
    description = coupon.get('description', '')
    print(f'[validate_coupon] {coupon_code} valid for {email or "any"} — {discount_percent}% off')

    return response(200, {
        'success': True,
        'coupon_code': coupon_code,
        'discount_percent': discount_percent,
        'description': description,
    })


# ── Route: POST /coupon/mark-used ─────────────────────────────────────────────

def mark_coupon_used(event):
    """
    Admin-only (requires X-Admin-Key header).
    Called by the payment Lambda after a successful Razorpay payment.

    Atomically sets:
      is_redeemed = true
      redeemed_by = email
      redeemed_at = now (ISO UTC)

    Body:
      coupon_code (required)
      email       (required) — email of the person who paid

    Returns:
      { success, coupon_code, redeemed_by, redeemed_at }
    """
    if not _check_admin_key(event):
        return response(403, {'error': 'Forbidden — invalid or missing admin key'})

    body = _parse_body(event)
    coupon_code = (body.get('coupon_code') or '').strip().upper()
    email = (body.get('email') or '').strip().lower()

    if not coupon_code or not email:
        return response(400, {'error': '"coupon_code" and "email" are required'})

    existing = coupons_table.get_item(Key={'coupon_code': coupon_code})
    if 'Item' not in existing:
        return response(404, {'error': f'Coupon "{coupon_code}" not found'})

    coupon = existing['Item']
    is_default = coupon.get('is_default', True)

    # ── Default coupons: unlimited use ────────────────────────────────────────
    # Never lock a default coupon. Just increment the usage counter for analytics.
    if is_default:
        now = _now_iso()
        try:
            coupons_table.update_item(
                Key={'coupon_code': coupon_code},
                UpdateExpression='SET usage_count = if_not_exists(usage_count, :zero) + :one, last_used_at = :ts',
                ExpressionAttributeValues={':zero': 0, ':one': 1, ':ts': now},
            )
        except Exception as e:
            print(f'[mark_coupon_used] Failed to increment usage_count for default coupon: {e}')
        print(f'[mark_coupon_used] Default coupon {coupon_code} used by {email} (unlimited)')
        return response(200, {
            'success': True,
            'coupon_code': coupon_code,
            'is_default': True,
            'message': 'Default coupon — usage recorded, not locked',
        })

    # ── User-specific coupons: single-use lock ────────────────────────────────
    # Idempotency: if already redeemed, log and return success (no-op)
    if coupon.get('is_redeemed', False):
        print(f'[mark_coupon_used] WARNING: {coupon_code} already redeemed by '
              f'{coupon.get("redeemed_by")} — skipping')
        return response(200, {
            'success': True,
            'coupon_code': coupon_code,
            'already_redeemed': True,
            'redeemed_by': coupon.get('redeemed_by'),
            'redeemed_at': coupon.get('redeemed_at'),
        })

    now = _now_iso()
    coupons_table.update_item(
        Key={'coupon_code': coupon_code},
        UpdateExpression='SET is_redeemed = :t, redeemed_by = :email, redeemed_at = :ts',
        ExpressionAttributeValues={
            ':t': True,
            ':email': email,
            ':ts': now,
        }
    )
    print(f'[mark_coupon_used] {coupon_code} marked redeemed by {email} at {now}')

    return response(200, {
        'success': True,
        'coupon_code': coupon_code,
        'redeemed_by': email,
        'redeemed_at': now,
    })


# ── Route: GET /coupon/list-all ──────────────────────────────────────────────

def list_all_coupons(event):
    """
    Admin-only (requires X-Admin-Key header).
    Returns ALL coupons (default + user-specific) with full details.
    Used exclusively by the admin dashboard.

    Returns:
      { success, coupons: [{
          coupon_code, discount_percent, description, valid_until,
          is_default, assigned_emails, is_redeemed, redeemed_by,
          redeemed_at, usage_count, status, created_at
        }]
      }
      status values: "active" | "expired" | "redeemed"
      Sorted: active first → expired → redeemed
    """
    if not _check_admin_key(event):
        return response(403, {'error': 'Forbidden — invalid or missing admin key'})

    now = datetime.now(timezone.utc)
    try:
        result = coupons_table.scan()
        items = result.get('Items', [])

        while 'LastEvaluatedKey' in result:
            result = coupons_table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
            items.extend(result.get('Items', []))

        coupons = []
        for item in items:
            # Compute status
            try:
                valid_until_dt = datetime.fromisoformat(
                    item.get('valid_until', '').replace('Z', '+00:00')
                )
                expired = now > valid_until_dt
            except Exception:
                expired = False

            if item.get('is_redeemed', False):
                status = 'redeemed'
            elif expired:
                status = 'expired'
            else:
                status = 'active'

            coupons.append({
                'coupon_code': item.get('coupon_code', ''),
                'discount_percent': int(item.get('discount_percent', 0)),
                'description': item.get('description', ''),
                'valid_until': item.get('valid_until', ''),
                'is_default': item.get('is_default', True),
                'assigned_emails': item.get('assigned_emails', []),
                'is_redeemed': item.get('is_redeemed', False),
                'redeemed_by': item.get('redeemed_by'),
                'redeemed_at': item.get('redeemed_at'),
                'usage_count': int(item.get('usage_count', 0)),
                'last_used_at': item.get('last_used_at'),
                'created_at': item.get('created_at', ''),
                'status': status,
            })

        # Sort: active first, then expired, then redeemed
        order = {'active': 0, 'expired': 1, 'redeemed': 2}
        coupons.sort(key=lambda x: (order.get(x['status'], 9), x.get('created_at', '')))

        print(f'[list_all_coupons] Returning {len(coupons)} coupons to admin')
        return response(200, {'success': True, 'coupons': coupons})

    except Exception as e:
        print(f'[list_all_coupons] Error: {str(e)}')
        return response(500, {'error': 'Failed to fetch coupons', 'message': str(e)})


# ── Route: POST /coupon/update ────────────────────────────────────────────────

def update_coupon(event):
    """
    Admin-only (requires X-Admin-Key header).
    Modifies mutable fields on an existing coupon.
    coupon_code is the PK — it cannot be changed.

    Body:
      coupon_code      (required)
      discount_percent (optional)
      valid_until      (optional) — ISO 8601 UTC
      description      (optional)
      is_default       (optional) — changing true→false makes it user-specific

    Returns:
      { success, coupon_code, updated_fields }
    """
    if not _check_admin_key(event):
        return response(403, {'error': 'Forbidden — invalid or missing admin key'})

    body = _parse_body(event)
    coupon_code = (body.get('coupon_code') or '').strip().upper()
    if not coupon_code:
        return response(400, {'error': '"coupon_code" is required'})

    # Fetch existing coupon
    existing = coupons_table.get_item(Key={'coupon_code': coupon_code})
    if 'Item' not in existing:
        return response(404, {'error': f'Coupon "{coupon_code}" not found'})

    update_parts = []
    expr_values = {}
    updated_fields = {}

    if 'discount_percent' in body:
        try:
            dp = int(body['discount_percent'])
            if not (1 <= dp <= 100):
                raise ValueError
        except (ValueError, TypeError):
            return response(400, {'error': '"discount_percent" must be an integer between 1 and 100'})
        update_parts.append('discount_percent = :dp')
        expr_values[':dp'] = dp
        updated_fields['discount_percent'] = dp

    if 'valid_until' in body:
        try:
            datetime.fromisoformat(body['valid_until'].replace('Z', '+00:00'))
        except Exception:
            return response(400, {'error': '"valid_until" must be a valid ISO 8601 datetime string'})
        update_parts.append('valid_until = :vu')
        expr_values[':vu'] = body['valid_until']
        updated_fields['valid_until'] = body['valid_until']

    if 'description' in body:
        desc = str(body['description']).strip()
        update_parts.append('description = :desc')
        expr_values[':desc'] = desc
        updated_fields['description'] = desc

    if 'is_default' in body:
        is_def = bool(body['is_default'])
        update_parts.append('is_default = :is_def')
        expr_values[':is_def'] = is_def
        updated_fields['is_default'] = is_def

    if not update_parts:
        return response(400, {'error': 'No updatable fields provided'})

    update_parts.append('updated_at = :ua')
    expr_values[':ua'] = _now_iso()

    coupons_table.update_item(
        Key={'coupon_code': coupon_code},
        UpdateExpression='SET ' + ', '.join(update_parts),
        ExpressionAttributeValues=expr_values,
    )
    print(f'[update_coupon] {coupon_code} updated: {updated_fields}')

    return response(200, {
        'success': True,
        'coupon_code': coupon_code,
        'updated_fields': updated_fields,
    })


# ── Route: GET /coupon/list-default ──────────────────────────────────────────

def list_default_coupons(event):
    """
    Public route — no auth required.
    Returns all active default coupons (is_default=true, not expired).
    Used by the product page to display available coupon chips.

    Returns:
      { success, coupons: [{ coupon_code, discount_percent, description, valid_until }] }
    """
    now = datetime.now(timezone.utc)
    try:
        # Scan for all default coupons
        result = coupons_table.scan(
            FilterExpression=Attr('is_default').eq(True),
            ProjectionExpression='coupon_code, discount_percent, description, valid_until',
        )
        items = result.get('Items', [])

        # Continue scanning if results are paginated
        while 'LastEvaluatedKey' in result:
            result = coupons_table.scan(
                FilterExpression=Attr('is_default').eq(True),
                ProjectionExpression='coupon_code, discount_percent, description, valid_until',
                ExclusiveStartKey=result['LastEvaluatedKey'],
            )
            items.extend(result.get('Items', []))

        # Filter out expired coupons in Python
        active = []
        for item in items:
            try:
                valid_until_dt = datetime.fromisoformat(
                    item.get('valid_until', '').replace('Z', '+00:00')
                )
                if now <= valid_until_dt:
                    active.append({
                        'coupon_code': item['coupon_code'],
                        'discount_percent': int(item.get('discount_percent', 0)),
                        'description': item.get('description', ''),
                        'valid_until': item.get('valid_until', ''),
                    })
            except Exception:
                pass  # Skip coupons with unparseable dates

        # Sort by discount_percent descending (highest discount first)
        active.sort(key=lambda x: x['discount_percent'], reverse=True)

        print(f'[list_default_coupons] Returning {len(active)} active default coupons')
        return response(200, {'success': True, 'coupons': active})

    except Exception as e:
        print(f'[list_default_coupons] Error: {str(e)}')
        return response(500, {'error': 'Failed to fetch default coupons', 'message': str(e)})


# ── Response helper ───────────────────────────────────────────────────────────

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': HEADERS,
        'body': json.dumps(body),
    }
