import mysql from 'mysql2/promise';

export default {
  async fetch(request, env) {
    // Cabeceras CORS obligatorias para comunicación entre dominios
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      try {
        const { code, pin, role } = await request.json();

        // Inicializa el pool de conexiones de Hyperdrive hacia tu MySQL
        const connection = await mysql.createConnection(env.PROD_DB.connectionString);

        let query = '';
        let queryParams = [code.trim().toUpperCase(), pin.trim()];
        let isAdmin = role.trim() === 'admin';

        // LÓGICA DINÁMICA: Selecciona la tabla correcta según el rol del formulario
        if (isAdmin) {
          query = 'SELECT ID_Administrador AS id_real, Codigo_Administrador AS codigo_real FROM administrador WHERE Codigo_Administrador = ? AND PIN_Acceso = ? LIMIT 1';
        } else {
          query = 'SELECT ID_Trabajador AS id_real, Codigo_Trabajador AS codigo_real FROM Trabajadores WHERE Codigo_Trabajador = ? AND PIN_Acceso = ? LIMIT 1';
        }

        const [rows] = await connection.execute(query, queryParams);
        await connection.end();

        // Si se encuentra el registro en la tabla correspondiente
        if (rows.length > 0) {
          const dbUser = rows[0];
          
          // Formateamos la respuesta para que el Frontend la entienda sin importar la tabla de origen
          const userSession = {
            id: String(dbUser.id_real),
            name: isAdmin ? `Administrador ${dbUser.codigo_real}` : `Empleado ${dbUser.codigo_real}`,
            code: dbUser.codigo_real,
            role: isAdmin ? 'admin' : 'employee',
            active: true
          };

          return new Response(JSON.stringify({ success: true, user: userSession }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ success: false, message: 'Código o PIN incorrectos para el perfil seleccionado.' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    return new Response('API Gateway de Autenticación Activa', { headers: corsHeaders });
  }
};