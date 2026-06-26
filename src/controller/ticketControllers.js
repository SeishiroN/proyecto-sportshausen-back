const store = require('../services/ticketStoreService');

const TIPOS_TICKET = [
  'Consulta sobre evento',
  'Problema con postulación',
  'Reporte de incidente',
  'Otro asunto'
];

const PRIORIDADES = ['BAJA', 'MEDIANA', 'ALTA', 'URGENTE'];

/**
 * LUCHADOR: Crear ticket
 * POST /api/tickets
 */
exports.crearTicket = async (req, res) => {
  try {
    const { tipo_solicitud, motivo, agrupacion_id, evento_id } = req.body;
    const luchador_id = req.user.id;

    if (!tipo_solicitud || !TIPOS_TICKET.includes(tipo_solicitud)) {
      return res.status(400).json({ error: 'Tipo de solicitud inválido' });
    }
    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({ error: 'El motivo debe tener al menos 10 caracteres' });
    }
    if (!agrupacion_id) {
      return res.status(400).json({ error: 'Agrupación no especificada' });
    }

    const ticket = store.crearTicket({
      luchador_id,
      agrupacion_id,
      tipo_solicitud,
      motivo: motivo.trim(),
      estado: 'ABIERTO',
      prioridad: 'BAJA',
      evento_id: evento_id || null,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    });

    res.status(201).json({ success: true, ticket, message: 'Ticket creado exitosamente' });

  } catch (error) {
    console.error('[crearTicket ERROR]', error.message);
    res.status(500).json({ error: 'Error al crear ticket' });
  }
};

/**
 * LUCHADOR: Ver mis tickets
 * GET /api/tickets/mis-tickets
 */
exports.misTickets = async (req, res) => {
  try {
    const tickets = store.getTicketsByLuchador(req.user.id)
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    res.json({ total: tickets.length, tickets });
  } catch (error) {
    console.error('[misTickets ERROR]', error.message);
    res.status(500).json({ error: 'Error al cargar tickets' });
  }
};

/**
 * LUCHADOR: Enviar mensaje en un ticket
 * POST /api/tickets/:ticketId/mensaje
 */
exports.enviarMensajeLuchador = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { contenido } = req.body;

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    const mensaje = store.crearMensaje({
      ticket_id: parseInt(ticketId),
      remitente: 'LUCHADOR',
      contenido: contenido.trim(),
      fecha_envio: new Date().toISOString(),
    });

    res.json({ success: true, mensaje });
  } catch (error) {
    console.error('[enviarMensajeLuchador ERROR]', error.message);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

/**
 * AGRUPACION: Ver tickets asignados
 * GET /api/tickets/agrupacion/mis-solicitudes
 */
exports.ticketsAgrupacion = async (req, res) => {
  try {
    const tickets = store.getTicketsByAgrupacion(req.user.id)
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    res.json({ total: tickets.length, tickets });
  } catch (error) {
    console.error('[ticketsAgrupacion ERROR]', error.message);
    res.status(500).json({ error: 'Error al cargar solicitudes' });
  }
};

/**
 * AGRUPACION: Cambiar prioridad
 * PATCH /api/tickets/:ticketId/prioridad
 */
exports.cambiarPrioridad = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { prioridad } = req.body;

    if (!PRIORIDADES.includes(prioridad)) {
      return res.status(400).json({ error: 'Prioridad inválida' });
    }

    const ticket = store.updateTicket(ticketId, { prioridad });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('[cambiarPrioridad ERROR]', error.message);
    res.status(500).json({ error: 'Error al cambiar prioridad' });
  }
};

/**
 * AGRUPACION: Enviar mensaje
 * POST /api/tickets/:ticketId/mensaje-admin
 */
exports.enviarMensajeAgrupacion = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { contenido } = req.body;

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    store.crearMensaje({
      ticket_id: parseInt(ticketId),
      remitente: 'AGRUPACION',
      contenido: contenido.trim(),
      fecha_envio: new Date().toISOString(),
    });

    // Auto-cambiar estado a EN_PROCESO si está ABIERTO
    const ticket = store.getTicketById(ticketId);
    if (ticket?.estado === 'ABIERTO') {
      store.updateTicket(ticketId, { estado: 'EN_PROCESO' });
    }

    res.json({ success: true, message: 'Mensaje enviado' });
  } catch (error) {
    console.error('[enviarMensajeAgrupacion ERROR]', error.message);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

/**
 * AGRUPACION: Finalizar ticket
 * PATCH /api/tickets/:ticketId/finalizar
 */
exports.finalizarTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = store.updateTicket(ticketId, { estado: 'CERRADO' });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('[finalizarTicket ERROR]', error.message);
    res.status(500).json({ error: 'Error al finalizar ticket' });
  }
};

/**
 * AMBOS: Obtener mensajes de un ticket
 * GET /api/tickets/:ticketId/mensajes
 */
exports.obtenerMensajes = async (req, res) => {
  try {
    const mensajes = store.getMensajesByTicket(req.params.ticketId)
      .sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));

    res.json({ total: mensajes.length, mensajes });
  } catch (error) {
    console.error('[obtenerMensajes ERROR]', error.message);
    res.status(500).json({ error: 'Error al cargar mensajes' });
  }
};

module.exports = exports;
