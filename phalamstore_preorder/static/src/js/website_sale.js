/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { rpc } from "@web/core/network/rpc";

publicWidget.registry.WebsiteSale.include({
    events: Object.assign({}, publicWidget.registry.WebsiteSale.prototype.events, {
        'change .oe_cart input.delivery_date_input': '_onChangeDeliveryDate',
        'change #delivery_option': '_onChangeDeliveryOption',
        'change .delivery_option_input': '_onCartDeliveryOptionChange',
    }),

    _getNextValidDeliveryDate: function () {
        let nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1); // Start with tomorrow

        // Skip Sunday (0) and Monday (1)
        while (nextDate.getDay() === 0 || nextDate.getDay() === 1) {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        return nextDate.toISOString().split('T')[0]; // YYYY-MM-DD
    },

    _setPreorderDate: function ($dateInput) {
        const validDate = this._getNextValidDeliveryDate();

        $dateInput.attr('min', validDate);

        // ✅ Only set value if not already set
        if (!$dateInput.val()) {
            $dateInput.val(validDate);
        }

        // ✅ Always store last valid date (either from input or new valid date)
        const initialDate = $dateInput.val();
        $dateInput.data('last-valid-date', initialDate);

        // ✅ Clear and rebind change handler
        $dateInput.off('change').on('change', function () {
            const selected = new Date($(this).val());
            const day = selected.getDay();

            if (day === 0 || day === 1) {
                alert("Delivery is not available on Sunday or Monday. Please select another date.");

                // Revert to last valid date
                const previousDate = $(this).data('last-valid-date');
                if (previousDate) {
                    $(this).val(previousDate);
                }
            } else {
                // Update last valid date
                $(this).data('last-valid-date', $(this).val());
            }
        });
    },


    _onChangeDeliveryOption: function (ev) {
        const $select = $(ev.currentTarget);
        const $datePicker = $('#preorder_date_picker');
        const $dateInput = $datePicker.find('input[type="date"]');

        if ($select.val() === 'preorder') {
            $datePicker.removeClass('d-none').addClass('d-block');
            this._setPreorderDate($dateInput);
        } else {
            $datePicker.removeClass('d-block').addClass('d-none');
            $dateInput.val('');
        }
    },

    _onCartDeliveryOptionChange: function (ev) {
        const $select = $(ev.currentTarget);
        this._toggleDatePickerVisibility($select);
    },

    _toggleDatePickerVisibility: function ($select) {
        const lineId = $select.data('line-id');
        const $container = $select.closest('div');
        const $datePicker = $container.find('.preorder_date_picker');
        const $dateInput = $container.find('.delivery_date_input');

        if ($select.val() === 'preorder') {
            $datePicker.removeClass('d-none').addClass('d-block');

            this._setPreorderDate($dateInput);

            // Send to backend if date already set
            if ($dateInput.val()) {
                this._onChangeDeliveryDate({ currentTarget: $dateInput[0] });
            }

        } else {
            $datePicker.removeClass('d-block').addClass('d-none');
            $dateInput.val('');

            // Send clear to backend
            rpc("/update_cart_line_date", {
                line_id: lineId,
                delivery_date: null,
            }).then((result) => {
                if (result.success) {
                    console.log("Delivery date cleared");
                } else {
                    console.error("Failed to clear delivery date");
                }
            }).catch((err) => {
                console.error("RPC Error:", err);
            });
        }
    },

    _onChangeDeliveryDate: function (ev) {
        const $input = $(ev.currentTarget);
        const lineId = $input.data('line-id');
        const selectedDate = $input.val();

        if (!lineId || !selectedDate) {
            return;
        }

        rpc("/update_cart_line_date", {
            line_id: lineId,
            delivery_date: selectedDate,
        }).then((result) => {
            if (result.success) {
                console.log("Delivery date updated");
            } else {
                console.error("Failed to update delivery date");
            }
        }).catch((err) => {
            console.error("RPC Error:", err);
        });
    },

    start: function () {
        this._super.apply(this, arguments);

        // Handle cart inputs if any
        $('.delivery_option_input').each((index, el) => {
            this._toggleDatePickerVisibility($(el));
        });

        const $select = $('#delivery_option');
        const $datePicker = $('#preorder_date_picker');
        const $dateInput = $datePicker.find('input[type="date"]');

        const todayOption = $select.find('option[value="today"]');

        if (todayOption.is(':disabled')) {
            $select.val('preorder').trigger('change');
        }

        // Always apply logic on page load
        if ($select.val() === 'preorder') {
            $datePicker.removeClass('d-none').addClass('d-block');
            this._setPreorderDate($dateInput);
        } else {
            $datePicker.removeClass('d-block').addClass('d-none');
            $dateInput.val('');
        }

        return this;
    },

    _submitForm: function () {
        const params = this.rootProduct;

        const $product = $('#product_detail');
        const date = $('#preorder_date').val()
        const productTrackingInfo = $product.data('product-tracking-info');
        if (productTrackingInfo) {
            productTrackingInfo.quantity = params.quantity;
            $product.trigger('add_to_cart_event', [productTrackingInfo]);
        }

        params.add_qty = params.quantity;
        params.product_custom_attribute_values = JSON.stringify(params.product_custom_attribute_values);
        params.no_variant_attribute_values = JSON.stringify(params.no_variant_attribute_values);
        if (date){
            params.preorder_date = date
        }
        delete params.quantity;
        return this.addToCart(params);
    },

    _getAdditionalRpcParams() {
        const $dateInput = $('.delivery_date_input');
        return $dateInput.length && $dateInput.val() ? { preorder_date: $dateInput.val() } : {};
    },
});
