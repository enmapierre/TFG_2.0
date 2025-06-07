const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔌 Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'tu_usuario_mysql',
  password: 'tu_contraseña_mysql',
  database: 'nombre_de_tu_base'
});

db.connect((err) => {
  if (err) throw err;
  console.log('🟢 Conectado a MySQL');
});

// 🧾 Ruta para procesar la compra
app.post('/api/checkout', (req, res) => {
  const { nombre, apellidos, email, direccion, productos } = req.body;

  // 1. Insertar cliente y pedido
  const insertCliente = `INSERT INTO clientes (nombre, apellidos, email, direccion) VALUES (?, ?, ?, ?)`;
  db.query(insertCliente, [nombre, apellidos, email, direccion], (err, result) => {
    if (err) return res.status(500).send('Error cliente');
    const clienteId = result.insertId;

    productos.forEach((producto) => {
      const insertPedido = `INSERT INTO pedidos (cliente_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
      db.query(insertPedido, [clienteId, producto.id, producto.cantidad, producto.precio], (err) => {
        if (err) console.error('❌ Error insertando pedido', err);
      });

      // 2. Actualizar inventario
      db.query(
        `UPDATE productos SET stock = stock - ? WHERE id = ?`,
        [producto.cantidad, producto.id],
        (err) => {
          if (err) console.error('❌ Error actualizando stock', err);
        }
      );
    });

    // 3. Enviar email de confirmación
    enviarEmailConfirmacion(email, productos);

    res.status(200).json({ success: true, message: 'Compra realizada' });
  });
});

// 📧 Función para enviar email
function enviarEmailConfirmacion(destinatario, productos) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'TU_EMAIL@gmail.com',
      pass: 'TU_APP_PASSWORD'
    }
  });

  const htmlProductos = productos.map(p => `
    <li>${p.nombre} x ${p.cantidad} - ${p.precio}€</li>
  `).join('');

  const mailOptions = {
    from: 'TU_EMAIL@gmail.com',
    to: destinatario,
    subject: 'Confirmación de tu pedido',
    html: `
      <h3>¡Gracias por tu compra!</h3>
      <p>Resumen de productos:</p>
      <ul>${htmlProductos}</ul>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) return console.error('❌ Error email:', err);
    console.log('📩 Email enviado:', info.response);
  });
}

// ▶️ Lanzar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend en http://localhost:${PORT}`);
});
