const axios = require('axios');

const XANO_URL = process.env.XANO_SPORTSHAUSEN_URL || process.env.XANO_API_URL;

const TIPOS_TICKET = [
  'Consulta sobre evento',
  'Problema con postulación',
  'Reporte de incidente',
  'Otro asunto'
];

const PRIORIDADES = ['BAJA', 'MEDIANA', 'ALTA', 'URGENTE'];
const ESTADOS = ['ABIERTO', 'EN_PROCESO', 'CERRADO'];

/**
 * LUCHADOR: Crear ticket
 * POST /api/tickets
 */
exports.crearTicket = async (req, res) => {
  try {
    const { tipo_solicitud, motivo, agrupacion_id, evento_id } = req.body;
    const luchador_id = req.user.id;

    // Validaciones
    if (!tipo_solicitud || !TIPOS_TICKET.includes(tipo_solicitud)) {
      return res.status(400).json({
        error: 'Tipo de solicitud inválido'
      });
    }
    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({
        error: 'El motivo debe tener al menos 10 caracteres'
      });
    }
    if (!agrupacion_id) {
      return res.status(400).json({
        error: 'Agrupación no especificada'
      });
    }

    // POST a Xano
    const payload = {
      luchador_id,
      agrupacion_id,
      tipo_solicitud,
      motivo: motivo.trim(),
      estado: 'ABIERTO',
      prioridad: 'BAJA',
      evento_id: evento_id || null,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    console.log('[Ticket POST] Payload:', payload);

    const response = await axios.post(
      `${XANO_URL}/tickets`,
      payload,
      { headers: { Authorization: `Bearer ${req.token}` } }
    );

    res.status(201).json({
      success: true,
      ticket: response.data,
      message: 'Ticket creado exitosamente'
    });

  } catch (error) {
    console.error('[crearTicket ERROR]', error.message);
    res.status(500).json({
      error: error.response?.data?.message || error.message
    });
  }
};

/**
 * LUCHADOR: Ver mis tickets
 * GET /api/tickets/mis-tickets
 */
exports.misTickets = async (req, res) => {
  try {
    const luchador_id = req.user.id;

    const response = await axios.get(
      `${XANO_URL}/tickets`,
      {
        params: { luchador_id },
        headers: { 'Authorization': `Bearer ${req.token}` }
      }
    );

    const tickets = Array.isArray(response.data) ? response.data : [];

    res.json({
      total: tickets.length,
      tickets: tickets.sort((a, b) =>
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      )
    });

  } catch (error) {
    console.error('[misTickets ERROR]', error.message);
    res.status(500).json({
      error: 'Error al cargar tickets'
    });
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
    const luchador_id = req.user.id;

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    const payload = {
      ticket_id: parseInt(ticketId),
      remitente: 'LUCHADOR',
      contenido: contenido.trim(),
      fecha_envio: new Date().toISOString()
    };

    const response = await axios.post(
      `${XANO_URL}/ticket_mensajes`,
      payload,
      { headers: { Authorization: `Bearer ${req.token}` } }
    );

    res.json({
      success: true,
      mensaje: response.data
    });

  } catch (error) {
    console.error('[enviarMensajeLuchador ERROR]', error.message);
    res.status(500).json({
      error: 'Error al enviar mensaje'
    });
  }
};

/**
 * AGRUPACION: Ver tickets asignados
 * GET /api/tickets/agrupacion/mis-solicitudes
 */
exports.ticketsAgrupacion = async (req, res) => {
  try {
    const agrupacion_id = req.user.id;

    const response = await axios.get(
      `${XANO_URL}/tickets`,
      {
        params: { agrupacion_id },
        headers: { 'Authorization': `Bearer ${req.token}` }
      }
    );

    const tickets = Array.isArray(response.data) ? response.data : [];

    res.json({
      total: tickets.length,
      tickets: tickets.sort((a, b) =>
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      )
    });

  } catch (error) {
    console.error('[ticketsAgrupacion ERROR]', error.message);
    res.status(500).json({
      error: 'Error al cargar solicitudes'
    });
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
      return res.status(400).json({
        error: 'Prioridad inválida'
      });
    }

    const payload = {
      prioridad,
      fecha_actualizacion: new Date().toISOString()
    };

    const response = await axios.patch(
      `${XANO_URL}/tickets/${ticketId}`,
      payload,
      { headers: { Authorization: `Bearer ${req.token}` } }
    );

    res.json({
      success: true,
      ticket: response.data
    });

  } catch (error) {
    console.error('[cambiarPrioridad ERROR]', error.message);
    res.status(500).json({
      error: 'Error al cambiar prioridad'
    });
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

    // POST mensaje
    const msgPayload = {
      ticket_id: parseInt(ticketId),
      remitente: 'AGRUPACION',
      contenido: contenido.trim(),
      fecha_envio: new Date().toISOString()
    };

    const authHeader = { headers: { Authorization: `Bearer ${req.token}` } };

    await axios.post(`${XANO_URL}/ticket_mensajes`, msgPayload, authHeader);

    // Auto-cambiar estado a EN_PROCESO si está ABIERTO
    try {
      const ticketRes = await axios.get(`${XANO_URL}/tickets/${ticketId}`, authHeader);
      if (ticketRes.data.estado === 'ABIERTO') {
        await axios.patch(`${XANO_URL}/tickets/${ticketId}`, { estado: 'EN_PROCESO' }, authHeader);
      }
    } catch (e) {
      // No crítico — el mensaje se envió igual
    }

    res.json({
      success: true,
      message: 'Mensaje enviado'
    });

  } catch (error) {
    console.error('[enviarMensajeAgrupacion ERROR]', error.message);
    res.status(500).json({
      error: 'Error al enviar mensaje'
    });
  }
};

/**
 * AGRUPACION: Finalizar ticket
 * PATCH /api/tickets/:ticketId/finalizar
 */
exports.finalizarTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const payload = {
      estado: 'CERRADO',
      fecha_actualizacion: new Date().toISOString()
    };

    const response = await axios.patch(
      `${XANO_URL}/tickets/${ticketId}`,
      payload,
      { headers: { Authorization: `Bearer ${req.token}` } }
    );

    res.json({
      success: true,
      ticket: response.data
    });

  } catch (error) {
    console.error('[finalizarTicket ERROR]', error.message);
    res.status(500).json({
      error: 'Error al finalizar ticket'
    });
  }
};

/**
 * AMBOS: Obtener mensajes de un ticket
 * GET /api/tickets/:ticketId/mensajes
 */
exports.obtenerMensajes = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const response = await axios.get(
      `${XANO_URL}/ticket_mensajes`,
      {
        params: { ticket_id: parseInt(ticketId) },
        headers: { Authorization: `Bearer ${req.token}` }
      }
    );

    const mensajes = Array.isArray(response.data) ? response.data : [];

    res.json({
      total: mensajes.length,
      mensajes: mensajes.sort((a, b) =>
        new Date(a.fecha_envio) - new Date(b.fecha_envio)
      )
    });

  } catch (error) {
    console.error('[obtenerMensajes ERROR]', error.message);
    res.status(500).json({
      error: 'Error al cargar mensajes'
    });
  }
};

module.exports = exports;
