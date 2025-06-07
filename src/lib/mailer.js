// src/lib/mailer.js
import nodemailer from 'nodemailer';
import 'dotenv/config';

// Configuración mejorada del transporte
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Añadimos opciones para mayor estabilidad
  pool: true,
  maxConnections: 1,
  rateDelta: 20000,
  rateLimit: 5
});

// Función más robusta con manejo de errores
export async function sendOrderConfirmation(orderData) {
  try {
    // Validación básica de los datos requeridos
    if (!orderData.email || !orderData.cart || !Array.isArray(orderData.cart)) {
      throw new Error('Datos del pedido incompletos o inválidos');
    }

    // Calculamos totales si no vienen en los datos
    const subtotal = orderData.totals?.subtotal || 
                   orderData.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = orderData.totals?.tax || subtotal * 0.21;
    const shipping = orderData.totals?.shipping || (subtotal >= 50 ? 0 : 5.99);
    const total = orderData.totals?.total || subtotal + tax + shipping;

    // Preparamos el contenido HTML
    const itemsHtml = orderData.cart.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>€${item.price.toFixed(2)}</td>
        <td>€${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Tienda Astro" <${process.env.EMAIL_USER}>`,
      to: orderData.email,
      subject: `Confirmación de pedido #${orderData.orderId || 'TEMP-' + Date.now()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Gracias por tu pedido, ${orderData.name || 'Cliente'}!</h2>
          <p>Tu pedido ha sido recibido correctamente.</p>

          ${orderData.shippingAddress ? `
          <h3 style="margin-top: 20px;">Dirección de envío:</h3>
          <p>
            ${orderData.shippingAddress.name || ''}<br/>
            ${orderData.shippingAddress.address || ''}<br/>
            ${orderData.shippingAddress.postal_code || ''}, ${orderData.shippingAddress.city || ''}<br/>
            ${orderData.shippingAddress.country || ''}
          </p>
          ` : ''}

          <h3 style="margin-top: 20px;">Resumen del pedido:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Producto</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Cantidad</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Precio</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            <p><strong>Subtotal:</strong> €${subtotal.toFixed(2)}</p>
            <p><strong>IVA (21%):</strong> €${tax.toFixed(2)}</p>
            <p><strong>Envío:</strong> €${shipping.toFixed(2)}</p>
            <p style="font-weight: bold; font-size: 1.1em;">Total: €${total.toFixed(2)}</p>
          </div>
        </div>
      `,
    };

    // Verificamos que las credenciales estén configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Credenciales de email no configuradas');
    }

    // Enviamos el correo
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error en sendOrderConfirmation:', error);
    throw error; // Re-lanzamos el error para manejarlo en el checkout
  }
}