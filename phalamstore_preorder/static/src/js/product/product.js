/** @odoo-module **/

import { patch } from '@web/core/utils/patch';
import { Product } from '@sale/js/product/product';
import { useEffect } from '@odoo/owl';

patch(Product.prototype, {
    props: {
        ...Product.prototype.props,
        product_qty: Number,
    },

    setup() {
        super.setup();

        useEffect(() => {
            if (this.props.product_qty === 0) {
                this.onDeliveryOptionChange(
                    { target: { value: 'preorder' } },
                    this.props.product_tmpl_id
                );
            }
        });
    },

    onDeliveryOptionChange(ev, productId) {
        const selected = ev.target.value;
        const datePicker = document.getElementById(`preorder_date_picker_${productId}`);
        const dateInput = document.getElementById(`delivery_date_${productId}`);

        if (selected === 'preorder') {
            if (datePicker) datePicker.classList.remove('d-none');

            // Get the next valid delivery date (skip Sun/Mon)
            let nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 1);
            while (nextDate.getDay() === 0 || nextDate.getDay() === 1) {
                nextDate.setDate(nextDate.getDate() + 1);
            }

            const yyyy = nextDate.getFullYear();
            const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
            const dd = String(nextDate.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;

            if (dateInput) {
                dateInput.setAttribute('min', formattedDate);
                dateInput.value = formattedDate;
                dateInput.dataset.lastValidDate = formattedDate;

                // Replace input to avoid duplicate listeners
                const newInput = dateInput.cloneNode(true);
                dateInput.parentNode.replaceChild(newInput, dateInput);

                // Listen for changes
                newInput.addEventListener('change', (e) => {
                    const selected = new Date(e.target.value);
                    const day = selected.getDay();

                    if (day === 0 || day === 1) {
                        alert("Delivery not available on Sunday or Monday. Please select another date.");

                        // Restore last valid date
                        const lastValid = newInput.dataset.lastValidDate;
                        if (lastValid) {
                            newInput.value = lastValid;
                        }
                    } else {
                        // Save the new valid date
                        newInput.dataset.lastValidDate = e.target.value;
                    }
                });
            }

        } else {
            if (datePicker) datePicker.classList.add('d-none');
            if (dateInput) {
                dateInput.value = '';
            }
        }
    },

    onDateChange(ev, productId) {
        const selectedDate = ev.target.value;
        console.log(`Selected date for product ${productId}: ${selectedDate}`);
    },
});
