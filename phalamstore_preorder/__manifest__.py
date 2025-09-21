# -*- coding: utf-8 -*-
{
    'name': "Phalamstore Preorder",
    'summary': """Allows user to preoder the product if not awailable in stock""",
    'author': "Smith Ponda",
    'category': 'Ecommerce',
    'version': '0.1',
    'depends': ['website_sale', 'stock'],
    'data': [
        'views/templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'phalamstore_preorder/static/src/js/website_sale.js',
            'phalamstore_preorder/static/src/js/product/*'
        ]
    }
}
