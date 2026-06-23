const express = require('express');
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
  crearTicket,
  misTickets,
  enviarMensajeLuchador,
  ticketsAgrupacion,
  cambiarPrioridad,
  enviarMensajeAgrupacion,
  finalizarTicket,
  obtenerMensajes
} = require('../controller/ticketControllers');

const router = express.Router();

// ======================
// LUCHADOR endpoints
// ======================

// Crear ticket
router.post('/',
  protect,
  requireRole('luchador'),
  crearTicket
);

// Ver mis tickets
router.get('/mis-tickets',
  protect,
  requireRole('luchador'),
  misTickets
);

// Enviar mensaje en ticket (luchador)
router.post('/:ticketId/mensaje',
  protect,
  requireRole('luchador'),
  enviarMensajeLuchador
);

// ======================
// AGRUPACION endpoints
// ======================

// Ver mis solicitudes (agrupación)
router.get('/agrupacion/mis-solicitudes',
  protect,
  requireRole('agrupacion'),
  ticketsAgrupacion
);

// Cambiar prioridad
router.patch('/:ticketId/prioridad',
  protect,
  requireRole('agrupacion'),
  cambiarPrioridad
);

// Enviar mensaje (agrupación)
router.post('/:ticketId/mensaje-admin',
  protect,
  requireRole('agrupacion'),
  enviarMensajeAgrupacion
);

// Finalizar ticket
router.patch('/:ticketId/finalizar',
  protect,
  requireRole('agrupacion'),
  finalizarTicket
);

// ======================
// AMBOS endpoints
// ======================

// Obtener mensajes
router.get('/:ticketId/mensajes',
  protect,
  obtenerMensajes
);

module.exports = router;
