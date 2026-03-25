export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiateRazorpayPayment = async (order, paymentDetails, onSuccess, onFailure) => {
  const loaded = await loadRazorpayScript();

  if (!loaded) {
    alert('Failed to load payment gateway. Please try again.');
    return;
  }

  const options = {
    key: paymentDetails.razorpayKeyId,
    amount: order.total * 100, // Convert to paise
    currency: 'INR',
    name: 'DukaanSync',
    description: `Order #${order.id}`,
    order_id: paymentDetails.razorpayOrderId,
    handler: function (response) {
      onSuccess({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    prefill: {
      name: `${order.customer.firstName} ${order.customer.lastName}`,
      email: order.customer.email,
      contact: order.customer.phone,
    },
    notes: {
      orderId: order.id,
    },
    theme: {
      color: '#059669',
    },
    modal: {
      ondismiss: function () {
        onFailure('Payment cancelled by user');
      },
    },
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
};
