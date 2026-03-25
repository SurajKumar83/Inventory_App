import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL =
  process.env.EMAIL_FROM || "DukaanSync <noreply@dukaansync.com>";

// Send OTP email for MFA
export const sendOTPEmail = async (to, otp, firstName) => {
  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: "Your DukaanSync Login Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">DukaanSync Login Verification</h2>
        <p>Hi ${firstName},</p>
        <p>Your one-time password (OTP) for login is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${otp}</span>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">DukaanSync - Inventory Management System</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw error;
  }
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (to, orderDetails) => {
  const { orderNumber, total, items, deliveryAddress } = orderDetails;

  const itemsList = items
    .map(
      (item) =>
        `<li>${item.product.name} x ${item.quantity} - ₹${item.subtotal}</li>`,
    )
    .join("");

  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Order Confirmed!</h2>
        <p>Thank you for your order.</p>
        <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0;">
          <h3>Order #${orderNumber}</h3>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          <hr style="margin: 15px 0;">
          <p style="font-size: 18px; font-weight: bold;">Total: ₹${total}</p>
        </div>
        <h3>Delivery Address</h3>
        <p>
          ${deliveryAddress.addressLine1}<br>
          ${deliveryAddress.addressLine2 ? deliveryAddress.addressLine2 + "<br>" : ""}
          ${deliveryAddress.city}, ${deliveryAddress.state}<br>
          ${deliveryAddress.postalCode}
        </p>
        <p>We'll notify you when your order is out for delivery.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">DukaanSync - Thank you for shopping with us!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    throw error;
  }
};

// Send low-stock alert email
export const sendLowStockAlertEmail = async (to, alertDetails) => {
  const { product, shop, quantity, reorderLevel, supplierInfo } = alertDetails;

  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: `⚠️ Low Stock Alert: ${product.name} at ${shop.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Low Stock Alert</h2>
        <p>The following product is running low at ${shop.name}:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${product.name}</h3>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Current Stock:</strong> ${quantity} ${product.unit}</p>
          <p><strong>Reorder Level:</strong> ${reorderLevel} ${product.unit}</p>
          <p><strong>Location:</strong> ${shop.name}</p>
        </div>
        ${
          supplierInfo
            ? `
        <h3>Suggested Action</h3>
        <p>Contact your supplier to reorder:</p>
        <ul>
          <li><strong>Supplier:</strong> ${supplierInfo.businessName}</li>
          <li><strong>Contact:</strong> ${supplierInfo.contactPerson}</li>
          <li><strong>Phone:</strong> ${supplierInfo.phone}</li>
          ${supplierInfo.email ? `<li><strong>Email:</strong> ${supplierInfo.email}</li>` : ""}
        </ul>
        `
            : ""
        }
        <p style="margin-top: 30px;">
          <a href="${process.env.ADMIN_URL || "https://admin.dukaansync.com"}/inventory"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Inventory
          </a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">DukaanSync - Inventory Management System</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock alert email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send low stock alert email:", error);
    throw error;
  }
};

export default {
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendLowStockAlertEmail,
};
