/**
 * PWA Gestión Integrada ISO - SENERCOM
 * Backend Apps Script
 *
 * IMPORTANTE (lecciones de otras PWA de Senercom):
 * - Desplegar SIEMPRE desde carlos.braun@gmail.com (nunca cbraun@senercom.cl, genera CORS)
 * - Después de pegar este código: ejecutar inicializarEstructura() una vez manualmente
 *   para crear las 7 pestañas, aceptar los permisos que pida, y recién ahí implementar
 *   como aplicación web (Implementar > Nueva implementación > Aplicación web,
 *   ejecutar como "Yo", acceso "Cualquiera")
 * - Todas las respuestas usan JSONP (doGet) para comunicarse con GitHub Pages sin CORS
 */

// ID de la Sheet maestra creada en Drive
const SHEET_ID = '1QfpRD6uSD7g1lyt0yKAdXmwEeKygryyuxGNyS0yZzNA';

// Clave de acceso propia de la app (no confundir con contraseña de Google).
// Se exige en cada consulta para filtrar accesos automáticos/casuales al link
// público. Si algún día quieres cambiarla, actualízala aquí y en el APP_KEY
// de cada archivo .html del frontend.
const CLAVE_APP = 'senercom-sgi-7x9K2m';

// Definición de las 7 tablas y sus encabezados exactos (mismos nombres que los
// documentos ISO oficiales, más los campos técnicos acordados)
const ESQUEMA = {
  Partes_Interesadas: [
    'id', 'Tipo', 'Parte interesada', 'Necesidad / expectativa', 'Requisitos',
    'Riesgos y oportunidades', 'Responsables de ejecución', 'Monitorear en Panel de Control',
    'Replicado_a',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  FODA: [
    'id', 'Categoría', 'Descripción', 'Ámbito', 'Obra', 'parte_interesada_id',
    'Probabilidad', 'Impacto', 'Criticidad (P x I)', 'Responsables de ejecución',
    'Monitorear en Panel de Control', 'Replicado_a',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  Cruce_FODA: [
    'id', 'factor_interno_id', 'factor_externo_id', 'tipo_cruce', 'origen',
    'Estrategia resultante', 'Estado', 'Responsables de ejecución',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  PESTEL: [
    'id', 'Categoría PESTEL', 'Factor', 'Descripción del factor', 'Plazo', 'Impacto',
    'Ámbito', 'Obra', 'Probabilidad', 'Consecuencia', 'Criticidad (P x C)',
    'Responsables de ejecución', 'Monitorear en Panel de Control', 'Replicado_a',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  Balance_Scorecard: [
    'id', 'Ámbito', 'Objetivo general', 'Año', 'Meta', 'Indicador y medición',
    'Frecuencia de control', 'Responsable objetivo',
    'Actividad', 'Responsable actividad', 'Recursos', 'Plazo', 'Seguimiento / Observaciones',
    'origen_ids', 'Responsables de ejecución', 'Monitorear en Panel de Control', 'Replicado_a',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  Riesgos_Oportunidades: [
    'id', 'Núm.', 'Origen', 'origen_id', 'Tipo', 'Descripción', 'Ámbito', 'Obra',
    'Probabilidad (P)', 'Consecuencia (C)', 'Valor (PxC)', 'Nivel',
    'Descripción medidas de control', 'Fortaleza (F)', 'Grado madurez (G)',
    'Valor medida (F+G)', 'Efectividad', 'Riesgo final',
    'Evitar', 'Eliminar', 'Cambiar', 'Compartir', 'Asumir',
    'Acción', 'Responsable', 'Plazo', '¿Cómo se evalúa la eficacia?', 'Indicador', 'Meta',
    'Estado', 'Responsables de ejecución', 'Monitorear en Panel de Control', 'Replicado_a',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  Hallazgos: [
    'id', 'Descripción del hallazgo', 'Fecha', 'Lugar / Obra', 'Capturado por',
    '¿Aplica a evaluación profunda (FOR-SGC-001)?', 'fecha_evaluacion', 'evaluado_por',
    'registro_sgc001_id', 'Monitorear en Panel de Control', 'Replicado_a',
    'creado_por', 'creado_fecha'
  ],
  Compromisos_Medidas: [
    'id', 'Origen', 'origen_id', 'Compromiso', 'Responsable', 'Fecha compromiso',
    'Estado', 'Observaciones', 'Responsables de ejecución', 'Monitorear en Panel de Control', 'Replicado_a',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  Monitoreo_SGC004: [
    'id', 'Año', 'Mes', 'Num', 'Origen', 'Objetivo', 'Fecha Definida', 'Meta', 'Indicador', 'Frecuencia',
    'Responsable', 'Plazo', 'Cumplimiento mes', 'Estado', 'creado_fecha'
  ],
  Evaluacion_Proveedores: [
    'id', 'Año', 'Proveedor', 'Promedio', 'Calificación', 'creado_fecha'
  ],
  KPI_Ingenieros_Mensual: [
    'id', 'Año', 'Mes', 'Ingeniero', 'Proyectos Estudiados', 'Monto Cotizado',
    'Proyectos Adjudicados', 'Monto Adjudicado', '% Adjudicación', 'creado_fecha'
  ],
  KPI_Estados_Mensual: [
    'id', 'Año', 'Mes', 'Estado', 'Cantidad', 'Monto', 'creado_fecha'
  ],
  KPI_TipoServicio_Mensual: [
    'id', 'Año', 'Mes', 'Tipo de Servicio', 'Cantidad', 'Monto', 'creado_fecha'
  ],
  KPI_Estados_Agrupado_Mensual: [
    'id', 'Año', 'Mes', 'Grupo', 'Cantidad', 'Monto', 'creado_fecha'
  ],
  KPI_Financiero_Mensual: [
    'id', 'Año', 'Mes', 'Costo Oficina', 'Utilidad', 'creado_fecha'
  ],
  Estado_Obras: [
    'id', 'Obra', 'Ámbito', 'Valor Obra', 'Adicionales', 'Valor Total Obra',
    'Facturado año anterior', 'Facturado año en curso', 'Total Facturado Acumulado',
    'Dev Anticipo', 'Retenciones Obra+Adic', 'Descuento', 'Total por Facturar',
    'Costo Máximo Ppto', 'Costo Directo', 'Honorarios % Ingeniería', 'Costo Personal Obra',
    'Anticipos Factura Proveedores', 'Saldos por Pagar Proveedores', 'Total Costos a la Fecha',
    'Obra Restante (meses)', 'Costo por Realizar (meses restantes)', 'Disponible Costos por Realizar',
    'Utilidad Esperada', 'Utilidad a la Fecha', '% Utilidad a la Fecha', '12.5%', 'Utilidad Neta',
    'Responsables de ejecución', 'Monitorear en Panel de Control',
    'creado_por', 'creado_fecha', 'modificado_por', 'modificado_fecha'
  ],
  Encuesta_Satisfaccion_Resumen: [
    'id', 'Año', 'N Respuestas', 'Promedio Calidad Servicio', 'Promedio Tiempo Respuesta',
    'Promedio Presupuestos y Plazos', 'Promedio Atención Comercial', 'Promedio Cumplimiento Objetivos',
    'Promedio Satisfacción General', 'creado_fecha'
  ],
  Encuesta_Satisfaccion_Detalle: [
    'id', 'Año', 'Fecha Respuesta', 'Empresa', 'RUT Empresa', 'Obra o Faena',
    'Calidad Servicio', 'Tiempo Respuesta', 'Presupuestos y Plazos', 'Atención Comercial',
    'Cumplimiento Objetivos', 'Satisfacción General', 'Comentario', 'creado_fecha'
  ],
  NoConformidades_Resumen: [
    'id', 'Año', 'Total', 'No Conformidades', 'No Conformidades Cerradas',
    'Observaciones', 'Observaciones Cerradas', 'Cerradas', 'Abiertas', 'creado_fecha'
  ],
  NoConformidades_Detalle: [
    'id', 'Año', 'Número', 'Tipo', 'Descripción', 'Área', 'Fecha Detección', 'Estado', 'Fecha Cierre', 'creado_fecha'
  ],
  Capacitaciones_Detalle: [
    'id', 'Año', 'Capacitación', 'Fecha Programada', 'Estado', 'Observaciones', 'creado_fecha'
  ],
  Activos_Tangibles: [
    'id', 'Nombre', 'Descripción / Marca', 'Modelo', 'N° Identificación', 'Fecha Ingreso',
    'Cantidad', 'Valor Unitario', 'Valor Total', 'Observaciones', 'creado_fecha'
  ],
  Activos_Intangibles: [
    'id', 'Nombre', 'Licencia', 'Fecha Contrato', 'Fecha Vencimiento', 'Cantidad',
    'Valor', 'Valor Total', 'Observaciones', 'creado_fecha'
  ]
};

// IDs de los archivos fuente EXTERNOS (fuera de nuestra Sheet maestra).
// Si alguno cambia de ubicación, actualiza el ID acá — nada más en el código
// depende de dónde esté guardado el archivo.
const FUENTES_EXTERNAS = {
  FOR_SGC_004: '1tlHRhhH0piEegMRLpjKPSHpgOrr6xkBCsjqLJcbjVeI',
  FOR_ADQ_002: '1jyHY3O2hjsyEelw6x4TEUFo2iDjDwBVQ',
  COMERCIAL: '1N6BmSf_3pjdmUmIcIl_BVknBi9sdvQBDKSgkxoCjIV0',
  ENCUESTA_SATISFACCION: '1mALONKMfJ7AuyX-CSjxtP4EKyeX0kpgFj6gLtcj4koM',
  NO_CONFORMIDADES: '1AmmEyavD1bvpq-vsUaicaTZH5w68NXaO',
  // Pendiente: Carlos debe convertir DOC-SGC-012 PLAN CAPACITACION a Google Sheets
  // (hoy es .xls) y pasar el ID nuevo acá. Carpeta con el archivo de cada año:
  // https://drive.google.com/drive/folders/112M0okMeGraTkUQd3rIyiYx3l2cF4GUb
  // IMPORTANTE: este archivo se reemplaza cada año — a inicios de cada año hay
  // que confirmar con Carlos cuál es el archivo vigente y actualizar este ID.
  CAPACITACIONES_CARPETA: '112M0okMeGraTkUQd3rIyiYx3l2cF4GUb',
  CAPACITACIONES: '1OIDbXgQpwYGg27-IZ29_PYQUqXH2DvdcwJ7rvQNjgUc',
  // Adecuación de Recursos (sección 11 del informe)
  ACTIVOS_TANGIBLES: '1RLC3awgLSD9gyWEt3S3npcNWEiInwKgsZyBT_akJNu0',   // DOC-ADQ-001
  ACTIVOS_INTANGIBLES: '141jQdYagohdZIYQJhr8m4Yq2E5EzAX7n9oINCon79o0'  // DOC-ADQ-002
};

// Imagen del organigrama (DOC-RRH-001), ya convertida a JPG por Carlos —
// se inserta directo en la sección 11 del informe con appendInlineImage().
const ORGANIGRAMA_IMG_ID = '1iSx2WJuJa42KchG0L68RiDT1ueL7Icm1';

// Campo categorial que cada tabla EXIGE para que el ítem replicado sea
// visible en su propia pantalla (todas agrupan/filtran por este campo).
// Sin esto, la replicación crea la fila igual pero queda "invisible" en
// la vista agrupada — el bug que reportó Carlos con FODA/PESTEL/BSC.
const CAMPOS_REQUERIDOS_REPLICACION = {
  FODA: 'Categoría',
  PESTEL: 'Categoría PESTEL',
  Riesgos_Oportunidades: 'Tipo',
  Balance_Scorecard: 'Ámbito'
};

/**
 * Ejecutar UNA VEZ manualmente desde el editor de Apps Script.
 * Crea las 7 pestañas con sus encabezados si no existen, y deja la
 * hoja "Hoja 1" por defecto de Sheets eliminada.
 */
function inicializarEstructura() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  Object.keys(ESQUEMA).forEach(function (nombrePestana) {
    let hoja = ss.getSheetByName(nombrePestana);
    if (!hoja) {
      hoja = ss.insertSheet(nombrePestana);
    }
    const encabezados = ESQUEMA[nombrePestana];
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, encabezados.length)
      .setFontWeight('bold')
      .setBackground('#003B49')
      .setFontColor('#FFFFFF');
    hoja.autoResizeColumns(1, encabezados.length);
  });

  // Elimina la hoja "Hoja 1" en blanco que Sheets crea por defecto, si sigue ahí
  const hojaDefecto = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hojaDefecto && ss.getSheets().length > 1) {
    ss.deleteSheet(hojaDefecto);
  }

  Logger.log('Estructura inicializada: ' + Object.keys(ESQUEMA).join(', '));
}

/**
 * Ejecutar UNA VEZ si ya habías corrido inicializarEstructura() antes de agregar
 * el campo "Responsables de ejecución". Agrega la columna que falte en cada
 * pestaña ya existente, sin tocar ni reordenar los datos ya cargados.
 */
function migrarAgregarColumnasFaltantes() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Object.keys(ESQUEMA).forEach(function (nombrePestana) {
    const hoja = ss.getSheetByName(nombrePestana);
    if (!hoja) return;
    const encabezadosEsperados = ESQUEMA[nombrePestana];
    const ultimaCol = hoja.getLastColumn();
    const encabezadosActuales = ultimaCol > 0
      ? hoja.getRange(1, 1, 1, ultimaCol).getValues()[0]
      : [];
    encabezadosEsperados.forEach(function (campo) {
      if (encabezadosActuales.indexOf(campo) === -1) {
        const nuevaCol = hoja.getLastColumn() + 1;
        hoja.getRange(1, nuevaCol).setValue(campo)
          .setFontWeight('bold').setBackground('#003B49').setFontColor('#FFFFFF');
        Logger.log('Agregada columna "' + campo + '" en ' + nombrePestana);
      }
    });
  });
  Logger.log('Migración completa.');
}

/**
 * Genera un ID único simple (timestamp + azar) para nuevos registros.
 */
function generarId() {
  return Utilities.getUuid();
}

/**
 * IMPORTACIÓN INICIAL — carga masiva del FODA ya existente en DOC-SGC-003.
 * Ejecutar UNA SOLA VEZ manualmente. Si la corres dos veces, va a duplicar
 * los ítems — bórralos de la pestaña FODA antes de repetir si hace falta.
 *
 * Quedan sin puntuar (Probabilidad/Impacto en blanco) y con Ámbito "Oficina"
 * por defecto (es el análisis corporativo, no de una obra puntual) —
 * puedes ajustar cada ítem desde la propia app después de importar.
 */
function importarFODAInicial() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('FODA');
  const responsablesPorDefecto = 'Carlos Braun, Cristián Menéndez';
  const ahora = new Date().toISOString();

  const fortalezas = [
    'No tenemos traslados a grandes distancias que impliquen riesgos',
    'Empresa con trabajadores de la región, por lo que no hay gastos de traslado ni alimentación.',
    'Experiencia de nuestros trabajadores en obras (los más antiguos).',
    'Experiencia de nuestros ingenieros.',
    'Seriedad y compromiso en sacar las obras adelante.',
    'Cumplimiento de plazos.',
    'Equipamiento y Herramientas adecuado.',
    'Instalaciones adecuadas.',
    'Cercanía con Cliente.',
    'Beneficios CCHC.',
    'Seriedad en el manejo financiero y oportuno pago de sueldos.',
    'Estabilidad Laboral.',
    'Bajo índice de accidentes.',
    'Versátiles. (más oportunidades en el mercado).',
    'Comunicación y buen trato proveedores',
    'Buena comunicación y buen ambiente laboral en general.',
    'Buen ambiente y trato humano.',
    'Buen Comportamiento con entidades bancarias'
  ];

  const debilidades = [
    'No desarrollamos el I+D',
    'Estructura más Cara'
  ];

  const oportunidades = [
    'Hidrógeno Verde',
    'Licitaciones Públicas',
    'Energías renovables',
    'Cámaras de seguridad',
    'Buscar y comprar materiales y equipos que generen menos contaminación (Ropa Seg, flexible libre de halógenos, evitar el uso de PVC).',
    'Implementar REVIT para diferenciarnos',
    'Hacer encuesta de Propuesta de Valor interna/externa',
    'Desarrollar competencias en IA',
    'Implementar software eléctrico parametrico',
    'Meter IA en nuestros análisis'
  ];

  const amenazas = [
    'Posibles enfermedades por hacinamiento, porque constructoras no nos asignan el espacio adecuado.',
    'Multas por mala condición laboral.',
    'Aparición de nuevos actores en el mercado.',
    'Crisis económica y recesión',
    'Nuevas pandemias',
    'Traslados en largas distancias',
    'Trabajos en altura',
    'Falta de programa de obra en etapa temprana',
    'Ejecución de proyecto sin proyecto terminado al iniciar obra.',
    'Pérdida de talento',
    'Estallido social',
    'Cambio condiciones climáticas',
    'Cierre de fronteras, geopolítico',
    'Falla rolón que viene desde Puerto Natales',
    'Riesgos de incendio, riesgos de accidentes, riesgos de electrocución, riesgos de multas por parte de SEC, riesgo cierre empresa.',
    'Baja solvencia de clientes por situación económica actual.',
    'Alta competencia con costos operacionales menores',
    'Cambios en Normas',
    'Exigencias nuevas mandantes',
    'Nuevas tecnologías IA y REVIT',
    'Poca transparencia en el cierre de licitaciones con clientes'
  ];

  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  let total = 0;

  function insertarLote(categoria, lista) {
    lista.forEach(function (descripcion) {
      const registro = {
        id: generarId(),
        'Categoría': categoria,
        'Descripción': descripcion,
        'Ámbito': 'Oficina',
        'Responsables de ejecución': responsablesPorDefecto,
        'Monitorear en Panel de Control': 'No',
        creado_por: 'Importación inicial (DOC-SGC-003)',
        creado_fecha: ahora
      };
      const fila = encabezados.map(function (campo) {
        return registro[campo] !== undefined ? registro[campo] : '';
      });
      hoja.appendRow(fila);
      total++;
    });
  }

  insertarLote('Fortaleza', fortalezas);
  insertarLote('Debilidad', debilidades);
  insertarLote('Oportunidad', oportunidades);
  insertarLote('Amenaza', amenazas);

  Logger.log('Importación completa: ' + total + ' ítems FODA cargados.');
}

/**
 * IMPORTACIÓN INICIAL — carga masiva del PESTEL ya existente en DOC-SGC-008.
 * Ejecutar UNA SOLA VEZ. Ámbito por defecto "Oficina" (análisis corporativo).
 * Probabilidad/Consecuencia quedan en blanco (tu documento no las tenía
 * puntuadas, solo Plazo e Impacto) — ajústalas desde la app si quieres.
 */
function importarPESTELInicial() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('PESTEL');
  const responsablesPorDefecto = 'Carlos Braun, Cristián Menéndez';
  const ahora = new Date().toISOString();

  // [Categoría, Factor, Descripción, Plazo, Impacto]
  const items = [
    ['Político', 'Conflictos bélicos internacionales', 'Guerras que afecten valores o disponibilidad de insumos', 'Mediano', 'Negativo'],
    ['Político', 'Políticas fiscales', 'Cambios fiscales que aumenten impuestos', 'Mediano', 'Negativo'],
    ['Político', 'Conflictos internos', 'Que aumenten inestabilidad económica por conflictos internos', 'Corto', 'Negativo'],
    ['Político', 'Subsidios', 'Subsidios que beneficien a la empresa', 'Corto', 'Positivo'],
    ['Político', 'Aislamiento de la región', 'Efecto en la llegada de materiales e insumos por aislamiento', 'Corto', 'Negativo'],
    ['Económico', 'Inflación', 'Aumento de costos operativos por inflación', 'Corto', 'Negativo'],
    ['Económico', 'Inestabilidad $ del cobre', 'Aumento de costo de materiales por variación precio cobre', 'Corto', 'Negativo'],
    ['Económico', 'Inestabilidad $ del petróleo', 'Aumentos de costo de materiales y transportes, por variación petróleo', 'Corto', 'Negativo'],
    ['Económico', 'Inestabilidad $ del dólar', 'Aumento de costo de materiales, por variación dólar', 'Corto', 'Negativo'],
    ['Económico', 'Aumento de tasas de interés', 'Disminuye posibilidad crediticia por aumento de tasas', 'Corto', 'Negativo'],
    ['Económico', 'Restricción de créditos', 'Aumentan restricciones por parte de bancos para otorgar créditos', 'Corto', 'Negativo'],
    ['Económico', 'Aumento de costos laborales', 'Aumento de costos laborales', 'Corto', 'Negativo'],
    ['Económico', 'Aumento de impuestos', 'Impuestos, aumento de costos operativos', 'Corto', 'Negativo'],
    ['Económico', 'Reactivación de economía', 'Reactivación del gobierno para favorecer inversiones', 'Corto', 'Positivo'],
    ['Económico', 'Crisis económica', 'Crisis económica, efecto sobre principales clientes en su liquidez', 'Corto', 'Negativo'],
    ['Social', 'Estallido social', 'Estallido social, efecto en toma de carreteras, protestas y otros', 'Mediano', 'Negativo'],
    ['Social', 'Baja mano de obra calificada', 'Baja M/O calificada, efecto en no contar con el RRHH necesario', 'Corto', 'Negativo'],
    ['Social', 'Pandemias', 'Pandemias, efecto en el normal operar de la empresa', 'Mediano', 'Negativo'],
    ['Tecnológico', 'Obsolescencia de equipos', 'Equipos que queden obsoletos', 'Largo', 'Negativo'],
    ['Tecnológico', 'Licencias de software', 'Software, alto costo en licencias', 'Corto', 'Negativo'],
    ['Tecnológico', 'Innovación tecnológica', 'Innovación, nuevas tecnologías que mejoren operación y procesos', 'Mediano', 'Positivo'],
    ['Tecnológico', 'Hackeo de sistemas', 'Hackeos a cuentas bancarias y correos electrónicos', 'Corto', 'Negativo'],
    ['Tecnológico', 'IA', 'Inteligencia artificial aplicada a la operación', 'Corto', 'Positivo'],
    ['Tecnológico', 'REVIT', 'Modelamiento BIM en proyectos', 'Corto', 'Positivo'],
    ['Tecnológico', 'Software control interno', 'Software de control interno de gestión', 'Mediano', 'Positivo'],
    ['Tecnológico', 'Aumento cuenta energía', 'La energía eléctrica ha aumentado considerablemente, del orden de un 50%', 'Corto', 'Negativo'],
    ['Ecológico-Ambiental', 'Proyectos de hidrógeno verde', 'Aumento en la prestación de servicios asociados a hidrógeno verde', 'Largo', 'Positivo'],
    ['Ecológico-Ambiental', 'Reciclaje', 'Residuos peligrosos sin destino controlado', 'Corto', 'Negativo'],
    ['Ecológico-Ambiental', 'Reducción del uso del papel', 'Reducción del uso del papel que disminuye costos', 'Corto', 'Positivo'],
    ['Ecológico-Ambiental', 'Condiciones climáticas extremas', 'Condiciones ambientales que paralicen o retrasen la prestación de servicios', 'Corto', 'Negativo'],
    ['Ecológico-Ambiental', 'Ley de responsabilidad del productor de residuos', 'Modificación de procesos y aumento de costos', 'Mediano', 'Negativo'],
    ['Ecológico-Ambiental', 'Subsidios a instalación de fuentes de energías renovables', 'Abrir nueva línea de negocios en instalación y mantención de sistemas fotovoltaicos', 'Mediano', 'Positivo'],
    ['Legal', 'Ley de pensiones', 'Aumento del costo operacional por la mano de obra', 'Corto', 'Negativo'],
    ['Legal', 'Ley del salario mínimo', 'Aumento de costo de proveedores', 'Corto', 'Negativo'],
    ['Legal', 'Ley en materias de salud y seguridad ocupacional', 'Incumplimientos que puedan causar multas o cierres de faena', 'Corto', 'Negativo'],
    ['Legal', 'Ley de 40 horas de trabajo', 'Aumento del costo operacional por la mano de obra', 'Mediano', 'Negativo'],
    ['Legal', 'Modificación de leyes de zonas extremas', 'Leyes que posiblemente beneficien a la empresa a nivel de reducción de impuestos y otros', 'Mediano', 'Indiferente'],
    ['Legal', 'Ley de negociación ramal', 'Posibles efectos que pueda tener sobre la valorización de la mano de obra', 'Mediano', 'Indiferente'],
    ['Legal', 'Decreto 44', 'Nuevo reglamento sobre gestión preventiva de riesgos laborales para un entorno de trabajo seguro y saludable', 'Corto', 'Indiferente'],
    ['Legal', 'Ley Karin', 'Efectos adversos que pueda tener esta ley, judicialización', 'Corto', 'Negativo']
  ];

  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  items.forEach(function (it) {
    const registro = {
      id: generarId(),
      'Categoría PESTEL': it[0],
      'Factor': it[1],
      'Descripción del factor': it[2],
      'Plazo': it[3],
      'Impacto': it[4],
      'Ámbito': 'Oficina',
      'Responsables de ejecución': responsablesPorDefecto,
      'Monitorear en Panel de Control': 'No',
      creado_por: 'Importación inicial (DOC-SGC-008)',
      creado_fecha: ahora
    };
    const fila = encabezados.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(fila);
  });

  Logger.log('Importación completa: ' + items.length + ' factores PESTEL cargados.');
}

/**
 * IMPORTACIÓN INICIAL — carga masiva de Partes Interesadas ya existentes en
 * DOC-SGC-007 (Rev. 2). Ejecutar UNA SOLA VEZ. No incluye la sección de
 * Ley 21.719 (protección de datos) por tener columnas distintas — se puede
 * armar aparte si se necesita.
 */
function importarPartesInteresadasInicial() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Partes_Interesadas');
  const responsablesPorDefecto = 'Carlos Braun, Cristián Menéndez';
  const ahora = new Date().toISOString();

  // [Tipo, Parte interesada, Necesidad/expectativa, Requisitos, Riesgos y oportunidades]
  const items = [
    ['Interna', 'Dueños de la Organización', 'Maximizar la Utilidad', 'Lograr la rentabilidad basada en costos de mano de obra, gastos generales, gastos en materiales y utilidad.', 'Riesgo: Cierre de la empresa por no lograr utilidad esperada o por pérdidas insostenibles. Oportunidad: crecimiento y expansión de la organización.'],
    ['Interna', 'Dueños de la Organización', 'Asegurar la calidad de los servicios', 'Cumplir con la satisfacción de los clientes.', 'Riesgo: Por pérdidas de control de los proyectos entregar servicios de mala calidad. Oportunidad: Fidelización de clientes y apertura de nuevas carteras.'],
    ['Interna', 'Dueños de la Organización', 'Entrega de propuestas atractivas y en forma oportuna', 'Lograr el máximo de adjudicaciones, realizando un buen análisis de licitaciones y confección de propuestas', 'Riesgo: no contar con el tiempo suficiente para el estudio y preparación de la propuesta por envío tarde del cliente o por sobrecarga de personal. Oportunidad: Fidelización de clientes y apertura de nuevas carteras.'],
    ['Interna', 'Gerencia general', 'Contar con un buen equipo de trabajo.', 'Tener perfiles de cargos definidos y procesos de selección eficientes', 'Riesgo: No contar con personal competente. Oportunidad: profesionales altamente calificados'],
    ['Interna', 'Gerencia general', 'Cumplir con los objetivos estratégicos definidos', 'Cumplimiento de metas relacionadas a los objetivos', 'Riesgos: No lograr un crecimiento sostenible ni la mejora continua. Oportunidad: lograr estándares esperados, mejora continua sostenida y alto grado de satisfacción de clientes.'],
    ['Interna', 'Trabajadores en general', 'Seguridad en el trabajo.', 'Cumplimiento DS 594, Ley 16.744 y Código del trabajo.', 'Riesgos: No considerar protocolos ni factores de riesgo debido a falta de planificación, desconocimiento o compromiso. Generación de accidentes o incidentes laborales. Oportunidad: al cumplir estándares de seguridad se puede bajar indicadores y tasas de cotización.'],
    ['Interna', 'Trabajadores en general', 'Estar en un ambiente ameno y con respaldo en la continuidad del trabajo y cumplimiento en remuneraciones y leyes sociales', 'Buen ambiente de trabajo y estabilidad laboral. Pago oportuno de sueldos e imposiciones.', 'Riesgos: discrepancias por expectativas no cumplidas, disconformidad por diferencias de sueldos, malos tratos, crisis económicas que generen despidos o retrasos en pago. Oportunidad: compromiso y fidelización de los equipos de trabajo y continuidad laboral.'],
    ['Interna', 'Trabajadores en general', 'Crecimiento y formación profesional', 'Recibir instrucción necesaria (planes de capacitación) e incentivos relacionados a mejoras de puestos de trabajo', 'Riesgo: por no realizar un buen desarrollo de planes de formación, impacto negativo en la calidad del servicio y accidentes. Oportunidad: Personal con formación permanente impacta positivamente en calidad y compromiso.'],
    ['Interna', 'Personal de obra', 'Contar con vehículos, maquinarias, herramientas y EPP en buenas condiciones', 'Maquinaria, vehículos, EPP y herramientas en buen estado de mantención y operación', 'Riesgo: de accidentes y de servicios de baja calidad o retrasos. Oportunidad: aumentar eficiencia en los servicios.'],
    ['Interna', 'Trabajadores/as de faena', 'Adecuadas condiciones de estadía en faenas fuera de la ciudad', 'Contar con alojamiento, alimentación y servicios sanitarios adecuados.', 'Riesgos: Mala planificación de obra, descontento de trabajadores que puedan paralizar obras. Oportunidad: mayor satisfacción de trabajadores y mejor rendimiento operacional.'],
    ['Interna', 'Profesionales de ingeniería y proyectos', 'Cumplimiento de la planificación de un proyecto', 'Contar con los recursos necesarios en proyectos. Cumplir con planificación de un proyecto', 'Riesgos: gestión deficiente del área de abastecimiento, mala comunicación interna, retrasos a causa del mandante. Oportunidad: optimización de recursos y cumplimiento de plazos'],
    ['Interna', 'Profesionales de ingeniería y proyectos', 'Contar con los mejores precios de materiales sin ir en desmedro de la calidad', 'Materiales que cumplan las expectativas de calidad con precios bajos', 'Riesgo: Aumento del costo de los proyectos. Oportunidad: optimización de los recursos.'],
    ['Interna', 'Asesoría de prevención de riesgos', 'Cumplir con leyes aplicables, implementar cultura de la prevención, contar con programas de gestión en SSO', 'Apoyo de gerencia y propietarios para implementar programas de gestión SSO. Personal comprometido. Disponibilidad de EPP adecuados.', 'Riesgos: que línea de mando medio no actúe en coherencia con el sistema de gestión SSO, desconocimiento de normativa, accidentes que afecten costos/plazos. Oportunidad: bajar indicadores y tasas de cotización.'],
    ['Interna', 'Asesoría contable', 'Realizar un eficiente intercambio de información fidedigna y actualizada', 'Entrega de información en los plazos', 'Riesgos: deficientes cálculos de sueldos, imposiciones, impuestos, generación de multas y pérdidas.'],
    ['Interna', 'Personal de RRHH y finanzas', 'Entrega de información de pago de proveedores oportuna y respaldada, pago de horas extras a tiempo, coordinación de capacitaciones', 'Cumplir a cabalidad los procedimientos de RRHH y finanzas, aumentar expertise capacitándose constantemente.', 'Riesgo: no comunicar a tiempo modificaciones contractuales, falta de coordinación con otros departamentos, multas o cierre de cuentas de proveedores.'],
    ['Interna', 'Logística', 'Realizar compras según procedimientos, entregar informes en tiempo y forma, manejar stocks críticos, mantener cartera de proveedores', 'Cumplir con el procedimiento de adquisiciones aplicable, proponer mejoras constantemente.', 'Riesgo: no considerar stocks críticos, compras por presión a mayor precio, mala asesoría de proveedores. Oportunidad: procedimientos sólidos que aporten al crecimiento real.'],

    ['Externa', 'Clientes generales', 'Dar cumplimiento a los requisitos del servicio', 'Servicio de calidad acorde a lo solicitado.', 'Riesgo: Clientes con deficiente grado de satisfacción, pérdida de clientes y prestigio. Oportunidad: servicio conforme que fidelice al cliente y genere nuevos proyectos y recomendaciones.'],
    ['Externa', 'Clientes de obra', 'Cumplimiento de requisitos técnicos, legales y administrativos del servicio y plazos de ejecución', 'Cumplimiento de condiciones de SSO, legalidad, técnicas, administrativas y plazos', 'Riesgo: deficiente grado de satisfacción, pérdida de clientes y prestigio, cobro de multas asociadas a garantías. Oportunidad: fidelización y recomendaciones a otras empresas del sector.'],
    ['Externa', 'Aseguradoras', 'Contar con pagos convenidos y entrega de información fidedigna en caso de siniestro', 'Pagos al día, información completa y oportuna', 'Riesgo: no pago de beneficio del seguro en caso de siniestro.'],
    ['Externa', 'Seremi de Salud', 'Contar con condiciones sanitarias adecuadas, basadas en la ley vigente', 'Cumplimiento de DS594 y normativa sanitaria/EPP asociada', 'Riesgo: Inspecciones sorpresivas, incumplimiento de la legislación aplicable que conlleve a multas.'],
    ['Externa', 'Ministerio del trabajo', 'Cumplir con legislación aplicable', 'Código del Trabajo y normativa de seguridad y subcontratación asociada', 'Riesgo: Incumplimiento de la legislación aplicable que conlleve a multas'],
    ['Externa', 'SUSESO (Superintendencia de Seguridad Social)', 'Cumplir con legislación aplicable', 'Ley 16.744 y Ley 19.345 sobre accidentes del trabajo y enfermedades profesionales', 'Riesgo: Incumplimiento de la legislación aplicable que conlleve a multas o sumarios.'],
    ['Externa', 'Carabineros de Chile', 'Cumplir con legislación aplicable', 'Cumplir con Ley del tránsito', 'Riesgo: Incumplimiento de la legislación aplicable que conlleve a multas, detención de choferes y/o vehículos.'],
    ['Externa', 'Municipalidades', 'Cumplir con legislación aplicable', 'Cumplimiento de ordenanzas municipales y ley de patentes municipales', 'Riesgo: Incumplimiento de la legislación aplicable que conlleve a multas o paralización de obras.'],
    ['Externa', 'SII', 'Cumplir con legislación aplicable y con los pagos de impuestos', 'Cumplimiento de ley tributaria', 'Riesgo: Incumplimiento que conlleve a multas, retención de impuestos o bloqueo de facturación.'],
    ['Externa', 'Ministerio de medio ambiente', 'Cumplir con legislación aplicable', 'Ley N°19.300 de Bases Generales del Medio Ambiente y normativa asociada', 'Riesgo: Paralización de obras y multas.'],
    ['Externa', 'Ministerio de transportes y telecomunicaciones', 'Cumplir con legislación aplicable', 'Permiso de circulación y revisión técnica al día, Ley de Tránsito y normativa de emisiones', 'Riesgo: multas por no contar con documentación al día, prohibición de uso de vehículos o maquinarias.'],
    ['Externa', 'Entidades bancarias', 'Cumplir con los pagos comprometidos', 'Cumplimiento de acuerdos en montos y plazos de pagos', 'Riesgo: Envío a DICOM, intereses por atrasos, cierre de cuentas. Oportunidad: aumento de ofertas de financiamiento.'],
    ['Externa', 'Proveedores de bienes materiales', 'Solicitar bienes con especificaciones claras y cumplir con pagos acordados', 'Envío de OC oportunamente y pago de acuerdo a los plazos establecidos', 'Riesgo: incumplimiento de especificaciones o plazos de entrega, bloqueo de crédito. Oportunidad: alianzas estratégicas, mejores condiciones de precio y plazo.'],
    ['Externa', 'Contratistas o proveedores de Servicios', 'Solicitar servicios con especificaciones claras y cumplir con pagos acordados', 'Envío de OC o contrato oportunamente y pago de acuerdo a los plazos establecidos', 'Riesgo: incumplimiento de labores o plazos, paralización de trabajos en caso de no pago, incidentes que afecten ley de subcontratación.'],
    ['Externa', 'SEC', 'Cumplimiento de condiciones legales y técnicas', 'Cumplimiento de decreto 8 y reglamentos técnicos RIC asociados', 'Riesgo: No entrega de certificados e instalaciones fuera de norma.'],
    ['Externa', 'Cámara Chilena de la Construcción', 'Recomendación de 2 empresas socias y pago oportuno', '2 referidos para ingresar y pago de cuota trimestral', 'Riesgo: suspensión de la permanencia dentro de la CChC y pérdida de beneficios. Oportunidad: beneficios sociales y vinculación con empresas del sector.'],
    ['Externa', 'ONG Canales y Don Bosco', 'Prestar apoyo para prácticas laborales, visitas a terreno, materiales', 'Dar condiciones para visitas a terreno, generar cupos para prácticas, realizar donaciones.', 'Riesgo: no contar con disponibilidad de practicantes. Oportunidad: captación de nuevos trabajadores, responsabilidad social empresarial.'],
    ['Externa', 'Mutual de Seguridad de la CChC', 'Participación activa en programas ofrecidos, comunicación fluida en caso de accidentes', 'Pago oportuno de tasa asociada', 'Riesgo: incumplimiento legal que deje a trabajadores sin cobertura ante accidentes. Oportunidad: socio estratégico, capacitaciones sin costo extra, asesorías.']
  ];

  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  items.forEach(function (it) {
    const registro = {
      id: generarId(),
      'Tipo': it[0],
      'Parte interesada': it[1],
      'Necesidad / expectativa': it[2],
      'Requisitos': it[3],
      'Riesgos y oportunidades': it[4],
      'Responsables de ejecución': responsablesPorDefecto,
      'Monitorear en Panel de Control': 'No',
      creado_por: 'Importación inicial (DOC-SGC-007)',
      creado_fecha: ahora
    };
    const fila = encabezados.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(fila);
  });

  Logger.log('Importación completa: ' + items.length + ' partes interesadas cargadas.');
}

/**
 * IMPORTACIÓN INICIAL — carga masiva de la sección "Partes interesadas
 * asociadas a la Ley de Protección de Datos Personales (Ley 21.719)" de
 * DOC-SGC-007 Rev. 2. Ejecutar UNA SOLA VEZ. Entra en vigencia 1-dic-2026.
 *
 * Mapeo de columnas (esta sección usa una estructura distinta al resto):
 * - Necesidad/expectativa  <- "Requisitos y Expectativas de Privacidad (ISO 9001)"
 * - Requisitos             <- "Flujo de Datos y Canales Específicos"
 * - Riesgos y oportunidades <- Calificación Jurídica + Base de licitud legal
 */
function importarLey21719Inicial() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Partes_Interesadas');
  const responsablesPorDefecto = 'Carlos Braun, Cristián Menéndez';
  const ahora = new Date().toISOString();

  // [Tipo, Parte interesada, Necesidad/expectativa, Requisitos, Riesgos y oportunidades]
  const items = [
    ['Interna', 'Gerencia General / Encargado SGC', 'Garantizar la confidencialidad total de secretos comerciales e infraestructura crítica (cárceles, comisarías) y resguardar la validez jurídica de las firmas de la empresa.', 'Acceso global a todos los sistemas (Defontana, Drive, Correo). Envío mensual de rankings de desempeño con copia a todos los ingenieros. Uso de Firma Electrónica Avanzada.', 'Ley 21.719 — Calificación: Responsable del Tratamiento (y DPD). Base de licitud: Interés Legítimo / Ejecución de Contrato (Dirección y control de la empresa).'],
    ['Interna', 'Administración / Recursos Humanos Interno', 'Acceso restringido a datos financieros e históricos laborales. Evitar la fuga de datos biográficos y familiares en las carpetas del personal.', 'Gestión de sueldos, finiquitos, vacaciones, licencias médicas. Control de asistencia biométrica (rostro, huella, clave en GeoVictoria). Asignación de claves corporativas y ERP Defontana.', 'Ley 21.719 — Calificación: Co-Responsable / Operador Interno. Base de licitud: Ejecución de Contrato Laboral / Obligación Legal (Código del Trabajo).'],
    ['Interna', 'Ingenieros de Proyectos', 'Acceso oportuno a datos técnicos sin sobrepasar los límites de privacidad de los maestros de obra. Prohibición de divulgación de datos de proyectos confidenciales.', 'Acceso a Defontana acotado a compras e inventario por centro de costo. Manejo de datos financieros y RR.HH. limitados a su obra. Recepción de planos, EETT y reglamentos de clientes.', 'Ley 21.719 — Calificación: Usuario Autorizado / Operador de Terreno. Base de licitud: Ejecución de Contrato (Cumplimiento de asignación técnica).'],
    ['Interna', 'Trabajadores (Maestros, Ayudantes, Técnicos)', 'Exigen que sus rankings no generen menoscabo, que el GPS no los vigile fuera de jornada, que sus tallas de EPP no sean expuestas públicamente y que sus datos de salud sean reservados.', 'Entrega de datos biométricos (rostro/huella), CVs, datos familiares. Monitoreo GPS y cámaras CCTV. Publicación de gráficos de rendimiento de AppSheet a la vista de toda la obra para bonos.', 'Ley 21.719 — Calificación: Titulares de los Datos. Base de licitud: Consentimiento Expreso (FOR-SGC-010) para biometría, rankings públicos, WhatsApp e imagen.'],
    ['Interna', 'Prevención de Riesgos (Part-Time)', 'Acceso confidencial y restringido a historiales médicos de aptitud laboral. Obligación de guardar secreto profesional estricto.', 'Manejo de contratos, CVs, e información médica altamente sensible (exámenes preocupacionales, ocupacionales, de altura). Registro y control de entrega de EPP individuales.', 'Ley 21.719 — Calificación: Custodio de Datos Sensibles. Base de licitud: Obligación Legal / Cumplimiento de Contrato (Ley 16.744).'],
    ['Interna', 'Asistente Social', 'Confidencialidad absoluta bajo código de ética profesional. Silo de datos físico u offline para evitar rastreos o hackeos de fichas sociales.', 'Contacto permanente con trabajadores y familias. Manejo de datos de extrema sensibilidad: salud familiar, crisis socioeconómicas, postulación a subsidios de vivienda.', 'Ley 21.719 — Calificación: Custodio de Datos Sensibles. Base de licitud: Consentimiento Expreso del Trabajador / Interés Legítimo.'],
    ['Interna', 'Logística (Antes Compras y Bodega)', 'Mantener resguardadas las listas de precios y datos de contacto de proveedores estratégicos frente a competidores.', 'Acceso a Defontana (bodega, compras, inventario). Manejo de bases de datos de proveedores, listas de precios, evaluaciones de retroalimentación individuales.', 'Ley 21.719 — Calificación: Usuario Autorizado. Base de licitud: Ejecución de Contrato / Interés Legítimo.'],
    ['Interna', 'Supervisor de terreno', 'Garantizar que en terreno exista una caja con candado con acceso exclusivo a esta persona, para que nadie más extraiga información de los trabajadores.', 'Acceso a información del personal a su cargo: liquidaciones de sueldo, contratos, anexos y finiquitos procesados en Defontana/Zenda.', 'Ley 21.719 — Calificación: Maestro Mayor con funciones de Supervisión. Base de licitud: Contrato de Prestación de Servicios con Cláusula de Encargado (Art. 21 Ley 21.719).'],

    ['Externa', 'Clientes Mandantes (Públicos / Privados)', 'Exigen la protección estricta de su seguridad nacional e industrial (planos de recintos penitenciarios). Cero divulgación de etapas conceptuales que causen daño comercial.', 'Entrega de cédulas, escrituras, números municipales, certificados de vigencia, contratos y planos críticos. Exigen a Senercom contratos de trabajadores y certificados de asistencia.', 'Ley 21.719 — Calificación: Tercero / Co-Responsable. Base de licitud: Gestión Precontractual y Ejecución de Contrato / Obligación Legal (Ley de Subcontratación).'],
    ['Externa', 'Oficina Contable Externa (David y Claudia)', 'Garantizar que el estudio contable cuente con servidores seguros, antivirus licenciados y que ningún empleado externo extraiga las nóminas de sueldo.', 'Acceso y procesamiento de información financiera, contable, flujos de caja, liquidaciones de sueldo, contratos, anexos y finiquitos procesados en Defontana/Zenda.', 'Ley 21.719 — Calificación: Encargado del Tratamiento. Base de licitud: Contrato de Prestación de Servicios con Cláusula de Encargado (Art. 21 Ley 21.719).'],
    ['Externa', 'Proveedores de Materiales y Equipos', 'Recibir solo información técnica anonimizada (planos sin el nombre del cliente final ni ubicaciones exactas) para cotizar de manera transparente.', 'Recepción de solicitudes de presupuesto e información contable de Senercom. Recepción ocasional de planos y documentos técnicos de clientes para cotizar.', 'Ley 21.719 — Calificación: Tercero / Destinatario. Base de licitud: Gestión Precontractual / Interés Legítimo.'],
    ['Externa', 'CChC (Cámara Chilena de la Construcción)', 'Resguardo de la información de menores de edad (hijos de trabajadores) bajo los más altos estándares de seguridad.', 'Envío mensual de reportes de control de residuos. Envío de datos de trabajadores e hijos para postulación a becas escolares y programas de bienestar.', 'Ley 21.719 — Calificación: Tercero Autorizado. Base de licitud: Cumplimiento de Convenio / Consentimiento Expreso (becas familiares).'],
    ['Externa', 'Entidades Fiscalizadoras (SEC, Inspección del Trabajo, AFC, Mutual)', 'Transferencia de datos segura a portales estatales, restringiendo la información al mínimo exigido por los formularios de la ley.', 'SEC: inscripción de proyectos, carnet, escrituras, planos. DT: carga de contratos, anexos, asistencia biométrica, finiquitos. Mutual: datos médicos y tasas de accidentabilidad.', 'Ley 21.719 — Calificación: Terceros Institucionales. Base de licitud: Cumplimiento de Obligación Legal (Potestad fiscalizadora del Estado).'],
    ['Externa', 'Instituciones Bancarias', 'Asegurar que los datos de proyectos de terceros entregados al banco no sean expuestos ni usados para análisis de riesgo comercial ajenos al proyecto.', 'Recepción de información contable, carpetas tributarias e información técnica de proyectos de terceros para la emisión y gestión de boletas de garantía.', 'Ley 21.719 — Calificación: Tercero Destinatario. Base de licitud: Cumplimiento de Obligación Legal / Gestión Precontractual.'],
    ['Externa', 'Postulantes a Puestos de Trabajo', 'Expectativa de que sus CVs no sean compartidos con otras empresas y sean eliminados de forma segura si no son seleccionados, sin sesgos discriminatorios en pruebas.', 'Envío de Currículums Vitae vía web o correo de contacto. Sujetos a pruebas de ingreso teórico-prácticas para selección de personal.', 'Ley 21.719 — Calificación: Titulares de los Datos. Base de licitud: Gestión Precontractual (Consentimiento tácito al enviar el CV).'],
    ['Externa', 'Agencia de Marketing (Interna o Contratada)', 'Obligación de editar o anonimizar (pixelar rostros, patentes) sin consentimiento explícito. Prohibición de usar material tras revocación del titular.', 'Captura y edición de material audiovisual de trabajadores en faena u oficinas. Publicación de campañas en Instagram, Facebook, LinkedIn y web.', 'Ley 21.719 — Calificación: Encargado del Tratamiento. Base de licitud: Contrato de Servicios / Consentimiento Expreso de Imagen.'],
    ['Externa', 'Proveedores de Software (GeoVictoria, Defontana, APIs de IA)', 'Exigir certificados de resguardo de datos biométricos y cifrado en la nube. Configuración obligatoria de las APIs de IA en modo "No Entrenamiento".', 'Almacenamiento y procesamiento automatizado de metadatos, registros de login, datos biométricos, API Keys corporativas de automatización.', 'Ley 21.719 — Calificación: Encargados del Tratamiento. Base de licitud: Contrato de Licencia de Software.']
  ];

  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  items.forEach(function (it) {
    const registro = {
      id: generarId(),
      'Tipo': it[0],
      'Parte interesada': it[1] + ' (Ley 21.719)',
      'Necesidad / expectativa': it[2],
      'Requisitos': it[3],
      'Riesgos y oportunidades': it[4],
      'Responsables de ejecución': responsablesPorDefecto,
      'Monitorear en Panel de Control': 'No',
      creado_por: 'Importación inicial (DOC-SGC-007 · Ley 21.719)',
      creado_fecha: ahora
    };
    const fila = encabezados.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(fila);
  });

  Logger.log('Importación completa: ' + items.length + ' partes interesadas Ley 21.719 cargadas.');
}

/**
 * IMPORTACIÓN INICIAL — carga masiva de Riesgos y Oportunidades ya existentes
 * en DOC-SGC-010 (Rev. 0, actualizado 25-05-2026). Ejecutar UNA SOLA VEZ.
 * Valor, Nivel, Valor medida y Efectividad se calculan solos con las mismas
 * fórmulas oficiales que usa la PWA — no hace falta puntuarlos a mano.
 */
function importarRiesgosOportunidadesInicial() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Riesgos_Oportunidades');
  const responsablesPorDefecto = 'Carlos Braun, Cristián Menéndez';
  const ahora = new Date().toISOString();

  function nivelDeValor(v) {
    if (v <= 4) return 'Bajo';
    if (v <= 10) return 'Medio';
    return 'Alto';
  }
  function efectividadDeValorMedida(v) {
    if (v > 4) return 'Alta';
    if (v > 2) return 'Media';
    return 'Baja';
  }

  // [Origen, Ámbito, Tipo, Descripción, P, C, Medidas, F, G, Evitar, Eliminar, Cambiar, Compartir, Asumir, Acción, Responsable, Plazo, ComoEvalEficacia, Indicador, Meta, Estado]
  const items = [
    ['PESTEL','Oficina','Riesgo','Guerras que afecten valores o disponibilidad de insumos',3,4,'Planificación de compras, compra de stock, calendario de compras',1,1,'Sí','','Sí','','Sí','Estudiar compras en etapa temprana para ver qué hay en bodega, qué comprar y dónde, asegurando stock de materiales. Planificación adecuada de compras y programa financiero.','Ingeniero de Proyecto / Gerencia / Jefe Depto Compras','30-12-2024','Stock disponible de materiales requeridos en los tiempos necesarios','% de disminución del costo de compras presupuestado vs real','Mayor o igual a 10%','Realizado ENEX, Comisaría.'],
    ['PESTEL','Terreno','Riesgo','Aislamiento de la región. Efecto en la llegada de materiales e insumos',2,3,'N/A','','','','','Sí','','','Asegurar stock de materiales para las obras. Planificación adecuada de compras y programa financiero.','Ingeniero de Proyecto / Gerencia / Compras','Permanente','Se tomará como base la evaluación 360°','Evaluación de desempeño Ingeniero/Compras','Buena evaluación ingenieros y compras','En proceso a la espera de obtener la ISO para implementar'],
    ['PESTEL','Terreno','Riesgo','Inestabilidad $ del cobre. Aumento de costo de materiales',3,3,'N/A','','','','','Sí','','','Asegurar stock de materiales adquiriendo mayor cantidad de respaldo. Planificación adecuada de compras y programa financiero.','Ingeniero de Proyecto / Gerencia / Compras','Permanente','Se tomará como base la evaluación 360°','Evaluación de desempeño Ingeniero/Compras','Buena evaluación ingenieros y compras','En proceso a la espera de obtener la ISO para implementar'],
    ['PESTEL','Terreno','Riesgo','Inestabilidad $ del petróleo. Aumentos de costo de transportes',3,2,'N/A','','','','','Sí','','','Planificar y tener claridad de alternativas de transporte (camión, avión, barco/consolidados).','Compras','Permanente','Planilla con contacto de oferentes y precios por formato de despacho','Planilla','100%','En proceso'],
    ['PESTEL','Terreno','Riesgo','Inestabilidad $ del dólar. Aumento de costo de materiales',4,2,'N/A','','','','','Sí','','','Un 10% de los ahorros que se realicen debe hacerse en dólares.','Gerencia / Administración','Permanente','100%','Lograr reunir US10.000 en algún medio de ahorro (dentro de los $100.000.000 objetivo a 2027)','100%','En proceso'],
    ['PESTEL','Oficina','Riesgo','Aumento de costos laborales',4,5,'Generar nuevo formato de presupuesto ajustando valores',1,3,'','','Sí','','','Adecuar formato de presupuesto ajustando valores 2025.','Gerencia','2025','Formato','Formato','Formato','Se corrige formato, dejándo OK versión 2025.'],
    ['PESTEL','Oficina','Riesgo','Impuestos, aumento de costos operativos',5,5,'N/A','','','','','Sí','','','Agendar dos reuniones con el contador (febrero-marzo y octubre).','Administración / Gerencia','30-10-2025','Mantener reuniones periódicas','Reuniones agendadas','100%','En proceso'],
    ['PESTEL','Oficina','Oportunidad','Reactivación del gobierno para favorecer inversiones',2,5,'N/A','','','','','','','Sí','Aumento de cotizaciones por eventual aumento de presupuesto de gobierno regional.','Gerencia','31-12-2025','Cant. Ppt. adjudicados 2024 vs 2025','Aumento de adjudicaciones','>= 20%','En proceso'],
    ['PESTEL','Oficina','Riesgo','Crisis económica, efecto sobre principales clientes en su liquidez',5,5,'N/A','','','','','Sí','','Sí','Estar permanentemente informado sobre la situación económica de clientes habituales y nuevos.','Gerencia','Permanente','Buscar que clientes paguen mensualmente los Estados de Pago','Pagos en las fechas acordadas por contrato','100%','En proceso'],
    ['PESTEL','Oficina','Riesgo','Indefinición de garantía',1,5,'Se incorpora garantía en Presupuesto, y se define alcance de garantía',2,3,'','','','','','','','','',''],
    ['PESTEL','Oficina','Riesgo','Estallido social, efecto en toma de carreteras, protestas y otros',4,5,'N/A','','','','','Sí','','','Asegurar stock de materiales adquiriendo mayor cantidad de respaldo. Planificación adecuada de compras y programa financiero.','Ingeniero de Proyecto / Gerencia / Compras','31-12-2025','Planificación de materiales para compra temprana','Existencia de planificación','100%','En proceso'],
    ['PESTEL','Oficina','Riesgo','Baja M/O calificada, efecto en no contar con el RRHH necesario',2,5,'N/A',3,2,'','','Sí','','','Hacer prueba, levantar carencias desde terreno y capacitar al personal.','Ingeniero de Proyecto / Gerencia / Administración / Maestros Mayores','31-12-2025','Realización test de evaluación','Realizar test a trabajadores nuevos y antiguos','100%','En proceso'],
    ['PESTEL','Oficina','Riesgo','Equipos que queden obsoletos',2,2,'Se mantienen equipos controlados y se certifican los que requieren certificación',3,3,'','','','','','','','','',''],
    ['PESTEL','Oficina','Riesgo','Software, alto costo en licencias',2,1,'Se invierte en obtener los certificados de software',3,3,'','','','','','','','','',''],
    ['PESTEL','Oficina','Oportunidad','Innovación, nuevas tecnologías que mejoren operación y procesos',5,5,'Se prueban nuevas herramientas y materiales en terreno',3,3,'','','Sí','','','Revisando nuevas tecnologías que permitan eficientar los procesos administrativos.','Gerencia / Ingeniería','31-12-2025','Revisión de nuevas opciones de software u otros','Evaluar al menos una solución adicional (IA o Itemizar)','100%','En proceso'],
    ['PESTEL','Oficina','Riesgo','Hackeos a cuentas bancarias y correos electrónicos',1,5,'Se está enviando información periódica para informar posibles hackeos',3,3,'','','','','Sí','Se enviará WhatsApp periódico con información de nuevas modalidades de estafas.','Gerencia / Encargado SGC / Marketing','31-12-2025','No tener dentro de la empresa personas estafadas','3 publicaciones anuales','100%','En proceso'],
    ['PESTEL','Oficina','Oportunidad','Hidrógeno verde: aumento en la prestación de servicios',5,5,'Participar en actividades de promoción de hidrógeno verde',3,3,'','','','','','Coordinar una reunión o cotización para alguna empresa de H.V.','Gerencia','31-12-2025','Reunión o presupuesto generado','Reunión o presupuesto','100%','En proceso'],
    ['PESTEL','Oficina','Riesgo','Residuos peligrosos sin destino controlado',2,2,'Se realiza curso de manejo de sustancias peligrosas',3,3,'','','Sí','','','Limitar compra de productos de riesgo para almacenar en la instalación.','Compras','31-12-2025','No comprando elementos riesgosos','No disponer de materiales riesgosos en bodega','0','En proceso'],
    ['PESTEL','Oficina','Oportunidad','Reducción del uso del papel que disminuye costos',2,2,'Trabajando en APL, reciclaje de cobre',3,3,'','','Sí','','','Limitar compra de productos y abordar tecnología que permita reducir el uso de papel.','','','','','',''],
    ['PESTEL','Oficina','Riesgo','Pensiones: aumento del costo operacional por la mano de obra',5,2,'Condiciones en contratos con clientes que aseguren traspasar costos',1,3,'','','Sí','','','Se traspasa costo a nuevo formato de presupuesto.','Gerencia','31-12-2024','Considerar variación del costo de M/O traspasando a cliente','Implementación','100%','100%'],
    ['PESTEL','Oficina','Riesgo','Ley salario mínimo: aumento de costo de proveedores',5,2,'Condiciones en contratos con clientes que aseguren traspasar costos',3,3,'','','Sí','','','Se deja nota en presupuestos, se negociará en el minuto que se haga efectivo el cambio.','Gerencia','31-12-2024','Incluir nota en carta oferta','Implementación','100%','100%'],
    ['PESTEL','Oficina','Riesgo','Ley salud y seguridad ocupacional: incumplimientos que causen multas o cierres de faena',5,1,'Control con ayuda de prevencionista y mutualidad',3,3,'','','','','','','','','','',''],
    ['PESTEL','Oficina','Riesgo','Ley 40 horas: aumento del costo operacional por la mano de obra',5,5,'Control con ayuda de oficina contable y administración',3,3,'','','Sí','','','Ajuste de formato de presupuesto.','Gerencia','02-02-2025','Ajuste formato presupuesto','Implementación','100%','100%'],
    ['Partes Interesadas','Oficina','Oportunidad','Crecimiento y expansión de la organización',3,5,'N/A',3,3,'Sí','','','','','Plan de negocio 2025.','Gerencia','Dic-2024','Revisión e implementación del plan de negocio 2025','Revisión e implementación del plan de negocio','100% plan de negocio finalizado','En proceso'],
    ['Partes Interesadas','Oficina','Riesgo','Por pérdidas de control de los proyectos, entregar servicios de mala calidad',3,1,'N/A',2,3,'','','Sí','','','Se revisan y entregan documentos ISO, con el fin de que todos los conozcan y usen.','Todos','Dic-2024','Implementación de formatos en oficina y terreno','Uso','100%','100%'],
    ['Partes Interesadas','Oficina','Oportunidad','Asegurar la calidad de los servicios. Fidelización de clientes y apertura de nuevas carteras',4,4,'N/A',2,3,'Sí','','','','','Encuesta a clientes.','Todos','Dic-2024','Encuesta enviada','Evaluación sobre 4','Evaluación sobre 4','100%'],
    ['Partes Interesadas','Oficina','Riesgo','No contar con el tiempo suficiente para el estudio y preparación de la propuesta',5,1,'N/A',2,3,'','','','','Sí','N/A','','','','','','En proceso'],
    ['Partes Interesadas','Oficina','Riesgo','No contar con personal competente',1,3,'Plan de capacitaciones en base a descriptores de cargo',2,3,'','','Sí','','','Optimizar los procesos de selección de personal mediante procedimiento aplicable y uso de pruebas.','Encargado de Personas','01-12-2023','Implementación de descriptores de cargo en contratación y evaluación','Documento de respaldo','100%','En proceso'],
    ['Partes Interesadas','Oficina','Riesgo','No considerar protocolos ni factores de riesgo por falta de planificación; accidentes o incidentes laborales',2,5,'Asesoría en prevención de riesgos y participación en sistema PEC de la Mutual',2,3,'','Sí','','','','Desarrolla matriz de riesgos para cada obra.','Ingeniería','31-12-2024','Matriz de riesgo','Matriz de riesgo','100%','100%'],
    ['Partes Interesadas','Oficina','Oportunidad','Al cumplir estándares de seguridad se puede bajar indicadores y tasas de cotización',5,2,'Prevencionista solicita informe cualitativo de mutualidad para revisar puntos faltantes',1,2,'Sí','','','','','Cerrar brechas y cumplir Certificación de Autoevaluación.','Prevención','31-12-2023','Cerrar brechas y cumplir Certificación','Cerrar brechas y cumplir Certificación','Obtener PEC','En proceso'],
    ['Partes Interesadas','Oficina','Riesgo','Discrepancias por expectativas no cumplidas, diferencias de sueldos, conflictos, malos tratos',5,2,'N/A',1,3,'Sí','','','','','Se asigna mayores capacidades a Capataces, quienes premian a los 3 con mejor desempeño.','Ingeniería','01-04-2025','Cumplir con Protocolos y Capacitaciones Ley Karin','Entrega de 3 reconocimientos al mes','100%','En proceso'],
    ['Partes Interesadas','Oficina','Oportunidad','Compromiso y fidelización de los equipos de trabajo y continuidad laboral',4,2,'N/A',1,3,'Sí','','','','','Realizar evaluaciones de ambiente de trabajo y capacitaciones.','Gerencia','30-12-2025','Seguir plan de capacitación anual','1 Encuesta de Bienestar y cumplir capacitaciones programadas','100%','En proceso'],
    ['Partes Interesadas','Oficina','Riesgo','Por no realizar un buen desarrollo de planes de formación; impacto negativo en calidad y accidentes',5,2,'Se crea plan de capacitaciones en base a descriptores de cargo',1,3,'','','Sí','','','Realizar evaluaciones de desempeño laboral y actualizar planes de capacitación.','Gerencia / Administrador / Encargado SGC','Dic-2024','Plan de capacitación','Cumplimiento','100%','En proceso'],
    ['Partes Interesadas','Oficina','Riesgo','Mala planificación de obra (alojamiento/alimentación); descontento de trabajadores que puedan paralizar obras',1,4,'Planificar en etapa temprana',1,3,'','','Sí','','','Planificar en etapa temprana.','Ingeniero de Proyectos','Dic-2023','Adecuado estudio de propuestas','Plano control/presupuesto/programa M.O./programa materiales','100%','En proceso'],
    ['Partes Interesadas','Oficina','Riesgo','Deficientes cálculos de sueldos, imposiciones, impuestos; generación de multas y pérdidas',4,3,'Regularización de software Defontana para cálculo de imposiciones',3,3,'','','','','Sí','Sistema de control de cálculo de imposiciones interno previo envío a oficina contable.','Encargado de Personas','Dic-2024','Planilla mensual de revisión RRHH','100% cuadratura con oficina contable, detectando diferencias','100%','Cumplimiento al 100%'],
    ['Partes Interesadas','Oficina','Riesgo','No comunicar a tiempo modificaciones contractuales y anexos; falta de coordinación entre departamentos',3,3,'Se implementan medidas de control administrativas, reuniones, repaso de formatos',1,2,'','','Sí','','','Usar documento de manejo de información documentada.','Ingeniero','Permanente','Uso del documento para control de versiones y flujo actualizado','Documento de respaldo','100%','Cumplimiento al 100%'],
    ['Partes Interesadas','Terreno','Riesgo','Cobro de multas asociadas a garantías en proyectos',1,5,'N/A',3,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Riesgo','No pago de beneficio del seguro en caso de siniestro por no pago de pólizas',1,4,'N/A',3,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Riesgo','Incumplimiento de la legislación aplicable que conlleve a multas; paralización de obras',1,4,'N/A',3,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Riesgo','Multas por no contar con documentación de vehículos al día; prohibición de uso',1,2,'N/A',3,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Riesgo','Envío a DICOM por no pago a entidades bancarias, intereses por atrasos, cierre de cuentas',1,3,'N/A',3,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Riesgo','Incumplimiento de especificaciones o plazos de entrega de materiales; riesgo de bloqueo de crédito',4,2,'N/A',2,3,'','','','','','','','','','','100%'],
    ['Partes Interesadas','Oficina','Oportunidad','Alianzas estratégicas para disponibilidad, mejores condiciones de precio/plazo, representantes de marca',5,3,'N/A',2,3,'','','','','','Generar alianzas con 3 proveedores (Hikvision, Milestone y otro).','Gerencia','31-12-2024','Mediante la formalización de alianzas','Generar mínimo 3 alianzas','100%','En proceso, falta una alianza'],
    ['Partes Interesadas','Oficina','Riesgo','Incumplimiento de labores o plazos; paralización de trabajos por no pago; incidentes de subcontratación',1,1,'N/A',2,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Riesgo','No entrega de certificados SEC e instalaciones fuera de norma',1,3,'N/A',3,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Riesgo','Suspensión de la permanencia dentro de la CChC y pérdida de beneficios',1,1,'N/A',2,3,'','','','','','','','','','',''],
    ['Partes Interesadas','Oficina','Oportunidad','CChC: beneficios sociales para trabajadores, vinculación con empresas del sector',5,2,'Actualmente se participa con beneficios sociales de la CChC',2,3,'Sí','','','','','Economía circular APL con empresas asociadas a la CChC.','Gerencia','30-09-2025','Obtener certificado de cumplimiento APL','Certificado','Obtener certificado','100%'],
    ['Partes Interesadas','Oficina','Riesgo','ONG Canales y Don Bosco: no contar con disponibilidad de practicantes',2,2,'N/A',2,3,'','','','','','Mantener vínculo con ONG Canales y Don Bosco.','Gerencia','31-12-2025','Donar tiempo a mantener buena relación','Documentos que acrediten relación','100% con respaldo','100%'],
    ['Partes Interesadas','Oficina','Oportunidad','ONG Canales y Don Bosco: captación de nuevos trabajadores, responsabilidad social empresarial',2,2,'N/A',2,3,'','','','','','Mantener relacionamiento y actividades extra laborales con partes interesadas externas.','Gerencia','31-12-2025','Formar parte del CADE','Formar parte del CADE','Formar parte del CADE','100%'],
    ['Partes Interesadas','Oficina','Riesgo','Mutual de Seguridad CChC: incumplimiento legal, multas, sin cobertura ante accidentes',1,2,'N/A',2,3,'','','','','','Armar documentación de respaldo y capacitar al personal en sistema PEC.','Gerencia / Prevención de riesgos','31-12-2025','Se evaluará con obtención del PEC de la Mutual','Obtener PEC','Obtener PEC','En proceso'],
    ['Partes Interesadas','Oficina','Oportunidad','Programa PEC que permita bajar la tasa que pagamos actualmente',1,3,'Abordado',1,3,'','','Sí','','','Armar documentación de respaldo y capacitar al personal en sistema PEC.','Gerencia / Prevención de riesgos','31-12-2025','Se evaluará con obtención del PEC de la Mutual','Obtener PEC','Obtener PEC','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Filtración o acceso no autorizado a datos personales sensibles de trabajadores (biométricos, médicos, familiares) en GeoVictoria, Defontana o Drive, con potencial sanción de la Agencia de Protección de Datos',3,5,'Política DOC-SGC-016. Permisos de acceso restringido en Drive. Contratos con cláusula de encargado con oficina contable y GeoVictoria',2,1,'','','Sí','','','Implementar registro de tratamiento de datos, auditar permisos en Drive y GeoVictoria, exigir certificados de cifrado a proveedores.','Gerencia / Administración','31-12-2026','Auditoría anual de accesos y registro de incidentes','N° de brechas de seguridad detectadas','0 brechas','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Recolección de datos personales sin consentimiento válido o fuera de las bases de licitud (trabajadores, postulantes, clientes)',4,4,'Formulario FOR-SGC-010 de consentimiento informado. Política DOC-SGC-016',2,1,'','','Sí','','','Asegurar que el 100% del personal firme el FOR-SGC-010 antes del 1° de diciembre de 2026. Diseñar aviso de privacidad para postulantes.','Administración / Encargado SGC','30-11-2026','% de trabajadores con consentimiento firmado','Cobertura de consentimientos firmados','100%','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Uso de datos personales para finalidades distintas a las declaradas (imágenes en marketing, datos de faena para análisis comercial, biométricos para control no laboral)',3,3,'Política DOC-SGC-016, principio de limitación de finalidad. FOR-SGC-010 con finalidades específicas',2,1,'','','Sí','','','Capacitar a Gerencia, Ingeniería, Marketing y Logística en limitación de finalidad. Revisar contratos con agencia de marketing.','Gerencia / Encargado SGC','31-12-2026','Realización de capacitación anual y registro de asistencia','N° de capacitaciones realizadas/planificadas','1 capacitación anual','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Compartir datos personales de trabajadores con mandantes o entidades fiscalizadoras sin medidas de seguridad mínimas o en exceso de lo legalmente requerido',3,4,'FOR-SGC-010 ítem Acreditación Mandantes y Entidades Fiscalizadoras. Política DOC-SGC-016',2,1,'','','Sí','','','Definir protocolo de transferencia mínima de datos; asegurar accesos individuales validados en plataformas.','Administración / Ingeniería','31-12-2026','Existencia de protocolo documentado y accesos individuales','Protocolo aprobado y en uso','1 protocolo implementado','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Incumplimiento del plazo de notificación de brechas de seguridad a la Agencia (72 horas) por falta de protocolo claro',3,5,'DOC-SGC-016 sección 8 establece el procedimiento ante brechas',1,1,'','','Sí','','','Elaborar y difundir protocolo de respuesta a incidentes de seguridad, con pasos, responsables y plazos.','Gerencia / Administración','30-11-2026','Existencia de protocolo documentado y registro de simulacro','Protocolo de brechas implementado','1 protocolo','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Almacenamiento prolongado o inadecuado de datos de ex-trabajadores, postulantes no seleccionados o clientes más allá del plazo legal',3,3,'DOC-SGC-016 sección 9 define tiempo de archivo. FOR-SGC-010 informa plazo de conservación',1,1,'','','Sí','','','Implementar política de retención y eliminación segura; revisión anual de carpetas de personal en Drive.','Administración / Encargado SGC','31-03-2027','Registro de eliminación de datos y revisión anual ejecutada','Política de retención implementada','1 revisión anual ejecutada','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Tratamiento de datos de menores (hijos de trabajadores para becas CChC, operativos oftalmológicos/dentales) sin consentimiento explícito de sus representantes legales',2,5,'FOR-SGC-010 ítem Asistente Social y CChC. Política DOC-SGC-016',1,1,'','','Sí','','','Diseñar formulario específico de consentimiento para cargas familiares (menores); restringir acceso a Asistente Social y Administración.','Administración / Asistente Social','30-11-2026','Formulario de consentimiento para menores y registro de firmantes','Formulario diseñado e implementado','100% de casos con consentimiento','En proceso'],
    ['Ley 21.719','Oficina','Riesgo','Publicación de rankings de desempeño individual o uso de datos de salud laboral que genere menoscabo o discriminación',3,4,'FOR-SGC-010 ítem APP-Sheet Avance y Gestión SSO. Consentimiento expreso requerido',2,1,'','','Sí','','','Verificar que los trabajadores afectados por rankings hayan firmado consentimiento; capacitar en prohibición de divulgación de datos de salud.','Encargado SGC / Prevención de Riesgos','31-12-2026','% de consentimiento firmado para rankings; N° de denuncias','Consentimientos firmados para rankings','100% / 0 denuncias','En proceso'],
    ['Ley 21.719','Oficina','Oportunidad','Implementar gestión de datos conforme a la Ley 21.719 como ventaja competitiva en licitaciones, especialmente en infraestructura crítica',4,5,'DOC-SGC-016 y FOR-SGC-010 en proceso de implementación',2,1,'','','','','Sí','Incorporar en las propuestas comerciales una sección de Gestión de Confidencialidad de Datos.','Gerencia / Ingeniería','31-03-2027','N° de propuestas que incluyen sección de protección de datos','Propuestas con sección de confidencialidad','100% de propuestas a clientes críticos','En proceso'],
    ['Ley 21.719','Oficina','Oportunidad','Fortalecer la confianza y fidelización de los trabajadores demostrando un manejo ético y transparente de sus datos personales',4,4,'FOR-SGC-010 con consentimiento informado y derechos ARCOP. Política DOC-SGC-016',2,1,'','','','','Sí','Comunicar la política de protección de datos y derechos ARCOP; jornada de inducción sobre la Ley 21.719 antes de su vigencia.','Administración / Encargado SGC','30-11-2026','Registro de inducción realizada y resultado de encuesta de clima laboral','% trabajadores capacitados en Ley 21.719','100% del personal','En proceso'],
    ['Ley 21.719','Oficina','Oportunidad','Optimizar y digitalizar de forma segura los procesos de RRHH, contabilidad y prevención mediante plataformas certificadas',3,4,'FOR-SGC-010 ítem Proveedores de Software. Contratos con cláusula de encargado',2,1,'','','','','Sí','Exigir a GeoVictoria y Defontana certificados de seguridad; configurar APIs de IA en modo "No Entrenamiento".','Gerencia / Administración','30-11-2026','Recepción de certificados de seguridad; contratos con cláusula de encargado firmados','N° de proveedores con certificado de seguridad','100% de proveedores críticos certificados','En proceso']
  ];

  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  items.forEach(function (it, idx) {
    const p = it[4], c = it[5];
    const valor = p * c;
    const f = it[7] === '' ? 0 : it[7];
    const g = it[8] === '' ? 0 : it[8];
    const valorMedida = (f || g) ? (f + g) : '';
    const registro = {
      id: generarId(),
      'Núm.': idx + 1,
      'Origen': it[0],
      'Ámbito': it[1],
      'Tipo': it[2] === 'Riesgo' ? 'Riesgo' : 'Oportunidad',
      'Descripción': it[3],
      'Probabilidad (P)': p,
      'Consecuencia (C)': c,
      'Valor (PxC)': valor,
      'Nivel': nivelDeValor(valor),
      'Descripción medidas de control': it[6],
      'Fortaleza (F)': it[7],
      'Grado madurez (G)': it[8],
      'Valor medida (F+G)': valorMedida,
      'Efectividad': valorMedida ? efectividadDeValorMedida(valorMedida) : '',
      'Evitar': it[9], 'Eliminar': it[10], 'Cambiar': it[11], 'Compartir': it[12], 'Asumir': it[13],
      'Acción': it[14],
      'Responsable': it[15],
      'Plazo': it[16],
      '¿Cómo se evalúa la eficacia?': it[17],
      'Indicador': it[18],
      'Meta': it[19],
      'Estado': it[20],
      'Responsables de ejecución': responsablesPorDefecto,
      'Monitorear en Panel de Control': 'No',
      creado_por: 'Importación inicial (DOC-SGC-010)',
      creado_fecha: ahora
    };
    const fila = encabezados.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(fila);
  });

  Logger.log('Importación completa: ' + items.length + ' riesgos y oportunidades cargados.');
}

/**
 * IMPORTACIÓN INICIAL — carga los compromisos/acuerdos ya pactados en el
 * último informe de gerencia (sección "Oportunidades de Mejora", 01),
 * para no partir de cero en Compromisos_Medidas. Ejecutar UNA SOLA VEZ.
 * Quedan en Estado "Pendiente" — la app calcula sola si están vencidos
 * según la fecha comprometida.
 */
function importarCompromisosInicial() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Compromisos_Medidas');
  const responsablesPorDefecto = 'Carlos Braun, Cristián Menéndez';
  const ahora = new Date().toISOString();

  // [Compromiso, Responsable, Fecha compromiso]
  const items = [
    ['Rematar el 100% de procedimientos de la empresa en formato ISO.', 'Carlos Braun', '31-12-2025'],
    ['Forzar detección de Hallazgos, para que se generen en forma obligatoria', 'Carlos Braun', '31-12-2025'],
    ['Realizar encuesta personal 2025', 'Carlos Braun', '31-07-2025'],
    ['Desarrollar plan de negocio y Presupuesto 2025', 'Carlos Braun', '31-12-2025'],
    ['Motivar al personal con capacitaciones y una correcta valorización de habilidades', 'Carlos Braun', '31-12-2025'],
    ['Aumentar nuestro relacionamiento con proveedores y comunidad.', 'Carlos Braun', '31-12-2025']
  ];

  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  items.forEach(function (it) {
    const registro = {
      id: generarId(),
      'Origen': 'Oportunidades de mejora (informe anterior)',
      'Compromiso': it[0],
      'Responsable': it[1],
      'Fecha compromiso': it[2],
      'Estado': 'Pendiente',
      'Responsables de ejecución': responsablesPorDefecto,
      'Monitorear en Panel de Control': 'Sí',
      creado_por: 'Importación inicial (FOR-SGC-007/008 anterior)',
      creado_fecha: ahora
    };
    const fila = encabezados.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(fila);
  });

  Logger.log('Importación completa: ' + items.length + ' compromisos cargados.');
}

/**
 * Busca en una matriz de valores la primera fila que contenga TODAS las
 * palabras clave dadas (en cualquiera de sus celdas). Sirve para encontrar
 * la fila de encabezado real de un archivo externo sin depender de saber
 * de antemano en qué fila o pestaña está.
 */
function buscarFilaEncabezado(valores, palabrasClave) {
  const clavesNorm = palabrasClave.map(function (c) { return normalizarTexto(c); });
  for (let i = 0; i < valores.length; i++) {
    const fila = valores[i].map(function (c) { return normalizarTexto(c); });
    const encontrada = clavesNorm.every(function (clave) {
      return fila.some(function (celda) { return celda.indexOf(clave) !== -1; });
    });
    if (encontrada) return i;
  }
  return -1;
}

function indiceColumna(filaEncabezado, textoBuscado) {
  const claveNorm = normalizarTexto(textoBuscado);
  for (let i = 0; i < filaEncabezado.length; i++) {
    if (normalizarTexto(filaEncabezado[i]).indexOf(claveNorm) !== -1) return i;
  }
  return -1;
}

/**
 * Igual que indiceColumna, pero exige coincidencia EXACTA (no parcial).
 * Necesaria para palabras cortas como "Año", que de otra forma calzan por
 * accidente dentro de otras columnas (ej. "MANO DE OBRA" contiene "ANO").
 */
function indiceColumnaExacta(filaEncabezado, textoBuscado) {
  const claveNorm = normalizarTexto(textoBuscado);
  for (let i = 0; i < filaEncabezado.length; i++) {
    if (normalizarTexto(filaEncabezado[i]) === claveNorm) return i;
  }
  return -1;
}

/**
 * Busca la columna del mes/año dado entre los encabezados, aceptando que la
 * celda venga como texto ("ago-26") O como fecha real (Sheets suele
 * autoformatear "ago-26" como una fecha 01-08-2026 internamente).
 */
function indiceColumnaMes(filaEncabezado, fecha) {
  const mesesEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mesAbrev = mesesEs[fecha.getMonth()];
  const anioCorto = String(fecha.getFullYear()).slice(2);
  for (let i = 0; i < filaEncabezado.length; i++) {
    const val = filaEncabezado[i];
    if (Object.prototype.toString.call(val) === '[object Date]') {
      if (val.getMonth() === fecha.getMonth() && val.getFullYear() === fecha.getFullYear()) return i;
    } else {
      const texto = String(val || '').toLowerCase();
      if (texto.indexOf(mesAbrev) !== -1 && texto.indexOf(anioCorto) !== -1) return i;
    }
  }
  return -1;
}

/**
 * EXTRACCIÓN — snapshot mensual de FOR-SGC-004 (Panel de Monitoreo externo).
 * Solo rescata: N°, Origen, Objetivo, Responsable, Plazo y el % de
 * cumplimiento del MES EN CURSO (no el histórico de los 12 meses).
 * Ejecutar una vez al mes, cuando quieras actualizar el snapshot — no se
 * borra el mes anterior, así queda el histórico propio en nuestra Sheet
 * aunque el archivo externo se reinicie el próximo año.
 */
function extraerMonitoreoSGC004() {
  limpiarTabla('Monitoreo_SGC004');
  const mesesEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mesTexto = mesesEs[ahora.getMonth()] + '-' + String(anio).slice(2);

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.FOR_SGC_004);
  const hojas = ssExterno.getSheets();
  let filaEncabezadoIdx = -1, valores = null;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    const idx = buscarFilaEncabezado(v, ['ORIGEN', 'Objetivo']);
    if (idx !== -1) { valores = v; filaEncabezadoIdx = idx; break; }
  }
  if (filaEncabezadoIdx === -1) throw new Error('No se encontró la fila de encabezado en FOR-SGC-004. Revisar estructura del archivo.');

  const encabezado = valores[filaEncabezadoIdx];
  const colNum = indiceColumna(encabezado, 'N°');
  const colOrigen = indiceColumna(encabezado, 'ORIGEN');
  const colObjetivo = indiceColumna(encabezado, 'Objetivo');
  const colFechaDef = indiceColumna(encabezado, 'Fecha');
  const colMeta = indiceColumna(encabezado, 'Meta');
  const colIndicador = indiceColumna(encabezado, 'Indicador');
  const colFrecuencia = indiceColumna(encabezado, 'Frecuencia');
  const colResponsable = indiceColumna(encabezado, 'Responsable');
  const colPlazo = indiceColumna(encabezado, 'Plazo');
  const colMesActual = indiceColumnaMes(encabezado, ahora);

  if (colMesActual === -1) {
    throw new Error('No se encontró la columna del mes actual (mes ' + (ahora.getMonth() + 1) + '/' + anio + ') en FOR-SGC-004. Puede que el archivo aún no tenga esa columna creada.');
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Monitoreo_SGC004');
  const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  let total = 0;

  for (let f = filaEncabezadoIdx + 1; f < valores.length; f++) {
    const fila = valores[f];
    const objetivo = fila[colObjetivo];
    if (!objetivo) continue; // fila vacía, se salta

    const cumplimiento = fila[colMesActual];
    const registro = {
      id: generarId(),
      'Año': anio,
      'Mes': mesTexto,
      'Num': fila[colNum] || '',
      'Origen': fila[colOrigen] || '',
      'Objetivo': objetivo,
      'Fecha Definida': fila[colFechaDef] || '',
      'Meta': fila[colMeta] || '',
      'Indicador': fila[colIndicador] || '',
      'Frecuencia': fila[colFrecuencia] || '',
      'Responsable': fila[colResponsable] || '',
      'Plazo': fila[colPlazo] || '',
      'Cumplimiento mes': cumplimiento || '',
      'Estado': cumplimiento ? 'Completado' : 'Sin dato este mes',
      creado_fecha: ahora.toISOString()
    };
    const filaDestino = encabezadosDestino.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(filaDestino);
    total++;
  }

  Logger.log('Snapshot FOR-SGC-004 completo: ' + total + ' ítems para ' + mesTexto + '.');
}

/**
 * EXTRACCIÓN — snapshot anual de FOR-ADQ-002 (Evaluación de Proveedores).
 * Solo rescata Nombre Proveedor + Calificación final — NO toca los datos
 * de contacto/crédito/rubro del directorio de proveedores.
 * Ejecutar cuando quieras actualizar el snapshot (ej. una vez al año, o
 * cada vez que se re-evalúe a los proveedores).
 */
function extraerEvaluacionProveedores() {
  limpiarTabla('Evaluacion_Proveedores');
  const ahora = new Date();
  const anio = ahora.getFullYear();

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.FOR_ADQ_002);
  const hojas = ssExterno.getSheets();
  let filaEncabezadoIdx = -1, valores = null;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    const idx = buscarFilaEncabezado(v, ['Nombre Proveedor', 'Calificación']);
    if (idx !== -1) { valores = v; filaEncabezadoIdx = idx; break; }
  }
  if (filaEncabezadoIdx === -1) throw new Error('No se encontró la fila de encabezado en FOR-ADQ-002. Revisar estructura del archivo.');

  const encabezado = valores[filaEncabezadoIdx];
  const colProveedor = indiceColumna(encabezado, 'Nombre Proveedor');
  const colPromedio = indiceColumna(encabezado, 'Promedio');
  const colCalificacion = indiceColumna(encabezado, 'Calificación');

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Evaluacion_Proveedores');
  const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  let total = 0;

  for (let f = filaEncabezadoIdx + 1; f < valores.length; f++) {
    const fila = valores[f];
    const proveedor = fila[colProveedor];
    const calificacion = fila[colCalificacion];
    if (!proveedor || !calificacion) continue; // fila vacía o sin evaluar, se salta

    const registro = {
      id: generarId(),
      'Año': anio,
      'Proveedor': proveedor,
      'Promedio': fila[colPromedio] || '',
      'Calificación': calificacion,
      creado_fecha: ahora.toISOString()
    };
    const filaDestino = encabezadosDestino.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(filaDestino);
    total++;
  }

  Logger.log('Snapshot FOR-ADQ-002 completo: ' + total + ' proveedores evaluados para ' + anio + '.');
}

/**
 * EXTRACCIÓN — snapshot anual del Listado de Activos Tangibles (DOC-ADQ-001).
 * Salta la cabecera de control de documento y solo lee la tabla real de
 * activos. Ejecutar cuando quieras actualizar el snapshot (ej. una vez al
 * año, o cada vez que Logística actualice el listado).
 */
function extraerActivosTangibles() {
  limpiarTabla('Activos_Tangibles');
  const ahora = new Date();

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.ACTIVOS_TANGIBLES);
  const hojas = ssExterno.getSheets();
  let filaEncabezadoIdx = -1, valores = null;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    const idx = buscarFilaEncabezado(v, ['NOMBRE DEL ACTIVOS TANGIBLES', 'VALOR TOTAL']);
    if (idx !== -1) { valores = v; filaEncabezadoIdx = idx; break; }
  }
  if (filaEncabezadoIdx === -1) throw new Error('No se encontró la fila de encabezado en DOC-ADQ-001 (Activos Tangibles). Revisar estructura del archivo.');

  const encabezado = valores[filaEncabezadoIdx];
  const colNombre = indiceColumna(encabezado, 'NOMBRE DEL ACTIVOS TANGIBLES');
  const colDescripcion = indiceColumna(encabezado, 'DESCRIPCION O MARCA');
  const colModelo = indiceColumna(encabezado, 'MODELO');
  const colIdent = indiceColumna(encabezado, 'IDENTIFICACION');
  const colFechaIngreso = indiceColumna(encabezado, 'FECHA DE INGRESO');
  const colCantidad = indiceColumnaExacta(encabezado, 'CANTIDAD');
  const colValorU = indiceColumnaExacta(encabezado, 'VALOR U MM$');
  const colValorTotal = indiceColumna(encabezado, 'VALOR TOTAL');
  const colObservaciones = indiceColumna(encabezado, 'OBSERVACIONES');

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Activos_Tangibles');
  const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  let total = 0;

  for (let f = filaEncabezadoIdx + 1; f < valores.length; f++) {
    const fila = valores[f];
    const nombre = fila[colNombre];
    if (!nombre) continue; // fila vacía, se salta

    const registro = {
      id: generarId(),
      'Nombre': nombre,
      'Descripción / Marca': colDescripcion !== -1 ? fila[colDescripcion] : '',
      'Modelo': colModelo !== -1 ? fila[colModelo] : '',
      'N° Identificación': colIdent !== -1 ? fila[colIdent] : '',
      'Fecha Ingreso': colFechaIngreso !== -1 ? fila[colFechaIngreso] : '',
      'Cantidad': colCantidad !== -1 ? fila[colCantidad] : '',
      'Valor Unitario': colValorU !== -1 ? fila[colValorU] : '',
      'Valor Total': colValorTotal !== -1 ? fila[colValorTotal] : '',
      'Observaciones': colObservaciones !== -1 ? fila[colObservaciones] : '',
      creado_fecha: ahora.toISOString()
    };
    const filaDestino = encabezadosDestino.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(filaDestino);
    total++;
  }

  Logger.log('Activos Tangibles: ' + total + ' ítems cargados.');
}

/**
 * EXTRACCIÓN — snapshot anual del Listado de Activos Intangibles
 * (DOC-ADQ-002 — licencias de software, dominios, marca registrada, etc.).
 * La fila de TOTAL al final del archivo se descarta sola porque no tiene
 * nombre de activo. Ejecutar cuando quieras actualizar el snapshot.
 */
function extraerActivosIntangibles() {
  limpiarTabla('Activos_Intangibles');
  const ahora = new Date();

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.ACTIVOS_INTANGIBLES);
  const hojas = ssExterno.getSheets();
  let filaEncabezadoIdx = -1, valores = null;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    const idx = buscarFilaEncabezado(v, ['NOMBRE DEL ACTIVOS INTANGIBLES', 'FECHA VENCIMIENTO']);
    if (idx !== -1) { valores = v; filaEncabezadoIdx = idx; break; }
  }
  if (filaEncabezadoIdx === -1) throw new Error('No se encontró la fila de encabezado en DOC-ADQ-002 (Activos Intangibles). Revisar estructura del archivo.');

  const encabezado = valores[filaEncabezadoIdx];
  const colNombre = indiceColumna(encabezado, 'NOMBRE DEL ACTIVOS INTANGIBLES');
  const colLicencia = indiceColumna(encabezado, 'LICENCIA');
  const colFechaContrato = indiceColumna(encabezado, 'FECHA DE CONTRATO');
  const colFechaVencimiento = indiceColumna(encabezado, 'FECHA VENCIMIENTO');
  const colCantidad = indiceColumnaExacta(encabezado, 'CANTIDAD');
  const colValor = indiceColumnaExacta(encabezado, 'VALOR MM$');
  const colValorTotal = indiceColumna(encabezado, 'VALOR TOTAL');
  const colObservaciones = indiceColumna(encabezado, 'OBSERVACIONES');

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Activos_Intangibles');
  const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  let total = 0;

  for (let f = filaEncabezadoIdx + 1; f < valores.length; f++) {
    const fila = valores[f];
    const nombre = fila[colNombre];
    if (!nombre) continue; // fila vacía o fila de TOTAL (sin nombre), se salta

    const registro = {
      id: generarId(),
      'Nombre': nombre,
      'Licencia': colLicencia !== -1 ? fila[colLicencia] : '',
      'Fecha Contrato': colFechaContrato !== -1 ? fila[colFechaContrato] : '',
      'Fecha Vencimiento': colFechaVencimiento !== -1 ? fila[colFechaVencimiento] : '',
      'Cantidad': colCantidad !== -1 ? fila[colCantidad] : '',
      'Valor': colValor !== -1 ? fila[colValor] : '',
      'Valor Total': colValorTotal !== -1 ? fila[colValorTotal] : '',
      'Observaciones': colObservaciones !== -1 ? fila[colObservaciones] : '',
      creado_fecha: ahora.toISOString()
    };
    const filaDestino = encabezadosDestino.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(filaDestino);
    total++;
  }

  Logger.log('Activos Intangibles: ' + total + ' ítems cargados.');
}

/**
 * EXTRACCIÓN — KPIs comerciales mensuales desde la pestaña "Centro de
 * Costos" de la planilla comercial. Recorre solo el año en curso y arma 3
 * resúmenes: por ingeniero, por estado del presupuesto, y por tipo de
 * servicio. Cada fila queda etiquetada con Año+Mes, así que sumando varias
 * filas obtienes el acumulado (mensual sumando 1 mes, anual sumando los 12).
 *
 * IMPORTANTE: qué Estados se cuentan como "adjudicado" está definido en
 * ESTADOS_ADJUDICADO más abajo — hoy son 'Presupuesto Adjudicado' y
 * 'En ejecución'. Si falta o sobra alguno, avísame para ajustarlo.
 *
 * Ejecutar cuando quieras actualizar el snapshot (ej. una vez al mes).
 */
/**
 * Agrupa cualquiera de los 9+ Estados de Centro de Costos en 4 categorías
 * simples, para que el informe y el Panel de Control se lean de un vistazo.
 * El detalle fino sigue disponible en KPI_Estados_Mensual si hace falta.
 */
function agruparEstado(estado) {
  const GANADO = ['Presupuesto Adjudicado', 'En ejecución'];
  const PERDIDO = ['Presupuesto Obsoleto', 'Presupuesto No Adjudicado', 'Bajada', 'Postergada', 'Desierta'];
  const COTIZANDO = ['En Cotización', 'Esperando Respuesta'];
  if (GANADO.indexOf(estado) !== -1) return 'Ganado';
  if (PERDIDO.indexOf(estado) !== -1) return 'Perdido';
  if (COTIZANDO.indexOf(estado) !== -1) return 'En Cotización';
  return 'Casos Especiales'; // ej. Valores subcontrato desproporcionados, u otros no listados
}

function extraerKPIsComerciales() {
  limpiarTabla('KPI_Ingenieros_Mensual');
  limpiarTabla('KPI_Estados_Mensual');
  limpiarTabla('KPI_Estados_Agrupado_Mensual');
  limpiarTabla('KPI_TipoServicio_Mensual');
  limpiarTabla('KPI_Financiero_Mensual');
  const ESTADOS_ADJUDICADO = ['Presupuesto Adjudicado', 'En ejecución'];
  const ahora = new Date();
  const anioActual = ahora.getFullYear();

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.COMERCIAL);
  const hojas = ssExterno.getSheets();
  let filaEncabezadoIdx = -1, valores = null;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    const idx = buscarFilaEncabezado(v, ['Estudió', 'Valor Contrato Neto', 'Tipo de Servicio']);
    if (idx !== -1) { valores = v; filaEncabezadoIdx = idx; break; }
  }
  if (filaEncabezadoIdx === -1) throw new Error('No se encontró la fila de encabezado de Centro de Costos (busco columnas "Estudió", "Valor Contrato Neto" y "Tipo de Servicio"). Revisar estructura del archivo.');

  const encabezado = valores[filaEncabezadoIdx];
  const colEstudio = indiceColumna(encabezado, 'Estudió');
  const colAnio = indiceColumnaExacta(encabezado, 'Año');
  const colMes = indiceColumna(encabezado, 'MES');
  const colEstado = indiceColumna(encabezado, 'Estado');
  const colTipoServicio = indiceColumna(encabezado, 'Tipo de Servicio');
  const colValor = indiceColumna(encabezado, 'Valor Contrato Neto');
  const colCostoOficina = indiceColumnaExacta(encabezado, 'COSTO OFICINA');
  const colUtilidad = indiceColumnaExacta(encabezado, 'UTILIDAD'); // toma la 1ª "UTILIDAD" (columna S, principal) — hay una 2ª más adelante en el archivo, de otra sección de cálculo

  const porIngeniero = {}; // clave: mes|ingeniero
  const porEstado = {};    // clave: mes|estado
  const porEstadoAgrupado = {}; // clave: mes|grupo (4 categorías)
  const porTipo = {};      // clave: mes|tipo
  const porFinanciero = {}; // clave: mes — Costo Oficina y Utilidad (columnas R y S), NO incluye Gastos Generales (se asocia a obras, no a oficina)

  for (let f = filaEncabezadoIdx + 1; f < valores.length; f++) {
    const fila = valores[f];
    const anioFila = String(fila[colAnio] || '');
    if (anioFila !== String(anioActual) && anioFila !== String(anioActual - 1)) continue; // año en curso + año anterior (para comparativos)

    const ingeniero = fila[colEstudio];
    if (!ingeniero) continue; // fila sin dueño, se salta

    const mes = String(fila[colMes] || 'SIN MES').toUpperCase();
    const estado = String(fila[colEstado] || 'Sin estado');
    const tipoServicio = String(fila[colTipoServicio] || 'Sin tipo');
    const monto = Number(fila[colValor]) || 0;
    const esAdjudicado = ESTADOS_ADJUDICADO.indexOf(estado) !== -1;

    // --- por ingeniero ---
    const claveIng = anioFila + '|' + mes + '|' + ingeniero;
    if (!porIngeniero[claveIng]) {
      porIngeniero[claveIng] = { anio: anioFila, mes: mes, ingeniero: ingeniero, estudiados: 0, cotizado: 0, adjudicados: 0, adjudicado: 0 };
    }
    porIngeniero[claveIng].estudiados++;
    porIngeniero[claveIng].cotizado += monto;
    if (esAdjudicado) { porIngeniero[claveIng].adjudicados++; porIngeniero[claveIng].adjudicado += monto; }

    // --- por estado ---
    const claveEst = anioFila + '|' + mes + '|' + estado;
    if (!porEstado[claveEst]) porEstado[claveEst] = { anio: anioFila, mes: mes, estado: estado, cantidad: 0, monto: 0 };
    porEstado[claveEst].cantidad++;
    porEstado[claveEst].monto += monto;

    // --- por estado agrupado (4 categorías, para lectura rápida) ---
    const grupo = agruparEstado(estado);
    const claveGrupo = anioFila + '|' + mes + '|' + grupo;
    if (!porEstadoAgrupado[claveGrupo]) porEstadoAgrupado[claveGrupo] = { anio: anioFila, mes: mes, grupo: grupo, cantidad: 0, monto: 0 };
    porEstadoAgrupado[claveGrupo].cantidad++;
    porEstadoAgrupado[claveGrupo].monto += monto;

    // --- por tipo de servicio ---
    const claveTipo = anioFila + '|' + mes + '|' + tipoServicio;
    if (!porTipo[claveTipo]) porTipo[claveTipo] = { anio: anioFila, mes: mes, tipo: tipoServicio, cantidad: 0, monto: 0 };
    porTipo[claveTipo].cantidad++;
    porTipo[claveTipo].monto += monto;

    // --- financiero (Costo Oficina y Utilidad, acumulado por mes — no por ingeniero) ---
    const claveFin = anioFila + '|' + mes;
    if (!porFinanciero[claveFin]) porFinanciero[claveFin] = { anio: anioFila, mes: mes, costoOficina: 0, utilidad: 0 };
    porFinanciero[claveFin].costoOficina += Number(fila[colCostoOficina]) || 0;
    porFinanciero[claveFin].utilidad += Number(fila[colUtilidad]) || 0;
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ahoraIso = ahora.toISOString();

  function volcar(nombreTabla, objeto, mapeoFila) {
    const hoja = ss.getSheetByName(nombreTabla);
    const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
    let total = 0;
    Object.keys(objeto).forEach(function (clave) {
      const origen = objeto[clave];
      const registro = mapeoFila(origen);
      registro.id = generarId();
      registro['Año'] = origen.anio || anioActual; // año real del dato, no siempre el actual
      registro.creado_fecha = ahoraIso;
      const fila = encabezadosDestino.map(function (campo) {
        return registro[campo] !== undefined ? registro[campo] : '';
      });
      hoja.appendRow(fila);
      total++;
    });
    Logger.log(nombreTabla + ': ' + total + ' filas cargadas.');
  }

  volcar('KPI_Ingenieros_Mensual', porIngeniero, function (r) {
    return {
      'Mes': r.mes, 'Ingeniero': r.ingeniero, 'Proyectos Estudiados': r.estudiados,
      'Monto Cotizado': r.cotizado, 'Proyectos Adjudicados': r.adjudicados,
      'Monto Adjudicado': r.adjudicado,
      '% Adjudicación': r.estudiados ? Math.round((r.adjudicados / r.estudiados) * 100) + '%' : '0%'
    };
  });
  volcar('KPI_Estados_Mensual', porEstado, function (r) {
    return { 'Mes': r.mes, 'Estado': r.estado, 'Cantidad': r.cantidad, 'Monto': r.monto };
  });
  volcar('KPI_Estados_Agrupado_Mensual', porEstadoAgrupado, function (r) {
    return { 'Mes': r.mes, 'Grupo': r.grupo, 'Cantidad': r.cantidad, 'Monto': r.monto };
  });
  volcar('KPI_TipoServicio_Mensual', porTipo, function (r) {
    return { 'Mes': r.mes, 'Tipo de Servicio': r.tipo, 'Cantidad': r.cantidad, 'Monto': r.monto };
  });
  volcar('KPI_Financiero_Mensual', porFinanciero, function (r) {
    return { 'Mes': r.mes, 'Costo Oficina': r.costoOficina, 'Utilidad': r.utilidad };
  });

  Logger.log('Extracción KPIs comerciales completa para el año ' + anioActual + '.');
}

/**
 * BOTÓN ÚNICO — corre todas las extracciones de fuentes externas de una vez,
 * en vez de tener que ejecutar cada función suelta. Ejecutar cuando quieras
 * actualizar todo antes de generar el informe mensual.
 * A medida que se conecten más fuentes (No Conformidades, Encuesta), se
 * agregan acá también.
 */
function actualizarTodosLosSnapshots() {
  const resultados = [];
  [
    ['FOR-SGC-004', extraerMonitoreoSGC004],
    ['FOR-ADQ-002', extraerEvaluacionProveedores],
    ['Comercial (Centro de Costos)', extraerKPIsComerciales],
    ['Comercial (E° OBRAS)', extraerEstadoObras],
    ['Encuesta de Satisfacción', extraerEncuestaSatisfaccion],
    ['No Conformidades', extraerNoConformidades],
    ['Capacitaciones', extraerCapacitaciones],
    ['Activos Tangibles', extraerActivosTangibles],
    ['Activos Intangibles', extraerActivosIntangibles]
  ].forEach(function (par) {
    try {
      par[1]();
      resultados.push({ fuente: par[0], ok: true });
    } catch (err) {
      resultados.push({ fuente: par[0], ok: false, error: err.message });
    }
  });
  Logger.log('Actualización de snapshots completa:\n' + resultados.map(function (r) {
    return r.fuente + ': ' + (r.ok ? 'OK' : 'ERROR — ' + r.error);
  }).join('\n'));
  return resultados;
}

/**
 * Quita tildes, pasa a mayúsculas y colapsa espacios — para comparar
 * etiquetas de fila sin que un espacio de más o una tilde rompan el match.
 */
/**
 * Borra todas las filas de datos de una tabla (deja el encabezado intacto).
 * Se llama SIEMPRE antes de escribir un snapshot nuevo, para que cada
 * extracción reemplace por completo el snapshot anterior — nunca lo
 * acumula. Sin esto, correr la misma extracción dos veces duplica todas
 * las filas (el bug que detectó Carlos en Estado de Obras, Proveedores,
 * Monitoreo SGC-004 y No Conformidades).
 */
function limpiarTabla(nombreTabla) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName(nombreTabla);
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila > 1) {
    hoja.getRange(2, 1, ultimaFila - 1, hoja.getLastColumn()).clearContent();
  }
}

function esValorNoCumplido(valor) {
  // Detecta explícitamente la palabra "no" en la celda del mes del Panel de
  // Monitoreo (FOR-SGC-004) — así se marca un punto no cumplido en ese archivo.
  const v = String(valor || '').trim().toLowerCase();
  return v === 'no';
}

function normalizarTexto(t) {
  return String(t || '')
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buscarFilaPorEtiqueta(valores, labelCol, desde, predicado) {
  for (let i = desde; i < valores.length; i++) {
    if (predicado(normalizarTexto(valores[i][labelCol]))) return i;
  }
  return -1;
}

/**
 * EXTRACCIÓN — snapshot de E° OBRAS (planilla comercial). A diferencia de
 * las demás fuentes, acá cada OBRA es una COLUMNA (no una fila), así que
 * primero se ubica la fila de encabezado con los nombres de obra, y luego
 * se recorre fila por fila (Valor Obra, Facturado, Costos, Márgenes...)
 * leyendo el valor de cada obra en su columna.
 *
 * Se descartan las obras marcadas "TERMINADO" en la fila de estado (justo
 * arriba de los nombres) — solo se guardan las vigentes, como pediste.
 *
 * Etiquetas marcadas "best-effort" abajo no se confirmaron contra el Sheet
 * real (solo contra tu imagen de ejemplo) — si alguna no calza, es la
 * primera candidata a revisar.
 */
function extraerEstadoObras() {
  limpiarTabla('Estado_Obras');
  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.COMERCIAL);
  const hojas = ssExterno.getSheets();
  let valores = null, headerRowIdx = -1, labelCol = -1;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    let mejorFila = -1, mejorCol = -1, mejorCantidad = -1;
    for (let i = 0; i < v.length; i++) {
      for (let j = 0; j < v[i].length; j++) {
        const txt = normalizarTexto(v[i][j]);
        if (txt.indexOf('ITEM') !== -1 && txt.indexOf('CNEGOCIO') !== -1) {
          const noVacias = v[i].filter(function (c) { return String(c || '').trim() !== ''; }).length;
          if (noVacias > mejorCantidad) { mejorCantidad = noVacias; mejorFila = i; mejorCol = j; }
        }
      }
    }
    if (mejorFila !== -1) { valores = v; headerRowIdx = mejorFila; labelCol = mejorCol; break; }
  }
  if (headerRowIdx === -1) throw new Error('No se encontró la tabla "ITEM / CNEGOCIO" (E° OBRAS) en la planilla comercial.');

  const filaHeader = valores[headerRowIdx];
  const filaEstado = headerRowIdx > 0 ? valores[headerRowIdx - 1] : [];

  const colsObra = [];
  for (let j = labelCol + 1; j < filaHeader.length; j++) {
    const txt = normalizarTexto(filaHeader[j]);
    if (!txt || txt === 'TOTALES') { if (txt === 'TOTALES') break; else continue; }
    colsObra.push(j);
  }

  function fila(etiquetaExacta) {
    return buscarFilaPorEtiqueta(valores, labelCol, headerRowIdx + 1, function (t) { return t === etiquetaExacta; });
  }
  function filaContiene() {
    const palabras = Array.prototype.slice.call(arguments);
    return buscarFilaPorEtiqueta(valores, labelCol, headerRowIdx + 1, function (t) {
      return palabras.every(function (p) { return t.indexOf(p) !== -1; });
    });
  }
  function filaEmpiezaCon(prefijo) {
    return buscarFilaPorEtiqueta(valores, labelCol, headerRowIdx + 1, function (t) { return t.indexOf(prefijo) === 0; });
  }

  const filas = {
    valorObra: fila('VALOR OBRA'),
    adicionales: fila('ADICIONALES'),
    facturadoAnterior: filaEmpiezaCon('FACTURADO A 31DIC'),
    facturadoActual: filaEmpiezaCon('FACTURADO A LA FECHA ORG'),
    totalFacturado: filaEmpiezaCon('TOTAL FACTURADO A LA FECHA'),
    devAnticipo: fila('DEV ANTICIPO'),
    retenciones: filaContiene('RETENCIONES', 'ADIC'),
    descuento: fila('DESCUENTO'),
    totalPorFacturar: fila('TOTAL POR FACTURAR PROYECTOS'),
    costoMaximo: filaContiene('MAX PPTO COSTO'),
    costoDirecto: fila('COSTO DIRECTO'),
    honorarios: filaContiene('HONORARIOS'),
    costoPersonal: fila('COSTO PERSONAL OBRA'),
    // --- best-effort, sin confirmar contra el Sheet real ---
    anticiposProv: filaContiene('ANTICIPOS', 'PROVEEDORES'),
    saldosProv: filaContiene('SALDOS', 'PROVEED'),
    totalCostos: filaContiene('TOTAL COSTOS A LA FECHA'),
    obraRestante: filaContiene('OBRA RESTANTE'),
    costoRestante: filaContiene('COSTO POR REALIZAR'),
    disponible: filaContiene('DISPONIB', 'REALIZAR'),
    utEsperada: fila('UT ESPERADA'),
    utFecha: fila('UT A LA FECHA'),
    doceCinco: filaEmpiezaCon('12.5'),
    utilidadNeta: fila('UTILIDAD NETA')
  };

  function valorDe(nombreFila, colObra) {
    const idx = filas[nombreFila];
    if (idx === -1 || idx === undefined) return '';
    const v = valores[idx][colObra];
    return typeof v === 'number' ? v : (Number(String(v).replace(/[^0-9.-]/g, '')) || v || '');
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Estado_Obras');
  const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const ahoraIso = new Date().toISOString();
  let total = 0, saltadas = 0, duplicadas = 0;
  const obrasYaVistas = {};

  colsObra.forEach(function (col) {
    const estadoCol = normalizarTexto(filaEstado[col]);
    if (estadoCol === 'TERMINADO') { saltadas++; return; } // solo obras vigentes

    const nombreObra = filaHeader[col];
    if (!nombreObra) return;

    const claveObra = normalizarTexto(nombreObra);
    if (obrasYaVistas[claveObra]) { duplicadas++; return; } // misma obra repetida en la fuente, se descarta
    obrasYaVistas[claveObra] = true;

    const valorObra = valorDe('valorObra', col) || 0;
    const adicionales = valorDe('adicionales', col) || 0;
    const facturadoAnt = valorDe('facturadoAnterior', col) || 0;
    const facturadoAct = valorDe('facturadoActual', col) || 0;
    const utFecha = valorDe('utFecha', col) || 0;
    const totalCostosFecha = valorDe('totalCostos', col) || 0;
    const costoMax = valorDe('costoMaximo', col) || 0;

    const registro = {
      id: generarId(),
      'Obra': nombreObra,
      'Ámbito': 'Terreno',
      'Valor Obra': valorObra,
      'Adicionales': adicionales,
      'Valor Total Obra': valorObra + adicionales,
      'Facturado año anterior': facturadoAnt,
      'Facturado año en curso': facturadoAct,
      'Total Facturado Acumulado': valorDe('totalFacturado', col) || (facturadoAnt + facturadoAct),
      'Dev Anticipo': valorDe('devAnticipo', col) || 0,
      'Retenciones Obra+Adic': valorDe('retenciones', col) || 0,
      'Descuento': valorDe('descuento', col) || 0,
      'Total por Facturar': valorDe('totalPorFacturar', col) || 0,
      'Costo Máximo Ppto': costoMax,
      'Costo Directo': valorDe('costoDirecto', col) || 0,
      'Honorarios % Ingeniería': valorDe('honorarios', col) || 0,
      'Costo Personal Obra': valorDe('costoPersonal', col) || 0,
      'Anticipos Factura Proveedores': valorDe('anticiposProv', col) || 0,
      'Saldos por Pagar Proveedores': valorDe('saldosProv', col) || 0,
      'Total Costos a la Fecha': totalCostosFecha,
      'Obra Restante (meses)': valorDe('obraRestante', col) || 0,
      'Costo por Realizar (meses restantes)': valorDe('costoRestante', col) || 0,
      'Disponible Costos por Realizar': valorDe('disponible', col) || (costoMax - totalCostosFecha),
      'Utilidad Esperada': valorDe('utEsperada', col) || 0,
      'Utilidad a la Fecha': utFecha,
      '% Utilidad a la Fecha': (valorObra + adicionales) ? ((utFecha / (valorObra + adicionales)) * 100).toFixed(1) + '%' : '0.0%',
      '12.5%': valorDe('doceCinco', col) || (utFecha * 0.125),
      'Utilidad Neta': valorDe('utilidadNeta', col) || (utFecha - utFecha * 0.125),
      'Responsables de ejecución': 'Carlos Braun, Cristián Menéndez',
      'Monitorear en Panel de Control': 'Sí',
      creado_por: 'Extracción automática (E° OBRAS)',
      creado_fecha: ahoraIso
    };

    const filaDestino = encabezadosDestino.map(function (campo) {
      return registro[campo] !== undefined ? registro[campo] : '';
    });
    hoja.appendRow(filaDestino);
    total++;
  });

  Logger.log('Estado de Obras: ' + total + ' obras vigentes cargadas, ' + saltadas + ' terminadas descartadas, ' + duplicadas + ' duplicadas descartadas.');
}

// Campo que actúa como "descripción principal" de cada tabla —
// se usa para saber qué copiar cuando se replica hacia otra tabla.
function obtenerDescripcionPrincipal(tabla, registro) {
  switch (tabla) {
    case 'FODA': return registro['Descripción'] || '';
    case 'PESTEL': return registro['Descripción del factor'] || '';
    case 'Riesgos_Oportunidades': return registro['Descripción'] || '';
    case 'Hallazgos': return registro['Descripción del hallazgo'] || '';
    case 'Balance_Scorecard': return registro['Objetivo general'] || '';
    case 'Compromisos_Medidas': return registro['Compromiso'] || '';
    case 'Partes_Interesadas':
      return (registro['Parte interesada'] || '') +
        (registro['Necesidad / expectativa'] ? ' — ' + registro['Necesidad / expectativa'] : '');
    default: return '';
  }
}

// Dónde va ese texto cuando la tabla es el DESTINO de la replicación.
function asignarDescripcionPrincipal(tabla, registro, texto) {
  switch (tabla) {
    case 'FODA': registro['Descripción'] = texto; break;
    case 'PESTEL': registro['Descripción del factor'] = texto; break;
    case 'Riesgos_Oportunidades': registro['Descripción'] = texto; break;
    case 'Hallazgos': registro['Descripción del hallazgo'] = texto; break;
    case 'Balance_Scorecard': registro['Objetivo general'] = texto; break;
    case 'Compromisos_Medidas': registro['Compromiso'] = texto; break;
    case 'Partes_Interesadas': registro['Necesidad / expectativa'] = texto; break;
  }
}

/**
 * Crea una copia de registroOrigen (de tablaOrigen) dentro de tablaDestino.
 * Copia lo que tenga sentido en común (Ámbito, Obra, Responsables de
 * ejecución) y deja registrado el origen si la tabla destino tiene esos
 * campos (Origen/origen_id, como ya usa Riesgos_Oportunidades).
 */
function replicarRegistro(tablaOrigen, registroOrigen, tablaDestino, usuario, extra) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName(tablaDestino);
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];

  const nuevo = {};
  asignarDescripcionPrincipal(
    tablaDestino, nuevo,
    obtenerDescripcionPrincipal(tablaOrigen, registroOrigen)
  );

  if (encabezados.indexOf('Ámbito') !== -1 && registroOrigen['Ámbito'] !== undefined) {
    nuevo['Ámbito'] = registroOrigen['Ámbito'];
  }
  if (encabezados.indexOf('Obra') !== -1 && registroOrigen['Obra'] !== undefined) {
    nuevo['Obra'] = registroOrigen['Obra'];
  }
  if (encabezados.indexOf('Responsables de ejecución') !== -1 && registroOrigen['Responsables de ejecución'] !== undefined) {
    nuevo['Responsables de ejecución'] = registroOrigen['Responsables de ejecución'];
  }
  if (encabezados.indexOf('Origen') !== -1) nuevo['Origen'] = tablaOrigen;
  if (encabezados.indexOf('origen_id') !== -1) nuevo['origen_id'] = registroOrigen.id;
  if (encabezados.indexOf('origen_ids') !== -1) nuevo['origen_ids'] = tablaOrigen + ':' + registroOrigen.id;
  if (encabezados.indexOf('Monitorear en Panel de Control') !== -1) {
    nuevo['Monitorear en Panel de Control'] = 'No';
  }

  // Campos categoriales elegidos explícitamente por el usuario al marcar
  // el checkbox (Categoría en FODA, Categoría PESTEL, Tipo en Riesgos y
  // Oportunidades, Ámbito en Balance Scorecard) — se aplican DESPUÉS de la
  // copia automática de arriba, así pisan cualquier valor mal copiado
  // (ej. Ámbito "Terreno/Oficina" que no es válido en Balance Scorecard).
  if (extra && typeof extra === 'object') {
    Object.keys(extra).forEach(function (campo) {
      if (encabezados.indexOf(campo) !== -1 && extra[campo]) {
        nuevo[campo] = extra[campo];
      }
    });
  }

  nuevo.id = generarId();
  nuevo.creado_por = usuario + ' (replicado desde ' + tablaOrigen + ')';
  nuevo.creado_fecha = new Date().toISOString();
  if (encabezados.indexOf('modificado_por') !== -1) {
    nuevo.modificado_por = '';
    nuevo.modificado_fecha = '';
  }

  const fila = encabezados.map(function (campo) {
    return nuevo[campo] !== undefined ? nuevo[campo] : '';
  });
  hoja.appendRow(fila);
  return nuevo.id;
}

/**
 * doGet: punto de entrada JSONP para todas las lecturas desde la PWA.
 * Uso: ?callback=xxx&accion=listar&tabla=Partes_Interesadas
 */
/**
 * EXTRACCIÓN — resumen anual de la Encuesta de Satisfacción del Cliente
 * (respuestas del Google Form). Solo año en curso, como el resto.
 */
function extraerEncuestaSatisfaccion() {
  limpiarTabla('Encuesta_Satisfaccion_Resumen');
  limpiarTabla('Encuesta_Satisfaccion_Detalle');
  const ahora = new Date();
  const anioActual = ahora.getFullYear();

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.ENCUESTA_SATISFACCION);
  const hojas = ssExterno.getSheets();
  let valores = null, filaEncabezadoIdx = -1;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    const idx = buscarFilaEncabezado(v, ['Marca temporal', 'CALIDAD DEL SERVICIO']);
    if (idx !== -1) { valores = v; filaEncabezadoIdx = idx; break; }
  }
  if (filaEncabezadoIdx === -1) throw new Error('No se encontró la fila de encabezado de la encuesta de satisfacción.');

  const encabezado = valores[filaEncabezadoIdx];
  const colFecha = indiceColumna(encabezado, 'Marca temporal');
  const colEmpresa = indiceColumna(encabezado, 'NOMBRE DE SU EMPRESA');
  const colRut = indiceColumna(encabezado, 'RUT DE SU EMPRESA');
  const colObra = indiceColumna(encabezado, 'NOMBRE OBRA O FAENA');
  const colComentario = indiceColumna(encabezado, 'Comentario');
  const preguntas = {
    calidad: indiceColumna(encabezado, 'CALIDAD DEL SERVICIO'),
    tiempo: indiceColumna(encabezado, 'TIEMPO DE RESPUESTA'),
    presupuestos: indiceColumna(encabezado, 'RESPECTO A PRESUPUESTOS'),
    atencion: indiceColumna(encabezado, 'CALIDAD DE LA ATENCIÓN'),
    cumplimiento: indiceColumna(encabezado, 'CUMPLIMIENTO DE OBJETIVOS'),
    satisfaccion: indiceColumna(encabezado, 'GRADO DE SATISFACCIÓN')
  };

  const sumas = { calidad: 0, tiempo: 0, presupuestos: 0, atencion: 0, cumplimiento: 0, satisfaccion: 0 };
  const conteos = { calidad: 0, tiempo: 0, presupuestos: 0, atencion: 0, cumplimiento: 0, satisfaccion: 0 };
  let nRespuestas = 0;
  const detalle = [];

  for (let f = filaEncabezadoIdx + 1; f < valores.length; f++) {
    const fila = valores[f];
    const fechaCelda = fila[colFecha];
    if (!fechaCelda) continue;
    const fecha = Object.prototype.toString.call(fechaCelda) === '[object Date]' ? fechaCelda : new Date(fechaCelda);
    if (isNaN(fecha) || fecha.getFullYear() !== anioActual) continue;

    nRespuestas++;
    const valoresPregunta = {};
    Object.keys(preguntas).forEach(function (clave) {
      const col = preguntas[clave];
      if (col === -1) return;
      const valor = Number(fila[col]);
      valoresPregunta[clave] = fila[col];
      if (!isNaN(valor) && fila[col] !== '') { sumas[clave] += valor; conteos[clave]++; }
    });

    detalle.push({
      fecha: fechaCelda,
      empresa: colEmpresa !== -1 ? fila[colEmpresa] : '',
      rut: colRut !== -1 ? fila[colRut] : '',
      obra: colObra !== -1 ? fila[colObra] : '',
      comentario: colComentario !== -1 ? fila[colComentario] : '',
      valores: valoresPregunta
    });
  }

  function promedio(clave) {
    return conteos[clave] ? (sumas[clave] / conteos[clave]).toFixed(1) : '';
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('Encuesta_Satisfaccion_Resumen');
  const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const registro = {
    id: generarId(),
    'Año': anioActual,
    'N Respuestas': nRespuestas,
    'Promedio Calidad Servicio': promedio('calidad'),
    'Promedio Tiempo Respuesta': promedio('tiempo'),
    'Promedio Presupuestos y Plazos': promedio('presupuestos'),
    'Promedio Atención Comercial': promedio('atencion'),
    'Promedio Cumplimiento Objetivos': promedio('cumplimiento'),
    'Promedio Satisfacción General': promedio('satisfaccion'),
    creado_fecha: ahora.toISOString()
  };
  const fila = encabezadosDestino.map(function (campo) { return registro[campo] !== undefined ? registro[campo] : ''; });
  hoja.appendRow(fila);

  const hojaDetalle = ss.getSheetByName('Encuesta_Satisfaccion_Detalle');
  const encabezadosDetalle = hojaDetalle.getRange(1, 1, 1, hojaDetalle.getLastColumn()).getValues()[0];
  detalle.forEach(function (d) {
    const registroDetalle = {
      id: generarId(),
      'Año': anioActual,
      'Fecha Respuesta': d.fecha,
      'Empresa': d.empresa,
      'RUT Empresa': d.rut,
      'Obra o Faena': d.obra,
      'Calidad Servicio': d.valores.calidad || '',
      'Tiempo Respuesta': d.valores.tiempo || '',
      'Presupuestos y Plazos': d.valores.presupuestos || '',
      'Atención Comercial': d.valores.atencion || '',
      'Cumplimiento Objetivos': d.valores.cumplimiento || '',
      'Satisfacción General': d.valores.satisfaccion || '',
      'Comentario': d.comentario,
      creado_fecha: ahora.toISOString()
    };
    const filaDetalle = encabezadosDetalle.map(function (campo) { return registroDetalle[campo] !== undefined ? registroDetalle[campo] : ''; });
    hojaDetalle.appendRow(filaDetalle);
  });

  Logger.log('Encuesta de Satisfacción ' + anioActual + ': ' + nRespuestas + ' respuestas.' +
    (nRespuestas === 0 ? ' (Sin respuestas este año todavía — normal si aún no llegan.)' : ''));
}

/**
 * EXTRACCIÓN — resumen anual de No Conformidades (FOR-SGC-001).
 * Cuenta por Tipo de hallazgo y por si tienen Fecha de Cierre o no.
 */
/**
 * Clasifica el color de fondo de una celda del Plan de Capacitación:
 * rojo = pendiente (programada, no cumplida), amarillo/naranjo = cumplida.
 */
function clasificarColorCapacitacion(hex) {
  if (!hex || hex === '#ffffff' || hex === '#ffffff'.toUpperCase()) return 'Sin marcar';
  const r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
  if (r > 180 && g < 130 && b < 130) return 'Pendiente'; // rojo
  if (r > 180 && g > 140 && b < 140) return 'Cumplida'; // amarillo / naranjo
  return 'Sin definir';
}

/**
 * EXTRACCIÓN — Plan de Capacitación del año (DOC-SGC-012). Cruza el mes
 * programado de cada curso (pestaña "detalle", columna "Fecha de
 * ejecución") con el color de esa celda en la pestaña del plan visual
 * (mes con "x" y color rojo/amarillo), para saber si ya se cumplió.
 * Ejecutar cuando quieras actualizar (ej. una vez al mes).
 *
 * IMPORTANTE: este archivo se reemplaza cada año — a inicios de año hay
 * que confirmar con Carlos el archivo vigente y actualizar
 * FUENTES_EXTERNAS.CAPACITACIONES.
 */
function extraerCapacitaciones() {
  if (!FUENTES_EXTERNAS.CAPACITACIONES) throw new Error('Falta configurar FUENTES_EXTERNAS.CAPACITACIONES.');
  limpiarTabla('Capacitaciones_Detalle');
  const ahora = new Date();
  const anioActual = ahora.getFullYear();

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.CAPACITACIONES);
  const hojas = ssExterno.getSheets();

  let hojaPlan = null, planValores = null, planHeaderIdx = -1, colNombrePlan = -1;
  let hojaDetalle = null, detalleValores = null, detalleHeaderIdx = -1;

  const MESES_ABREV = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  hojas.forEach(function (h) {
    const v = h.getDataRange().getValues();

    // La fila de meses (ENE, FEB, MAR...) va en una fila propia — el título
    // "NOMBRE CAPACITACIÓN" suele ir en la fila justo arriba, en la misma
    // columna. Buscamos primero los meses (más específico), y la columna
    // de nombre del curso la sacamos de la fila anterior o, si no está, de
    // la columna A por defecto.
    const idxMeses = buscarFilaEncabezado(v, ['ENE', 'FEB', 'MAR', 'ABR']);
    if (idxMeses !== -1 && !hojaPlan) {
      hojaPlan = h; planValores = v; planHeaderIdx = idxMeses;
      const filaTitulo = idxMeses > 0 ? v[idxMeses - 1] : [];
      colNombrePlan = indiceColumna(filaTitulo, 'NOMBRE CAPACITACI');
      if (colNombrePlan === -1) colNombrePlan = 1; // respaldo: columna B, donde va el nombre del curso
    }

    const idxDet = buscarFilaEncabezado(v, ['FECHA DE EJECUCION']);
    if (idxDet !== -1 && !hojaDetalle) { hojaDetalle = h; detalleValores = v; detalleHeaderIdx = idxDet; }
  });
  if (!hojaPlan) throw new Error('No se encontró la fila con los meses (ENE-DIC) en el archivo de Capacitaciones. Pestañas encontradas: ' + hojas.map(function (h) { return h.getName(); }).join(', '));
  if (!hojaDetalle) throw new Error('No se encontró la pestaña "detalle" (con "Fecha de ejecución") en el archivo de Capacitaciones. Pestañas encontradas: ' + hojas.map(function (h) { return h.getName(); }).join(', '));

  const encPlan = planValores[planHeaderIdx];
  const colsMesPlan = MESES_ABREV.map(function (abrev) { return indiceColumna(encPlan, abrev); });

  const encDet = detalleValores[detalleHeaderIdx];
  let colNombreDet = indiceColumna(encDet, 'TEMA DE CAPACITACI');
  if (colNombreDet === -1) colNombreDet = 1; // respaldo: columna B, donde suele ir el nombre del curso
  const colFechaEjec = indiceColumna(encDet, 'FECHA DE EJECUCI');

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hojaDestino = ss.getSheetByName('Capacitaciones_Detalle');
  const encabezadosDestino = hojaDestino.getRange(1, 1, 1, hojaDestino.getLastColumn()).getValues()[0];
  let total = 0;

  for (let f = detalleHeaderIdx + 1; f < detalleValores.length; f++) {
    const filaDet = detalleValores[f];
    const nombreCurso = filaDet[colNombreDet];
    if (!nombreCurso) continue;
    const mesTexto = String(filaDet[colFechaEjec] || '');
    const mesIdx = indiceMes(mesTexto.slice(0, 3)); // ej. "marzo" -> "mar" -> índice
    let estado = 'Sin dato', observaciones = '';

    if (mesIdx !== -1 && colsMesPlan[mesIdx] !== -1) {
      // busca la fila de este curso en la pestaña del plan visual
      let filaPlanIdx = -1;
      for (let p = planHeaderIdx + 1; p < planValores.length; p++) {
        if (normalizarTexto(planValores[p][colNombrePlan]) === normalizarTexto(nombreCurso)) { filaPlanIdx = p; break; }
      }
      if (filaPlanIdx !== -1) {
        const rangoCelda = hojaPlan.getRange(filaPlanIdx + 1, colsMesPlan[mesIdx] + 1);
        estado = clasificarColorCapacitacion(rangoCelda.getBackground());
      } else {
        observaciones = 'No se encontró el curso en el plan visual para cruzar el color.';
      }
    } else {
      observaciones = 'No se pudo identificar el mes programado ("' + mesTexto + '").';
    }

    const registro = {
      id: generarId(),
      'Año': anioActual,
      'Capacitación': nombreCurso,
      'Fecha Programada': mesTexto,
      'Estado': estado,
      'Observaciones': observaciones,
      creado_fecha: ahora.toISOString()
    };
    const filaDestino = encabezadosDestino.map(function (campo) { return registro[campo] !== undefined ? registro[campo] : ''; });
    hojaDestino.appendRow(filaDestino);
    total++;
  }

  Logger.log('Capacitaciones: ' + total + ' cursos cargados para ' + anioActual + '.');
}

function extraerNoConformidades() {
  limpiarTabla('NoConformidades_Resumen');
  limpiarTabla('NoConformidades_Detalle');
  const ahora = new Date();
  const anioActual = ahora.getFullYear();

  const ssExterno = SpreadsheetApp.openById(FUENTES_EXTERNAS.NO_CONFORMIDADES);
  const hojas = ssExterno.getSheets();
  let valores = null, filaEncabezadoIdx = -1;

  for (let h = 0; h < hojas.length; h++) {
    const v = hojas[h].getDataRange().getValues();
    const idx = buscarFilaEncabezado(v, ['Fecha de detección', 'Tipo de hallazgo']);
    if (idx !== -1) { valores = v; filaEncabezadoIdx = idx; break; }
  }
  if (filaEncabezadoIdx === -1) throw new Error('No se encontró la fila de encabezado de No Conformidades (FOR-SGC-001).');

  const encabezado = valores[filaEncabezadoIdx];
  const colFecha = indiceColumna(encabezado, 'Fecha de detección');
  const colTipo = indiceColumna(encabezado, 'Tipo de hallazgo');
  const colCierre = indiceColumna(encabezado, 'Fecha de Cierre');
  const colNumero = indiceColumna(encabezado, 'Número');
  const colDescripcion = indiceColumna(encabezado, 'Descripción');
  const colArea = indiceColumna(encabezado, 'Área');

  let total = 0, noConformidades = 0, observaciones = 0, cerradas = 0, abiertas = 0;
  let ncCerradas = 0, obsCerradas = 0;
  const detalle = [];

  for (let f = filaEncabezadoIdx + 1; f < valores.length; f++) {
    const fila = valores[f];
    const fechaCelda = fila[colFecha];
    if (!fechaCelda) continue;
    const fecha = Object.prototype.toString.call(fechaCelda) === '[object Date]' ? fechaCelda : new Date(fechaCelda);
    if (isNaN(fecha) || fecha.getFullYear() !== anioActual) continue;

    total++;
    const tipo = String(fila[colTipo] || '');
    const estaCerrada = !!fila[colCierre];
    if (tipo.indexOf('No conformidad') !== -1) { noConformidades++; if (estaCerrada) ncCerradas++; }
    else if (tipo.indexOf('Observación') !== -1) { observaciones++; if (estaCerrada) obsCerradas++; }

    if (estaCerrada) cerradas++; else abiertas++;

    detalle.push({
      numero: colNumero !== -1 ? fila[colNumero] : (f - filaEncabezadoIdx),
      tipo: tipo,
      descripcion: colDescripcion !== -1 ? fila[colDescripcion] : '',
      area: colArea !== -1 ? fila[colArea] : '',
      fechaDeteccion: fechaCelda,
      cerrada: estaCerrada,
      fechaCierre: fila[colCierre] || ''
    });
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName('NoConformidades_Resumen');
  const encabezadosDestino = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const registro = {
    id: generarId(),
    'Año': anioActual,
    'Total': total,
    'No Conformidades': noConformidades,
    'No Conformidades Cerradas': ncCerradas,
    'Observaciones': observaciones,
    'Observaciones Cerradas': obsCerradas,
    'Cerradas': cerradas,
    'Abiertas': abiertas,
    creado_fecha: ahora.toISOString()
  };
  const fila = encabezadosDestino.map(function (campo) { return registro[campo] !== undefined ? registro[campo] : ''; });
  hoja.appendRow(fila);

  const hojaDetalle = ss.getSheetByName('NoConformidades_Detalle');
  const encabezadosDetalle = hojaDetalle.getRange(1, 1, 1, hojaDetalle.getLastColumn()).getValues()[0];
  detalle.forEach(function (d) {
    const registroDetalle = {
      id: generarId(),
      'Año': anioActual,
      'Número': d.numero,
      'Tipo': d.tipo,
      'Descripción': d.descripcion,
      'Área': d.area,
      'Fecha Detección': d.fechaDeteccion,
      'Estado': d.cerrada ? 'Resuelta' : 'Pendiente',
      'Fecha Cierre': d.fechaCierre,
      creado_fecha: ahora.toISOString()
    };
    const filaDetalle = encabezadosDetalle.map(function (campo) { return registroDetalle[campo] !== undefined ? registroDetalle[campo] : ''; });
    hojaDetalle.appendRow(filaDetalle);
  });

  Logger.log('No Conformidades ' + anioActual + ': ' + total + ' registros (' + noConformidades + ' NC, ' + observaciones + ' Obs.) — ' + abiertas + ' abiertas, ' + cerradas + ' cerradas.');
}

/**
 * ============================================================
 * GENERADOR DE INFORMES — FOR-SGC-008 (detallado) y FOR-SGC-007 (resumen)
 * ============================================================
 * Arma ambos documentos en Google Docs juntando todo lo que ya está
 * conectado (PWA + snapshots comerciales). Las secciones cuya fuente
 * todavía no está enlazada (Satisfacción del Cliente, No Conformidades,
 * Política de Calidad, Auditorías, Adecuación de Recursos) quedan con un
 * aviso [Pendiente] o [Redacción manual] para completar a mano por ahora.
 *
 * Ejecutar generarAmbosInformes() para crear los dos documentos de una vez
 * — quedan guardados directo en las carpetas de Drive acordadas.
 */

const CARPETA_INFORME_DATOS = '1UiBjs3GYgu3ipL0Zat5ipxafOx_6P1ae';   // FOR-SGC-008
const CARPETA_INFORME_RESUMEN = '1UXQWnbMIvO1X9GJqgn1cG6Et2YVw8dkQ'; // FOR-SGC-007

function clpTexto(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
}

function crearDocInforme(nombreArchivo, carpetaId) {
  const doc = DocumentApp.create(nombreArchivo);
  const archivo = DriveApp.getFileById(doc.getId());
  DriveApp.getFolderById(carpetaId).addFile(archivo);
  DriveApp.getRootFolder().removeFile(archivo); // saca la copia de la raíz de Mi Unidad
  const attrs = {};
  attrs[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
  attrs[DocumentApp.Attribute.FONT_SIZE] = 12;
  doc.getBody().setAttributes(attrs);
  return doc;
}

/**
 * Portada + encabezado de página + hoja de introducción + índice.
 * Deja el documento listo para que, desde ahí, cada llamada a agregarTitulo()
 * arranque en una página nueva.
 */
function agregarPortadaEIndice(doc, codigo, tituloDoc, subtitulo, introduccion, indiceItems) {
  const body = doc.getBody();
  const fechaTexto = new Date().toLocaleDateString('es-CL');

  try {
    const header = doc.addHeader();
    const pHeader = header.appendParagraph(tituloDoc.toUpperCase() + '  ·  ' + codigo + '  ·  Sistema de Gestión de la Calidad');
    pHeader.editAsText().setFontFamily('Arial').setFontSize(8).setForegroundColor('#8A9A9E');
  } catch (e) { /* si falla el header, seguimos sin él */ }

  try {
    const logoBlob = UrlFetchApp.fetch('https://cbraun-collab.github.io/pwa-gestion-iso/logo-senercom.png').getBlob();
    const parrafoLogo = body.appendParagraph('');
    const imagen = parrafoLogo.appendInlineImage(logoBlob);
    const anchoOriginal = imagen.getWidth();
    const altoOriginal = imagen.getHeight();
    const anchoDeseado = 130;
    imagen.setWidth(anchoDeseado);
    imagen.setHeight(Math.round(altoOriginal * (anchoDeseado / anchoOriginal)));
  } catch (e) { /* sin logo si la red falla, no detiene el informe */ }

  const pCodigo = body.appendParagraph('Código: ' + codigo + '   ·   Fecha: ' + fechaTexto);
  pCodigo.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  pCodigo.editAsText().setFontFamily('Arial').setFontSize(10).setForegroundColor('#8A9A9E');

  for (let i = 0; i < 6; i++) body.appendParagraph('');

  const pTitulo = body.appendParagraph(tituloDoc.toUpperCase());
  pTitulo.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pTitulo.editAsText().setFontFamily('Arial').setFontSize(24).setBold(true);

  const pSub = body.appendParagraph(subtitulo);
  pSub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pSub.editAsText().setFontFamily('Arial').setFontSize(13);

  for (let i = 0; i < 10; i++) body.appendParagraph('');

  const pIntro = body.appendParagraph(introduccion);
  pIntro.editAsText().setFontFamily('Arial').setFontSize(12);

  for (let i = 0; i < 4; i++) body.appendParagraph('');

  const pFecha = body.appendParagraph(fechaTexto);
  pFecha.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pFecha.editAsText().setFontFamily('Arial').setFontSize(11).setBold(true);
  const pEmpresa = body.appendParagraph('CONSTRUCTORA E INGENIERÍA SENERCOM LTDA.');
  pEmpresa.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pEmpresa.editAsText().setFontFamily('Arial').setFontSize(11).setBold(true);

  body.appendPageBreak();

  const pIndiceTitulo = body.appendParagraph('ÍNDICE');
  pIndiceTitulo.editAsText().setFontFamily('Arial').setFontSize(12).setBold(true);
  (indiceItems || []).forEach(function (item) {
    const p = body.appendParagraph(item);
    p.editAsText().setFontFamily('Arial').setFontSize(12);
  });
  const pNotaIndice = body.appendParagraph('Nota: este índice es una lista de referencia — no incluye números de página, porque Google Apps Script no permite generarlos automáticamente. Para un índice con números de página y enlaces (clic para saltar a la sección), usa el menú Insertar → Índice de Google Docs una vez abierto el documento.');
  pNotaIndice.setItalic(true);
  pNotaIndice.editAsText().setFontFamily('Arial').setFontSize(9).setForegroundColor('#8A9A9E');

  body.appendPageBreak();
}

let primerTitulo = true;
function agregarTitulo(doc, texto) {
  if (!primerTitulo) doc.getBody().appendPageBreak();
  primerTitulo = false;
  const p = doc.getBody().appendParagraph(texto);
  p.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  p.editAsText().setFontFamily('Arial').setFontSize(12).setBold(true);
}
function agregarSubtitulo(doc, texto) {
  const p = doc.getBody().appendParagraph(texto);
  p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  p.editAsText().setFontFamily('Arial').setFontSize(12).setBold(true);
}
/**
 * Línea chica en cursiva y gris, justo debajo de un título/subtítulo,
 * indicando de qué módulo o planilla sale esa sección del informe.
 */
function agregarFuente(doc, texto) {
  const p = doc.getBody().appendParagraph('Fuente: ' + texto);
  p.setItalic(true);
  p.editAsText().setFontFamily('Arial').setForegroundColor('#8A9A9E').setFontSize(9);
}
function agregarTexto(doc, texto) {
  const p = doc.getBody().appendParagraph(texto);
  p.editAsText().setFontFamily('Arial').setFontSize(12);
  return p;
}
function agregarTabla(doc, encabezados, filas) {
  if (!filas.length) { agregarTexto(doc, '(Sin registros)'); return; }
  const tabla = doc.getBody().appendTable();
  const filaEnc = tabla.appendTableRow();
  encabezados.forEach(function (h) {
    const celda = filaEnc.appendTableCell(String(h));
    celda.setBackgroundColor('#EAF1F1');
    celda.editAsText().setFontFamily('Arial').setFontSize(12).setBold(true);
  });
  filas.forEach(function (f) {
    const fila = tabla.appendTableRow();
    f.forEach(function (v) {
      const celda = fila.appendTableCell(v === undefined || v === null ? '' : String(v));
      celda.editAsText().setFontFamily('Arial').setFontSize(12);
    });
  });
}

/**
 * Bloque de análisis manual — deja un título propio (no solo texto entre
 * corchetes) y aclara que es opcional: el dato que vale es el de las
 * tablas, y este espacio se puede completar a mano o con una propuesta
 * inicial redactada con ayuda de IA para editar después.
 */
function agregarBloqueAnalisis(doc, tituloOpcional) {
  agregarSubtitulo(doc, tituloOpcional || 'Análisis de Resultados y Priorización de Actividades');
  const p = agregarTexto(doc, '[Opcional — este espacio se puede completar a mano, o partir de una propuesta redactada con ayuda de IA como base para editar. La información que vale y respalda el informe es la de las tablas anteriores; este análisis es complementario.]');
  p.setItalic(true);
}

/**
 * Suma las filas mensuales de KPI_Ingenieros_Mensual por ingeniero,
 * para tener el acumulado del año (sin volver a leer la planilla externa).
 */
const MESES_ORDEN = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function indiceMes(nombreMes) {
  return MESES_ORDEN.indexOf(normalizarTexto(nombreMes));
}

function tituloCase(s) {
  s = String(s || '');
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/**
 * Suma las filas de KPI_Ingenieros_Mensual, opcionalmente filtrando por año
 * y por "hasta qué mes" (para comparar años distintos a la fecha, de forma
 * justa — mismos meses transcurridos en ambos años).
 */
function acumularKPIIngenieros(anioFiltro, mesCorteIdx) {
  const filas = listarRegistros('KPI_Ingenieros_Mensual').registros;
  const acum = {};
  filas.forEach(function (r) {
    if (anioFiltro !== undefined && String(r['Año']) !== String(anioFiltro)) return;
    if (mesCorteIdx !== undefined) {
      const idx = indiceMes(r['Mes']);
      if (idx !== -1 && idx > mesCorteIdx) return;
    }
    const k = r['Ingeniero'];
    if (!acum[k]) acum[k] = { estudiados: 0, cotizado: 0, adjudicados: 0, adjudicado: 0 };
    acum[k].estudiados += Number(r['Proyectos Estudiados']) || 0;
    acum[k].cotizado += Number(r['Monto Cotizado']) || 0;
    acum[k].adjudicados += Number(r['Proyectos Adjudicados']) || 0;
    acum[k].adjudicado += Number(r['Monto Adjudicado']) || 0;
  });
  return acum;
}

/** Suma el Monto Adjudicado de todos los ingenieros para un año y mes puntual. */
function totalAdjudicadoDelMes(anio, mesNombre) {
  const filas = listarRegistros('KPI_Ingenieros_Mensual').registros;
  let total = 0;
  filas.forEach(function (r) {
    if (String(r['Año']) === String(anio) && normalizarTexto(r['Mes']) === normalizarTexto(mesNombre)) {
      total += Number(r['Monto Adjudicado']) || 0;
    }
  });
  return total;
}

/**
 * Cuadro visual de 4 cuadrantes (Fortalezas/Oportunidades arriba,
 * Debilidades/Amenazas abajo) con los mismos colores que la planilla FODA
 * de referencia de Carlos — para que el informe se vea igual que el
 * documento que ya conocen en gerencia, no como una lista plana.
 */
function agregarCuadroFODA(doc, foda) {
  function items(cat) {
    const lista = foda.filter(function (f) { return f['Categoría'] === cat; });
    return lista.length ? lista.map(function (f, i) { return (i + 1) + '. ' + f['Descripción']; }).join('\n') : '(sin ítems)';
  }

  const tabla = doc.getBody().appendTable();

  const filaTitulos1 = tabla.appendTableRow();
  filaTitulos1.appendTableCell('FORTALEZAS').setBackgroundColor('#6AA84F');
  filaTitulos1.appendTableCell('OPORTUNIDADES').setBackgroundColor('#C27BA0');

  const filaContenido1 = tabla.appendTableRow();
  filaContenido1.appendTableCell(items('Fortaleza')).setBackgroundColor('#D9EAD3');
  filaContenido1.appendTableCell(items('Oportunidad')).setBackgroundColor('#EAD1DC');

  const filaTitulos2 = tabla.appendTableRow();
  filaTitulos2.appendTableCell('DEBILIDADES').setBackgroundColor('#E69138');
  filaTitulos2.appendTableCell('AMENAZAS').setBackgroundColor('#3D85C6');

  const filaContenido2 = tabla.appendTableRow();
  filaContenido2.appendTableCell(items('Debilidad')).setBackgroundColor('#FCE5CD');
  filaContenido2.appendTableCell(items('Amenaza')).setBackgroundColor('#CFE2F3');
}

/**
 * Tabla PESTEL agrupada por categoría, con la celda de Impacto coloreada
 * igual que la planilla de referencia (verde positivo, rojo negativo,
 * amarillo indiferente).
 */
function agregarTablaPESTEL(doc, pestel) {
  if (!pestel.length) { agregarTexto(doc, '(Sin factores registrados)'); return; }

  const tabla = doc.getBody().appendTable();
  const filaEncabezado = tabla.appendTableRow();
  ['Categoría', 'Factor', 'Descripción del Factor', 'Plazo', 'Impacto'].forEach(function (h) {
    const celda = filaEncabezado.appendTableCell(h);
    celda.setBackgroundColor('#EAF1F1');
    celda.editAsText().setBold(true);
  });

  pestel.forEach(function (p) {
    const fila = tabla.appendTableRow();
    fila.appendTableCell(p['Categoría PESTEL'] || '');
    fila.appendTableCell(p['Factor'] || '');
    fila.appendTableCell(p['Descripción del factor'] || '');
    fila.appendTableCell(p['Plazo'] || '');
    const impacto = p['Impacto'] || '';
    const celdaImpacto = fila.appendTableCell(impacto);
    const color = impacto === 'Positivo' ? '#D9EAD3' : (impacto === 'Negativo' ? '#F4CCCC' : (impacto === 'Indiferente' ? '#FFF2CC' : '#FFFFFF'));
    celdaImpacto.setBackgroundColor(color);
  });
}

/**
 * Barra de texto simple (bloques llenos/vacíos) para representar un
 * promedio 1-5 de forma visual dentro de una celda de tabla de Google Docs.
 */
function barraVisual(valor, maximo) {
  maximo = maximo || 5;
  const v = Number(valor) || 0;
  const llenos = Math.max(0, Math.min(10, Math.round((v / maximo) * 10)));
  return '█'.repeat(llenos) + '░'.repeat(10 - llenos);
}

/** Representación con estrellas (★ llenas / ☆ vacías) para un promedio 1-5. */
function estrellas(valor) {
  const v = Math.max(0, Math.min(5, Math.round(Number(valor) || 0)));
  return '★'.repeat(v) + '☆'.repeat(5 - v);
}

/**
 * Texto literal de las preguntas de la Encuesta de Satisfacción del
 * Cliente, tal como aparecen en el formulario — para que quede claro qué
 * se le está preguntando a los clientes, no solo el resultado.
 */
const PREGUNTAS_ENCUESTA_TEXTO = [
  '¿Quedó conforme con la calidad del servicio prestado? Indicar en escala de 1 a 5.',
  '¿Quedó conforme con los cumplimientos de plazos parciales y finales de la obra? Indicar en escala de 1 a 5.',
  '¿El presupuesto presentado cumplió con las expectativas de claridad de la información y plazos? Indicar en escala de 1 a 5.',
  '¿Quedó conforme con su atención comercial? Indicar en escala de 1 a 5.',
  'Indicar grado de satisfacción global con los trabajos realizados. Indicar en escala de 1 a 5.',
  '¿Volvería a trabajar con nosotros?',
  'Agradeceremos todo comentario que quisiese agregar.'
];

/**
 * Suma las filas mensuales de KPI_Estados_Agrupado_Mensual por grupo
 * (Ganado/Perdido/En Cotización/Casos Especiales), acumulado del año.
 */
function acumularEstadosAgrupados(anioFiltro) {
  const filas = listarRegistros('KPI_Estados_Agrupado_Mensual').registros;
  const acum = {};
  filas.forEach(function (r) {
    if (anioFiltro !== undefined && String(r['Año']) !== String(anioFiltro)) return;
    const g = r['Grupo'];
    if (!acum[g]) acum[g] = { cantidad: 0, monto: 0 };
    acum[g].cantidad += Number(r['Cantidad']) || 0;
    acum[g].monto += Number(r['Monto']) || 0;
  });
  return acum;
}

/**
 * Agrupa las filas de Balance_Scorecard por "Objetivo general", para poder
 * mostrar una tabla propia por objetivo (con la meta de cada año como
 * columna) en vez de una sola tabla plana.
 */
function agruparBSCPorObjetivo(bsc) {
  const porObjetivo = {};
  bsc.forEach(function (b) {
    const o = b['Objetivo general'] || '(sin nombre)';
    if (!porObjetivo[o]) porObjetivo[o] = [];
    porObjetivo[o].push(b);
  });
  return porObjetivo;
}

function generarInformeDatos() {
  primerTitulo = true;
  const ahora = new Date();
  const fechaTexto = ahora.toLocaleDateString('es-CL');
  const doc = crearDocInforme('FOR-SGC-008 Informe de Datos para Revisión de Gerencia - ' + fechaTexto, CARPETA_INFORME_DATOS);
  agregarPortadaEIndice(doc, 'FOR-SGC-008', 'Informe de Datos para la Revisión de la Gerencia', 'Sistema de Gestión de la Calidad',
    'Este informe reúne la información del Sistema de Gestión Integrado (FODA, PESTEL, Partes Interesadas, Riesgos y Oportunidades, Balance Scorecard, Compromisos y Medidas) junto con los indicadores comerciales y operacionales del período, como base de trabajo para la revisión de la Gerencia.',
    [
      '1. Análisis de Compromisos Pactados',
      '2. Cambios en Cuestiones Externas e Internas',
      '     2.1 FODA',
      '     2.2 PESTEL',
      '     2.3 Partes Interesadas',
      '3. Riesgos y Oportunidades',
      '4. Satisfacción del Cliente',
      '5. Objetivos Estratégicos',
      '     5.1 Desempeño comercial por ingeniero',
      '     5.2 Objetivos Estratégicos y sus Resultados',
      '     5.3 Indicadores Financieros (Costo Oficina y Utilidad)',
      '6. Política de Calidad',
      '7. Desempeño de los Procesos',
      '     7.1 Estado de obras vigentes',
      '     7.2 No Conformidades y Acciones Correctivas',
      '8. Seguimiento y Medición del Desempeño',
      '9. Resultado de Auditorías',
      '10. Desempeño de Proveedores Externos',
      '11. Adecuación de Recursos',
      '12. Oportunidades de Mejora',
      '13. Capacitaciones del Personal'
    ]);

  const NOTA_ANALISIS = '[Redacción manual — análisis de resultados y priorización de actividades en el periodo]';
  const compromisos = listarRegistros('Compromisos_Medidas').registros;

  agregarTitulo(doc, '1. Análisis de Compromisos Pactados');
  agregarFuente(doc, 'módulo "Compromisos y Medidas" de la PWA de Gestión Integrada ISO — mismos acuerdos definidos en el informe de gerencia del periodo anterior, siempre actualizados a su última versión.');
  agregarTabla(doc, ['Compromiso', 'Responsable', 'Fecha', 'Estado', 'Observaciones'],
    compromisos.map(function (c) { return [c['Compromiso'], c['Responsable'], c['Fecha compromiso'], c['Estado'], c['Observaciones']]; }));

  agregarTitulo(doc, '2. Cambios en Cuestiones Externas e Internas');
  const foda = listarRegistros('FODA').registros;
  const pestel = listarRegistros('PESTEL').registros;
  const partes = listarRegistros('Partes_Interesadas').registros;
  agregarSubtitulo(doc, '2.1 FODA (' + foda.length + ' ítems)');
  agregarFuente(doc, 'módulo FODA de la PWA.');
  ['Fortaleza', 'Debilidad', 'Oportunidad', 'Amenaza'].forEach(function (cat) {
    agregarTexto(doc, '• ' + cat + 's: ' + foda.filter(function (f) { return f['Categoría'] === cat; }).length);
  });
  agregarCuadroFODA(doc, foda);

  agregarSubtitulo(doc, '2.1.1 Matriz Cruzada (TOWS)');
  agregarFuente(doc, 'módulo FODA — Matriz Cruzada de la PWA.');
  const cruce = listarRegistros('Cruce_FODA').registros;
  if (cruce.length) {
    agregarTabla(doc, ['Tipo de Cruce', 'Estrategia Resultante', 'Estado', 'Responsables'],
      cruce.map(function (c) { return [c['tipo_cruce'], c['Estrategia resultante'], c['Estado'], c['Responsables de ejecución']]; }));
  } else {
    agregarTexto(doc, '[Matriz cruzada aún no desarrollada — se incorpora automáticamente en el próximo informe apenas se cargue en el módulo FODA]');
  }

  agregarSubtitulo(doc, '2.2 PESTEL (' + pestel.length + ' factores registrados)');
  agregarFuente(doc, 'módulo PESTEL de la PWA.');
  agregarTablaPESTEL(doc, pestel);

  agregarSubtitulo(doc, '2.3 Partes Interesadas (' + partes.length + ' registradas)');
  agregarFuente(doc, 'módulo Partes Interesadas de la PWA.');
  agregarTabla(doc, ['Tipo', 'Parte Interesada', 'Necesidad / Expectativa', 'Requisitos', 'Riesgos y Oportunidades'],
    partes.map(function (p) { return [p['Tipo'], p['Parte interesada'], p['Necesidad / expectativa'], p['Requisitos'], p['Riesgos y oportunidades']]; }));

  agregarBloqueAnalisis(doc, 'Reflexiones sobre FODA, PESTEL y Partes Interesadas');

  agregarTitulo(doc, '3. Riesgos y Oportunidades');
  agregarFuente(doc, 'módulo Riesgos y Oportunidades de la PWA.');
  const riesgos = listarRegistros('Riesgos_Oportunidades').registros;
  const riesgosCriticos = riesgos.filter(function (r) { return r['Nivel'] === 'Alto' || r['Nivel'] === 'Crítico'; });
  agregarTexto(doc, 'Total registrados: ' + riesgos.length + ' — En nivel Alto/Crítico: ' + riesgosCriticos.length);
  agregarTabla(doc, ['Descripción', 'Tipo', 'Nivel', 'Estado', 'Responsable'],
    riesgosCriticos.map(function (r) { return [r['Descripción'], r['Tipo'], r['Nivel'], r['Estado'], r['Responsable']]; }));
  agregarBloqueAnalisis(doc);

  agregarTitulo(doc, '4. Satisfacción del Cliente');
  agregarFuente(doc, 'Encuesta de Satisfacción del Cliente (Google Form), resumen y detalle anual extraídos automáticamente.');
  agregarSubtitulo(doc, 'Preguntas de la encuesta');
  PREGUNTAS_ENCUESTA_TEXTO.forEach(function (preg, i) { agregarTexto(doc, (i + 1) + '. ' + preg); });

  const encuestaResumen = listarRegistros('Encuesta_Satisfaccion_Resumen').registros;
  const ultimaEncuesta = encuestaResumen[encuestaResumen.length - 1];
  if (ultimaEncuesta && Number(ultimaEncuesta['N Respuestas']) > 0) {
    agregarSubtitulo(doc, 'Resultados ' + ultimaEncuesta['Año'] + ' (' + ultimaEncuesta['N Respuestas'] + ' respuestas recibidas)');
    const preguntasResultado = [
      ['Calidad del Servicio', ultimaEncuesta['Promedio Calidad Servicio']],
      ['Tiempo de Respuesta', ultimaEncuesta['Promedio Tiempo Respuesta']],
      ['Presupuestos y Plazos', ultimaEncuesta['Promedio Presupuestos y Plazos']],
      ['Atención Comercial', ultimaEncuesta['Promedio Atención Comercial']],
      ['Cumplimiento de Objetivos', ultimaEncuesta['Promedio Cumplimiento Objetivos']],
      ['Satisfacción General', ultimaEncuesta['Promedio Satisfacción General']]
    ];
    agregarTabla(doc, ['Pregunta', 'Promedio (1-5)', 'Calificación'],
      preguntasResultado.map(function (p) { return [p[0], p[1], estrellas(p[1])]; }));

    agregarSubtitulo(doc, 'Empresas que respondieron en ' + ultimaEncuesta['Año']);
    const encuestaDetalle = listarRegistros('Encuesta_Satisfaccion_Detalle').registros.filter(function (d) { return String(d['Año']) === String(ultimaEncuesta['Año']); });
    encuestaDetalle.forEach(function (d) {
      agregarSubtitulo(doc, d['Empresa'] || '(sin nombre de empresa)');
      agregarTexto(doc, 'Obra o faena: ' + (d['Obra o Faena'] || '-') + '   ·   RUT: ' + (d['RUT Empresa'] || '-'));
      agregarTabla(doc, ['Calidad', 'Tiempo Resp.', 'Presup. y Plazos', 'At. Comercial', 'Cumpl. Objetivos', 'Satisf. General'],
        [[d['Calidad Servicio'], d['Tiempo Respuesta'], d['Presupuestos y Plazos'], d['Atención Comercial'], d['Cumplimiento Objetivos'], d['Satisfacción General']]]);
      if (d['Comentario']) agregarTexto(doc, 'Comentario del cliente: "' + d['Comentario'] + '"');
      const pDesc = agregarTexto(doc, '[Opcional — descripción de esta respuesta, redactada a mano o con ayuda de IA como propuesta inicial]');
      pDesc.setItalic(true);
    });
  } else {
    agregarTexto(doc, 'Sin respuestas registradas en ' + ahora.getFullYear() + ' — revisar con comercial si conviene reforzar el envío de la encuesta.');
  }
  agregarBloqueAnalisis(doc);

  agregarTitulo(doc, '5. Objetivos Estratégicos');
  agregarFuente(doc, 'módulo Balance Scorecard de la PWA.');
  const bsc = listarRegistros('Balance_Scorecard').registros;
  agregarTabla(doc, ['Ámbito', 'Objetivo', 'Meta', 'Indicador', 'Responsable'],
    bsc.map(function (b) { return [b['Ámbito'], b['Objetivo general'], b['Meta'], b['Indicador y medición'], b['Responsable objetivo']]; }));

  agregarSubtitulo(doc, '5.1 Desempeño comercial por ingeniero (acumulado del año ' + ahora.getFullYear() + ')');
  agregarFuente(doc, 'planilla comercial, pestaña "Centro de Costos" (FOR-COM-013), extraído automáticamente.');
  const EXCLUIDOS_DESEMPENO = ['Claudia Menéndez', 'Darío Valdivia', 'Pablo Muñoz'].map(normalizarTexto);
  const anioActualInforme = ahora.getFullYear();
  const mesActualIdx = ahora.getMonth();
  const acumIngActual = acumularKPIIngenieros(anioActualInforme);
  const ingenierosValidos = Object.keys(acumIngActual).filter(function (k) { return EXCLUIDOS_DESEMPENO.indexOf(normalizarTexto(k)) === -1; });
  agregarTabla(doc, ['Ingeniero', 'Estudiados', 'Monto Cotizado', 'Adjudicados', 'Monto Adjudicado', '% Efectividad'],
    ingenierosValidos.map(function (k) {
      const a = acumIngActual[k];
      const pct = a.estudiados ? Math.round((a.adjudicados / a.estudiados) * 100) + '%' : '0%';
      return [k, a.estudiados, clpTexto(a.cotizado), a.adjudicados, clpTexto(a.adjudicado), pct];
    }));

  agregarSubtitulo(doc, 'Detalle mensual por ingeniero — ' + anioActualInforme);
  agregarFuente(doc, 'planilla comercial, pestaña "Centro de Costos", desglose mes a mes por ingeniero.');
  const detalleMensualIng = listarRegistros('KPI_Ingenieros_Mensual').registros
    .filter(function (r) { return String(r['Año']) === String(anioActualInforme) && EXCLUIDOS_DESEMPENO.indexOf(normalizarTexto(r['Ingeniero'])) === -1; })
    .sort(function (a, b) { return indiceMes(a['Mes']) - indiceMes(b['Mes']) || String(a['Ingeniero']).localeCompare(String(b['Ingeniero'])); });
  agregarTabla(doc, ['Mes', 'Ingeniero', 'Estudiados', 'Monto Cotizado', 'Adjudicados', 'Monto Adjudicado', '% Adjudicación'],
    detalleMensualIng.map(function (r) { return [tituloCase(r['Mes']), r['Ingeniero'], r['Proyectos Estudiados'], clpTexto(r['Monto Cotizado']), r['Proyectos Adjudicados'], clpTexto(r['Monto Adjudicado']), r['% Adjudicación']]; }));

  let totEstudiados = 0, totCotizado = 0, totAdjudicados = 0, totAdjudicado = 0;
  ingenierosValidos.forEach(function (k) {
    const a = acumIngActual[k];
    totEstudiados += a.estudiados; totCotizado += a.cotizado; totAdjudicados += a.adjudicados; totAdjudicado += a.adjudicado;
  });
  const agrupado = acumularEstadosAgrupados(anioActualInforme);
  const perdido = agrupado['Perdido'] || { cantidad: 0, monto: 0 };
  const cotizando = agrupado['En Cotización'] || { cantidad: 0, monto: 0 };
  const perdidosOEspera = { cantidad: perdido.cantidad + cotizando.cantidad, monto: perdido.monto + cotizando.monto };
  const efectN = totEstudiados ? Math.round((totAdjudicados / totEstudiados) * 100) + '%' : '0%';
  const efectMonto = totCotizado ? ((totAdjudicado / totCotizado) * 100).toFixed(2) + '%' : '0%';

  agregarSubtitulo(doc, 'Totales ' + anioActualInforme + ' — Cantidad de presupuestos generados versus adjudicados');
  agregarTabla(doc, ['Indicador', 'Valor'], [
    ['Proyectos Estudiados', totEstudiados],
    ['Montos Cotizados', clpTexto(totCotizado)],
    ['Proyectos Adjudicados', totAdjudicados],
    ['Perdidos o en Espera de Adjudicación', perdidosOEspera.cantidad + ' proyectos — ' + clpTexto(perdidosOEspera.monto)],
    ['Montos Adjudicados', clpTexto(totAdjudicado)],
    ['Efectividad de Cierre n° %', efectN],
    ['Efectividad de Cierre $ %', efectMonto]
  ]);

  agregarSubtitulo(doc, 'Comparativo con año anterior (acumulado a la misma fecha)');
  agregarTexto(doc, 'Se compara lo acumulado en ' + anioActualInforme + ' hasta el mes en curso, contra lo acumulado en ' + (anioActualInforme - 1) + ' en esos mismos meses (' + tituloCase(MESES_ORDEN[0]) + ' a ' + tituloCase(MESES_ORDEN[mesActualIdx]) + '), para comparar en igualdad de condiciones.');
  function totalesIngenieros(anio) {
    const acum = acumularKPIIngenieros(anio, mesActualIdx);
    let e = 0, c = 0, ad = 0, am = 0;
    Object.keys(acum).forEach(function (k) {
      if (EXCLUIDOS_DESEMPENO.indexOf(normalizarTexto(k)) !== -1) return;
      const a = acum[k]; e += a.estudiados; c += a.cotizado; ad += a.adjudicados; am += a.adjudicado;
    });
    return { estudiados: e, cotizado: c, adjudicados: ad, adjudicado: am };
  }
  const totActualAFecha = totalesIngenieros(anioActualInforme);
  const totAnteriorAFecha = totalesIngenieros(anioActualInforme - 1);
  agregarTabla(doc, ['Indicador', anioActualInforme + ' (a la fecha)', (anioActualInforme - 1) + ' (a la fecha)'], [
    ['Proyectos Estudiados', totActualAFecha.estudiados, totAnteriorAFecha.estudiados],
    ['Montos Cotizados', clpTexto(totActualAFecha.cotizado), clpTexto(totAnteriorAFecha.cotizado)],
    ['Proyectos Adjudicados', totActualAFecha.adjudicados, totAnteriorAFecha.adjudicados],
    ['Montos Adjudicados', clpTexto(totActualAFecha.adjudicado), clpTexto(totAnteriorAFecha.adjudicado)]
  ]);

  const mesSiguienteIdx = (mesActualIdx + 1) % 12;
  const metaMesSiguiente = totalAdjudicadoDelMes(anioActualInforme - 1, MESES_ORDEN[mesSiguienteIdx]);
  agregarTexto(doc, 'Referencia para el próximo mes: en ' + tituloCase(MESES_ORDEN[mesSiguienteIdx]) + ' ' + (anioActualInforme - 1) +
    ' se adjudicó ' + clpTexto(metaMesSiguiente) + '. Para superar el mismo mes del año anterior, ' + tituloCase(MESES_ORDEN[mesSiguienteIdx]) + ' ' + anioActualInforme +
    ' debiese adjudicar por sobre ese monto.');
  agregarBloqueAnalisis(doc, 'Análisis de resultados por ingeniero');

  agregarSubtitulo(doc, '5.2 Objetivos Estratégicos y sus Resultados');
  agregarFuente(doc, 'módulo Balance Scorecard de la PWA.');
  agregarTexto(doc, 'A continuación se presentan los objetivos estratégicos de la empresa y los resultados obtenidos durante el período, según lo definido en el Balance Scorecard, con las metas establecidas por año.');
  const porObjetivo = agruparBSCPorObjetivo(bsc);
  Object.keys(porObjetivo).forEach(function (nombreObjetivo) {
    agregarSubtitulo(doc, nombreObjetivo);
    const filasObjetivo = porObjetivo[nombreObjetivo];
    const anios = Array.from(new Set(filasObjetivo.map(function (f) { return f['Año']; }))).filter(function (a) { return a; }).sort();
    const primera = filasObjetivo[0];
    const encabezadosTabla = ['Ámbito'].concat(anios.map(function (a) { return 'Meta ' + a; })).concat(['Indicador y Medición', 'Frecuencia', 'Responsable']);
    const metasPorAnio = anios.map(function (a) {
      const fila = filasObjetivo.find(function (f) { return String(f['Año']) === String(a); });
      return fila ? fila['Meta'] : '-';
    });
    const filaDatos = [primera['Ámbito']].concat(metasPorAnio).concat([primera['Indicador y medición'], primera['Frecuencia de control'], primera['Responsable objetivo']]);
    agregarTabla(doc, encabezadosTabla, [filaDatos]);
    agregarBloqueAnalisis(doc, 'Análisis: ' + nombreObjetivo);
  });

  agregarSubtitulo(doc, '5.3 Indicadores Financieros (Costo Oficina y Utilidad)');
  agregarFuente(doc, 'planilla comercial, pestaña "Centro de Costos" — columnas Costo Oficina y Utilidad, extraído automáticamente. No incluye Gastos Generales (se asocia a obras, no a la oficina).');
  const financiero = listarRegistros('KPI_Financiero_Mensual').registros
    .filter(function (r) { return String(r['Año']) === String(anioActualInforme); })
    .sort(function (a, b) { return indiceMes(a['Mes']) - indiceMes(b['Mes']); });
  agregarTabla(doc, ['Mes', 'Costo Oficina', 'Utilidad'],
    financiero.map(function (f) { return [tituloCase(f['Mes']), clpTexto(f['Costo Oficina']), clpTexto(f['Utilidad'])]; }));

  let totCostoOficina = 0, totUtilidadFinanciero = 0;
  financiero.forEach(function (f) {
    totCostoOficina += Number(f['Costo Oficina']) || 0;
    totUtilidadFinanciero += Number(f['Utilidad']) || 0;
  });
  agregarSubtitulo(doc, 'Acumulado anual ' + anioActualInforme);
  agregarTabla(doc, ['Indicador', 'Valor'], [
    ['Costo Oficina', clpTexto(totCostoOficina)],
    ['Utilidad', clpTexto(totUtilidadFinanciero)]
  ]);
  agregarBloqueAnalisis(doc, 'Análisis de indicadores financieros');

  agregarTitulo(doc, '6. Política de Calidad');
  agregarFuente(doc, 'redacción manual — sin fuente digital conectada.');
  agregarTexto(doc, '[Redacción manual — agregar según corresponda]');

  agregarTitulo(doc, '7. Desempeño de los Procesos');
  agregarSubtitulo(doc, '7.1 Estado de obras vigentes');
  agregarFuente(doc, 'planilla comercial, pestaña "E° OBRAS", extraído automáticamente (solo obras vigentes).');
  const estObras = listarRegistros('Estado_Obras').registros;
  agregarTabla(doc, ['Obra', 'Valor Total', 'Facturado Acumulado', '% Utilidad', 'Utilidad Neta'],
    estObras.map(function (o) { return [o['Obra'], clpTexto(o['Valor Total Obra']), clpTexto(o['Total Facturado Acumulado']), o['% Utilidad a la Fecha'], clpTexto(o['Utilidad Neta'])]; }));
  agregarBloqueAnalisis(doc, 'Análisis del estado de obras');

  agregarSubtitulo(doc, '7.2 No Conformidades y Acciones Correctivas');
  agregarFuente(doc, 'FOR-SGC-001 (registro de No Conformidades), resumen y detalle anual extraídos automáticamente.');
  agregarTexto(doc, 'Con el objetivo de asegurar el cumplimiento de los estándares de calidad definidos tanto en la gestión de nuestros servicios como en la administración de la compañía, se implementó el registro de No Conformidades y Acciones Correctivas. A continuación se presenta el estado general de los resultados del período.');
  const ncResumen = listarRegistros('NoConformidades_Resumen').registros;
  const ultimoNC = ncResumen[ncResumen.length - 1];
  if (ultimoNC) {
    agregarTabla(doc, ['Tipo Evento', 'Cantidad', 'Acciones Resueltas'], [
      ['No Conformidades', ultimoNC['No Conformidades'], ultimoNC['No Conformidades Cerradas']],
      ['Observaciones', ultimoNC['Observaciones'], ultimoNC['Observaciones Cerradas']]
    ]);
  } else {
    agregarTexto(doc, '[Sin snapshot cargado — correr extraerNoConformidades()]');
  }
  agregarSubtitulo(doc, 'Listado detallado');
  const ncDetalle = listarRegistros('NoConformidades_Detalle').registros.filter(function (d) { return String(d['Año']) === String(ahora.getFullYear()); });
  agregarTabla(doc, ['N°', 'Tipo', 'Descripción', 'Área', 'Estado', 'Fecha Cierre'],
    ncDetalle.map(function (d) { return [d['Número'], d['Tipo'], d['Descripción'], d['Área'], d['Estado'], d['Fecha Cierre'] || '-']; }));
  agregarTexto(doc, '[Redacción manual — contexto adicional: estado de la próxima auditoría interna, plazos de cierre pendientes]');

  agregarTitulo(doc, '8. Seguimiento y Medición del Desempeño');
  agregarFuente(doc, 'FOR-SGC-004 (Panel de Monitoreo), snapshot mensual extraído automáticamente — se revisa en la planilla externa, no en la PWA.');
  const monitoreo = listarRegistros('Monitoreo_SGC004').registros;
  const sinActualizar = monitoreo.filter(function (m) { return m['Estado'] === 'Sin dato este mes'; });
  agregarTexto(doc, 'Ítems monitoreados: ' + monitoreo.length + ' — Sin actualizar este mes: ' + sinActualizar.length);
  agregarTabla(doc, ['N°', 'Origen', 'Objetivo/Actividad', 'Fecha Definida', 'Meta', 'Indicadores', 'Frecuencia', 'Responsable', 'Estado Cumplimiento'],
    monitoreo.map(function (m) {
      return [m['Num'], m['Origen'], m['Objetivo'], m['Fecha Definida'], m['Meta'], m['Indicador'], m['Frecuencia'], m['Responsable'], m['Estado']];
    }));

  agregarTitulo(doc, '9. Resultado de Auditorías');
  agregarFuente(doc, 'redacción manual — archivos de auditoría interna (por área) o externa (auditoría externa o de renovación ISO), sin fuente digital conectada por ahora.');
  agregarTexto(doc, '[Redacción manual — puede corresponder a auditorías internas realizadas por cada área, o a auditoría externa / de renovación ISO. Pendiente evaluar a futuro sistematizar la carga del archivo de auditoría para extraer esta información directamente]');

  agregarTitulo(doc, '10. Desempeño de Proveedores Externos');
  agregarFuente(doc, 'FOR-ADQ-002 (Evaluación de Proveedores), extraído automáticamente.');
  agregarTexto(doc, 'A continuación se entrega el resultado de análisis de la evaluación de los proveedores de materiales y de servicios.');
  const prov = listarRegistros('Evaluacion_Proveedores').registros;
  agregarTablaProveedores(doc, prov);

  agregarTitulo(doc, '11. Adecuación de Recursos');
  agregarFuente(doc, 'Organigrama (DOC-RRH-001), Listado de Activos Tangibles (DOC-ADQ-001) y Listado de Activos Intangibles (DOC-ADQ-002), extraídos automáticamente. Lista de trabajadores: redacción manual (protección de datos personales).');

  agregarSubtitulo(doc, 'Lista de Trabajadores');
  agregarTexto(doc, '[Redacción manual — protección de datos personales, no se extrae automáticamente]');

  agregarSubtitulo(doc, 'Organigrama');
  try {
    const orgBlob = DriveApp.getFileById(ORGANIGRAMA_IMG_ID).getBlob();
    const pOrg = doc.getBody().appendParagraph('');
    const imgOrg = pOrg.appendInlineImage(orgBlob);
    const anchoOrgOriginal = imgOrg.getWidth();
    const altoOrgOriginal = imgOrg.getHeight();
    const anchoOrgDeseado = 450;
    imgOrg.setWidth(anchoOrgDeseado);
    imgOrg.setHeight(Math.round(altoOrgOriginal * (anchoOrgDeseado / anchoOrgOriginal)));
  } catch (e) {
    agregarTexto(doc, '[No se pudo insertar el organigrama automáticamente: ' + e.message + ' — revisar permisos del archivo ORGANIGRAMA_IMG_ID]');
  }

  agregarSubtitulo(doc, 'Activos Tangibles');
  const activosTangibles = listarRegistros('Activos_Tangibles').registros;
  agregarTabla(doc, ['Nombre', 'Descripción / Marca', 'Modelo', 'N° Identificación', 'Cantidad', 'Valor Unitario', 'Valor Total', 'Observaciones'],
    activosTangibles.map(function (a) { return [a['Nombre'], a['Descripción / Marca'], a['Modelo'], a['N° Identificación'], a['Cantidad'], clpTexto(a['Valor Unitario']), clpTexto(a['Valor Total']), a['Observaciones']]; }));

  agregarSubtitulo(doc, 'Activos Intangibles');
  const activosIntangibles = listarRegistros('Activos_Intangibles').registros;
  agregarTabla(doc, ['Nombre', 'Licencia', 'Fecha Contrato', 'Fecha Vencimiento', 'Cantidad', 'Valor', 'Valor Total', 'Observaciones'],
    activosIntangibles.map(function (a) { return [a['Nombre'], a['Licencia'], a['Fecha Contrato'], a['Fecha Vencimiento'], a['Cantidad'], clpTexto(a['Valor']), clpTexto(a['Valor Total']), a['Observaciones']]; }));

  agregarTitulo(doc, '12. Oportunidades de Mejora');
  agregarFuente(doc, 'módulo "Compromisos y Medidas" de la PWA (misma fuente que la Sección 1).');
  agregarTabla(doc, ['Compromiso', 'Responsable', 'Fecha', 'Estado', 'Observaciones'],
    compromisos.map(function (c) { return [c['Compromiso'], c['Responsable'], c['Fecha compromiso'], c['Estado'], c['Observaciones']]; }));

  agregarTitulo(doc, '13. Capacitaciones del Personal');
  if (FUENTES_EXTERNAS.CAPACITACIONES) {
    agregarFuente(doc, 'DOC-SGC-012 (Plan de Capacitación del año), extraído automáticamente.');
    const capacitaciones = listarRegistros('Capacitaciones_Detalle').registros.filter(function (c) { return String(c['Año']) === String(ahora.getFullYear()); });
    agregarTabla(doc, ['Capacitación', 'Fecha Programada', 'Estado', 'Observaciones'],
      capacitaciones.map(function (c) { return [c['Capacitación'], c['Fecha Programada'], c['Estado'], c['Observaciones']]; }));
  } else {
    agregarFuente(doc, 'DOC-SGC-012 (Plan de Capacitación del año) — pendiente de conectar.');
    agregarTexto(doc, '[Pendiente: convertir el archivo DOC-SGC-012 Plan Capacitación ' + ahora.getFullYear() + ' de Excel a Google Sheets y entregar el link, para poder extraer automáticamente qué capacitaciones se realizaron y cuáles quedan pendientes en el período. El archivo se reemplaza cada año — recordar confirmar el vigente a inicios de cada año.]');
  }
  agregarBloqueAnalisis(doc, 'Análisis de capacitaciones del periodo');

  const pNotaIA = agregarTexto(doc, 'Este informe fue desarrollado con apoyo de Inteligencia Artificial (extracción y consolidación automática de datos, y redacción de propuestas de análisis en los espacios opcionales marcados), con el fin de mantener la transparencia del proceso.');
  pNotaIA.setItalic(true);
  pNotaIA.editAsText().setForegroundColor('#8A9A9E').setFontSize(10);

  doc.saveAndClose();
  return doc.getUrl();
}

/**
 * Tabla de Evaluación de Proveedores con la celda de Calificación coloreada
 * (verde Excelente/Bueno, amarillo Regular, rojo Malo/Muy malo).
 */
function agregarTablaProveedores(doc, prov) {
  if (!prov.length) { agregarTexto(doc, '(Sin proveedores evaluados)'); return; }
  const tabla = doc.getBody().appendTable();
  const filaEncabezado = tabla.appendTableRow();
  ['N°', 'Nombre Proveedor', 'Promedio', 'Calificación'].forEach(function (h) {
    const celda = filaEncabezado.appendTableCell(h);
    celda.setBackgroundColor('#EAF1F1');
    celda.editAsText().setBold(true);
  });
  const colores = {
    'Muy bueno': '#B6D7A8', 'Excelente': '#B6D7A8',
    'Bueno': '#D9EAD3',
    'Regular': '#FFF2CC',
    'Malo': '#F4CCCC', 'Muy malo': '#EA9999'
  };
  prov.forEach(function (p, i) {
    const fila = tabla.appendTableRow();
    fila.appendTableCell(String(i + 1));
    fila.appendTableCell(p['Proveedor'] || '');
    const promedioNum = Number(p['Promedio']);
    fila.appendTableCell(isNaN(promedioNum) ? String(p['Promedio'] || '') : promedioNum.toFixed(2));
    const calificacion = p['Calificación'] || '';
    fila.appendTableCell(calificacion).setBackgroundColor(colores[calificacion] || '#FFFFFF');
  });
}

function generarInformeResumen() {
  primerTitulo = true;
  const ahora = new Date();
  const fechaTexto = ahora.toLocaleDateString('es-CL');
  const doc = crearDocInforme('FOR-SGC-007 Acta Revisión de la Dirección - ' + fechaTexto, CARPETA_INFORME_RESUMEN);
  const body = doc.getBody();
  body.appendParagraph('ACTA REVISIÓN DE LA DIRECCIÓN').setHeading(DocumentApp.ParagraphHeading.TITLE);
  agregarTexto(doc, 'Fecha: ' + fechaTexto);
  agregarTexto(doc, 'Participantes: [completar]');

  agregarTitulo(doc, 'Acuerdos y Compromisos');
  agregarFuente(doc, 'módulo "Compromisos y Medidas" de la PWA de Gestión Integrada ISO.');
  const compromisos = listarRegistros('Compromisos_Medidas').registros;
  agregarTabla(doc, ['Descripción de situación', 'Compromiso / Comentarios', 'Responsable', 'Fecha de compromiso'],
    compromisos.map(function (c) { return [c['Origen'] || 'Oportunidades de mejora', c['Compromiso'], c['Responsable'], c['Fecha compromiso']]; }));

  doc.saveAndClose();
  return doc.getUrl();
}

/**
 * Genera los dos informes de una vez y deja las URLs en el log.
 */
function generarAmbosInformes() {
  const urlDatos = generarInformeDatos();
  const urlResumen = generarInformeResumen();
  Logger.log('FOR-SGC-008 (Informe de Datos): ' + urlDatos);
  Logger.log('FOR-SGC-007 (Acta Resumen): ' + urlResumen);
}

function doGet(e) {
  const callback = e.parameter.callback;
  const accion = e.parameter.accion;
  let resultado;

  try {
    if (e.parameter.clave !== CLAVE_APP) throw new Error('Clave de acceso inválida');
    if (accion === 'listar') {
      resultado = listarRegistros(e.parameter.tabla);
    } else {
      resultado = { error: 'Acción no reconocida' };
    }
  } catch (err) {
    resultado = { error: err.message };
  }

  const salida = callback + '(' + JSON.stringify(resultado) + ')';
  return ContentService.createTextOutput(salida)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function listarRegistros(nombreTabla) {
  if (!ESQUEMA[nombreTabla]) return { error: 'Tabla no válida: ' + nombreTabla };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName(nombreTabla);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos.shift();
  const filas = datos.map(function (fila) {
    const obj = {};
    encabezados.forEach(function (encabezado, i) { obj[encabezado] = fila[i]; });
    return obj;
  });
  return { tabla: nombreTabla, registros: filas };
}

/**
 * doPost: punto de entrada para crear y actualizar registros desde la PWA.
 * El body debe ser JSON: { tabla, accion: 'crear'|'actualizar', registro: {...}, usuario: 'nombre' }
 * Se envía como Content-Type: text/plain desde el frontend para evitar el
 * preflight CORS que Apps Script no maneja bien.
 *
 * Si accion es 'crear' y viene replicar_a (array de nombres de tabla), el
 * registro recién creado se copia automáticamente hacia cada tabla listada
 * (ver replicarRegistro más arriba).
 */
function doPost(e) {
  let resultado;
  try {
    if (!e.postData || !e.postData.contents) throw new Error('Solicitud vacía');
    if (e.postData.contents.length > 50000) throw new Error('Solicitud demasiado grande');

    const body = JSON.parse(e.postData.contents);
    if (body.clave !== CLAVE_APP) throw new Error('Clave de acceso inválida');

    // --- Actualizar una fuente externa (botón "Actualizar" en la PWA) ---
    // No depende de tabla/registro — corre la función de extracción que
    // corresponda y devuelve un mensaje de resultado.
    if (body.accion === 'actualizarFuente') {
      const FUNCIONES_EXTRACCION = {
        NoConformidades: extraerNoConformidades,
        EstadoObras: extraerEstadoObras,
        MonitoreoSGC004: extraerMonitoreoSGC004,
        EvaluacionProveedores: extraerEvaluacionProveedores,
        KPIsComerciales: extraerKPIsComerciales,
        EncuestaSatisfaccion: extraerEncuestaSatisfaccion,
        Capacitaciones: extraerCapacitaciones,
        ActivosTangibles: extraerActivosTangibles,
        ActivosIntangibles: extraerActivosIntangibles,
        Todos: actualizarTodosLosSnapshots
      };
      const fn = FUNCIONES_EXTRACCION[body.fuente];
      if (!fn) throw new Error('Fuente no reconocida: ' + body.fuente);
      const salidaFn = fn(); // actualizarTodosLosSnapshots() devuelve el detalle por fuente; las demás no devuelven nada
      const respuesta = { ok: true, mensaje: 'Actualizado correctamente.' };
      if (Array.isArray(salidaFn)) {
        respuesta.detalle = salidaFn;
        const fallidas = salidaFn.filter(function (r) { return !r.ok; });
        if (fallidas.length) {
          respuesta.mensaje = fallidas.length + ' de ' + salidaFn.length + ' fuentes fallaron — revisa el detalle.';
        }
      }
      return ContentService.createTextOutput(JSON.stringify(respuesta))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- Generar el Informe de Gerencia (botón en la PWA) ---
    // body.cual: 'Ambos' | 'Datos' | 'Resumen'. Devuelve las URLs de los
    // documentos generados para mostrarlas directo en la app.
    if (body.accion === 'generarInforme') {
      const cual = body.cual || 'Ambos';
      const salida = { ok: true };
      if (cual === 'Datos' || cual === 'Ambos') salida.urlDatos = generarInformeDatos();
      if (cual === 'Resumen' || cual === 'Ambos') salida.urlResumen = generarInformeResumen();
      return ContentService.createTextOutput(JSON.stringify(salida))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const tabla = body.tabla;
    const usuario = String(body.usuario || 'desconocido').slice(0, 100);

    if (!ESQUEMA[tabla]) throw new Error('Tabla no válida: ' + tabla);

    // --- Eliminar un registro (botón "Eliminar" en la PWA, con confirmación) ---
    if (body.accion === 'eliminar') {
      resultado = eliminarRegistro(tabla, body.id);
      return ContentService.createTextOutput(JSON.stringify(resultado))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (!body.registro || typeof body.registro !== 'object') throw new Error('Registro inválido');

    // Limita el tamaño de cada campo de texto para evitar filas basura gigantes
    Object.keys(body.registro).forEach(function (campo) {
      if (typeof body.registro[campo] === 'string' && body.registro[campo].length > 3000) {
        body.registro[campo] = body.registro[campo].slice(0, 3000);
      }
    });

    if (body.accion === 'crear') {
      resultado = crearRegistro(tabla, body.registro, usuario);
    } else if (body.accion === 'actualizar') {
      resultado = actualizarRegistro(tabla, body.registro, usuario);
    } else {
      throw new Error('Acción no reconocida: ' + body.accion);
    }

    // --- Replicación hacia otras tablas (funciona al crear Y al editar) ---
    // Protección anti-duplicados: cada tabla ya replicada queda registrada
    // en el campo "Replicado_a" del registro origen — si se vuelve a marcar
    // la misma tabla, no se vuelve a crear una copia.
    if (resultado.ok && Array.isArray(body.replicar_a) && body.replicar_a.length && ESQUEMA[tabla].indexOf('Replicado_a') !== -1) {
      const idRegistro = body.accion === 'crear' ? resultado.id : body.registro.id;
      const registroActual = obtenerRegistroPorId(tabla, idRegistro) || Object.assign({}, body.registro, { id: idRegistro });
      const yaReplicado = String(registroActual['Replicado_a'] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      resultado.replicado_en = [];
      const nuevosExitosos = [];
      body.replicar_a.forEach(function (tablaDestino) {
        if (ESQUEMA[tablaDestino] && tablaDestino !== tabla && yaReplicado.indexOf(tablaDestino) === -1) {
          const campoReq = CAMPOS_REQUERIDOS_REPLICACION[tablaDestino];
          const extraDestino = (body.replicar_extra && body.replicar_extra[tablaDestino]) || null;
          if (campoReq && (!extraDestino || !extraDestino[campoReq])) {
            // Sin este campo el ítem quedaría creado pero invisible en la
            // vista agrupada de esa tabla — se rechaza en vez de crear un
            // registro fantasma. El frontend ya debería impedir llegar
            // hasta acá, esto es una segunda barrera.
            resultado.replicado_en.push({ tabla: tablaDestino, error: 'Falta indicar "' + campoReq + '" para replicar a ' + tablaDestino + ' — no se creó la copia.' });
            return;
          }
          try {
            const nuevoId = replicarRegistro(tabla, registroActual, tablaDestino, usuario, extraDestino);
            resultado.replicado_en.push({ tabla: tablaDestino, id: nuevoId });
            nuevosExitosos.push(tablaDestino);
          } catch (errRep) {
            resultado.replicado_en.push({ tabla: tablaDestino, error: errRep.message });
          }
        }
      });
      if (nuevosExitosos.length) {
        const todos = yaReplicado.concat(nuevosExitosos).join(', ');
        actualizarRegistro(tabla, { id: idRegistro, 'Replicado_a': todos }, usuario);
      }
    }
    // --- fin bloque de replicación ---
  } catch (err) {
    resultado = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

function crearRegistro(nombreTabla, registro, usuario) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName(nombreTabla);
  const encabezadosReales = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];

  registro.id = generarId();
  registro.creado_por = usuario;
  registro.creado_fecha = new Date().toISOString();
  if (encabezadosReales.indexOf('modificado_por') !== -1) {
    registro.modificado_por = '';
    registro.modificado_fecha = '';
  }

  const fila = encabezadosReales.map(function (campo) {
    return registro[campo] !== undefined ? registro[campo] : '';
  });
  hoja.appendRow(fila);
  return { ok: true, id: registro.id };
}

/**
 * Lee un registro completo por su id, directo desde el Sheet — se usa antes
 * de replicar, para tener el valor actual de "Replicado_a" y no duplicar.
 */
function obtenerRegistroPorId(nombreTabla, id) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName(nombreTabla);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos.shift();
  const idCol = encabezados.indexOf('id');
  for (let i = 0; i < datos.length; i++) {
    if (datos[i][idCol] === id) {
      const obj = {};
      encabezados.forEach(function (h, j) { obj[h] = datos[i][j]; });
      return obj;
    }
  }
  return null;
}

function actualizarRegistro(nombreTabla, registro, usuario) {
  if (!registro.id) throw new Error('Falta el id del registro a actualizar');
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName(nombreTabla);
  const encabezadosReales = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const idCol = encabezadosReales.indexOf('id');
  const datos = hoja.getDataRange().getValues();

  for (let fila = 1; fila < datos.length; fila++) {
    if (datos[fila][idCol] === registro.id) {
      registro.modificado_por = usuario;
      registro.modificado_fecha = new Date().toISOString();
      encabezadosReales.forEach(function (campo, col) {
        if (registro[campo] !== undefined && campo !== 'id' &&
            campo !== 'creado_por' && campo !== 'creado_fecha') {
          hoja.getRange(fila + 1, col + 1).setValue(registro[campo]);
        }
      });
      return { ok: true, id: registro.id };
    }
  }
  throw new Error('No se encontró el registro con id ' + registro.id);
}

/**
 * Elimina un registro por su id. Irreversible — el frontend debe confirmar
 * con el usuario antes de llamar a esto.
 */
function eliminarRegistro(nombreTabla, id) {
  if (!id) throw new Error('Falta el id del registro a eliminar');
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const hoja = ss.getSheetByName(nombreTabla);
  const encabezadosReales = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const idCol = encabezadosReales.indexOf('id');
  const datos = hoja.getDataRange().getValues();

  for (let fila = 1; fila < datos.length; fila++) {
    if (datos[fila][idCol] === id) {
      hoja.deleteRow(fila + 1);
      return { ok: true, id: id };
    }
  }
  throw new Error('No se encontró el registro con id ' + id);
}

/**
 * PANEL DE CONTROL — resumen periódico por correo (frecuencia configurada en el activador de Apps Script).
 *
 * Para activarlo (una vez):
 * 1. En el editor de Apps Script, ícono de reloj ⏰ (Activadores) a la izquierda
 * 2. + Añadir activador
 * 3. Función a ejecutar: enviarResumenSemanal
 * 4. Origen del evento: Basado en tiempo
 * 5. Tipo de activador basado en tiempo: el que prefieras (Carlos lo dejó como Temporizador mensual)
 * 6. Elige día/fecha y hora dentro del formulario de Apps Script
 * 7. Guardar (te pedirá autorizar el envío de correos la primera vez)
 */
function enviarResumenSemanal() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const destinatarios = ['cbraun@senercom.cl', 'contacto@senercom.cl'];

  // Refresca el Panel de Monitoreo (FOR-SGC-004) automáticamente antes de
  // armar el correo, para que el mes en curso siempre tenga datos frescos
  // sin depender de que alguien haya entrado a la PWA a actualizar antes del
  // lunes. Si el archivo externo falla (permisos, columna del mes no creada
  // aún, etc.), no se detiene el resto del correo — solo esa sección queda
  // con el aviso de que no se pudo actualizar.
  let monitoreoActualizadoOk = true;
  let monitoreoErrorMsg = '';
  try {
    extraerMonitoreoSGC004();
  } catch (errMon) {
    monitoreoActualizadoOk = false;
    monitoreoErrorMsg = errMon.message;
  }

  function leerMonitoreados(nombreTabla) {
    const hoja = ss.getSheetByName(nombreTabla);
    const datos = hoja.getDataRange().getValues();
    const encabezados = datos.shift();
    return datos
      .map(function (fila) {
        const obj = {};
        encabezados.forEach(function (h, i) { obj[h] = fila[i]; });
        return obj;
      })
      .filter(function (r) { return r['Monitorear en Panel de Control'] === 'Sí'; });
  }

  const riesgos = leerMonitoreados('Riesgos_Oportunidades');
  const bsc = leerMonitoreados('Balance_Scorecard');
  const compromisos = leerMonitoreados('Compromisos_Medidas');
  const hoy = new Date();
  const compromisosVencidos = compromisos.filter(function (r) {
    if (r['Estado'] === 'OK' || r['Estado'] === 'Cumplido') return false;
    const f = new Date(r['Fecha compromiso']);
    return !isNaN(f) && f < hoy;
  });
  const hallazgosHoja = ss.getSheetByName('Hallazgos');
  const hallazgosDatos = hallazgosHoja.getDataRange().getValues();
  const hallazgosEncabezados = hallazgosDatos.shift();
  const hallazgosPendientes = hallazgosDatos
    .map(function (fila) {
      const obj = {};
      hallazgosEncabezados.forEach(function (h, i) { obj[h] = fila[i]; });
      return obj;
    })
    .filter(function (r) { return !r['¿Aplica a evaluación profunda (FOR-SGC-001)?']; });

  const alertas = riesgos.filter(function (r) {
    return r['Nivel'] === 'Crítico' || r['Nivel'] === 'Alto' || r['Estado'] === 'Vencido';
  });

  // --- Puntos no cumplidos del Panel de Monitoreo (FOR-SGC-004) ---
  // Se lee directo desde Monitoreo_SGC004, que acaba de refrescarse arriba.
  const mesesEsCorreo = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  const ahoraCorreo = new Date();
  const mesActualTextoCorreo = mesesEsCorreo[ahoraCorreo.getMonth()] + '-' + String(ahoraCorreo.getFullYear()).slice(2);
  const monitoreoHoja = ss.getSheetByName('Monitoreo_SGC004');
  const monitoreoDatos = monitoreoHoja.getDataRange().getValues();
  const monitoreoEncabezados = monitoreoDatos.shift();
  const monitoreoRegistros = monitoreoDatos.map(function (fila) {
    const obj = {};
    monitoreoEncabezados.forEach(function (h, i) { obj[h] = fila[i]; });
    return obj;
  });
  const monitoreoDelMes = monitoreoRegistros.filter(function (r) { return r['Mes'] === mesActualTextoCorreo; });
  const monitoreoNoCumplidos = monitoreoDelMes.filter(function (r) { return esValorNoCumplido(r['Cumplimiento mes']); });

  let html = '<div style="font-family:Arial,sans-serif; max-width:640px;">';
  html += '<h2 style="color:#003B49;">Panel de Control — Gestión Integrada ISO</h2>';
  html += '<p style="color:#555;">Resumen automático — ' + new Date().toLocaleDateString('es-CL') + '</p>';

  html += '<h3 style="color:#CF4520;">Panel de Monitoreo — puntos no cumplidos este mes (' + monitoreoNoCumplidos.length + ')</h3>';
  if (!monitoreoActualizadoOk) {
    html += '<p style="color:#B93B1A;">No se pudo actualizar el Panel de Monitoreo automáticamente antes de enviar este correo (' + monitoreoErrorMsg + '). Los datos mostrados abajo pueden estar desactualizados — revisa manualmente en Generar Informe → Actualizar todas las fuentes.</p>';
  } else if (!monitoreoDelMes.length) {
    html += '<p style="color:#8A5A2A;">Sin snapshot para ' + mesActualTextoCorreo + ' — revisa que la columna del mes exista en el archivo FOR-SGC-004.</p>';
  } else if (!monitoreoNoCumplidos.length) {
    html += '<p style="color:#2C6E45;">Sin puntos marcados "no" este mes.</p>';
  } else {
    monitoreoNoCumplidos.forEach(function (r) {
      html += '<p style="margin:4px 0; padding:8px; background:#FBEAE5; border-radius:6px;">' +
        '<strong>N°' + (r['Num'] || '-') + ' — ' + (r['Objetivo'] || '') + '</strong><br>' +
        'Origen: ' + (r['Origen'] || '-') + ' · Responsable: ' + (r['Responsable'] || '-') + ' · Plazo: ' + (r['Plazo'] || '-') +
        '</p>';
    });
  }

  html += '<h3 style="color:#CF4520;">Riesgos y Oportunidades en alerta (' + alertas.length + ')</h3>';
  if (!alertas.length) {
    html += '<p style="color:#2C6E45;">Sin alertas esta semana.</p>';
  } else {
    alertas.forEach(function (r) {
      html += '<p style="margin:4px 0; padding:8px; background:#FBEAE5; border-radius:6px;">' +
        '<strong>' + (r['Descripción'] || '') + '</strong><br>' +
        'Nivel: ' + (r['Nivel'] || '-') + ' · Estado: ' + (r['Estado'] || '-') +
        ' · Responsable: ' + (r['Responsable'] || '-') + ' · Plazo: ' + (r['Plazo'] || '-') +
        (r['Acción'] ? '<br>Acción definida: ' + r['Acción'] : '') +
        '</p>';
    });
  }

  html += '<h3 style="color:#8A5A2A;">Hallazgos sin evaluar (' + hallazgosPendientes.length + ')</h3>';
  if (!hallazgosPendientes.length) {
    html += '<p style="color:#2C6E45;">Sin hallazgos pendientes.</p>';
  } else {
    hallazgosPendientes.forEach(function (r) {
      html += '<p style="margin:4px 0; padding:8px; background:#F0E4D8; border-radius:6px;">' +
        '<strong>' + (r['Descripción del hallazgo'] || '') + '</strong><br>' +
        (r['Lugar / Obra'] || '-') + ' · ' + (r['Fecha'] || '-') + ' · Capturado por: ' + (r['Capturado por'] || '-') +
        '</p>';
    });
  }

  html += '<h3 style="color:#CF4520;">Compromisos y Medidas vencidos (' + compromisosVencidos.length + ')</h3>';
  if (!compromisosVencidos.length) {
    html += '<p style="color:#2C6E45;">Sin compromisos vencidos.</p>';
  } else {
    compromisosVencidos.forEach(function (r) {
      html += '<p style="margin:4px 0; padding:8px; background:#FBEAE5; border-radius:6px;">' +
        '<strong>' + (r['Compromiso'] || '') + '</strong><br>' +
        'Responsable: ' + (r['Responsable'] || '-') + ' · Fecha comprometida: ' + (r['Fecha compromiso'] || '-') +
        ' · Estado: ' + (r['Estado'] || '-') +
        '</p>';
    });
  }

  html += '<h3 style="color:#0A5568;">Balance Scorecard monitoreado (' + bsc.length + ')</h3>';
  if (!bsc.length) {
    html += '<p>Sin objetivos marcados para monitoreo.</p>';
  } else {
    bsc.forEach(function (r) {
      html += '<p style="margin:4px 0; padding:8px; background:#EAF1F1; border-radius:6px;">' +
        '<strong>' + (r['Objetivo general'] || '') + '</strong><br>' +
        (r['Ámbito'] || '') + ' · Meta: ' + (r['Meta'] || '-') +
        '</p>';
    });
  }

  html += '<p style="color:#999; font-size:12px; margin-top:20px;">Este correo se generó automáticamente desde la PWA de Gestión Integrada ISO. Para ver el detalle completo, entra al Panel de Control en la aplicación.</p>';
  html += '</div>';

  MailApp.sendEmail({
    to: destinatarios.join(','),
    subject: 'Panel de Control ISO — Resumen (' + alertas.length + ' alertas)',
    htmlBody: html
  });
}
