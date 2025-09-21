from odoo import http
from odoo.http import request

class WebsiteSaleExtension(http.Controller):

    @http.route('/update_cart_line_date', type='json', auth='user', website=True, csrf=False)
    def update_cart_line_date(self, line_id=None, delivery_date=None):
        try:
            if not line_id:
                return {'success': False, 'error': 'Missing parameters'}

            line = request.env['sale.order.line'].sudo().browse(int(line_id))
            if line.exists():
                line.write({'delivery_date': delivery_date})
                return {'success': True}
            else:
                return {'success': False, 'error': 'Line not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
