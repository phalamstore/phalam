from odoo import http
from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.http import request

class WebsiteSaleInherit(WebsiteSale):

    def website_sale_should_show_product_configurator(
            self, product_template_id, ptav_ids, is_product_configured
    ):
        res = super().website_sale_should_show_product_configurator(product_template_id, ptav_ids, is_product_configured)
        if is_product_configured:
            return False
        return False if is_product_configured else True

    def _get_product_information(
        self,
        product_template,
        combination,
        currency,
        pricelist,
        so_date,
        quantity=1,
        product_uom_id=None,
        parent_combination=None,
        **kwargs,
    ):
        # 🔁 Call the parent method to retain base behavior
        values = super()._get_product_information(
            product_template,
            combination,
            currency,
            pricelist,
            so_date,
            quantity=quantity,
            product_uom_id=product_uom_id,
            parent_combination=parent_combination,
            **kwargs,
        )
        values.update({'product_qty': product_template.qty_available})
        return values