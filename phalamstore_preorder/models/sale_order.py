from odoo import models, fields, api
from datetime import datetime
from collections import defaultdict

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    delivery_date = fields.Date()

    def action_confirm(self):
        """
        Before confirming the order, split lines with different delivery_date into new orders.
        """
        for order in self:
            order._split_order_by_delivery_date()
        self.filtered(lambda o:not o.delivery_date).write({'delivery_date': fields.Date.today()})
        return super(SaleOrder, self).action_confirm()

    def _split_order_by_delivery_date(self):
        """
        Splits the order lines based on delivery_date.
        - Lines with no date or today's date stay in the original order.
        - Other lines go into new draft orders, one per delivery_date.
        - Each order's delivery_date field is set accordingly.
        """
        today = fields.Date.today()
        sale_order_line_obj = self.env['sale.order.line']
        for order in self:
            today_line = order.order_line.filtered(lambda line: not line.is_delivery and (not line.delivery_date or line.delivery_date == today))
            if not today_line:
                today = order.order_line.filtered(lambda line: line.delivery_date)[0].delivery_date
            future_lines_by_date = defaultdict(list)  # Lines to split

            # Step 1: Classify lines
            for line in order.order_line.filtered(lambda l: not l.is_delivery):
                # Stay in original order if no date or today
                if not line.delivery_date or line.delivery_date == today:
                    order.delivery_date = line.delivery_date if line.delivery_date else line.order_id.delivery_date
                else:
                    # Future/past dated line — to be split
                    future_lines_by_date[line.delivery_date].append(line)

            # Step 2: Create new orders for future/past-dated lines
            for delivery_date, lines in future_lines_by_date.items():
                new_order = order.copy({
                    'order_line': [(5, 0, 0)],
                    'state': 'draft',
                    # 'name': f"{order.name} - {delivery_date.strftime('%Y-%m-%d')}",
                    'website_id': False
                })

                for line in lines:
                    new_line_vals = line.copy_data()[0]
                    line.unlink()
                    new_line_vals['order_id'] = new_order.id
                    sale_order_line_obj.create(new_line_vals)

                new_order.delivery_date = delivery_date

    def _prepare_order_line_values(
            self, product_id, quantity, event_booth_pending_ids=False, registration_values=None,
            **kwargs
    ):
        """Add corresponding event to the SOline creation values (if booths are provided)."""
        values = super()._prepare_order_line_values(product_id, quantity, **kwargs)
        if kwargs.get('preorder_date'):
            values.update({'delivery_date': kwargs.get('preorder_date')})

        return values

    def _cart_update_order_line(self, product_id, quantity, order_line, **kwargs):
        order_line = super(SaleOrder, self)._cart_update_order_line(
            product_id, quantity, order_line, **kwargs
        )
        if kwargs.get('delivery_date'):
            order_line.write({'delivery_date': kwargs.get('delivery_date')})

        return order_line

    def _cart_find_product_line(
            self,
            product_id,
            line_id=None,
            linked_line_id=False,
            no_variant_attribute_value_ids=None,
            **kwargs
    ):
        lines = super()._cart_find_product_line(product_id, line_id, linked_line_id, no_variant_attribute_value_ids, **kwargs)
        if kwargs.get('preorder_date'):
            preorder_date = datetime.strptime(kwargs.get('preorder_date'), '%Y-%m-%d').date()
            lines = lines.filtered(lambda line:line.delivery_date == preorder_date)
        return lines