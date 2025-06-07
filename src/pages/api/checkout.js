export async function POST({ request }) {
  try {
    console.log('=== INICIO CHECKOUT API ===');
    
    // Verificar Content-Type (más flexible para Astro)
    const contentType = request.headers.get('Content-Type') || '';
    console.log('Content-Type recibido:', contentType);
    console.log('Todas las headers:', [...request.headers.entries()]);
    
    // Astro puede enviar diferentes content-types, ser más flexible
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      console.log('Content-Type no válido:', contentType);
    }

    // Parsear JSON con manejo de errores específico
    let data;
    try {
      const requestText = await request.text();
      console.log('Texto raw recibido:', requestText);
      
      if (!requestText || requestText.trim() === '') {
        throw new Error('El cuerpo de la petición está vacío');
      }
      
      data = JSON.parse(requestText);
    } catch (parseError) {
      console.error('Error al parsear JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Error al parsear JSON: " + parseError.message
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    console.log('Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar que los campos requeridos existen
    const requiredFields = ['card_number', 'card_cvc', 'card_expiry', 'email', 'name', 'surname', 'address', 'city', 'postal_code', 'country', 'cart'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Validar datos de la tarjeta ficticia
    const validCard = "4111111111111111";
    const validCVC = "345";
    const validExpiry = "10/25";
    
    const inputCard = data.card_number.replace(/\s/g, "");
    console.log('Tarjeta procesada:', inputCard);
    console.log('CVC recibido:', data.card_cvc);
    console.log('Vencimiento recibido:', data.card_expiry);
    
    if (inputCard !== validCard || data.card_cvc !== validCVC || data.card_expiry !== validExpiry) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Datos de tarjeta incorrectos. Usa: 4111 1111 1111 1111, CVC: 345, Vencimiento: 10/25" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validar que hay productos en el carrito
    if (!Array.isArray(data.cart) || data.cart.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "El carrito está vacío o no es válido" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Calcular totales
    const subtotal = data.cart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
    
    const tax = subtotal * 0.21;
    const shippingCost = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + tax + shippingCost;

    // Preparar datos para el email
    const orderSummary = data.cart.map(item => 
      `${item.name || 'Producto'} x${item.quantity || 1} - €${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}`
    ).join('\n');

    const emailData = {
      to_email: data.email,
      to_name: `${data.name} ${data.surname}`,
      shipping_name: `${data.name} ${data.surname}`,
      shipping_address: data.address,
      shipping_city: data.city,
      shipping_postal: data.postal_code,
      shipping_country: data.country,
      order_summary: orderSummary,
      subtotal: `€${subtotal.toFixed(2)}`,
      tax: `€${tax.toFixed(2)}`,
      shipping_cost: shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`,
      total: `€${total.toFixed(2)}`,
      order_number: `SJ${Date.now()}` // Número de pedido único
    };

    console.log('Datos del email preparados:', emailData);

    // Enviar email usando EmailJS con manejo de errores mejorado
    let emailResponse;
    try {
      emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'TU_SERVICE_ID', // Reemplaza con tu SERVICE_ID
          template_id: 'TU_TEMPLATE_ID', // Reemplaza con tu TEMPLATE_ID
          user_id: 'TU_PUBLIC_KEY', // Reemplaza con tu PUBLIC_KEY
          template_params: emailData
        })
      });
      
      console.log('Status de EmailJS:', emailResponse.status);
      console.log('Headers de EmailJS:', [...emailResponse.headers.entries()]);
      
    } catch (fetchError) {
      console.error('Error en fetch de EmailJS:', fetchError);
      throw new Error(`Error de conexión con EmailJS: ${fetchError.message}`);
    }

    // Verificar respuesta de EmailJS
    if (!emailResponse.ok) {
      let errorText = '';
      try {
        errorText = await emailResponse.text();
        console.log('Respuesta de error de EmailJS:', errorText);
      } catch (textError) {
        console.error('No se pudo leer la respuesta de error:', textError);
      }
      
      throw new Error(`EmailJS respondió con status ${emailResponse.status}: ${errorText}`);
    }

    // Intentar parsear respuesta de EmailJS
    let emailResult = null;
    try {
      const responseText = await emailResponse.text();
      console.log('Respuesta raw de EmailJS:', responseText);
      
      if (responseText && responseText.trim() !== '') {
        emailResult = JSON.parse(responseText);
        console.log('Respuesta parseada de EmailJS:', emailResult);
      }
    } catch (parseError) {
      console.warn('No se pudo parsear respuesta de EmailJS (pero el envío fue exitoso):', parseError);
      // No lanzamos error aquí porque el email podría haberse enviado correctamente
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Pedido procesado correctamente. Revisa tu email para la confirmación.",
        order_number: emailData.order_number
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('Error detallado en checkout:', error);
    console.error('Stack trace:', error.stack);
    
    // Determinar el tipo de error para dar una respuesta más específica
    let errorMessage = "Error interno del servidor";
    if (error.message.includes('JSON')) {
      errorMessage = "Error de formato JSON";
    } else if (error.message.includes('EmailJS')) {
      errorMessage = "Error al enviar el email de confirmación";
    } else if (error.message.includes('fetch')) {
      errorMessage = "Error de conexión";
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `${errorMessage}: ${error.message}`,
        debug: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name
        } : undefined
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}