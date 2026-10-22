// --- CENTRALIZACIÓN EN RED LOCAL (MIDDLEWARE DE LOCALSTORAGE) ---
(function() {
    const originalGetItem = localStorage.getItem;
    const originalSetItem = localStorage.setItem;

    window.dbCache = {};

    window.syncDatabaseWithServer = async function() {
        try {
            const res = await fetch('/api/load');
            const db = await res.json();
            
            window.dbCache['ecomeq_users'] = JSON.stringify(db.users);
            window.dbCache['ecomeq_reports'] = JSON.stringify(db.reports);
            window.dbCache['ecomeq_incidents'] = JSON.stringify(db.incidents);
            window.dbCache['ecomeq_inspections'] = JSON.stringify(db.inspections);
            window.dbCache['ecomeq_notifications'] = JSON.stringify(db.notifications);
            window.dbCache['ecomeq_courses'] = JSON.stringify(db.courses);
            window.dbCache['ecomeq_resource_readings'] = JSON.stringify(db.resources);
            window.dbCache['ecomeq_resource_goals'] = JSON.stringify(db.goals);
            window.dbCache['ecomeq_custom_sds'] = JSON.stringify(db.customSds);
            window.dbCache['ecomeq_calendar_events'] = JSON.stringify(db.calendar);
            window.dbCache['ecomeq_disposal_rates'] = JSON.stringify(db.rates);
            
            if (db.trainings) {
                Object.keys(db.trainings).forEach(email => {
                    window.dbCache[`trainings_${email}`] = JSON.stringify(db.trainings[email]);
                });
            }
        } catch (e) {
            console.error("Error sincronizando base de datos con el servidor:", e);
        }
    };

    // Registrar el Service Worker para soporte PWA (Escritorio y Móvil)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker de Ecomeq registrado con éxito.'))
                .catch(err => console.error('Error registrando el Service Worker de Ecomeq:', err));
        });
    }

    localStorage.getItem = function(key) {
        if ((key.startsWith('ecomeq_') && key !== 'ecomeq_session') || key.startsWith('trainings_')) {
            if (window.dbCache.hasOwnProperty(key)) {
                return window.dbCache[key];
            }
            return originalGetItem.call(localStorage, key);
        }
        return originalGetItem.call(localStorage, key);
    };

    localStorage.setItem = function(key, value) {
        if ((key.startsWith('ecomeq_') && key !== 'ecomeq_session') || key.startsWith('trainings_')) {
            window.dbCache[key] = value;
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: key, data: JSON.parse(value) })
            }).catch(err => console.error(`Error guardando ${key} en servidor:`, err));
        } else {
            originalSetItem.call(localStorage, key, value);
        }
    };
})();

/* ==========================================================================
   BASE DE DATOS SIMULADA Y DATOS SEMILLA INICIALES
   ========================================================================== */
const DEFAULT_USERS = [
    {
        email: "admin@ecomeq.com",
        password: "admin123",
        name: "Laura Martínez",
        role: "Coordinador",
        area: "Medio Ambiente"
    },
    {
        email: "operador@ecomeq.com",
        password: "operador123",
        name: "Carlos Gómez - Jefe de Producción",
        role: "Jefe de Área",
        area: "Producción"
    }
];

// Funciones auxiliares para verificar el rol del usuario (soporta migraciones y mayúsculas/minúsculas)
function isJefeDeArea(user) {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r === 'jefe de área' || r === 'jefe de area' || r === 'operador';
}

function isCoordinador(user) {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r === 'coordinador' || r === 'admin' || r === 'administrador';
}

const SEED_REPORTS = [
    // Reportes del año 2025 (Histórico)
    { id: "rep-2025-01", datetime: "2025-01-15T08:00", area: "Producción", bodega: "Bodega 1 (Principal)", wasteName: "Aceite de motor usado", weight: 95.0, type: "Hidrocarburos", corriente: "Y8", physicalState: "Líquido", operator: "Carlos Gómez", observations: "Lotes anuales de mantenimiento.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0012", collectedDate: "2025-01-20T14:00" },
    { id: "rep-2025-02", datetime: "2025-02-18T09:30", area: "Laboratorio", bodega: "Bodega 2 (Auxiliar)", wasteName: "Descarte de ácido nítrico", weight: 42.0, type: "Ácidos", corriente: "Y34", physicalState: "Líquido", operator: "Doris Quiroga", observations: "Limpieza semestral.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0028", collectedDate: "2025-02-22T10:00" },
    { id: "rep-2025-03", datetime: "2025-03-24T14:00", area: "Mantenimiento", bodega: "Centro de acopio", wasteName: "EPPs impregnados con grasa", weight: 35.5, type: "Sólidos impregnados", corriente: "A4130", physicalState: "Sólido", operator: "Juan Pérez", observations: "Trapos de mantenimiento general.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0044", collectedDate: "2025-03-28T16:00" },
    { id: "rep-2025-04", datetime: "2025-05-10T11:00", area: "Logística", bodega: "Shut de RESPEL", wasteName: "Envases de reactivos vacíos", weight: 58.0, type: "Envases contaminados", corriente: "A4130", physicalState: "Sólido", operator: "Marcos Sierra", observations: "Tambores plásticos.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0078", collectedDate: "2025-05-15T11:00" },
    { id: "rep-2025-05", datetime: "2025-08-12T10:00", area: "Producción", bodega: "Bodega 1 (Principal)", wasteName: "Lodos aceitosos", weight: 120.0, type: "Hidrocarburos", corriente: "Y9", physicalState: "Lodo", operator: "Carlos Gómez", observations: "Aceites usados.", status: "collected", collectedBy: "Ecológica", manifest: "MAN-2025-0134", collectedDate: "2025-08-16T09:00" },
    { id: "rep-2025-06", datetime: "2025-10-05T09:00", area: "Laboratorio", bodega: "Bodega 2 (Auxiliar)", wasteName: "Soda cáustica gastada", weight: 28.0, type: "Básicos", corriente: "Y35", physicalState: "Líquido", operator: "Doris Quiroga", observations: "Desechos alcalinos.", status: "collected", collectedBy: "Ecológica", manifest: "MAN-2025-0189", collectedDate: "2025-10-10T12:00" },
    { id: "rep-2025-07", datetime: "2025-12-19T15:30", area: "Oficinas", bodega: "Shut de RESPEL", wasteName: "Tubos de luz mercuriales", weight: 18.0, type: "Luminarias", corriente: "Y29", physicalState: "Sólido", operator: "Sofía Castro", observations: "Recambio de fin de año.", status: "collected", collectedBy: "Ecológica", manifest: "MAN-2025-0230", collectedDate: "2025-12-23T11:00" },
    
    // Reportes del año 2026
    { id: "rep-001", datetime: "2026-01-10T10:15", area: "Producción", bodega: "Centro de acopio", wasteName: "Aceite de motor usado", weight: 75.0, type: "Hidrocarburos", corriente: "Y8", physicalState: "Líquido", operator: "Carlos Gómez", observations: "Aceites de motor quemados.", status: "collected", collectedBy: "Lito S.A.", manifest: "MAN-2026-0001", collectedDate: "2026-01-15T15:30" },
    { id: "rep-002", datetime: "2026-02-12T14:30", area: "Mantenimiento", bodega: "Shut de RESPEL", wasteName: "Estopas impregnadas con solventes", weight: 45.0, type: "Sólidos impregnados", corriente: "A4130", physicalState: "Sólido", operator: "Juan Pérez", observations: "Bolsa roja de trapos con solventes.", status: "collected", collectedBy: "Lito S.A.", manifest: "MAN-2026-0015", collectedDate: "2026-02-16T15:30" },
    { id: "rep-003", datetime: "2026-03-05T09:00", area: "Laboratorio", bodega: "Bodega 2 (Auxiliar)", wasteName: "Solución de ácido sulfúrico", weight: 22.0, type: "Ácidos", corriente: "Y34", physicalState: "Líquido", operator: "Doris Quiroga", observations: "Descartes de reactivos de control de calidad.", status: "collected", collectedBy: "Lito S.A.", manifest: "MAN-2026-0024", collectedDate: "2026-03-10T15:30" },
    { id: "rep-004", datetime: "2026-04-18T11:45", area: "Producción", bodega: "Bodega 1 (Principal)", wasteName: "Aceite hidráulico quemado", weight: 110.0, type: "Hidrocarburos", corriente: "Y8", physicalState: "Líquido", operator: "Carlos Gómez", observations: "Lubricantes usados cambio de máquina A.", status: "collected", collectedBy: "Lito S.A.", manifest: "MAN-2026-0038", collectedDate: "2026-04-22T15:30" },
    { id: "rep-005", datetime: "2026-05-12T08:30", area: "Laboratorio", bodega: "Bodega 2 (Auxiliar)", wasteName: "Solución alcalina de lavado", weight: 35.0, type: "Básicos", corriente: "Y35", physicalState: "Líquido", operator: "Doris Quiroga", observations: "Soluciones alcalinas agotadas.", status: "collected", collectedBy: "Lito S.A.", manifest: "MAN-2026-0052", collectedDate: "2026-05-15T15:30" },
    { id: "rep-006", datetime: "2026-05-24T16:00", area: "Logística", bodega: "Shut de RESPEL", wasteName: "Galones plásticos contaminados", weight: 54.0, type: "Envases contaminados", corriente: "A4130", physicalState: "Sólido", operator: "Marcos Sierra", observations: "Canecas de reactivos químicos vacías.", status: "collected", collectedBy: "Lito S.A.", manifest: "MAN-2026-0052", collectedDate: "2026-05-15T15:30" },
    { id: "rep-007", datetime: "2026-05-28T10:00", area: "Oficinas", bodega: "Shut de RESPEL", wasteName: "Tubos fluorescentes rotos", weight: 12.0, type: "Luminarias", corriente: "Y29", physicalState: "Sólido", operator: "Sofía Castro", observations: "Tubos fluorescentes descartados.", status: "stored" },
    { id: "rep-008", datetime: "2026-06-01T11:20", area: "Mantenimiento", bodega: "Centro de acopio", wasteName: "Filtros de aceite usados", weight: 28.5, type: "Hidrocarburos", corriente: "Y9", physicalState: "Sólido", operator: "Juan Pérez", observations: "Filtros de aceite y estopas usadas.", status: "stored" },
    { id: "rep-009", datetime: "2026-06-02T15:45", area: "Producción", bodega: "Bodega 1 (Principal)", wasteName: "Aceite de transmisiones usado", weight: 88.0, type: "Hidrocarburos", corriente: "Y8", physicalState: "Líquido", operator: "Carlos Gómez", observations: "Aceites de transmisiones de engranajes.", status: "stored" },
    { id: "rep-010", datetime: "2026-06-03T10:30", area: "Laboratorio", bodega: "Bodega 2 (Auxiliar)", wasteName: "Remanentes de reactivos ácidos", weight: 14.5, type: "Ácidos", corriente: "Y34", physicalState: "Líquido", operator: "Doris Quiroga", observations: "Remanentes de reactivos de análisis. pH < 1.5.", status: "stored" }
];

const COURSES_DATA = [
    {
        id: "course-1",
        category: "Presentación",
        title: "Clasificación de RESPEL: Hidrocarburos, Ácidos y Básicos (SGA)",
        desc: "Aprenda a identificar y segregar correctamente los residuos de acuerdo a su naturaleza de inflamabilidad o corrosividad siguiendo el Sistema Globalmente Armonizado.",
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        slides: [
            {
                title: "Introducción a los Residuos Peligrosos",
                content: `
                    <p>Un residuo peligroso (<strong>RESPEL</strong>) es aquel que, por sus características corrosivas, reactivas, explosivas, tóxicas, inflamables o biológico-infecciosas, puede causar daño a la salud humana o al medio ambiente.</p>
                    <p>En nuestra empresa, la clasificación básica obligatoria divide las corrientes líquidas y químicas principalmente en tres grupos:</p>
                    <ul>
                        <li><strong>Hidrocarburos:</strong> Aceites usados, grasas, combustibles y solventes orgánicos.</li>
                        <li><strong>Ácidos:</strong> Residuos líquidos con un pH menor a 2 (ácido clorhídrico, sulfúrico, nítrico).</li>
                        <li><strong>Básicos:</strong> Residuos líquidos con un pH mayor a 12 (hidróxido de sodio, potasa cáustica).</li>
                    </ul>
                `
            },
            {
                title: "Identificación según SGA",
                content: `
                    <p>El Sistema Globalmente Armonizado (SGA) exige etiquetar cada recipiente contenedor de RESPEL con sus pictogramas correspondientes:</p>
                    <ul>
                        <li><strong>Llamas (Inflamables):</strong> Aplica a Hidrocarburos. Mantener lejos de chispas y calor excesivo.</li>
                        <li><strong>Corrosión (Corrosivos):</strong> Aplica a Ácidos y Básicos. Causa quemaduras graves en piel y ojos.</li>
                        <li><strong>Signo de Exclamación / Calavera:</strong> Tóxicos por inhalación o contacto.</li>
                    </ul>
                    <div class="slide-highlight-card">
                        <p>⚠️ IMPORTANTE: Nunca mezcle ácidos con básicos. La reacción es violenta (neutralización exotérmica) liberando gases tóxicos y altas temperaturas.</p>
                    </div>
                `
            },
            {
                title: "Normas de Segregación en Ecomeq",
                content: `
                    <p>Al hacer entrega de residuos en el centro de almacenamiento:</p>
                    <ul>
                        <li>Los <strong>Hidrocarburos</strong> se almacenan en el dique de contención verde, en bidones plásticos.</li>
                        <li>Los <strong>Ácidos</strong> se ubican sobre estibas antiderrame independientes etiquetadas con color rojo.</li>
                        <li>Los <strong>Básicos</strong> se colocan en estibas antiderrame independientes con etiqueta azul.</li>
                    </ul>
                    <p>Cada entrega debe pesarse de manera exacta y ser reportada a través del sistema inmediatamente.</p>
                `
            }
        ],
        quiz: [
            {
                question: "¿Cuál es el riesgo principal de mezclar residuos Ácidos con Básicos?",
                options: [
                    "No ocurre nada, se neutralizan pacíficamente.",
                    "Se genera una reacción exotérmica violenta con posible emisión de vapores tóxicos.",
                    "Los residuos se evaporan por completo."
                ],
                answer: 1
            },
            {
                question: "¿Qué pictograma del SGA corresponde típicamente a los Hidrocarburos?",
                options: [
                    "Calavera y tibias cruzadas",
                    "Signo de exclamación de peligro genérico",
                    "Llama de sustancia inflamable"
                ],
                answer: 2
            },
            {
                question: "¿Cuál es el pH característico de un residuo químico Básico o Alcalino?",
                options: [
                    "pH menor a 2",
                    "pH neutral (exactamente 7)",
                    "pH mayor a 12"
                ],
                answer: 2
            }
        ]
    },
    {
        id: "course-2",
        category: "Sensibilización",
        title: "Manejo Seguro de Sustancias Químicas Corrosivas e Inflamables",
        desc: "Protocolos operativos estándar para la manipulación, trasvase y almacenamiento temporal de ácidos, bases e hidrocarburos.",
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><circle cx="12" cy="17" r="1"></circle></svg>',
        slides: [
            {
                title: "Riesgos de Corrosivos e Inflamables",
                content: `
                    <p>Las sustancias químicas peligrosas con las que trabajamos a diario requieren medidas de protección específicas:</p>
                    <ul>
                        <li><strong>Sustancias Corrosivas (Ácidos y Bases):</strong> Tienen el potencial de destruir tejidos vivos o materiales metálicos. Sus vapores pueden lesionar las vías respiratorias.</li>
                        <li><strong>Sustancias Inflamables (Hidrocarburos):</strong> Tienen un punto de inflamación bajo y pueden arder con facilidad. Los vapores acumulados en espacios cerrados representan riesgo de explosión.</li>
                    </ul>
                `
            },
            {
                title: "Equipo de Protección Personal (EPP) Obligatorio",
                content: `
                    <p>Durante la manipulación y entrega de estos residuos al almacén, es estrictamente obligatorio vestir:</p>
                    <ul>
                        <li>Gafas de seguridad de montura hermética (monogafas).</li>
                        <li>Guantes de nitrilo de caña larga (resistentes a químicos).</li>
                        <li>Peto o delantal de PVC/neopreno (para corrosivos).</li>
                        <li>Botas de seguridad con suela antideslizante y puntera reforzada.</li>
                    </ul>
                `
            },
            {
                title: "Procedimiento de Manipulación Segura",
                content: `
                    <p>1. Verifique que los envases no tengan fisuras ni fugas antes de moverlos.<br>
                    2. Use siempre embudos adecuados para evitar derrames durante el llenado.<br>
                    3. No llene los recipientes a más del 90% de su capacidad para permitir la expansión de gases.<br>
                    4. Mantenga el área ventilada constantemente.</p>
                    <div class="slide-highlight-card">
                        <p>💡 TIP: En caso de contacto con la piel por ácido o base, acuda inmediatamente a la ducha de emergencia y lave con abundante agua durante 15 minutos.</p>
                    </div>
                `
            }
        ],
        quiz: [
            {
                question: "¿A qué capacidad máxima se deben llenar los recipientes de RESPEL líquidos?",
                options: [
                    "Al 100% para aprovechar el envase.",
                    "Máximo al 90% de su capacidad para evitar sobrepresiones.",
                    "A la mitad de su capacidad únicamente."
                ],
                answer: 1
            },
            {
                question: "¿Qué elemento de protección visual es obligatorio al manipular químicos corrosivos?",
                options: [
                    "Gafas cosméticas de sol.",
                    "Monogafas herméticas de protección química.",
                    "Ninguna, con cerrar los ojos un poco basta."
                ],
                answer: 1
            }
        ]
    },
    {
        id: "course-3",
        category: "Sensibilización",
        title: "Uso de Kit de Derrames y Emergencias Químicas",
        desc: "Instrucciones paso a paso para el control y contención de fugas accidentales de hidrocarburos, ácidos o sustancias básicas.",
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        slides: [
            {
                title: "Identificación del Derrame",
                content: `
                    <p>Ante un derrame accidental de RESPEL, mantenga la calma y siga el protocolo general de las 3 'C':</p>
                    <ul>
                        <li><strong>Controlar:</strong> Detener la fuente del derrame (levantar un bidón caído, cerrar una válvula).</li>
                        <li><strong>Contener:</strong> Limitar la extensión del líquido para evitar que llegue a alcantarillas o suelo natural.</li>
                        <li><strong>Colectar:</strong> Absorber y depositar en bolsas rojas los residuos del material absorbente.</li>
                    </ul>
                `
            },
            {
                title: "Contenido del Kit de Derrames Ecomeq",
                content: `
                    <p>Nuestras estaciones de trabajo cuentan con Kits de Derrame que contienen:</p>
                    <ul>
                        <li><strong>Cordones absorbentes (salchichas):</strong> Para delimitar y cercar el derrame.</li>
                        <li><strong>Hojas absorbentes:</strong> Para colocar directamente sobre el charco de líquido.</li>
                        <li><strong>Neutralizantes químicos:</strong> Polvo neutralizante de ácidos (color rosa cambia a amarillo) y básico.</li>
                        <li><strong>Pala y escoba antiestáticas:</strong> Evitan chispas en derrames de hidrocarburo.</li>
                        <li><strong>Bolsas rojas y bridas:</strong> Para la disposición final de los absorbentes contaminados.</li>
                    </ul>
                `
            },
            {
                title: "Limpieza y Reporte",
                content: `
                    <p>Una vez absorbido el derrame:</p>
                    <p>1. Recoja todos los absorbentes saturados con la pala de plástico.<br>
                    2. Introdúzcalos en las bolsas rojas de seguridad.<br>
                    3. Selle la bolsa con una brida y etiquétela como "Sólidos Impregnados".<br>
                    4. Genere el reporte en esta aplicación para registrar el peso recolectado.<br>
                    5. Reporte al Coordinador Ambiental para reponer los materiales del Kit.</p>
                `
            }
        ],
        quiz: [
            {
                question: "¿Cuál es el primer paso ante un derrame si la fuente aún está activa?",
                options: [
                    "Llamar a la empresa recolectora externa.",
                    "Controlar la fuente para detener la fuga si es seguro hacerlo.",
                    "Limpiar el suelo antes de levantar el envase."
                ],
                answer: 1
            },
            {
                question: "¿Dónde se deben depositar los absorbentes contaminados usados en el derrame?",
                options: [
                    "En la basura común de la oficina.",
                    "En las bolsas rojas del kit, rotulados como RESPEL de Sólidos Impregnados.",
                    "Se deben lavar y exprimir en la alcantarilla."
                ],
                answer: 1
            }
        ]
    },
    {
        id: "course-4",
        category: "Infografía",
        title: "Plan de Gestión Integral de RESPEL (PGIR)",
        desc: "Conozca los lineamientos corporativos, metas de reducción, almacenamiento y la disposición final certificada por gestores ambientales.",
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        slides: [
            {
                title: "Ciclo del RESPEL en Ecomeq",
                content: `
                    <p>El Plan de Gestión Integral de Residuos (PGIR) define los pasos legales y operativos de la compañía:</p>
                    <p>1. <strong>Generación y Reporte:</strong> Las áreas operativas pesan y registran su RESPEL diariamente.<br>
                    2. <strong>Almacenamiento Temporal:</strong> El residuo se almacena en el depósito central bajo condiciones controladas (ventilación, contención de derrames, rotulado SGA).<br>
                    3. <strong>Retiro Semanal:</strong> Todos los viernes, una empresa externa licenciada recoge los residuos acumulados.<br>
                    4. <strong>Disposición Final:</strong> La empresa gestora emite un Manifiesto de Carga y, posteriormente, un Certificado de Incineración, Celdas de Seguridad o Co-procesamiento.</p>
                `
            },
            {
                title: "Responsabilidades Clave",
                content: `
                    <ul>
                        <li><strong>Operadores de Área:</strong> Segregar en la fuente, empacar de forma segura, rotular con el SGA e ingresar el registro en el sistema con el peso neto exacto.</li>
                        <li><strong>Coordinador Ambiental (Admin):</strong> Consolidar inventarios, coordinar las recolecciones semanales con la empresa gestora, revisar que los manifiestos coincidan con lo despachado y archivar certificados de disposición final.</li>
                    </ul>
                `
            }
        ],
        quiz: [
            {
                question: "¿Qué documento legal emite la empresa gestora que certifica la recolección inicial de los residuos?",
                options: [
                    "Una factura común.",
                    "Un Manifiesto de Carga o Acta de Recolección.",
                    "Un diploma ambiental."
                ],
                answer: 1
            },
            {
                question: "¿Con qué frecuencia se realiza el retiro de RESPEL por parte de la empresa externa?",
                options: [
                    "Diaria",
                    "Mensual",
                    "Semanal (generalmente los viernes)"
                ],
                answer: 2
            }
        ]
    }
];

/* ==========================================================================
   GESTIÓN DEL ESTADO DE LA APLICACIÓN
   ========================================================================== */
let state = {
    currentUser: null,
    reports: [],
    incidents: [],
    trainings: {},
    selectedReportIds: [],
    currentView: 'dashboard',
    activeCourse: null,
    activeSlideIdx: 0,
    editingSdsId: null, // ID de la FDS que se está editando
    activeCourseFilter: 'All' // Filtro activo para el catálogo de capacitaciones
};

/* ==========================================================================
   TARIFAS DE DISPOSICIÓN Y UTILIDADES FINANCIERAS
   ========================================================================== */
let DISPOSAL_RATES = JSON.parse(localStorage.getItem("ecomeq_disposal_rates")) || {
    'Hidrocarburos': 1200,
    'Ácidos': 3500,
    'Básicos': 3000,
    'Envases contaminados': 1800,
    'Sólidos impregnados': 2200,
    'Luminarias': 4500
};


function formatCurrency(value) {
    return `$${Math.round(value).toLocaleString('es-CO')}`;
}

function calculateDisposalCost(type, weight) {
    const rate = DISPOSAL_RATES[type] || 0;
    return rate * parseFloat(weight);
}


/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    await window.syncDatabaseWithServer();
    initDatabase();
    checkActiveSession();
    registerEventListeners();
    updateDateDisplay();

    // Iniciar polling de sincronización en tiempo real cada 5 segundos
    setInterval(async () => {
        const activeSession = localStorage.getItem("ecomeq_session");
        if (activeSession) {
            await window.syncDatabaseWithServer();
            
            if (typeof state !== 'undefined') {
                state.reports = JSON.parse(localStorage.getItem("ecomeq_reports")) || [];
                state.incidents = JSON.parse(localStorage.getItem("ecomeq_incidents")) || [];
                state.courses = JSON.parse(localStorage.getItem("ecomeq_courses")) || COURSES_DATA;
                state.customSds = JSON.parse(localStorage.getItem("ecomeq_custom_sds")) || [];
                state.notifications = JSON.parse(localStorage.getItem("ecomeq_notifications")) || [];
                state.calendarEvents = JSON.parse(localStorage.getItem("ecomeq_calendar_events")) || [];
                
                // Actualizar vistas en tiempo real si están activas
                renderNotifications();
                
                if (state.currentView === 'dashboard') {
                    renderDashboard();
                } else if (state.currentView === 'reports') {
                    renderReportsTable();
                } else if (state.currentView === 'incidents') {
                    renderIncidentsTable();
                } else if (state.currentView === 'calendar') {
                    renderCalendar();
                }
            }
        }
    }, 5000);
});

// Sembrar bases de datos en localStorage si no existen
function initDatabase() {
    if (!localStorage.getItem("ecomeq_disposal_rates")) {
        localStorage.setItem("ecomeq_disposal_rates", JSON.stringify(DISPOSAL_RATES));
    }
    if (!localStorage.getItem("ecomeq_users")) {
        localStorage.setItem("ecomeq_users", JSON.stringify(DEFAULT_USERS));
    } else {
        // Migración de roles si es necesario (Operador -> Jefe de Área)
        let users = JSON.parse(localStorage.getItem("ecomeq_users"));
        let updated = false;
        users = users.map(u => {
            if (u.role === 'Operador') {
                u.role = 'Jefe de Área';
                u.name = u.name === 'Carlos Gómez' ? 'Carlos Gómez - Jefe de Producción' : u.name;
                updated = true;
            }
            return u;
        });
        if (updated) {
            localStorage.setItem("ecomeq_users", JSON.stringify(users));
        }
    }
    if (!localStorage.getItem("ecomeq_reports")) {
        localStorage.setItem("ecomeq_reports", JSON.stringify(SEED_REPORTS));
    }
    
    const SEED_INCIDENTS = [
        { id: "inc-1", datetime: "2026-04-12T09:15", area: "Mantenimiento", substance: "Hidrocarburos", volume: 15.0, kitUsed: "Sí", status: "Controlado", operator: "Juan Pérez", desc: "Rotura de manguera de trasvase de aceite hidráulico usado.", action: "Se colocaron salchichas absorbentes del kit y arena. El aceite fue absorbido con hojas absorbentes y depositado en bolsa de RESPEL." },
        { id: "inc-2", datetime: "2026-05-02T11:00", area: "Laboratorio", substance: "Ácidos", volume: 3.5, kitUsed: "Sí", status: "Controlado", operator: "Doris Quiroga", desc: "Caída de frasco de ácido nítrico concentrado en mesón.", action: "Se aplicó neutralizante en polvo para ácidos (cambió de color indicando neutralización) y se limpió con estopa húmeda." },
        { id: "inc-3", datetime: "2026-05-20T16:30", area: "Producción", substance: "Básicos", volume: 8.0, kitUsed: "Sí", status: "Controlado", operator: "Carlos Gómez", desc: "Derrame menor de soda cáustica líquida por rebose de tanque de lavado.", action: "Se acordonó el área, se aplicó neutralizante básico y absorbente universal." }
    ];
    if (!localStorage.getItem("ecomeq_incidents")) {
        localStorage.setItem("ecomeq_incidents", JSON.stringify(SEED_INCIDENTS));
    }
    if (!localStorage.getItem("ecomeq_courses")) {
        localStorage.setItem("ecomeq_courses", JSON.stringify(COURSES_DATA));
    }

    // Datos semilla para monitoreo mensual de recursos (Energía y Agua)
    const SEED_RESOURCES = [
        { id: "res-1", month: "2025-10", production: 4800, energy_consumed: 7200, energy_generated: 1200, water_initial: 1000, water_final: 1180, water_photo: "", operator: "Laura Martínez" },
        { id: "res-2", month: "2025-11", production: 5000, energy_consumed: 7400, energy_generated: 1500, water_initial: 1180, water_final: 1380, water_photo: "", operator: "Laura Martínez" },
        { id: "res-3", month: "2025-12", production: 5200, energy_consumed: 7800, energy_generated: 1100, water_initial: 1380, water_final: 1600, water_photo: "", operator: "Laura Martínez" },
        { id: "res-4", month: "2026-01", production: 4500, energy_consumed: 6800, energy_generated: 1300, water_initial: 1600, water_final: 1790, water_photo: "", operator: "Laura Martínez" },
        { id: "res-5", month: "2026-02", production: 4600, energy_consumed: 6900, energy_generated: 1400, water_initial: 1790, water_final: 1970, water_photo: "", operator: "Carlos Gómez" },
        { id: "res-6", month: "2026-03", production: 4800, energy_consumed: 7000, energy_generated: 1600, water_initial: 1970, water_final: 2170, water_photo: "", operator: "Carlos Gómez" },
        { id: "res-7", month: "2026-04", production: 5000, energy_consumed: 7500, energy_generated: 1800, water_initial: 2170, water_final: 2410, water_photo: "", operator: "Carlos Gómez" },
        { id: "res-8", month: "2026-05", production: 5200, energy_consumed: 8000, energy_generated: 2000, water_initial: 2410, water_final: 2650, water_photo: "", operator: "Carlos Gómez" }
    ];
    if (!localStorage.getItem("ecomeq_resource_readings")) {
        localStorage.setItem("ecomeq_resource_readings", JSON.stringify(SEED_RESOURCES));
    }
    const DEFAULT_RESOURCE_GOALS = {
        energy_kpi_goal: 1.5,
        water_kpi_goal: 0.05
    };
    if (!localStorage.getItem("ecomeq_resource_goals")) {
        localStorage.setItem("ecomeq_resource_goals", JSON.stringify(DEFAULT_RESOURCE_GOALS));
    }
    initCalendarEvents();
}

function checkActiveSession() {
    const session = localStorage.getItem("ecomeq_session");
    if (session) {
        state.currentUser = JSON.parse(session);
        
        // Migración de sesión activa si tiene rol legado
        if (state.currentUser.role === 'Operador') {
            state.currentUser.role = 'Jefe de Área';
            localStorage.setItem("ecomeq_session", JSON.stringify(state.currentUser));
        }
        
        loadUserDataAndState();
        showAppShell();
    } else {
        showLoginScreen();
    }
}

function loadUserDataAndState() {
    // Cargar tarifas actualizadas de la base de datos central
    if (localStorage.getItem("ecomeq_disposal_rates")) {
        DISPOSAL_RATES = JSON.parse(localStorage.getItem("ecomeq_disposal_rates"));
    }
    // Cargar reportes, incidentes y cursos dinámicos del almacenamiento local
    state.reports = JSON.parse(localStorage.getItem("ecomeq_reports")) || [];
    
    // Migrar registros antiguos de "Jaula de RESPEL" a "Centro de acopio" en el almacenamiento local
    let reportsMigrated = false;
    state.reports = state.reports.map(r => {
        if (r.bodega === "Jaula de RESPEL") {
            r.bodega = "Centro de acopio";
            reportsMigrated = true;
        }
        return r;
    });
    if (reportsMigrated) {
        localStorage.setItem("ecomeq_reports", JSON.stringify(state.reports));
    }

    state.incidents = JSON.parse(localStorage.getItem("ecomeq_incidents")) || [];
    state.courses = JSON.parse(localStorage.getItem("ecomeq_courses")) || COURSES_DATA;
    // Cargar FDS personalizadas cargadas por el administrador
    state.customSds = JSON.parse(localStorage.getItem("ecomeq_custom_sds")) || [];
    
    // Cargar progreso de capacitación para este usuario específico
    const userKey = `trainings_${state.currentUser.email}`;
    state.trainings = JSON.parse(localStorage.getItem(userKey)) || {};
    
    // Si no hay progreso, inicializar el progreso de los cursos
    state.courses.forEach(c => {
        if (!state.trainings[c.id]) {
            state.trainings[c.id] = { status: "pending", score: 0 };
        }
    });
    localStorage.setItem(userKey, JSON.stringify(state.trainings));

    // Actualizar la interfaz de usuario del perfil
    document.getElementById("profile-name").textContent = state.currentUser.name;
    document.getElementById("profile-role").textContent = state.currentUser.role;
    
    // Avatar con iniciales
    const initials = state.currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase();
    document.getElementById("user-avatar-initials").textContent = initials;
    
    // Establecer el valor predeterminado del campo Nombre del Operador
    document.getElementById("report-operator").value = state.currentUser.name;

    // Aplicar cambios de diseño según los roles (Coordinador vs Jefe de Área)
    const appContainer = document.getElementById("app-container");
    const formCont = document.getElementById("inspection-form-container");
    const infoCont = document.getElementById("inspection-info-container");
    
    if (isJefeDeArea(state.currentUser)) {
        appContainer.classList.add("jefatura-mode");
        appContainer.classList.remove("coordinator-mode");
        if (formCont && infoCont) {
            formCont.style.display = "none";
            infoCont.style.display = "block";
        }
    } else {
        appContainer.classList.remove("jefatura-mode");
        appContainer.classList.add("coordinator-mode");
        if (formCont && infoCont) {
            formCont.style.display = "block";
            infoCont.style.display = "none";
        }
    }

    // Cargar lecturas y metas de recursos del almacenamiento local
    state.resourceReadings = JSON.parse(localStorage.getItem("ecomeq_resource_readings")) || [];
    state.resourceGoals = JSON.parse(localStorage.getItem("ecomeq_resource_goals")) || {
        energy_kpi_goal: 1.5,
        water_kpi_goal: 0.05
    };

    initNotifications();

    // Actualizar el Dashboard, la Tabla y la interfaz de Capacitaciones
    renderDashboard();
    renderHistoryTable();
    renderCoursesGrid();
    renderResourcesView();
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    document.getElementById("header-date").textContent = today.toLocaleDateString('es-ES', options);
    
    // Precompletar la fecha y hora del reporte con la hora local
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // desfase en milisegundos
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    document.getElementById("report-datetime").value = localISOTime;
}

/* ==========================================================================
   NAVEGACIÓN Y CAMBIO DE VISTAS
   ========================================================================== */
function registerEventListeners() {
    // Alternancia de la barra lateral (cajón de navegación móvil)
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    
    sidebarToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("mobile-open");
    });
    
    document.addEventListener("click", () => {
        sidebar.classList.remove("mobile-open");
    });

    sidebar.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    // Clics en los botones de navegación
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-target");
            switchView(target);
            sidebar.classList.remove("mobile-open");
        });
    });

    // Cerrar sesión
    document.getElementById("logout-btn").addEventListener("click", logout);

    // Envío del formulario de inicio de sesión
    document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);

    // Envío del formulario de reporte diario de RESPEL
    document.getElementById("report-respel-form").addEventListener("submit", handleReportSubmit);
    
    // Cambio en el tipo de residuo para actualizar la corriente correspondiente
    document.getElementById("report-type").addEventListener("change", handleReportTypeChange);

    // Envío del formulario de recolección (Admin)
    document.getElementById("collection-form").addEventListener("submit", handleCollectionSubmit);

    // Seleccionar todo en la tabla de historial
    document.getElementById("select-all-checkbox").addEventListener("change", handleTableSelectAllToggle);

    // Entradas de filtros
    document.getElementById("filter-search").addEventListener("input", renderHistoryTable);
    document.getElementById("filter-area").addEventListener("change", renderHistoryTable);
    document.getElementById("filter-type").addEventListener("change", renderHistoryTable);
    document.getElementById("filter-status").addEventListener("change", renderHistoryTable);

    // Entradas de análisis
    document.getElementById("analytics-year").addEventListener("change", renderAnalyticsView);
    document.getElementById("analytics-month").addEventListener("change", renderAnalyticsView);

    // Disparador del modal del selector de exportación
    const btnExport = document.getElementById("btn-export-csv");
    if (btnExport) {
        btnExport.addEventListener("click", () => openModal("modal-export-choice"));
    }

    // Envío del formulario de creación de curso (Admin)
    const courseCreateForm = document.getElementById("course-create-form");
    if (courseCreateForm) {
        courseCreateForm.addEventListener("submit", handleCourseCreateSubmit);
    }

    // Botones de navegación de diapositivas
    document.getElementById("btn-prev-slide").addEventListener("click", showPrevSlide);
    document.getElementById("btn-next-slide").addEventListener("click", showNextSlide);
    document.getElementById("btn-start-quiz").addEventListener("click", showQuizSection);
    
    // Envío del formulario de quiz
    document.getElementById("quiz-form").addEventListener("submit", handleQuizSubmit);

    // Admin abre el modal de recolección
    document.getElementById("btn-open-collection-modal").addEventListener("click", openCollectionModal);

    // Envío del formulario de reporte de incidentes
    document.getElementById("incident-report-form").addEventListener("submit", handleIncidentSubmit);

    // Envío del formulario de reporte personalizado
    document.getElementById("custom-report-form").addEventListener("submit", handleCustomReportSubmit);

    // Envío del formulario de creación de usuario (Admin)
    document.getElementById("user-create-form").addEventListener("submit", handleUserCreateSubmit);

    // Envío del formulario de configuración de tarifas (Admin)
    const ratesForm = document.getElementById("rates-config-form");
    if (ratesForm) {
        ratesForm.addEventListener("submit", handleRatesConfigSubmit);
    }

    // Registrar envíos de formularios de Recursos (Energía y Agua)
    const resourceForm = document.getElementById("resource-reading-form");
    if (resourceForm) {
        resourceForm.addEventListener("submit", handleResourceSubmit);
    }
    const resourceGoalsForm = document.getElementById("resource-goals-form");
    if (resourceGoalsForm) {
        resourceGoalsForm.addEventListener("submit", handleGoalsSubmit);
    }

    // Registrar envío de formulario de carga de FDS (Administrador)
    const sdsUploadForm = document.getElementById("sds-upload-form");
    if (sdsUploadForm) {
        sdsUploadForm.addEventListener("submit", handleSdsUploadSubmit);
    }

    // Calculadora en tiempo real del porcentaje solar para el formulario de Recursos
    const energyConsumedInput = document.getElementById("res-energy-consumed");
    const energyGeneratedInput = document.getElementById("res-energy-generated");
    const formSolarCalc = document.getElementById("res-form-solar-calc");
    if (energyConsumedInput && energyGeneratedInput && formSolarCalc) {
        const updateSolarCalc = () => {
            const consumed = parseFloat(energyConsumedInput.value) || 0;
            const generated = parseFloat(energyGeneratedInput.value) || 0;
            const pct = consumed > 0 ? Math.min(100, (generated / consumed) * 100) : 0;
            formSolarCalc.textContent = `Participación Solar Proyectada: ${pct.toFixed(1)}%`;
        };
        energyConsumedInput.addEventListener("input", updateSolarCalc);
        energyGeneratedInput.addEventListener("input", updateSolarCalc);
    }

    // Registrar eventos de notificaciones, inspecciones y calendario
    registerNotificationEvents();
    registerInspectionFormEvents();
    const calendarForm = document.getElementById("calendar-event-form");
    if (calendarForm) {
        calendarForm.addEventListener("submit", handleCalendarEventSubmit);
    }
}

function switchView(viewName) {
    // Guardia de vista basada en roles (permitir report, incidents, sds, trainings, inspections, calendar a Jefe de Área)
    if (isJefeDeArea(state.currentUser)) {
        if (viewName !== 'report' && viewName !== 'incidents' && viewName !== 'sds' && viewName !== 'trainings' && viewName !== 'inspections' && viewName !== 'calendar') {
            viewName = 'report';
        }
    }

    state.currentView = viewName;
    
    // Actualizar clases activas de navegación
    document.querySelectorAll(".nav-btn").forEach(btn => {
        if (btn.getAttribute("data-target") === viewName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Texto del título
    const titles = {
        'dashboard': 'Dashboard de Gestión',
        'report': 'Registrar Entrega Diaria',
        'history': 'Historial de Movimientos',
        'analytics': 'Estadísticas e Informes Históricos',
        'incidents': 'Incidentes y Derrames de RESPEL',
        'sds': 'Biblioteca de Fichas de Seguridad (FDS)',
        'trainings': 'Capacitaciones',
        'users': 'Gestión de Accesos',
        'resources': 'Consumo de Recursos (Energía y Agua)',
        'inspections': 'Inspecciones de Seguridad',
        'calendar': 'Calendario de Gestión Ambiental'
    };
    document.getElementById("view-title").textContent = titles[viewName] || 'Ecomeq';

    // Mostrar/Ocultar vistas
    document.querySelectorAll(".content-view").forEach(view => {
        if (view.id === `view-${viewName}`) {
            view.classList.add("active-view");
        } else {
            view.classList.remove("active-view");
        }
    });

    // Cargar lógica específica de vista
    if (viewName === 'inspections') {
        initInspectionFormPrefill();
        renderInspectionsTable();
    } else if (viewName === 'calendar') {
        renderCalendar();
    }

    // Desplazarse al inicio
    document.querySelector(".main-content").scrollTop = 0;

    // Actualizar detalles específicos del contexto
    if (viewName === 'dashboard') {
        renderDashboard();
    } else if (viewName === 'history') {
        renderHistoryTable();
    } else if (viewName === 'analytics') {
        renderAnalyticsView();
    } else if (viewName === 'incidents') {
        renderIncidentsView();
    } else if (viewName === 'sds') {
        renderSdsGrid();
    } else if (viewName === 'trainings') {
        renderCoursesGrid();
    } else if (viewName === 'users') {
        renderUsersView();
    } else if (viewName === 'resources') {
        renderResourcesView();
    }
}

/* ==========================================================================
   LÓGICA DE AUTENTICACIÓN
   ========================================================================== */
function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    const users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
    const matchedUser = users.find(u => u.email === email && u.password === password);

    if (matchedUser) {
        // Guardar sesión
        state.currentUser = matchedUser;
        localStorage.setItem("ecomeq_session", JSON.stringify(matchedUser));
        
        loadUserDataAndState();
        showAppShell();
        
        // Limpiar formulario
        document.getElementById("login-form").reset();
    } else {
        alert("❌ Credenciales incorrectas. Intente nuevamente.");
    }
}

function setDemoCredentials(role) {
    if (role === 'admin') {
        document.getElementById("login-email").value = "admin@ecomeq.com";
        document.getElementById("login-password").value = "admin123";
    } else {
        document.getElementById("login-email").value = "operador@ecomeq.com";
        document.getElementById("login-password").value = "operador123";
    }
}

function logout() {
    if (confirm("¿Está seguro de que desea cerrar la sesión?")) {
        localStorage.removeItem("ecomeq_session");
        state.currentUser = null;
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById("app-container").classList.remove("active-grid");
    document.getElementById("app-container").style.display = "none";
    document.getElementById("login-container").classList.add("active-flex");
}

function showAppShell() {
    document.getElementById("login-container").classList.remove("active-flex");
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").classList.add("active-grid");
    document.getElementById("app-container").style.display = "grid";
    if (isJefeDeArea(state.currentUser)) {
        switchView('report');
    } else {
        switchView('dashboard');
    }
}

/* ==========================================================================
   ESTADÍSTICAS DEL DASHBOARD Y RENDERIZADO DE GRÁFICOS
   ========================================================================== */
function renderDashboard() {
    // 1. Cálculos
    const storedReports = state.reports.filter(r => r.status === 'stored');
    const totalStoredWeight = storedReports.reduce((sum, r) => sum + parseFloat(r.weight), 0);
    const totalStoredCost = storedReports.reduce((sum, r) => sum + calculateDisposalCost(r.type, r.weight), 0);
    
    // Peso de esta semana (generación de los últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyWeight = state.reports
        .filter(r => new Date(r.datetime) >= sevenDaysAgo)
        .reduce((sum, r) => sum + parseFloat(r.weight), 0);

    // Cuenta regresiva para la recolección del próximo viernes
    const nextFridayCountdown = getNextCollectionCountdownText();

    // Progreso de capacitaciones
    const completedCoursesCount = Object.values(state.trainings).filter(t => t.status === 'completed').length;
    const totalCourses = state.courses ? state.courses.length : COURSES_DATA.length;
    const progressPercentage = totalCourses > 0 ? Math.round((completedCoursesCount / totalCourses) * 100) : 0;

    // Actualizar contadores simples
    document.getElementById("stat-stored-weight").textContent = `${totalStoredWeight.toFixed(1)} kg`;
    document.getElementById("stat-stored-count").textContent = `${storedReports.length} entregas en almacén`;
    document.getElementById("stat-next-collection").textContent = nextFridayCountdown;
    document.getElementById("stat-completed-trainings").textContent = `${completedCoursesCount} / ${totalCourses}`;
    document.getElementById("stat-training-percentage").textContent = `${progressPercentage}% Completado`;
    document.getElementById("badge-trainings-count").textContent = totalCourses - completedCoursesCount;
    if (totalCourses - completedCoursesCount === 0) {
        document.getElementById("badge-trainings-count").style.display = "none";
    } else {
        document.getElementById("badge-trainings-count").style.display = "inline-flex";
    }

    // Actualizar contador de costos
    const statStoredCostEl = document.getElementById("stat-stored-cost");
    if (statStoredCostEl) {
        statStoredCostEl.textContent = formatCurrency(totalStoredCost);
    }


    // 2. Cálculo del gráfico de dona por tipo
    const typeWeights = {};
    const COLORS_MAP = {
        'Hidrocarburos': '#10b981',        // Emerald green
        'Ácidos': '#ef4444',               // Red
        'Básicos': '#06b6d4',              // Cyan/Teal
        'Envases contaminados': '#f59e0b', // Amber/Yellow
        'Sólidos impregnados': '#a855f7',  // Purple
        'Luminarias': '#3b82f6'             // Blue
    };

    // Calcular totales por tipo
    let overallWeight = 0;
    state.reports.forEach(r => {
        const w = parseFloat(r.weight);
        typeWeights[r.type] = (typeWeights[r.type] || 0) + w;
        overallWeight += w;
    });
    
    document.getElementById("donut-total-weight").textContent = `${overallWeight.toFixed(0)} kg`;

    // Renderizar dona y leyenda
    const donutChart = document.getElementById("dashboard-donut-chart");
    const legendList = document.getElementById("chart-legend-list");
    
    // Limpiar elementos antiguos de segmentos de dona excepto el círculo de fondo
    const oldSegments = donutChart.querySelectorAll('.donut-segment');
    oldSegments.forEach(el => el.remove());
    legendList.innerHTML = '';

    if (overallWeight === 0) {
        legendList.innerHTML = '<p class="text-xs text-muted">No hay datos de residuos registrados aún.</p>';
    } else {
        let accumulatedPercent = 0;
        const radius = 70;
        const circumference = 2 * Math.PI * radius; // 439.82

        // Ordenar tipos por peso desc
        const sortedTypes = Object.entries(typeWeights).sort((a,b) => b[1] - a[1]);

        sortedTypes.forEach(([type, weight]) => {
            const percentage = (weight / overallWeight) * 100;
            const strokeColor = COLORS_MAP[type] || '#6b7280';
            
            // Renderizar segmento
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("class", "donut-segment");
            circle.setAttribute("cx", "100");
            circle.setAttribute("cy", "100");
            circle.setAttribute("r", radius.toString());
            circle.setAttribute("fill", "none");
            circle.setAttribute("stroke", strokeColor);
            circle.setAttribute("stroke-width", "24");
            
            // dasharray: porcentaje de peso de la circunferencia, dashoffset: desfase acumulado
            const strokeDashOffset = circumference - (percentage / 100) * circumference;
            const strokeDashArray = `${circumference} ${circumference}`;
            const rotation = (accumulatedPercent / 100) * 360;
            
            circle.setAttribute("stroke-dasharray", strokeDashArray);
            circle.setAttribute("stroke-dashoffset", strokeDashOffset.toString());
            circle.setAttribute("transform", `rotate(${rotation - 90} 100 100)`);
            donutChart.appendChild(circle);

            // Renderizar elemento de leyenda
            const legendItem = document.createElement("div");
            legendItem.className = "legend-item";
            const typeCost = calculateDisposalCost(type, weight);
            legendItem.innerHTML = `
                <div class="legend-label-group">
                    <span class="legend-color" style="background-color: ${strokeColor}"></span>
                    <span>${type}</span>
                </div>
                <div class="legend-weight" style="text-align: right;">
                    <div>${weight.toFixed(1)} kg <span class="legend-pct">${percentage.toFixed(0)}%</span></div>
                    <div style="font-size: 11px; color: var(--color-warning); font-weight: 500;">${formatCurrency(typeCost)}</div>
                </div>
            `;
            legendList.appendChild(legendItem);

            accumulatedPercent += percentage;
        });
    }

    // 3. Renderizar gráficos de barras de área
    const areaWeights = {};
    const ALL_AREAS = ["Producción", "Mantenimiento", "Laboratorio", "Logística", "Oficinas"];
    ALL_AREAS.forEach(area => areaWeights[area] = 0);

    let maxAreaWeight = 0;
    state.reports.forEach(r => {
        const w = parseFloat(r.weight);
        areaWeights[r.area] = (areaWeights[r.area] || 0) + w;
    });

    Object.values(areaWeights).forEach(val => {
        if (val > maxAreaWeight) maxAreaWeight = val;
    });

    const barList = document.getElementById("dashboard-areas-bar-list");
    barList.innerHTML = '';

    ALL_AREAS.forEach(area => {
        const weight = areaWeights[area];
        const percentOfMax = maxAreaWeight > 0 ? (weight / maxAreaWeight) * 100 : 0;
        
        const barRow = document.createElement("div");
        barRow.className = "bar-row";
        barRow.innerHTML = `
            <div class="bar-info">
                <span class="bar-area-name">${area}</span>
                <span class="bar-area-val">${weight.toFixed(1)} kg</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${percentOfMax}%"></div>
            </div>
        `;
        barList.appendChild(barRow);
    });

    // 4. Lista de reportes recientes (Últimos 5)
    const recentReports = [...state.reports]
        .sort((a,b) => new Date(b.datetime) - new Date(a.datetime))
        .slice(0, 5);

    const recentContainer = document.getElementById("dashboard-recent-reports");
    recentContainer.innerHTML = '';

    if (recentReports.length === 0) {
        recentContainer.innerHTML = '<li class="text-xs text-muted py-4 text-center">No hay reportes de entregas aún.</li>';
    } else {
        recentReports.forEach(r => {
            const dotColor = COLORS_MAP[r.type] || '#6b7280';
            const formattedDate = new Date(r.datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            const statusLabel = r.status === 'stored' ? 'Almacenado' : 'Recolectado';
            const statusClass = r.status === 'stored' ? 'badge-warning' : 'badge-success';

            const item = document.createElement("li");
            item.className = "recent-item";
            item.innerHTML = `
                <div class="recent-main">
                    <span class="recent-type-dot" style="background-color: ${dotColor}"></span>
                    <div class="recent-details">
                        <h5>${r.wasteName || r.type}</h5>
                        <span>${r.bodega || r.area} • ${formattedDate}</span>
                    </div>
                </div>
                <div class="recent-meta">
                    <div class="recent-weight">${r.weight.toFixed(1)} kg</div>
                    <span class="badge ${statusClass} recent-status">${statusLabel}</span>
                </div>
            `;
            recentContainer.appendChild(item);
        });
    }

    // 5. Alertas del sistema (advertencia de límite de acumulación)
    const alertsContainer = document.getElementById("dashboard-alerts-list");
    // Comenzar con la información fija de recolección semanal
    alertsContainer.innerHTML = `
        <div class="alert-item alert-info">
            <div class="alert-indicator"></div>
            <div class="alert-content">
                <h5>Despacho Semanal programado</h5>
                <p>Las recolecciones del gestor son todos los viernes a la 1:00 PM.</p>
            </div>
        </div>
    `;

    // Advertir si un solo tipo supera los 150 kg en almacén
    const typeStoredWeights = {};
    storedReports.forEach(r => {
        typeStoredWeights[r.type] = (typeStoredWeights[r.type] || 0) + parseFloat(r.weight);
    });

    Object.entries(typeStoredWeights).forEach(([type, w]) => {
        if (w >= 150) {
            const alert = document.createElement("div");
            alert.className = "alert-item alert-warn";
            alert.innerHTML = `
                <div class="alert-indicator"></div>
                <div class="alert-content">
                    <h5>Límite de Almacenamiento Alto</h5>
                    <p>Se acumulan <strong>${w.toFixed(1)} kg</strong> de ${type} en almacenamiento temporal. Solicitar recolección prioritaria.</p>
                </div>
            `;
            alertsContainer.appendChild(alert);
        }
    });

    // Renderizar notificaciones no leídas en alertas del sistema del dashboard
    let visibleNotifs = state.notifications || [];
    if (isJefeDeArea(state.currentUser)) {
        const workerArea = state.currentUser.area || "";
        visibleNotifs = visibleNotifs.filter(n => n.targetArea === "All" || n.targetArea.toLowerCase() === workerArea.toLowerCase());
    }
    
    visibleNotifs.filter(n => !n.read).slice(0, 3).forEach(n => {
        const alert = document.createElement("div");
        alert.className = "alert-item alert-warn";
        alert.innerHTML = `
            <div class="alert-indicator" style="background: var(--color-error)"></div>
            <div class="alert-content">
                <h5>${n.title}</h5>
                <p>${n.message}</p>
            </div>
        `;
        alertsContainer.appendChild(alert);
    });

    // Renderizar el widget de agenda ambiental del dashboard
    const agendaContainer = document.getElementById("dashboard-agenda-list");
    if (agendaContainer) {
        agendaContainer.innerHTML = "";
        const events = JSON.parse(localStorage.getItem("ecomeq_calendar_events")) || [];
        
        // Buscar eventos en los próximos 15 días
        const now = new Date();
        const fifteenDaysLater = new Date();
        fifteenDaysLater.setDate(now.getDate() + 15);
        
        const upcomingEvents = events.filter(ev => {
            let evDate;
            if (ev.recurry) {
                evDate = new Date(now.getFullYear(), parseInt(ev.date.slice(5, 7)) - 1, parseInt(ev.date.slice(8, 10)));
            } else {
                evDate = new Date(ev.date);
            }
            evDate.setHours(0,0,0,0);
            const todayNorm = new Date(now);
            todayNorm.setHours(0,0,0,0);
            const limitNorm = new Date(fifteenDaysLater);
            limitNorm.setHours(23,59,59,999);
            
            return evDate >= todayNorm && evDate <= limitNorm;
        });

        // Ordenar por fecha
        upcomingEvents.sort((a, b) => {
            const getDateVal = (ev) => {
                if (ev.recurry) {
                    return new Date(now.getFullYear(), parseInt(ev.date.slice(5, 7)) - 1, parseInt(ev.date.slice(8, 10)));
                }
                return new Date(ev.date);
            };
            return getDateVal(a) - getDateVal(b);
        });

        if (upcomingEvents.length === 0) {
            agendaContainer.innerHTML = `
                <div style="text-align: center; padding: 12px; color: var(--color-text-muted); font-size: 11.5px;">
                    No hay eventos en los próximos 15 días.
                </div>
            `;
        } else {
            const typeIcons = {
                'efemeride': '🌍',
                'inspeccion': '🕵️‍♂️',
                'recoleccion': '♻️',
                'reunion': '🤝',
                'capacitacion': '📚'
            };
            
            upcomingEvents.slice(0, 4).forEach(ev => {
                const item = document.createElement("div");
                item.className = "agenda-item";
                item.style.display = "flex";
                item.style.alignItems = "center";
                item.style.gap = "10px";
                item.style.padding = "8px";
                item.style.background = "rgba(255, 255, 255, 0.02)";
                item.style.borderRadius = "6px";
                item.style.border = "1px solid rgba(255, 255, 255, 0.04)";
                
                const evDate = ev.recurry 
                    ? new Date(now.getFullYear(), parseInt(ev.date.slice(5, 7)) - 1, parseInt(ev.date.slice(8, 10)))
                    : new Date(ev.date);
                
                const dateLabel = evDate.toLocaleDateString('es-ES', {month: 'short', day: 'numeric'});
                
                item.innerHTML = `
                    <span style="font-size: 13px;">${typeIcons[ev.type] || '📅'}</span>
                    <div style="flex: 1; min-width: 0;">
                        <h5 style="margin: 0; font-size: 12px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ev.title}</h5>
                        <p style="margin: 0; font-size: 10px; color: var(--color-text-muted);">${dateLabel}</p>
                    </div>
                `;
                agendaContainer.appendChild(item);
            });
        }
    }
}

function getNextCollectionCountdownText() {
    const now = new Date();
    // Viernes = día 5
    const currentDay = now.getDay();
    let daysToFriday = 5 - currentDay;
    if (daysToFriday < 0) {
        daysToFriday += 7; // Next Friday
    } else if (daysToFriday === 0) {
        // Es viernes. Veamos si es antes de las 13:00
        if (now.getHours() < 13) {
            return "Hoy (Viernes 1:00 PM)";
        } else {
            daysToFriday = 7; // Viernes de la próxima semana
        }
    }
    
    if (daysToFriday === 1) {
        return "Mañana (Viernes)";
    }
    return `En ${daysToFriday} días (Viernes)`;
}

/* ==========================================================================
   ENVÍO DEL FORMULARIO DE REPORTE
   ========================================================================== */
function handleReportSubmit(e) {
    e.preventDefault();
    
    const area = document.getElementById("report-area").value;
    const type = document.getElementById("report-type").value;
    const weight = parseFloat(document.getElementById("report-weight").value);
    const datetime = document.getElementById("report-datetime").value;
    const operator = document.getElementById("report-operator").value.trim();
    const observations = document.getElementById("report-observations").value.trim();
    const bodega = document.getElementById("report-bodega").value;
    const wasteName = document.getElementById("report-waste-name").value.trim();
    const corriente = document.getElementById("report-corriente").value;
    const physicalState = document.getElementById("report-physical-state").value;

    if (!area || !type || isNaN(weight) || !datetime || !operator || !wasteName || !corriente) {
        alert("Por favor rellene todos los campos obligatorios.");
        return;
    }

    const newReport = {
        id: "rep-" + Date.now(),
        datetime: datetime,
        area: area,
        type: type,
        weight: weight,
        operator: operator,
        observations: observations || "Sin observaciones específicas.",
        status: "stored",
        bodega: bodega,
        wasteName: wasteName,
        corriente: corriente,
        physicalState: physicalState
    };

    // Guardar el nuevo reporte
    state.reports.push(newReport);
    localStorage.setItem("ecomeq_reports", JSON.stringify(state.reports));

    // Limpiar el formulario (conservamos el operador para agilizar ingresos sucesivos)
    document.getElementById("report-area").value = "";
    document.getElementById("report-type").value = "";
    document.getElementById("report-weight").value = "";
    document.getElementById("report-observations").value = "";
    document.getElementById("report-waste-name").value = "";
    document.getElementById("report-bodega").value = "Centro de acopio";
    document.getElementById("report-corriente").innerHTML = '<option value="" disabled selected>Seleccione tipo de residuo primero...</option>';
    document.getElementById("report-physical-state").value = "Líquido";
    updateDateDisplay(); // Actualizar fecha al momento actual

    // Renderizar dashboard y tablas
    renderDashboard();
    renderHistoryTable();

    // Lanzar el modal interactivo de éxito
    openModal("modal-success");
}

/* ==========================================================================
   VISTA C: REGISTROS DE HISTORIAL DE RESIDUOS Y FILTRADO
   ========================================================================== */
function renderHistoryTable() {
    const searchVal = document.getElementById("filter-search").value.toLowerCase();
    const areaVal = document.getElementById("filter-area").value;
    const typeVal = document.getElementById("filter-type").value;
    const statusVal = document.getElementById("filter-status").value;

    const tbody = document.getElementById("history-table-body");
    const emptyState = document.getElementById("table-empty-state");
    
    tbody.innerHTML = '';
    
    // Restablecimiento de selección de casillas de verificación
    state.selectedReportIds = [];
    document.getElementById("select-all-checkbox").checked = false;
    updateAdminCollectionBarVisibility();

    // Ordenar los reportes de manera cronológica descendente (el más nuevo primero)
    const filteredReports = state.reports
        .sort((a,b) => new Date(b.datetime) - new Date(a.datetime))
        .filter(r => {
            // Filtro de búsqueda por texto en múltiples propiedades
            const matchSearch = (r.operator && r.operator.toLowerCase().includes(searchVal)) || 
                                (r.observations && r.observations.toLowerCase().includes(searchVal)) ||
                                (r.wasteName && r.wasteName.toLowerCase().includes(searchVal)) ||
                                (r.bodega && r.bodega.toLowerCase().includes(searchVal)) ||
                                (r.corriente && r.corriente.toLowerCase().includes(searchVal)) ||
                                (r.physicalState && r.physicalState.toLowerCase().includes(searchVal)) ||
                                (r.manifest && r.manifest.toLowerCase().includes(searchVal));
            
            // Filtros de los menús desplegables
            const matchArea = areaVal === 'all' || r.area === areaVal;
            const matchType = typeVal === 'all' || r.type === typeVal;
            const matchStatus = statusVal === 'all' || 
                               (statusVal === 'stored' && r.status === 'stored') || 
                               (statusVal === 'collected' && r.status === 'collected');

            return matchSearch && matchArea && matchType && matchStatus;
        });

    if (filteredReports.length === 0) {
        tbody.parentElement.parentElement.style.display = "none";
        emptyState.style.display = "flex";
        return;
    }

    tbody.parentElement.parentElement.style.display = "block";
    emptyState.style.display = "none";

    filteredReports.forEach(r => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", r.id);
        if (state.selectedReportIds.includes(r.id)) {
            tr.classList.add("selected");
        }

        const dateStr = new Date(r.datetime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const weightStr = `${parseFloat(r.weight).toFixed(1)} kg`;
        
        const isCollected = r.status === 'collected';
        let statusClass = 'status-stored-acopio';
        let statusText = `En ${r.bodega || 'Centro de acopio'}`;
        
        if (isCollected) {
            statusClass = 'status-collected';
            statusText = 'Recolectado';
        } else if (r.bodega === 'Shut de RESPEL') {
            statusClass = 'status-stored-shut';
        } else if (r.bodega && r.bodega.includes('Bodega')) {
            statusClass = 'badge-warning';
        }

        const manifestCell = isCollected ? 
            `<div class="manifest-text">${r.manifest}</div><div class="text-xs text-muted">${r.collectedBy} (${new Date(r.collectedDate).toLocaleDateString('es-ES')})</div>` : 
            `<span class="text-xs text-muted">Pendiente de retiro</span>`;

        // El checkbox de selección múltiple sólo es visible para el Coordinador y para filas sin retirar
        const checkboxCell = (isCoordinador(state.currentUser) && !isCollected) ? 
            `<td class="col-checkbox admin-only-cell"><input type="checkbox" class="row-selector" data-id="${r.id}" onchange="handleRowSelectToggle(this)"></td>` : 
            `<td class="col-checkbox admin-only-cell"><span class="text-muted" title="Ya recolectado">-</span></td>`;

        // Panel de botones de control rápido de bodega para el Coordinador
        const controlCell = `<td class="admin-only-cell">
                <div class="location-btn-group">
                    <button class="btn-location-toggle ${r.bodega === 'Centro de acopio' ? 'active' : ''}" data-loc="acopio" onclick="changeReportStatus('${r.id}', 'Centro de acopio')" title="Mover a Centro de acopio">Acopio</button>
                    <button class="btn-location-toggle ${r.bodega === 'Shut de RESPEL' ? 'active' : ''}" data-loc="shut" onclick="changeReportStatus('${r.id}', 'Shut de RESPEL')" title="Mover a Shut">Shut</button>
                    <button class="btn-location-toggle ${r.bodega === 'Bodega 1 (Principal)' ? 'active' : ''}" data-loc="b1" onclick="changeReportStatus('${r.id}', 'Bodega 1 (Principal)')" title="Mover a Bodega 1">B1</button>
                    <button class="btn-location-toggle ${r.bodega === 'Bodega 2 (Auxiliar)' ? 'active' : ''}" data-loc="b2" onclick="changeReportStatus('${r.id}', 'Bodega 2 (Auxiliar)')" title="Mover a Bodega 2">B2</button>
                    <button class="btn-location-collect ${isCollected ? 'active' : ''}" onclick="changeReportStatus('${r.id}', 'collected')" title="Ya se recogió / Salida">${isCollected ? 'Recogido' : 'Recoger'}</button>
                </div>
             </td>`;

        const costStr = formatCurrency(calculateDisposalCost(r.type, r.weight));
        tr.innerHTML = `
            ${checkboxCell}
            <td><strong>${dateStr}</strong></td>
            <td>${r.bodega || 'Centro de acopio'}</td>
            <td><strong>${r.wasteName || r.type}</strong></td>
            <td><strong>${weightStr}</strong></td>
            <td>${r.type}</td>
            <td><span class="badge" style="background: rgba(0, 75, 156, 0.1); border: 1px solid var(--color-surface-border); padding: 2px 6px; border-radius: 4px;">${r.corriente || 'Y9'}</span></td>
            <td>${r.physicalState || 'Líquido'}</td>
            <td class="admin-only-cell" style="color: var(--color-warning); font-weight: 600;">${costStr}</td>
            <td>
                <span class="status-pill ${statusClass}">
                    <span class="status-dot"></span>
                    ${statusText}
                </span>
            </td>
            ${controlCell}
            <td>${manifestCell}</td>
        `;
        tbody.appendChild(tr);
    });

    // Reapply role elements visibility
    if (isJefeDeArea(state.currentUser)) {
        document.querySelectorAll(".admin-only-cell").forEach(cell => cell.style.display = "none");
    } else {
        document.querySelectorAll(".admin-only-cell").forEach(cell => cell.style.display = "");
    }
}

// Manipulación de casillas de verificación
function handleRowSelectToggle(checkbox) {
    const id = checkbox.getAttribute("data-id");
    const tr = checkbox.closest("tr");
    
    if (checkbox.checked) {
        tr.classList.add("selected");
        if (!state.selectedReportIds.includes(id)) {
            state.selectedReportIds.push(id);
        }
    } else {
        tr.classList.remove("selected");
        state.selectedReportIds = state.selectedReportIds.filter(x => x !== id);
    }
    
    updateAdminCollectionBarVisibility();
}

function handleTableSelectAllToggle(e) {
    const checked = e.target.checked;
    const rowCheckboxes = document.querySelectorAll(".row-selector");
    
    state.selectedReportIds = [];
    
    rowCheckboxes.forEach(cb => {
        cb.checked = checked;
        const id = cb.getAttribute("data-id");
        const tr = cb.closest("tr");
        
        if (checked) {
            tr.classList.add("selected");
            state.selectedReportIds.push(id);
        } else {
            tr.classList.remove("selected");
        }
    });

    updateAdminCollectionBarVisibility();
}

function updateAdminCollectionBarVisibility() {
    const bar = document.getElementById("admin-collection-bar");
    if (isCoordinador(state.currentUser) && state.selectedReportIds.length > 0) {
        bar.classList.remove("hidden");
        
        // Sumar pesos y costos
        const selectedReports = state.reports.filter(r => state.selectedReportIds.includes(r.id));
        const totalWeight = selectedReports.reduce((sum, r) => sum + parseFloat(r.weight), 0);
        const totalCost = selectedReports.reduce((sum, r) => sum + calculateDisposalCost(r.type, r.weight), 0);
        
        document.getElementById("collection-select-count").textContent = `${state.selectedReportIds.length} residuos seleccionados`;
        document.getElementById("collection-select-weight").textContent = `Peso Total: ${totalWeight.toFixed(1)} kg`;
        document.getElementById("collection-select-cost").textContent = `Costo Total: ${formatCurrency(totalCost)}`;
    } else {
        bar.classList.add("hidden");
    }
}

// Exportar datos de tabla filtrados a CSV
function exportFilteredDataToCSV() {
    const searchVal = document.getElementById("filter-search").value.toLowerCase();
    const areaVal = document.getElementById("filter-area").value;
    const typeVal = document.getElementById("filter-type").value;
    const statusVal = document.getElementById("filter-status").value;

    const filtered = state.reports.filter(r => {
        const matchSearch = (r.operator && r.operator.toLowerCase().includes(searchVal)) || 
                            (r.observations && r.observations.toLowerCase().includes(searchVal)) ||
                            (r.manifest && r.manifest.toLowerCase().includes(searchVal));
        const matchArea = areaVal === 'all' || r.area === areaVal;
        const matchType = typeVal === 'all' || r.type === typeVal;
        const matchStatus = statusVal === 'all' || 
                            (statusVal === 'stored' && r.status === 'stored') || 
                            (statusVal === 'collected' && r.status === 'collected');
        return matchSearch && matchArea && matchType && matchStatus;
    });

    // Ordenar cronológicamente descendente (el más nuevo primero) para coincidir con la vista de la tabla
    filtered.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    if (filtered.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    // Estructura de la planilla CSV compatible con Excel (BOM UTF-8 y especificación de separador)
    let csvContent = "\uFEFFsep=;\n";
    csvContent += "ID;Fecha;Bodega;Nombre Residuo;Cantidad (kg);Tipo RESPEL;Corriente;Estado Fisico;Costo Estimado;Operador;Estado de Gestion;Empresa Recolectora;Nro Manifiesto;Fecha Recoleccion\n";

    filtered.forEach(r => {
        const date = new Date(r.datetime).toLocaleString();
        const collectedBy = r.collectedBy || "-";
        const manifest = r.manifest || "-";
        const collectedDate = r.collectedDate ? new Date(r.collectedDate).toLocaleString() : "-";
        const cost = calculateDisposalCost(r.type, r.weight);

        // Reemplazar puntos por comas en decimales de peso y costo para coincidir con la configuración regional en español
        const weightFormatted = String(r.weight).replace('.', ',');
        const costFormatted = String(cost).replace('.', ',');

        csvContent += `"${r.id}";"${date}";"${r.bodega}";"${r.wasteName}";${weightFormatted};"${r.type}";"${r.corriente}";"${r.physicalState}";${costFormatted};"${r.operator}";"${r.status}";"${collectedBy}";"${manifest}";"${collectedDate}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Ecomeq_RESPEL_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ==========================================================================
   ADMIN REGISTRATION OF WEEKLY COLLECTIONS
   ========================================================================== */
function openCollectionModal() {
    const selectedReports = state.reports.filter(r => state.selectedReportIds.includes(r.id));
    const totalWeight = selectedReports.reduce((sum, r) => sum + parseFloat(r.weight), 0);
    const totalCost = selectedReports.reduce((sum, r) => sum + calculateDisposalCost(r.type, r.weight), 0);

    document.getElementById("col-modal-count").textContent = state.selectedReportIds.length;
    document.getElementById("col-modal-weight").textContent = `${totalWeight.toFixed(1)} kg`;
    document.getElementById("col-modal-cost").textContent = `${formatCurrency(totalCost)} COP`;
    
    // Set current time in modal
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    document.getElementById("col-datetime").value = localISOTime;

    openModal("modal-collection");
}

function handleCollectionSubmit(e) {
    e.preventDefault();
    
    const company = document.getElementById("col-company").value.trim();
    const manifest = document.getElementById("col-manifest").value.trim();
    const colDatetime = document.getElementById("col-datetime").value;

    if (!company || !manifest || !colDatetime) {
        alert("Por favor rellene todos los campos obligatorios.");
        return;
    }

    // Process all selected reports
    state.reports = state.reports.map(r => {
        if (state.selectedReportIds.includes(r.id)) {
            return {
                ...r,
                status: 'collected',
                collectedBy: company,
                manifest: manifest,
                collectedDate: colDatetime
            };
        }
        return r;
    });

    // Save
    localStorage.setItem("ecomeq_reports", JSON.stringify(state.reports));

    // Reset selection and close modal
    state.selectedReportIds = [];
    closeModal("modal-collection");
    document.getElementById("collection-form").reset();

    // Re-render
    renderDashboard();
    renderHistoryTable();
    updateAdminCollectionBarVisibility();
}

/* ==========================================================================
   TRAININGS MODULES & INTERACTIVE QUIZZES
   ========================================================================== */
function getDefaultCourseCategory(id) {
    if (id === 'course-1') return 'Presentación';
    if (id === 'course-2' || id === 'course-3') return 'Sensibilización';
    if (id === 'course-4') return 'Infografía';
    return 'Presentación';
}

function filterCourses(category) {
    state.activeCourseFilter = category;
    renderCoursesGrid();
}

function renderWorkerTrainingsDirectory() {
    const tbody = document.getElementById("worker-trainings-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
    const workers = users.filter(u => isJefeDeArea(u));

    if (workers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding:20px; text-align:center; color:#888;">No hay trabajadores registrados en el sistema.</td></tr>`;
        return;
    }

    workers.forEach(worker => {
        const workerKey = `trainings_${worker.email}`;
        const workerTrainings = JSON.parse(localStorage.getItem(workerKey)) || {};

        const totalCoursesCount = state.courses.length;
        let approvedCount = 0;
        state.courses.forEach(c => {
            if (workerTrainings[c.id] && workerTrainings[c.id].status === 'completed') {
                approvedCount++;
            }
        });

        const progressPercent = totalCoursesCount > 0 ? Math.round((approvedCount / totalCoursesCount) * 100) : 0;

        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
        tr.innerHTML = `
            <td style="padding: 12px 8px;">
                <div style="font-weight:600; color:#fff;">${worker.name}</div>
                <div style="font-size:11px; color:var(--color-text-muted);">${worker.email}</div>
            </td>
            <td style="padding: 12px 8px;">${worker.area}</td>
            <td style="padding: 12px 8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="flex:1; background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden; min-width:80px; max-width:120px;">
                        <div style="background:var(--color-primary); width:${progressPercent}%; height:100%;"></div>
                    </div>
                    <span style="font-weight:600; font-size:12px;">${approvedCount} / ${totalCoursesCount} (${progressPercent}%)</span>
                </div>
            </td>
            <td style="padding: 12px 8px; text-align: center;">
                <button class="btn-secondary btn-xs" onclick="openWorkerTrainingDetail('${worker.email}')">Ver Historial</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openWorkerTrainingDetail(email) {
    const users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
    const worker = users.find(u => u.email === email);
    if (!worker) return;

    document.getElementById("worker-detail-title").textContent = `Historial de Capacitaciones: ${worker.name}`;
    document.getElementById("worker-detail-info").innerHTML = `
        <strong>Trabajador:</strong> ${worker.name}<br>
        <strong>Correo Electrónico:</strong> ${worker.email}<br>
        <strong>Área de Procedencia:</strong> ${worker.area}
    `;

    const tbody = document.getElementById("worker-detail-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const workerKey = `trainings_${worker.email}`;
    const workerTrainings = JSON.parse(localStorage.getItem(workerKey)) || {};

    state.courses.forEach(c => {
        const cat = c.category || getDefaultCourseCategory(c.id);
        const progress = workerTrainings[c.id] || { status: "pending", score: 0 };
        const isCompleted = progress.status === 'completed';
        const statusBadge = isCompleted ? 
            `<span class="badge" style="background:#10b981; color:#fff; padding:2px 6px; font-size:10px; border-radius:4px;">✓ APROBADO</span>` : 
            `<span class="badge" style="background:rgba(255,255,255,0.08); color:var(--color-text-muted); padding:2px 6px; font-size:10px; border-radius:4px;">PENDIENTE</span>`;

        const scoreText = isCompleted ? `${progress.score || 100}%` : '-';
        
        let certBtn = '';
        if (isCompleted) {
            certBtn = `<button class="btn-accent btn-xs" onclick="closeModal('modal-worker-training-detail'); openCertificateModal('${c.title}', '${worker.name}');" style="padding: 2px 6px; font-size: 11px;">Ver Certificado</button>`;
        } else {
            certBtn = `<span style="color:var(--color-text-muted); font-size:11px; font-style:italic;">No disponible</span>`;
        }

        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
        tr.innerHTML = `
            <td style="padding: 10px 4px; color:#fff; font-weight:500;">${c.title}</td>
            <td style="padding: 10px 4px;">${cat}</td>
            <td style="padding: 10px 4px;">${statusBadge}</td>
            <td style="padding: 10px 4px; text-align: center; font-weight:700;">${scoreText}</td>
            <td style="padding: 10px 4px; text-align: center;">${certBtn}</td>
        `;
        tbody.appendChild(tr);
    });

    openModal("modal-worker-training-detail");
}

function renderCoursesGrid() {
    const container = document.getElementById("courses-container");
    if (!container) return;
    container.innerHTML = '';

    // Actualizar clases activas en los botones de filtro
    document.querySelectorAll(".category-filters button").forEach(btn => {
        btn.classList.remove("active");
    });
    
    const filter = state.activeCourseFilter || 'All';
    if (filter === 'All') {
        const btn = document.getElementById("btn-filter-all");
        if (btn) btn.classList.add("active");
    } else if (filter === 'Presentación') {
        const btn = document.getElementById("btn-filter-presentations");
        if (btn) btn.classList.add("active");
    } else if (filter === 'Sensibilización') {
        const btn = document.getElementById("btn-filter-awareness");
        if (btn) btn.classList.add("active");
    } else if (filter === 'Infografía') {
        const btn = document.getElementById("btn-filter-infographics");
        if (btn) btn.classList.add("active");
    }

    state.courses.forEach(c => {
        const cat = c.category || getDefaultCourseCategory(c.id);
        if (filter !== 'All' && cat !== filter) {
            return;
        }

        const userProgress = state.trainings[c.id] || { status: "pending", score: 0 };
        const isCompleted = userProgress.status === 'completed';
        const badgeClass = isCompleted ? 'status-completed' : 'status-pending';
        const badgeText = isCompleted ? '✓ Aprobado (100%)' : 'Pendiente';
        const actionBtnText = isCompleted ? 'Revisar / Certificado' : 'Iniciar Curso';
        const actionBtnClass = isCompleted ? 'btn-secondary' : 'btn-primary';

        const card = document.createElement("div");
        card.className = "course-card";
        card.innerHTML = `
            <div class="course-icon-badge" style="position: relative;">
                ${c.icon || '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'}
            </div>
            <span class="badge" style="background: rgba(112, 176, 220, 0.1); color: var(--color-accent-light); align-self: flex-start; margin-bottom: 8px; font-size: 10px; border-radius: 4px; padding: 2px 6px;">${cat}</span>
            <h4>${c.title}</h4>
            <p>${c.desc}</p>
            <div class="course-footer">
                <span class="course-status-badge ${badgeClass}">${badgeText}</span>
                <button class="${actionBtnClass} btn-xs" onclick="startCourse('${c.id}')">${actionBtnText}</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Renderizar también el directorio de progreso de trabajadores si es coordinador
    if (isCoordinador(state.currentUser)) {
        renderWorkerTrainingsDirectory();
    }
}

function startCourse(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    state.activeCourse = course;
    state.activeSlideIdx = 0;

    // Reset modals visuals
    document.getElementById("course-modal-title").textContent = course.title;
    document.getElementById("course-slide-container").classList.remove("hidden");
    document.getElementById("course-quiz-container").classList.add("hidden");
    document.getElementById("btn-start-quiz").classList.add("hidden");
    document.getElementById("course-viewer-footer").classList.remove("hidden");

    renderCurrentSlide();
    openModal("modal-course");
}

function renderCurrentSlide() {
    const container = document.getElementById("course-slide-container");
    const slides = state.activeCourse.slides;
    const current = slides[state.activeSlideIdx];

    let attachmentHtml = '';
    if (state.activeSlideIdx === 0 && state.activeCourse.attachment) {
        const attachment = state.activeCourse.attachment;
        if (attachment.type.startsWith('image/')) {
            attachmentHtml = `
                <div class="slide-attachment image-attachment" style="margin-top: 20px; text-align: center;">
                    <img src="${attachment.data}" alt="${attachment.name}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                    <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 6px;">Imagen adjunta: ${attachment.name}</div>
                </div>
            `;
        } else {
            attachmentHtml = `
                <div class="slide-attachment file-attachment" style="margin-top: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--color-primary)" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <div style="text-align: left;">
                            <div style="font-weight: 600; font-size: 14px; color: #fff;">${attachment.name}</div>
                            <div style="font-size: 11px; color: var(--color-text-muted);">${(attachment.type || 'Documento')}</div>
                        </div>
                    </div>
                    <a href="${attachment.data}" download="${attachment.name}" class="btn-primary btn-xs" style="text-decoration: none; padding: 6px 12px; font-size: 12px; display: inline-block;">
                        Descargar
                    </a>
                </div>
            `;
        }
    }

    container.innerHTML = `
        <div class="slide-content">
            <div class="slide-header">
                <h4>Diapositiva ${state.activeSlideIdx + 1}: ${current.title}</h4>
            </div>
            <div class="slide-body">
                ${current.content}
                ${attachmentHtml}
            </div>
        </div>
    `;

    // Update slide progression footer
    document.getElementById("slide-progress").textContent = `${state.activeSlideIdx + 1} / ${slides.length}`;
    
    // Hide/Show navigation buttons
    document.getElementById("btn-prev-slide").style.display = state.activeSlideIdx === 0 ? "none" : "block";
    
    const isLastSlide = state.activeSlideIdx === slides.length - 1;
    const btnNext = document.getElementById("btn-next-slide");
    
    if (isLastSlide) {
        btnNext.style.display = "none";
        document.getElementById("btn-start-quiz").classList.remove("hidden");
        
        const isCompleted = state.trainings[state.activeCourse.id].status === 'completed';
        if (isCompleted) {
            document.getElementById("btn-start-quiz").textContent = "Ver Certificado";
        } else {
            document.getElementById("btn-start-quiz").textContent = "Iniciar Evaluación";
        }
    } else {
        btnNext.style.display = "block";
        document.getElementById("btn-start-quiz").classList.add("hidden");
    }
}

function showNextSlide() {
    if (state.activeSlideIdx < state.activeCourse.slides.length - 1) {
        state.activeSlideIdx++;
        renderCurrentSlide();
    }
}

function showPrevSlide() {
    if (state.activeSlideIdx > 0) {
        state.activeSlideIdx--;
        renderCurrentSlide();
    }
}

let triviaState = {
    currentQuestionIdx: 0,
    score: 0,
    elapsedMs: 0,
    timerInterval: null,
    correctAnswers: 0
};

function showQuizSection() {
    // If already completed, just open certificate directly
    const progress = state.trainings[state.activeCourse.id];
    if (progress && progress.status === 'completed') {
        closeModal("modal-course");
        openCertificateModal(state.activeCourse.title);
        return;
    }

    startTriviaGame();
}

function startTriviaGame() {
    // Clear timer interval if running
    if (triviaState.timerInterval) {
        clearInterval(triviaState.timerInterval);
    }

    // Reset trivia state
    triviaState = {
        currentQuestionIdx: 0,
        score: 0,
        elapsedMs: 0,
        timerInterval: null,
        correctAnswers: 0
    };

    const container = document.getElementById("course-quiz-container");
    container.classList.remove("hidden");
    document.getElementById("course-slide-container").classList.add("hidden");
    document.getElementById("course-viewer-footer").classList.add("hidden");

    // Render Trivia Shell
    container.innerHTML = `
        <div class="trivia-wrapper">
            <div class="trivia-header">
                <div class="trivia-info">
                    <span id="trivia-progress" style="font-weight: 600; color: var(--color-primary-light);">Pregunta 1 de 3</span>
                    <span id="trivia-score" style="font-weight: 600; color: var(--color-warning); margin-left: 20px;">Puntaje: 0</span>
                </div>
                <div class="trivia-timer-box">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span id="trivia-time" style="vertical-align: middle;">15.0s</span>
                </div>
            </div>
            <div class="trivia-timer-bar-track">
                <div id="trivia-timer-bar" class="trivia-timer-bar-fill"></div>
            </div>
            <div id="trivia-question-area">
                <!-- Injected dynamically -->
            </div>
            <div id="trivia-feedback-area">
                <!-- Injected dynamically -->
            </div>
        </div>
    `;

    loadTriviaQuestion();
}

function loadTriviaQuestion() {
    // Clear interval just in case
    if (triviaState.timerInterval) {
        clearInterval(triviaState.timerInterval);
    }

    const q = state.activeCourse.quiz[triviaState.currentQuestionIdx];
    const shapes = ['▲', '◆', '●', '■'];
    const colorClasses = ['opt-red', 'opt-blue', 'opt-yellow', 'opt-green'];

    let optionsHtml = '';
    q.options.forEach((opt, idx) => {
        const shape = shapes[idx] || '■';
        const colorClass = colorClasses[idx] || 'opt-green';
        optionsHtml += `
            <button type="button" class="trivia-option-btn ${colorClass}" data-index="${idx}" onclick="selectTriviaAnswer(${idx})">
                <span class="trivia-shape">${shape}</span>
                <span>${opt}</span>
            </button>
        `;
    });

    document.getElementById("trivia-question-area").innerHTML = `
        <div class="trivia-question-text">${q.question}</div>
        <div class="trivia-options-grid">${optionsHtml}</div>
    `;

    document.getElementById("trivia-feedback-area").innerHTML = '';
    document.getElementById("trivia-progress").textContent = `Pregunta ${triviaState.currentQuestionIdx + 1} de ${state.activeCourse.quiz.length}`;
    document.getElementById("trivia-score").textContent = `Puntaje: ${triviaState.score}`;

    // Reset progress bar & timer
    triviaState.elapsedMs = 0;
    document.getElementById("trivia-timer-bar").style.width = "100%";
    document.getElementById("trivia-time").textContent = "15.0s";

    // Start timer countdown (15 seconds, checking every 100ms)
    const start = Date.now();
    triviaState.timerInterval = setInterval(() => {
        triviaState.elapsedMs = Date.now() - start;
        const remainingTime = Math.max(0, 15 - (triviaState.elapsedMs / 1000));
        document.getElementById("trivia-time").textContent = `${remainingTime.toFixed(1)}s`;
        document.getElementById("trivia-timer-bar").style.width = `${(remainingTime / 15) * 100}%`;

        if (remainingTime <= 0) {
            clearInterval(triviaState.timerInterval);
            onTriviaTimeOut();
        }
    }, 100);
}

function selectTriviaAnswer(selectedIdx) {
    // Freeze timer
    if (triviaState.timerInterval) {
        clearInterval(triviaState.timerInterval);
    }

    const q = state.activeCourse.quiz[triviaState.currentQuestionIdx];
    const isCorrect = selectedIdx === q.answer;

    // Disable all option buttons
    const buttons = document.querySelectorAll(".trivia-option-btn");
    buttons.forEach(btn => {
        btn.disabled = true;
        const btnIdx = parseInt(btn.getAttribute("data-index"));
        if (btnIdx === q.answer) {
            btn.style.border = "4px solid #fff"; // Highlight correct answer
            btn.style.boxShadow = "0 0 15px rgba(255,255,255,0.4)";
        } else if (btnIdx === selectedIdx) {
            btn.style.border = "4px solid var(--color-error)"; // Highlight selected wrong answer
        } else {
            btn.style.opacity = "0.3"; // Dim others
        }
    });

    const feedbackArea = document.getElementById("trivia-feedback-area");

    if (isCorrect) {
        triviaState.correctAnswers++;
        const remainingTime = Math.max(0, 15 - (triviaState.elapsedMs / 1000));
        // Speed score formula: 500 base + 500 * (remainingTime / 15)
        const points = Math.round(500 + 500 * (remainingTime / 15));
        triviaState.score += points;
        document.getElementById("trivia-score").textContent = `Puntaje: ${triviaState.score}`;

        feedbackArea.innerHTML = `
            <div class="trivia-feedback-banner feedback-correct">
                <div class="feedback-title">¡Excelente!</div>
                <div class="feedback-points">+${points} puntos (Acierto rápido)</div>
                <button type="button" class="btn-primary mt-4 w-full" style="max-width: 250px; margin: 16px auto 0 auto;" onclick="nextTriviaStep()">Siguiente Pregunta</button>
            </div>
        `;
    } else {
        const correctText = q.options[q.answer];
        feedbackArea.innerHTML = `
            <div class="trivia-feedback-banner feedback-incorrect">
                <div class="feedback-title">Incorrecto</div>
                <div style="font-size: 13.5px; margin-top: 4px;">La respuesta correcta es: <strong>${correctText}</strong></div>
                <button type="button" class="btn-primary mt-4 w-full" style="max-width: 250px; margin: 16px auto 0 auto;" onclick="nextTriviaStep()">Siguiente Pregunta</button>
            </div>
        `;
    }
}

function onTriviaTimeOut() {
    const q = state.activeCourse.quiz[triviaState.currentQuestionIdx];
    
    // Disable buttons
    const buttons = document.querySelectorAll(".trivia-option-btn");
    buttons.forEach(btn => {
        btn.disabled = true;
        const btnIdx = parseInt(btn.getAttribute("data-index"));
        if (btnIdx === q.answer) {
            btn.style.border = "4px solid #fff";
        } else {
            btn.style.opacity = "0.3";
        }
    });

    const correctText = q.options[q.answer];
    document.getElementById("trivia-feedback-area").innerHTML = `
        <div class="trivia-feedback-banner feedback-incorrect" style="background: rgba(245, 158, 11, 0.15); border-color: var(--color-warning); color: #fde047;">
            <div class="feedback-title">¡Tiempo Agotado!</div>
            <div style="font-size: 13.5px; margin-top: 4px;">La respuesta correcta es: <strong>${correctText}</strong></div>
            <button type="button" class="btn-primary mt-4 w-full" style="max-width: 250px; margin: 16px auto 0 auto;" onclick="nextTriviaStep()">Siguiente Pregunta</button>
        </div>
    `;
}

function nextTriviaStep() {
    triviaState.currentQuestionIdx++;
    if (triviaState.currentQuestionIdx < state.activeCourse.quiz.length) {
        loadTriviaQuestion();
    } else {
        endTriviaGame();
    }
}

function endTriviaGame() {
    if (triviaState.timerInterval) {
        clearInterval(triviaState.timerInterval);
    }

    const container = document.getElementById("course-quiz-container");
    const totalQuestions = state.activeCourse.quiz.length;
    const passed = triviaState.correctAnswers === totalQuestions; // 100% correct answers required

    // Prepare Podium
    // Mock profiles scores: Laura (2350), Carlos (1450)
    let players = [
        { name: "Laura Martínez", initials: "LM", score: 2350, role: "Coordinador" },
        { name: "Carlos Gómez", initials: "CG", score: 1450, role: "Jefe de Área" },
        { name: state.currentUser.name, initials: state.currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase(), score: triviaState.score, role: state.currentUser.role, isUser: true }
    ];

    // Sort descending by score
    players.sort((a, b) => b.score - a.score);

    // Build the 3D podium columns mapping:
    // Left: 2nd place, Center: 1st place, Right: 3rd place
    const p1 = players[0];
    const p2 = players[1];
    const p3 = players[2];

    const makePodiumStep = (player, orderClass, barClass) => {
        if (!player) return '';
        const nameLabel = player.isUser ? 'Tú' : player.name.split(' ')[0];
        return `
            <div class="podium-step ${orderClass} ${player.isUser ? 'active' : ''}">
                <div class="podium-avatar" style="background: ${player.isUser ? 'var(--color-primary-dark)' : 'var(--color-surface-hover)'}; border-color: ${player.isUser ? 'var(--color-primary)' : '#fff'};">
                    ${player.initials}
                </div>
                <div class="podium-name" title="${player.name}">${nameLabel}</div>
                <div class="podium-score">${player.score} pts</div>
                <div class="podium-bar ${barClass}">
                    ${orderClass === 'order-1' ? '1' : (orderClass === 'order-2' ? '2' : '3')}
                </div>
            </div>
        `;
    };

    // Grid order class helper: order-1 (1st), order-2 (2nd), order-3 (3rd)
    const podiumHtml = `
        <div class="podium-container">
            ${makePodiumStep(p2, 'order-2', 'bar-2nd')}
            ${makePodiumStep(p1, 'order-1', 'bar-1st')}
            ${makePodiumStep(p3, 'order-3', 'bar-3rd')}
        </div>
    `;

    let actionBtnHtml = '';
    let resultMessage = '';

    if (passed) {
        // Save course approval
        const userKey = `trainings_${state.currentUser.email}`;
        state.trainings[state.activeCourse.id] = {
            status: "completed",
            score: 100,
            date: new Date().toLocaleDateString('es-ES')
        };
        localStorage.setItem(userKey, JSON.stringify(state.trainings));

        // Re-render other components
        renderCoursesGrid();
        renderDashboard();

        resultMessage = `
            <h4 style="color: var(--color-primary-light); font-size: 20px; font-weight: 700;">🎉 ¡Curso Aprobado! (100% de Aciertos)</h4>
            <p style="font-size: 13.5px; color: var(--color-text-muted); margin-top: 8px;">Excelente desempeño en tiempo real. Tu acreditación digital ha sido generada.</p>
        `;
        actionBtnHtml = `
            <button type="button" class="btn-primary w-full" style="padding: 12px 18px;" onclick="closeModal('modal-course'); openCertificateModal('${state.activeCourse.title}');">
                Obtener Certificado
            </button>
        `;
    } else {
        resultMessage = `
            <h4 style="color: var(--color-error); font-size: 20px; font-weight: 700;">❌ Curso No Aprobado</h4>
            <p style="font-size: 13.5px; color: var(--color-text-muted); margin-top: 8px;">Respondiste correctamente ${triviaState.correctAnswers} de ${totalQuestions} preguntas.<br>Debes acertar todas las preguntas para obtener tu certificado corporativo.</p>
        `;
        actionBtnHtml = `
            <button type="button" class="btn-warning w-full" style="padding: 12px 18px;" onclick="startTriviaGame()">
                Intentar de Nuevo
            </button>
        `;
    }

    container.innerHTML = `
        <div class="trivia-wrapper" style="text-align: center; max-width: 500px; margin: 0 auto;">
            <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: #fff;">Fin del Quiz de Trivia</h3>
            <div style="font-size: 14px; margin-top: 4px; color: var(--color-text-muted);">Puntuación final: <strong>${triviaState.score} puntos</strong></div>
            
            ${podiumHtml}
            
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                ${resultMessage}
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button type="button" class="btn-secondary w-full" onclick="closeModal('modal-course')">Cerrar</button>
                ${actionBtnHtml}
            </div>
        </div>
    `;
}

window.startTriviaGame = startTriviaGame;
window.selectTriviaAnswer = selectTriviaAnswer;
window.nextTriviaStep = nextTriviaStep;

/* ==========================================================================
   CERTIFICATES DRAWING
   ========================================================================== */
function openCertificateModal(courseTitle, workerName) {
    document.getElementById("cert-recipient-name").textContent = workerName || state.currentUser.name;
    document.getElementById("cert-course-title").textContent = courseTitle;
    document.getElementById("cert-issue-date").textContent = new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    openModal("modal-certificate");
}

function printCertificate() {
    document.body.classList.add("printing-certificate");
    window.print();
    document.body.classList.remove("printing-certificate");
}

// Procesar el envío del quiz de capacitación (previene el comportamiento por defecto)
function handleQuizSubmit(e) {
    if (e) e.preventDefault();
}

/* ==========================================================================
   GLOBAL OVERLAY MODALS ROUTINE
   ========================================================================== */
function openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
    if (modalId === 'modal-course' && triviaState && triviaState.timerInterval) {
        clearInterval(triviaState.timerInterval);
    }
}

/* ==========================================================================
   MONTHLY & ANNUAL HISTORICAL ANALYTICS VIEW
   ========================================================================== */
function renderAnalyticsView() {
    const year = parseInt(document.getElementById("analytics-year").value);
    const monthSelect = document.getElementById("analytics-month").value;
    const isAnnual = monthSelect === 'all';
    const month = isAnnual ? null : parseInt(monthSelect);
    
    const periodBadge = document.getElementById("analytics-period-badge");
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    if (isAnnual) {
        periodBadge.textContent = `Año ${year}`;
    } else {
        periodBadge.textContent = `${monthNames[month]} ${year}`;
    }

    // Filter reports for selected period
    const periodReports = state.reports.filter(r => {
        const rDate = new Date(r.datetime);
        const matchYear = rDate.getFullYear() === year;
        const matchMonth = isAnnual || rDate.getMonth() === month;
        return matchYear && matchMonth;
    });

    // 1. Compute Metrics
    const totalWeight = periodReports.reduce((sum, r) => sum + parseFloat(r.weight), 0);
    const totalCost = periodReports.reduce((sum, r) => sum + calculateDisposalCost(r.type, r.weight), 0);
    const deliveryCount = periodReports.length;
    const averageWeight = deliveryCount > 0 ? (totalWeight / deliveryCount) : 0;
    
    const collectedReports = periodReports.filter(r => r.status === 'collected');
    const collectedWeight = collectedReports.reduce((sum, r) => sum + parseFloat(r.weight), 0);
    const collectionRate = totalWeight > 0 ? Math.round((collectedWeight / totalWeight) * 100) : 0;

    // Update Metrics UI
    document.getElementById("analytics-total-weight").textContent = `${totalWeight.toFixed(1)} kg`;
    document.getElementById("analytics-delivery-count").textContent = `${deliveryCount} entregas registradas`;
    document.getElementById("analytics-collected-weight").textContent = `${collectedWeight.toFixed(1)} kg`;
    document.getElementById("analytics-collection-rate").textContent = `${collectionRate}% tasa de retiro`;
    document.getElementById("analytics-average-weight").textContent = `${averageWeight.toFixed(1)} kg`;
    document.getElementById("analytics-total-cost").textContent = formatCurrency(totalCost);

    // 2. Render Vertical Monthly Trend Chart
    const trendWidget = document.getElementById("analytics-trend-widget");
    const trendBars = document.getElementById("analytics-trend-bars");
    
    if (isAnnual) {
        trendWidget.classList.remove("hidden");
        trendBars.innerHTML = '';
        
        // Calculate weight and cost by month
        const monthlySums = Array(12).fill(0);
        const monthlyCosts = Array(12).fill(0);
        periodReports.forEach(r => {
            const rDate = new Date(r.datetime);
            const mIdx = rDate.getMonth();
            monthlySums[mIdx] += parseFloat(r.weight);
            monthlyCosts[mIdx] += calculateDisposalCost(r.type, r.weight);
        });
        
        const maxMonthSum = Math.max(...monthlySums, 1);
        const shortMonthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        
        monthlySums.forEach((sum, idx) => {
            const heightPercent = (sum / maxMonthSum) * 100;
            const costSum = monthlyCosts[idx];
            const barWrapper = document.createElement("div");
            barWrapper.className = "trend-bar-wrapper";
            barWrapper.innerHTML = `
                <div class="trend-bar-fill" style="height: ${heightPercent > 0 ? Math.max(heightPercent, 3) : 0}%">
                    <div class="trend-bar-value">
                        <div>${sum.toFixed(0)} kg</div>
                        <div style="color: var(--color-warning); font-size: 9px; margin-top: 2px;">${formatCurrency(costSum)}</div>
                    </div>
                </div>
                <span class="trend-bar-label">${shortMonthNames[idx]}</span>
            `;
            trendBars.appendChild(barWrapper);
        });
        document.getElementById("analytics-trend-title").textContent = `Tendencia de Generación Mensual para el Año ${year} (kg / $)`;
    } else {
        trendWidget.classList.remove("hidden");
        trendBars.innerHTML = '';
        
        // Generate sums and costs for days 1-31
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dailySums = Array(daysInMonth).fill(0);
        const dailyCosts = Array(daysInMonth).fill(0);
        periodReports.forEach(r => {
            const rDate = new Date(r.datetime);
            const dIdx = rDate.getDate() - 1;
            dailySums[dIdx] += parseFloat(r.weight);
            dailyCosts[dIdx] += calculateDisposalCost(r.type, r.weight);
        });
        
        const maxDailySum = Math.max(...dailySums, 1);
        
        dailySums.forEach((sum, idx) => {
            const dayNum = idx + 1;
            const heightPercent = (sum / maxDailySum) * 100;
            const costSum = dailyCosts[idx];
            const barWrapper = document.createElement("div");
            barWrapper.className = "trend-bar-wrapper";
            
            const shouldShowLabel = dayNum === 1 || dayNum === 5 || dayNum === 10 || dayNum === 15 || dayNum === 20 || dayNum === 25 || dayNum === daysInMonth;
            
            barWrapper.innerHTML = `
                <div class="trend-bar-fill" style="height: ${heightPercent > 0 ? Math.max(heightPercent, 3) : 0}%">
                    <div class="trend-bar-value">
                        <div>Día ${dayNum}: ${sum.toFixed(0)} kg</div>
                        <div style="color: var(--color-warning); font-size: 9px; margin-top: 2px;">${formatCurrency(costSum)}</div>
                    </div>
                </div>
                <span class="trend-bar-label" style="font-size: 9px;">${shouldShowLabel ? 'D' + dayNum : ''}</span>
            `;
            trendBars.appendChild(barWrapper);
        });
        document.getElementById("analytics-trend-title").textContent = `Distribución Diaria en ${monthNames[month]} ${year} (kg / $)`;
    }

    // 3. Render Period Donut Chart
    const typeWeights = {};
    periodReports.forEach(r => {
        typeWeights[r.type] = (typeWeights[r.type] || 0) + parseFloat(r.weight);
    });

    const COLORS_MAP = {
        'Hidrocarburos': '#10b981',
        'Ácidos': '#ef4444',
        'Básicos': '#06b6d4',
        'Envases contaminados': '#f59e0b',
        'Sólidos impregnados': '#a855f7',
        'Luminarias': '#3b82f6'
    };

    const donutChart = document.getElementById("analytics-donut-chart");
    const legendList = document.getElementById("analytics-legend-list");
    
    const oldSegments = donutChart.querySelectorAll('.donut-segment');
    oldSegments.forEach(el => el.remove());
    legendList.innerHTML = '';

    document.getElementById("analytics-donut-total").textContent = `${totalWeight.toFixed(0)} kg`;

    if (totalWeight === 0) {
        legendList.innerHTML = '<p class="text-xs text-muted text-center py-4">No hay datos en el período.</p>';
    } else {
        let accumulatedPercent = 0;
        const radius = 70;
        const circumference = 2 * Math.PI * radius;

        const sortedTypes = Object.entries(typeWeights).sort((a,b) => b[1] - a[1]);
        sortedTypes.forEach(([type, weight]) => {
            const percentage = (weight / totalWeight) * 100;
            const strokeColor = COLORS_MAP[type] || '#6b7280';
            
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("class", "donut-segment");
            circle.setAttribute("cx", "100");
            circle.setAttribute("cy", "100");
            circle.setAttribute("r", radius.toString());
            circle.setAttribute("fill", "none");
            circle.setAttribute("stroke", strokeColor);
            circle.setAttribute("stroke-width", "24");
            
            const strokeDashOffset = circumference - (percentage / 100) * circumference;
            circle.setAttribute("stroke-dasharray", `${circumference} ${circumference}`);
            circle.setAttribute("stroke-dashoffset", strokeDashOffset.toString());
            circle.setAttribute("transform", `rotate(${accumulatedPercent / 100 * 360 - 90} 100 100)`);
            donutChart.appendChild(circle);

            const legendItem = document.createElement("div");
            legendItem.className = "legend-item";
            const typeCost = calculateDisposalCost(type, weight);
            legendItem.innerHTML = `
                <div class="legend-label-group">
                    <span class="legend-color" style="background-color: ${strokeColor}"></span>
                    <span style="font-size: 11px;">${type}</span>
                </div>
                <div class="legend-weight" style="font-size: 11px; text-align: right;">
                    <div>${weight.toFixed(0)} kg (${percentage.toFixed(0)}%)</div>
                    <div style="color: var(--color-warning); font-weight: 500;">${formatCurrency(typeCost)}</div>
                </div>
            `;
            legendList.appendChild(legendItem);

              accumulatedPercent += percentage;
          });
      }

      // 4. Renderizar gráficos de barras de área for Period
      const areaWeights = {};
      const ALL_AREAS = ["Producción", "Mantenimiento", "Laboratorio", "Logística", "Oficinas"];
      ALL_AREAS.forEach(area => areaWeights[area] = 0);

      let maxAreaWeight = 0;
      periodReports.forEach(r => {
          areaWeights[r.area] += parseFloat(r.weight);
      });
      Object.values(areaWeights).forEach(val => {
          if (val > maxAreaWeight) maxAreaWeight = val;
      });

      const barList = document.getElementById("analytics-areas-bar-list");
      barList.innerHTML = '';

      ALL_AREAS.forEach(area => {
          const weight = areaWeights[area];
          const percentOfMax = maxAreaWeight > 0 ? (weight / maxAreaWeight) * 100 : 0;
          
          const barRow = document.createElement("div");
          barRow.className = "bar-row";
          barRow.innerHTML = `
              <div class="bar-info">
                  <span class="bar-area-name">${area}</span>
                  <span class="bar-area-val">${weight.toFixed(1)} kg</span>
              </div>
              <div class="bar-track" style="height: 5px;">
                  <div class="bar-fill" style="width: ${percentOfMax}%"></div>
              </div>
          `;
          barList.appendChild(barRow);
      });

      // 5. Smart Analytics Insights
      const insightsContainer = document.getElementById("analytics-insights-container");
      insightsContainer.innerHTML = '';

      if (deliveryCount === 0) {
          insightsContainer.innerHTML = `
              <div class="alert-item alert-info">
                  <div class="alert-indicator"></div>
                  <div class="alert-content">
                      <h5>Sin registros</h5>
                      <p>No se encontraron entregas de RESPEL para el período seleccionado.</p>
                  </div>
              </div>
          `;
      } else {
          const sortedTypes = Object.entries(typeWeights).sort((a,b) => b[1] - a[1]);
          const sortedAreas = Object.entries(areaWeights).sort((a,b) => b[1] - a[1]);
          
          const mainType = sortedTypes[0] ? sortedTypes[0][0] : "Ninguno";
          const mainTypeWeight = sortedTypes[0] ? sortedTypes[0][1] : 0;
          const mainArea = sortedAreas[0] ? sortedAreas[0][0] : "Ninguna";
          const mainAreaWeight = sortedAreas[0] ? sortedAreas[0][1] : 0;

          const alertDiv = document.createElement("div");
          alertDiv.className = "alert-item alert-info";
          alertDiv.setAttribute("style", "border-left: 3px solid var(--color-primary); background: rgba(16, 185, 129, 0.02);");
          alertDiv.innerHTML = `
              <div class="alert-indicator" style="background-color: var(--color-primary);"></div>
              <div class="alert-content">
                  <h5>Análisis del Período</h5>
                  <p>Durante este ciclo se registraron <strong>${deliveryCount} entregas</strong>, sumando un total de <strong>${totalWeight.toFixed(1)} kg</strong> con un costo estimado de disposición de <strong>${formatCurrency(totalCost)}</strong>.</p>
                  <p class="mt-2" style="font-size: 12px; line-height: 1.4;">
                      • El residuo de mayor volumen fue <strong>${mainType}</strong> (${mainTypeWeight.toFixed(1)} kg).<br>
                      • El área de mayor generación fue <strong>${mainArea}</strong> (${mainAreaWeight.toFixed(1)} kg).<br>
                      • La tasa de retiro por parte del gestor externo se situó en el <strong>${collectionRate}%</strong>.
                  </p>
              </div>
          `;
          insightsContainer.appendChild(alertDiv);
      }

      // 6. Comparative Period calculations & rendering
      let prevYear = year;
      let prevMonth = month;
      let periodLabelText = '';
      
      if (isAnnual) {
          prevYear = year - 1;
          periodLabelText = `vs Año ${prevYear}`;
      } else {
          if (month === 0) {
              prevMonth = 11;
              prevYear = year - 1;
          } else {
              prevMonth = month - 1;
          }
          const shortMonthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
          periodLabelText = `vs ${shortMonthNames[prevMonth]} ${prevYear}`;
      }
      
      // Filter reports for previous period
      const prevReports = state.reports.filter(r => {
          const rDate = new Date(r.datetime);
          const matchYear = rDate.getFullYear() === prevYear;
          const matchMonth = isAnnual || rDate.getMonth() === prevMonth;
          return matchYear && matchMonth;
      });
      
      const prevWeight = prevReports.reduce((sum, r) => sum + parseFloat(r.weight), 0);
      const prevCost = prevReports.reduce((sum, r) => sum + calculateDisposalCost(r.type, r.weight), 0);

      // Weight changes
      let weightChangePct = 0;
      let weightChangeClass = 'change-neutral';
      let weightChangeArrow = '•';
      let weightChangeText = 'sin variación';
      
      if (prevWeight > 0) {
          const diff = totalWeight - prevWeight;
          weightChangePct = Math.round((diff / prevWeight) * 100);
          if (diff > 0) {
              weightChangeClass = 'change-up';
              weightChangeArrow = '▲';
              weightChangeText = 'incremento';
          } else if (diff < 0) {
              weightChangeClass = 'change-down';
              weightChangeArrow = '▼';
              weightChangeText = 'reducción';
          }
      } else if (totalWeight > 0) {
          weightChangePct = 100;
          weightChangeClass = 'change-up';
          weightChangeArrow = '▲';
          weightChangeText = 'nuevo registro';
      }

      // Cost changes
      let costChangePct = 0;
      let costChangeClass = 'change-neutral';
      let costChangeArrow = '•';
      let costChangeText = 'sin variación';
      
      if (prevCost > 0) {
          const diff = totalCost - prevCost;
          costChangePct = Math.round((diff / prevCost) * 100);
          if (diff > 0) {
              costChangeClass = 'change-up';
              costChangeArrow = '▲';
              costChangeText = 'incremento';
          } else if (diff < 0) {
              costChangeClass = 'change-down';
              costChangeArrow = '▼';
              costChangeText = 'reducción';
          }
      } else if (totalCost > 0) {
          costChangePct = 100;
          costChangeClass = 'change-up';
          costChangeArrow = '▲';
          costChangeText = 'nuevo registro';
      }

      const comparisonLabel = document.getElementById("analytics-comparison-label");
      const comparisonContent = document.getElementById("analytics-comparison-content");
      
      if (comparisonLabel && comparisonContent) {
          comparisonLabel.textContent = periodLabelText;
          
          comparisonContent.innerHTML = `
              <div class="comparison-cards-grid">
                  <div class="comp-card">
                      <div class="comp-card-title">Generación de Residuos (Peso)</div>
                      <div class="comp-metrics-row">
                          <div class="comp-metric-item">
                              <span class="comp-metric-label">Período Actual</span>
                              <span class="comp-metric-value">${totalWeight.toFixed(1)} kg</span>
                          </div>
                          <div class="comp-metric-divider"></div>
                          <div class="comp-metric-item">
                              <span class="comp-metric-label">Período Anterior</span>
                              <span class="comp-metric-value">${prevWeight.toFixed(1)} kg</span>
                          </div>
                      </div>
                      <div class="comp-footer">
                          <span class="comp-badge ${weightChangeClass}">
                              <span class="comp-arrow">${weightChangeArrow}</span>
                              ${Math.abs(weightChangePct)}% ${weightChangeText}
                          </span>
                      </div>
                  </div>
                  
                  <div class="comp-card">
                      <div class="comp-card-title">Costo de Disposición Final</div>
                      <div class="comp-metrics-row">
                          <div class="comp-metric-item">
                              <span class="comp-metric-label">Período Actual</span>
                              <span class="comp-metric-value" style="color: var(--color-warning);">${formatCurrency(totalCost)}</span>
                          </div>
                          <div class="comp-metric-divider"></div>
                          <div class="comp-metric-item">
                              <span class="comp-metric-label">Período Anterior</span>
                              <span class="comp-metric-value">${formatCurrency(prevCost)}</span>
                          </div>
                      </div>
                      <div class="comp-footer">
                          <span class="comp-badge ${costChangeClass}">
                              <span class="comp-arrow">${costChangeArrow}</span>
                              ${Math.abs(costChangePct)}% ${costChangeText}
                          </span>
                      </div>
                  </div>
              </div>
          `;
      }
}

// Global exposure for event handlers in HTML templates
window.setDemoCredentials = setDemoCredentials;
window.switchView = switchView;
window.closeModal = closeModal;
window.startCourse = startCourse;
window.handleRowSelectToggle = handleRowSelectToggle;
window.printCertificate = printCertificate;
window.renderAnalyticsView = renderAnalyticsView;

/* ==========================================================================
   INCIDENT & SPILL MANAGEMENT
   ========================================================================== */
function renderIncidentsView() {
    // Fill datetime default
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    document.getElementById("inc-datetime").value = localISOTime;

    const tbody = document.getElementById("incidents-table-body");
    tbody.innerHTML = '';

    const sortedIncidents = [...state.incidents].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    if (sortedIncidents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No se registran incidentes ambientales.</td></tr>';
        return;
    }

    sortedIncidents.forEach(inc => {
        const tr = document.createElement("tr");
        const formattedDate = new Date(inc.datetime).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        tr.innerHTML = `
            <td><strong>${formattedDate}</strong></td>
            <td>${inc.area}</td>
            <td><span class="badge badge-accent">${inc.substance}</span></td>
            <td><strong>${parseFloat(inc.volume).toFixed(1)} L</strong></td>
            <td>${inc.kitUsed}</td>
            <td><span class="status-pill status-stored"><span class="status-dot"></span>${inc.status}</span></td>
            <td>
                <div style="font-weight:600; color:#fff; margin-bottom:2px;">${inc.desc}</div>
                <div class="text-xs text-muted"><strong>Control:</strong> ${inc.action}</div>
                <div class="text-xs text-muted" style="margin-top:2px;">Registrado por: ${inc.operator || 'Operador'}</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleIncidentSubmit(e) {
    e.preventDefault();

    const datetime = document.getElementById("inc-datetime").value;
    const area = document.getElementById("inc-area").value;
    const substance = document.getElementById("inc-substance").value;
    const volume = parseFloat(document.getElementById("inc-volume").value);
    const kitUsed = document.querySelector('input[name="inc-kit"]:checked').value;
    const desc = document.getElementById("inc-desc").value.trim();
    const action = document.getElementById("inc-action").value.trim();

    if (!datetime || !area || !substance || isNaN(volume) || !desc || !action) {
        alert("Por favor complete todos los campos.");
        return;
    }

    const newIncident = {
        id: "inc-" + Date.now(),
        datetime: datetime,
        area: area,
        substance: substance,
        volume: volume,
        kitUsed: kitUsed,
        status: "Controlado",
        operator: state.currentUser.name,
        desc: desc,
        action: action
    };

    state.incidents.push(newIncident);
    localStorage.setItem("ecomeq_incidents", JSON.stringify(state.incidents));

    // Restablecer formulario
    document.getElementById("incident-report-form").reset();
    
    // Actualizar tabla y notificar
    renderIncidentsView();
    openModal("modal-success");
}

/* ==========================================================================
   SAFETY DATA SHEETS (FDS / MSDS) LIBRARY
   ========================================================================== */
const SDS_DATABASE = {
    'hidrocarburos': {
        title: "FDS - Aceite Hidráulico Usado (Hidrocarburo)",
        sub: "Sustancia Inflamable y Peligrosa para el Medio Ambiente",
        cas: "64742-54-7 (Aceite base lubricante)",
        pictograms: ['Inflamable', 'Medio Ambiente'],
        p1: "Inhalación: Retirar al aire libre. Contacto con la piel: Lavar con agua y jabón abundante. Ojos: Lavar con agua por 15 min. Ingestión: NO inducir el vómito, buscar atención médica inmediata.",
        p2: "Usar espuma química, polvo químico seco o dióxido de carbono (CO2). NO utilizar chorros directos de agua, ya que pueden esparcir el fuego.",
        p3: "Evitar chispas y llamas abiertas. Almacenar en bidones plásticos/metálicos cerrados, ubicados sobre estibas antiderrame bajo techo ventilado.",
        p4: "Guantes de nitrilo o neoprene, monogafas químicas y botas de seguridad con resistencia a aceites."
    },
    'acidos': {
        title: "FDS - Ácido Sulfúrico Concentrado (Ácido Corrosivo)",
        sub: "Sustancia Fuertemente Corrosiva (pH < 1.5)",
        cas: "7664-93-9",
        pictograms: ['Corrosivo', 'Toxicidad Aguda'],
        p1: "Inhalación: Trasladar al aire libre. Piel: Enjuagar con agua corriente durante 15 minutos en ducha de emergencia. Ojos: Lavar con chorro de agua suave durante 20 minutos. Ingestión: Enjuagar la boca, beber agua. NO inducir vómito.",
        p2: "El producto no es inflamable. En caso de incendio circundante, usar polvo químico seco, CO2. Evitar el contacto directo de agua con el ácido concentrado.",
        p3: "Almacenar sobre estibas antiderrame de polietileno (plásticas), separado de bases o metales. Envases herméticos etiquetados.",
        p4: "Monogafas herméticas, pantalla facial, guantes de nitrilo/neopreno de caña alta, delantal o peto de PVC y botas químicas."
    },
    'basicos': {
        title: "FDS - Hidróxido de Sodio (Soda Cáustica / Básicos)",
        sub: "Sustancia Fuertemente Alcalina (pH > 13)",
        cas: "1310-73-2",
        pictograms: ['Corrosivo'],
        p1: "Inhalación: Retirar de la zona de exposición. Piel: Retirar ropa contaminada y lavar con abundante agua por 15 minutos. Ojos: Lavar inmediatamente con agua corriente. Ingestión: Lavar boca con agua, dar a beber leche o agua. NO inducir vómito.",
        p2: "No inflamable. En presencia de fuego usar medios de extinción según los materiales circundantes.",
        p3: "Almacenar alejado de ácidos y en envases plásticos bien cerrados. Sensible a la humedad.",
        p4: "Gafas de seguridad química con ajuste hermético, guantes de caucho de caña larga, botas y delantal impermeable."
    },
    'solventes': {
        title: "FDS - Solvente de Limpieza / Varsol",
        sub: "Líquido Inflamable y Nocivo para la Salud",
        cas: "8052-41-3",
        pictograms: ['Inflamable', 'Toxicidad Aguda', 'Peligro de Aspiración'],
        p1: "Inhalación: Llevar al aire libre. Piel: Quitar ropa contaminada y lavar con agua y jabón. Ojos: Enjuagar con agua limpia por 15 minutos. Ingestión: Peligro de aspiración a los pulmones. NO inducir el vómito. Buscar auxilio médico.",
        p2: "Polvo químico seco, espuma resistente al alcohol, CO2. Enfriar envases expuestos con agua pulverizada.",
        p3: "Mantener alejado de fuentes de calor, chispas y superficies calientes. Conectar recipientes a tierra para trasvases.",
        p4: "Uso obligatorio de respirador con filtro para vapores orgánicos, guantes de nitrilo y antiparras protectoras."
    }
};

// Renderizar una tarjeta de FDS individual en el contenedor
function renderSingleSdsCard(container, id, sds) {
    const card = document.createElement("div");
    card.className = "course-card";
    
    let pictosHtml = '';
    const pictograms = sds.pictograms || [];
    pictograms.forEach(pic => {
        pictosHtml += `<span class="badge badge-warning" style="margin-right:4px; font-size:10px;">${pic}</span>`;
    });

    const badgeText = sds.isCustom ? 'Ficha Cargada' : 'SGA Cumplimiento';
    const canManage = sds.isCustom && isCoordinador(state.currentUser);

    card.innerHTML = `
        <div class="course-icon-badge" style="color:var(--color-warning);">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <h4>${sds.title}</h4>
        <p>${sds.sub}<br><span class="text-xs" style="font-family:monospace; color:#888;">CAS: ${sds.cas}</span></p>
        <div style="margin-bottom: 16px;">
            ${pictosHtml}
        </div>
        <div class="course-footer" style="flex-wrap: wrap; gap: 8px;">
            <span class="course-status-badge status-completed">${badgeText}</span>
            <div style="display: flex; gap: 6px; margin-left: auto;">
                <button class="btn-accent btn-xs" onclick="openSdsModal('${id}')">${canManage ? 'Abrir' : 'Abrir Ficha'}</button>
                ${canManage ? `
                    <button class="btn-primary btn-xs" onclick="startSdsEdit('${id}')">Editar</button>
                    <button class="btn-danger btn-xs" onclick="deleteSds('${id}')">Eliminar</button>
                ` : ''}
            </div>
        </div>
    `;
    container.appendChild(card);
}

// Renderizar la grilla de FDS (combina las estáticas y las personalizadas)
function renderSdsGrid() {
    const container = document.getElementById("sds-grid-container");
    if (!container) return;
    container.innerHTML = '';

    // Dibujar FDS estáticas
    Object.entries(SDS_DATABASE).forEach(([id, sds]) => {
        renderSingleSdsCard(container, id, sds);
    });

    // Dibujar FDS personalizadas (cargadas por el administrador)
    if (state.customSds) {
        state.customSds.forEach(sds => {
            renderSingleSdsCard(container, sds.id, sds);
        });
    }
}

// Abrir el modal de visualización de FDS
function openSdsModal(sdsId) {
    const bodyContent = document.getElementById("sds-modal-body-content");
    const titleEl = document.getElementById("sds-modal-title");

    // Limpiar variables de FDS personalizada activa
    state.currentActiveSdsData = null;
    state.currentActiveSdsName = null;
    state.currentActiveSdsType = null;

    const isCustom = sdsId.startsWith('custom-');
    if (isCustom) {
        const sds = state.customSds.find(s => s.id === sdsId);
        if (!sds) return;

        titleEl.textContent = sds.title;
        
        let pictosHtml = '';
        sds.pictograms.forEach(pic => {
            pictosHtml += `<span style="background:#fef08a; border:2px solid #ca8a04; color:#854d0e; padding:6px 12px; font-weight:700; border-radius:4px; margin-right:8px; font-size:12px; display:inline-block;">⚠️ ${pic.toUpperCase()}</span>`;
        });

        // Generar visor para PDF o caja de descarga para Word
        let previewHtml = '';
        if (sds.fileType === 'application/pdf') {
            previewHtml = `
                <div style="margin-top:20px; border:1px solid #ccc; border-radius:4px; overflow:hidden; height:450px;">
                    <embed src="${sds.fileData}" type="application/pdf" width="100%" height="100%" />
                </div>
            `;
        } else {
            previewHtml = `
                <div style="margin-top:20px; padding:30px; border:2px dashed #004b9c; border-radius:8px; text-align:center; background:rgba(0, 75, 156, 0.03);">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="#004b9c" stroke-width="1.5" fill="none" style="margin-bottom:12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <h4 style="margin:0 0 8px 0; color:#004b9c;">Documento de Word Cargado</h4>
                    <p style="margin:0 0 16px 0; font-size:13px; color:#555;">Nombre del archivo: <strong>${sds.fileName}</strong></p>
                    <a href="${sds.fileData}" download="${sds.fileName}" class="btn-primary" style="display:inline-block; text-decoration:none; padding:10px 20px; font-size:13px; border-radius:6px; color:#fff;">Descargar Documento Word</a>
                </div>
            `;
        }

        bodyContent.innerHTML = `
            <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
                <h2 style="margin:0; font-size:20px; color:#111;">FICHA DE DATOS DE SEGURIDAD CARGADA</h2>
                <span style="font-size:11px; color:#555; text-transform:uppercase;">Ecomeq S.A. - Control Interno</span>
            </div>

            <div style="margin-bottom: 20px;">
                <table style="width:100%; border:1px solid #ccc; font-size:13px; color:#111;">
                    <tr>
                        <td style="padding:8px; background:#f3f4f6; font-weight:700; width:30%; border-bottom:1px solid #ccc;">Nombre Químico:</td>
                        <td style="padding:8px; border-bottom:1px solid #ccc;">${sds.title}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; background:#f3f4f6; font-weight:700; border-bottom:1px solid #ccc;">Número CAS:</td>
                        <td style="padding:8px; border-bottom:1px solid #ccc; font-family:monospace;">${sds.cas}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; background:#f3f4f6; font-weight:700; border-bottom:1px solid #ccc;">Descripción:</td>
                        <td style="padding:8px; border-bottom:1px solid #ccc;">${sds.sub}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="margin:0 0 10px 0; color:#111;">Pictogramas de Advertencia (SGA):</h4>
                <div>
                    ${sds.pictograms.length > 0 ? pictosHtml : '<span style="font-size:13px; color:#555;">No se seleccionaron pictogramas.</span>'}
                </div>
            </div>

            <div style="margin-bottom: 20px; border-top:1px solid #ccc; padding-top:15px;">
                <h4 style="margin:0 0 10px 0; color:#111; display:flex; justify-content:space-between; align-items:center;">
                    <span>Visualización / Descarga del Documento:</span>
                    <a href="${sds.fileData}" download="${sds.fileName}" style="font-size:12px; color:#004b9c; text-decoration:underline;">Descargar Original (${sds.fileName})</a>
                </h4>
                ${previewHtml}
            </div>
        `;

        state.currentActiveSdsData = sds.fileData;
        state.currentActiveSdsName = sds.fileName;
        state.currentActiveSdsType = sds.fileType;
    } else {
        const sds = SDS_DATABASE[sdsId];
        if (!sds) return;

        titleEl.textContent = sds.title;
        
        let pictosHtml = '';
        sds.pictograms.forEach(pic => {
            pictosHtml += `<span style="background:#fef08a; border:2px solid #ca8a04; color:#854d0e; padding:6px 12px; font-weight:700; border-radius:4px; margin-right:8px; font-size:12px; display:inline-block;">⚠️ ${pic.toUpperCase()}</span>`;
        });

        bodyContent.innerHTML = `
            <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
                <h2 style="margin:0; font-size:22px; color:#111;">FICHA DE DATOS DE SEGURIDAD</h2>
                <span style="font-size:12px; color:#555; text-transform:uppercase;">Ecomeq S.A. - Sistema SGA</span>
            </div>

            <div style="margin-bottom: 20px;">
                <table style="width:100%; border:1px solid #ccc; font-size:13px; color:#111;">
                    <tr>
                        <td style="padding:8px; background:#f3f4f6; font-weight:700; width:30%; border-bottom:1px solid #ccc;">Nombre Químico:</td>
                        <td style="padding:8px; border-bottom:1px solid #ccc;">${sds.title.replace('FDS - ', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; background:#f3f4f6; font-weight:700; border-bottom:1px solid #ccc;">Identificación CAS:</td>
                        <td style="padding:8px; border-bottom:1px solid #ccc; font-family:monospace;">${sds.cas}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; background:#f3f4f6; font-weight:700;">Clasificación de Peligro:</td>
                        <td style="padding:8px;">${pictosHtml}</td>
                    </tr>
                </table>
            </div>

            <div style="display:flex; flex-direction:column; gap:16px; font-size:13.5px; color:#333; line-height:1.5;">
                <div>
                    <h4 style="background:#e5e7eb; color:#111; padding:6px 10px; margin:0 0 8px 0; border-left:4px solid #004b9c;">SECCIÓN 4: PRIMEROS AUXILIOS</h4>
                    <p style="margin:0; padding-left:10px;">${sds.p1}</p>
                </div>
                <div>
                    <h4 style="background:#e5e7eb; color:#111; padding:6px 10px; margin:0 0 8px 0; border-left:4px solid #004b9c;">SECCIÓN 5: MEDIDAS DE LUCHA CONTRA INCENDIOS</h4>
                    <p style="margin:0; padding-left:10px;">${sds.p2}</p>
                </div>
                <div>
                    <h4 style="background:#e5e7eb; color:#111; padding:6px 10px; margin:0 0 8px 0; border-left:4px solid #004b9c;">SECCIÓN 7: MANIPULACIÓN Y ALMACENAMIENTO</h4>
                    <p style="margin:0; padding-left:10px;">${sds.p3}</p>
                </div>
                <div>
                    <h4 style="background:#e5e7eb; color:#111; padding:6px 10px; margin:0 0 8px 0; border-left:4px solid #004b9c;">SECCIÓN 8: CONTROL DE EXPOSICIÓN / EPP</h4>
                    <p style="margin:0; padding-left:10px;"><strong>EPP Obligatorio:</strong> ${sds.p4}</p>
                </div>
            </div>
        `;
    }

    openModal("modal-sds-view");
}

// Imprimir la FDS activa (maneja también la impresión de documentos PDF cargados)
function printSDS() {
    if (state.currentActiveSdsData) {
        if (state.currentActiveSdsType === 'application/pdf') {
            const printWindow = window.open();
            if (printWindow) {
                printWindow.document.write(`<iframe src="${state.currentActiveSdsData}" style="width:100%; height:100%; border:none;"></iframe>`);
                printWindow.document.title = state.currentActiveSdsName;
                setTimeout(() => { 
                    printWindow.print(); 
                }, 500);
            } else {
                alert("Bloqueador de ventanas emergentes activo. Por favor descargue el PDF original para imprimir.");
            }
        } else {
            // Si es Word, forzar descarga para que puedan imprimir desde Microsoft Word
            const link = document.createElement('a');
            link.href = state.currentActiveSdsData;
            link.download = state.currentActiveSdsName;
            link.click();
            alert("No se puede imprimir directamente un archivo de Word en el navegador. Se ha descargado el archivo para que lo abra e imprima.");
        }
    } else {
        document.body.classList.add("printing-sds");
        window.print();
        document.body.classList.remove("printing-sds");
    }
}

// Procesar el envío del formulario de carga de FDS (Coordinador)
function handleSdsUploadSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById("new-sds-title").value.trim();
    const sub = document.getElementById("new-sds-sub").value.trim();
    const cas = document.getElementById("new-sds-cas").value.trim();
    const fileInput = document.getElementById("new-sds-file");
    const selectedPictos = Array.from(document.querySelectorAll('input[name="new-sds-picto"]:checked')).map(cb => cb.value);
    
    // Validar campos de texto comunes
    if (!title || !sub || !cas) {
        alert("Por favor rellene todos los campos de texto.");
        return;
    }
    
    // Si estamos editando una ficha existente
    if (state.editingSdsId) {
        const sdsIndex = state.customSds.findIndex(s => s.id === state.editingSdsId);
        if (sdsIndex === -1) {
            alert("No se encontró la ficha que se intenta modificar.");
            cancelSdsEdit();
            return;
        }
        
        const existingSds = state.customSds[sdsIndex];
        
        // Si el usuario cargó un archivo nuevo durante la edición
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            if (file.size > 2 * 1024 * 1024) {
                alert("El archivo supera el tamaño máximo permitido de 2 MB para almacenamiento local.");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                const fileData = evt.target.result;
                
                existingSds.title = title;
                existingSds.sub = sub;
                existingSds.cas = cas;
                existingSds.pictograms = selectedPictos;
                existingSds.fileData = fileData;
                existingSds.fileName = file.name;
                existingSds.fileType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/msword');
                
                saveAndRefreshSdsEdit();
            };
            
            reader.onerror = function() {
                alert("Ocurrió un error al leer el nuevo archivo. Inténtelo de nuevo.");
            };
            
            reader.readAsDataURL(file);
        } else {
            // Si no se cargó un archivo nuevo, guardar solo los metadatos
            existingSds.title = title;
            existingSds.sub = sub;
            existingSds.cas = cas;
            existingSds.pictograms = selectedPictos;
            
            saveAndRefreshSdsEdit();
        }
        return;
    }
    
    // Lógica para registrar una nueva ficha (archivo es obligatorio)
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Por favor cargue un archivo PDF o Word para la nueva ficha.");
        return;
    }
    
    const file = fileInput.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
        alert("El archivo supera el tamaño máximo permitido de 2 MB para almacenamiento local.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        const fileData = evt.target.result;
        
        const newSds = {
            id: 'custom-' + Date.now(),
            title: title,
            sub: sub,
            cas: cas,
            pictograms: selectedPictos,
            fileData: fileData,
            fileName: file.name,
            fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/msword'),
            isCustom: true
        };
        
        state.customSds.push(newSds);
        
        try {
            localStorage.setItem("ecomeq_custom_sds", JSON.stringify(state.customSds));
            renderSdsGrid();
            document.getElementById("sds-upload-form").reset();
            alert("Ficha de Datos de Seguridad cargada con éxito en el sistema.");
        } catch (storageError) {
            state.customSds.pop();
            alert("Error: El espacio de almacenamiento del navegador está lleno. Elimine archivos o limpie la caché e inténtelo de nuevo.");
        }
    };
    
    reader.onerror = function() {
        alert("Ocurrió un error al leer el archivo. Inténtelo de nuevo.");
    };
    
    reader.readAsDataURL(file);
}

// Iniciar la edición de una FDS personalizada
function startSdsEdit(id) {
    const sds = state.customSds.find(s => s.id === id);
    if (!sds) {
        alert("No se encontró la ficha seleccionada.");
        return;
    }
    
    // Rellenar campos del formulario
    document.getElementById("new-sds-title").value = sds.title;
    document.getElementById("new-sds-sub").value = sds.sub;
    document.getElementById("new-sds-cas").value = sds.cas;
    
    // Desmarcar todos y marcar solo los de la ficha
    const checkboxes = document.querySelectorAll('input[name="new-sds-picto"]');
    checkboxes.forEach(cb => {
        cb.checked = sds.pictograms.includes(cb.value);
    });
    
    // El archivo ya no es obligatorio al editar
    document.getElementById("new-sds-file").removeAttribute("required");
    
    // Cambiar estado e interfaz
    state.editingSdsId = id;
    
    const cancelBtn = document.getElementById("btn-cancel-sds-edit");
    if (cancelBtn) cancelBtn.classList.remove("hidden");
    
    const submitBtn = document.getElementById("btn-submit-sds");
    if (submitBtn) {
        const textSpan = submitBtn.querySelector("span");
        if (textSpan) textSpan.textContent = "Guardar Cambios en Ficha";
    }
    
    const formHeader = document.querySelector("#sds-upload-form").previousElementSibling.querySelector("h3");
    if (formHeader) formHeader.textContent = "Modificar Ficha de Datos de Seguridad (FDS)";
    
    // Enfocar el primer campo e ir hacia abajo
    document.getElementById("new-sds-title").focus();
    document.getElementById("sds-upload-form").scrollIntoView({ behavior: 'smooth' });
}

// Cancelar el modo de edición de FDS
function cancelSdsEdit() {
    state.editingSdsId = null;
    
    // Restablecer formulario
    document.getElementById("sds-upload-form").reset();
    document.getElementById("new-sds-file").setAttribute("required", "required");
    
    // Ocultar botón de cancelar
    const cancelBtn = document.getElementById("btn-cancel-sds-edit");
    if (cancelBtn) cancelBtn.classList.add("hidden");
    
    // Restablecer etiquetas
    const submitBtn = document.getElementById("btn-submit-sds");
    if (submitBtn) {
        const textSpan = submitBtn.querySelector("span");
        if (textSpan) textSpan.textContent = "Cargar y Registrar Ficha";
    }
    
    const formHeader = document.querySelector("#sds-upload-form").previousElementSibling.querySelector("h3");
    if (formHeader) formHeader.textContent = "Cargar Nueva Ficha de Datos de Seguridad (FDS)";
}

// Eliminar una FDS personalizada del sistema
function deleteSds(id) {
    if (!confirm("¿Está seguro de que desea eliminar esta Ficha de Datos de Seguridad permanentemente?")) {
        return;
    }
    
    const sdsIndex = state.customSds.findIndex(s => s.id === id);
    if (sdsIndex === -1) {
        alert("No se encontró la ficha que desea eliminar.");
        return;
    }
    
    // Si se está editando esta ficha, cancelar la edición antes de borrarla
    if (state.editingSdsId === id) {
        cancelSdsEdit();
    }
    
    state.customSds.splice(sdsIndex, 1);
    
    try {
        localStorage.setItem("ecomeq_custom_sds", JSON.stringify(state.customSds));
        renderSdsGrid();
        alert("Ficha de Datos de Seguridad eliminada correctamente.");
    } catch (error) {
        alert("Ocurrió un error al intentar eliminar la ficha del almacenamiento.");
    }
}

// Guardar los cambios de edición en localStorage y refrescar
function saveAndRefreshSdsEdit() {
    try {
        localStorage.setItem("ecomeq_custom_sds", JSON.stringify(state.customSds));
        cancelSdsEdit();
        renderSdsGrid();
        alert("Ficha de Datos de Seguridad modificada con éxito.");
    } catch (storageError) {
        alert("Error: El espacio de almacenamiento del navegador está lleno. No se pudieron guardar los cambios.");
    }
}

/* ==========================================================================
   CUSTOM REPORT GENERATOR (AD-HOC WIZARD)
   ========================================================================== */
function openCustomReportModal() {
    // Establecer fechas predeterminadas: primer día del año actual hasta hoy
    const currentYear = new Date().getFullYear();
    document.getElementById("cr-startdate").value = `${currentYear}-01-01`;
    document.getElementById("cr-enddate").value = new Date().toISOString().slice(0, 10);
    
    openModal("modal-custom-report");
}

// Exportación personalizada de datos en formato CSV compatible con Excel
function triggerCustomCSVExport() {
    const source = document.getElementById("cr-source").value;
    const reportType = document.getElementById("cr-report-type").value;
    const selectedAreas = Array.from(document.querySelectorAll('input[name="cr-area"]:checked')).map(cb => cb.value);

    // Validar selección de áreas
    if (selectedAreas.length === 0) {
        alert("Por favor seleccione al menos un área.");
        return;
    }

    // Validar que el manifiesto no se aplique a incidentes
    if (source === 'incidentes' && reportType === 'manifest') {
        alert("El filtro por manifiesto solo aplica a Entregas de RESPEL.");
        return;
    }

    let startDate, endDate, selectedManifest;
    
    // Obtener los parámetros de filtro según la consolidación seleccionada
    if (reportType === 'range') {
        const startStr = document.getElementById("cr-startdate").value;
        const endStr = document.getElementById("cr-enddate").value;
        if (!startStr || !endStr) {
            alert("Por favor seleccione ambas fechas.");
            return;
        }
        startDate = new Date(startStr + 'T00:00:00');
        endDate = new Date(endStr + 'T23:59:59');
    } else if (reportType === 'month') {
        const monthStr = document.getElementById("cr-month").value;
        if (!monthStr) {
            alert("Por favor seleccione el mes.");
            return;
        }
        startDate = new Date(monthStr + '-01T00:00:00');
        const [yr, mo] = monthStr.split("-").map(Number);
        const lastDay = new Date(yr, mo, 0).getDate();
        const lastDayStr = String(lastDay).padStart(2, '0');
        endDate = new Date(`${monthStr}-${lastDayStr}T23:59:59`);
    } else if (reportType === 'manifest') {
        selectedManifest = document.getElementById("cr-manifest-select").value;
        if (!selectedManifest) {
            alert("Por favor seleccione un manifiesto de recolección.");
            return;
        }
    }

    if (source === 'residuos') {
        // Filtrar entregas de residuos según los criterios seleccionados
        const filtered = state.reports.filter(r => {
            const matchArea = selectedAreas.includes(r.area);
            if (!matchArea) return false;
            
            if (reportType === 'manifest') {
                return r.manifest === selectedManifest;
            } else {
                const rDate = new Date(r.datetime);
                return rDate >= startDate && rDate <= endDate;
            }
        });

        // Ordenar cronológicamente de forma descendente (el más nuevo primero)
        filtered.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

        if (filtered.length === 0) {
            alert("No hay registros que coincidan con estos filtros.");
            return;
        }

        // Construir contenido CSV compatible con Excel (BOM UTF-8 y especificación de separador)
        let csv = "\uFEFFsep=;\n";
        csv += "ID;Fecha;Bodega;Nombre Residuo;Cantidad (kg);Tipo RESPEL;Corriente;Estado Fisico;Costo Estimado;Operador;Estado de Gestion;Empresa Recolectora;Manifiesto\n";
        filtered.forEach(r => {
            const cost = calculateDisposalCost(r.type, r.weight);
            // Reemplazar puntos por comas en decimales de peso y costo para coincidir con la configuración regional en español
            const weightFormatted = String(r.weight).replace('.', ',');
            const costFormatted = String(cost).replace('.', ',');
            csv += `"${r.id}";"${new Date(r.datetime).toLocaleString()}";"${r.bodega}";"${r.wasteName}";${weightFormatted};"${r.type}";"${r.corriente}";"${r.physicalState}";${costFormatted};"${r.operator}";"${r.status}";"${r.collectedBy || '-'}";"${r.manifest || '-'}"\n`;
        });

        downloadCSV(csv, "Reporte_Personalizado_RESPEL");
    } else {
        // Filtrar incidentes (solo rango de fechas y mes completo)
        const filtered = state.incidents.filter(inc => {
            const matchArea = selectedAreas.includes(inc.area);
            if (!matchArea) return false;
            
            const rDate = new Date(inc.datetime);
            return rDate >= startDate && rDate <= endDate;
        });

        // Ordenar cronológicamente de forma descendente (el más nuevo primero)
        filtered.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

        if (filtered.length === 0) {
            alert("No hay incidentes registrados para este rango.");
            return;
        }

        // Construir contenido CSV compatible con Excel (BOM UTF-8 y especificación de separador)
        let csv = "\uFEFFsep=;\n";
        csv += "ID;Fecha;Area;Sustancia;Volumen (L);Kit Usado;Estado;Operador;Descripcion;Accion Correctiva\n";
        filtered.forEach(inc => {
            // Reemplazar puntos por comas en decimales de volumen para coincidir con la configuración regional en español
            const volumeFormatted = String(inc.volume).replace('.', ',');
            csv += `"${inc.id}";"${new Date(inc.datetime).toLocaleString()}";"${inc.area}";"${inc.substance}";${volumeFormatted};"${inc.kitUsed}";"${inc.status}";"${inc.operator}";"${inc.desc.replace(/"/g, '""')}";"${inc.action.replace(/"/g, '""')}"\n`;
        });

        downloadCSV(csv, "Reporte_Personalizado_Incidentes");
    }
}

// Descargar archivo CSV generado dinámicamente
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Procesar envío del formulario para la vista de impresión del informe personalizado
function handleCustomReportSubmit(e) {
    e.preventDefault();

    const source = document.getElementById("cr-source").value;
    const reportType = document.getElementById("cr-report-type").value;
    const selectedAreas = Array.from(document.querySelectorAll('input[name="cr-area"]:checked')).map(cb => cb.value);

    // Validar áreas
    if (selectedAreas.length === 0) {
        alert("Por favor seleccione al menos un área.");
        return;
    }

    // Validar incompatibilidades
    if (source === 'incidentes' && reportType === 'manifest') {
        alert("El filtro por manifiesto solo aplica a Entregas de RESPEL.");
        return;
    }

    let startDate, endDate, selectedManifest, periodLabel;
    
    // Configurar fechas y etiquetas de periodo según tipo de consolidación
    if (reportType === 'range') {
        const startStr = document.getElementById("cr-startdate").value;
        const endStr = document.getElementById("cr-enddate").value;
        if (!startStr || !endStr) {
            alert("Por favor seleccione ambas fechas.");
            return;
        }
        startDate = new Date(startStr + 'T00:00:00');
        endDate = new Date(endStr + 'T23:59:59');
        periodLabel = `${startStr} a ${crDateFormatted(endStr)}`;
    } else if (reportType === 'month') {
        const monthStr = document.getElementById("cr-month").value;
        if (!monthStr) {
            alert("Por favor seleccione el mes.");
            return;
        }
        startDate = new Date(monthStr + '-01T00:00:00');
        const [yr, mo] = monthStr.split("-").map(Number);
        const lastDay = new Date(yr, mo, 0).getDate();
        const lastDayStr = String(lastDay).padStart(2, '0');
        endDate = new Date(`${monthStr}-${lastDayStr}T23:59:59`);
        periodLabel = `Mes Completo: ${formatResourceMonth(monthStr)}`;
    } else if (reportType === 'manifest') {
        selectedManifest = document.getElementById("cr-manifest-select").value;
        if (!selectedManifest) {
            alert("Por favor seleccione un manifiesto de recolección.");
            return;
        }
        periodLabel = `Manifiesto de Salida: ${selectedManifest}`;
    }

    const printArea = document.getElementById("report-print-area");
    
    if (source === 'residuos') {
        // Filtrar registros de entregas
        const filtered = state.reports.filter(r => {
            const matchArea = selectedAreas.includes(r.area);
            if (!matchArea) return false;
            
            if (reportType === 'manifest') {
                return r.manifest === selectedManifest;
            } else {
                const rDate = new Date(r.datetime);
                return rDate >= startDate && rDate <= endDate;
            }
        });

        const totalWeight = filtered.reduce((sum, r) => sum + parseFloat(r.weight), 0);
        const totalCost = filtered.reduce((sum, r) => sum + calculateDisposalCost(r.type, r.weight), 0);
        let rowsHtml = '';
        
        filtered.forEach(r => {
            const costStr = formatCurrency(calculateDisposalCost(r.type, r.weight));
            rowsHtml += `
                <tr style="border-bottom:1px solid #ccc;">
                    <td style="padding:8px;">${new Date(r.datetime).toLocaleDateString('es-ES')}</td>
                    <td style="padding:8px;">${r.bodega}</td>
                    <td style="padding:8px;">${r.wasteName}</td>
                    <td style="padding:8px; text-align:right; font-weight:700;">${r.weight.toFixed(1)} kg</td>
                    <td style="padding:8px;">${r.type}</td>
                    <td style="padding:8px;">${r.corriente}</td>
                    <td style="padding:8px;">${r.physicalState}</td>
                    <td style="padding:8px; text-align:right; font-weight:700; color:#004b9c;">${costStr}</td>
                    <td style="padding:8px;">${r.status === 'collected' ? 'Recolectado ('+r.manifest+')' : 'Almacenado'}</td>
                </tr>
            `;
        });

        printArea.innerHTML = `
            <div style="border-bottom:3px solid #004b9c; padding-bottom:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1 style="margin:0; font-size:24px; color:#004b9c;">ECOMEQ S.A.</h1>
                    <span style="font-size:12px; color:#555;">INFORME PERSONALIZADO DE GENERACIÓN RESPEL</span>
                </div>
                <div style="text-align:right; font-size:12px; color:#555;">
                    Fec. Emisión: ${new Date().toLocaleDateString('es-ES')}<br>
                    Filtro: ${periodLabel}
                </div>
            </div>

            <div style="margin-bottom:20px; background:#f0f7ff; padding:15px; border-radius:8px; border:1px solid #cce3fd;">
                <h4 style="margin:0 0 5px 0; color:#004b9c;">Resumen del Reporte</h4>
                <p style="margin:0; font-size:14px; color:#002d62;">
                    Este informe compila las entregas de residuos peligrosos generados bajo el filtro: <strong>${periodLabel}</strong> para las áreas seleccionadas: <em>${selectedAreas.join(', ')}</em>.<br>
                    <strong>Total Entregas:</strong> ${filtered.length} | <strong>Peso Total:</strong> ${totalWeight.toFixed(1)} kg | <strong>Costo Total Estimado:</strong> ${formatCurrency(totalCost)}.
                </p>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:left; color:#111;">
                <thead>
                    <tr style="background:#e5e7eb; border-bottom:2px solid #ccc;">
                        <th style="padding:8px;">Fecha</th>
                        <th style="padding:8px;">Bodega/Destino</th>
                        <th style="padding:8px;">Nombre del Residuo</th>
                        <th style="padding:8px; text-align:right;">Cantidad</th>
                        <th style="padding:8px;">Tipo</th>
                        <th style="padding:8px;">Corriente</th>
                        <th style="padding:8px;">Estado Físico</th>
                        <th style="padding:8px; text-align:right;">Costo Est.</th>
                        <th style="padding:8px;">Estado / Manifiesto</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.length > 0 ? rowsHtml : '<tr><td colspan="9" style="padding:20px; text-align:center; color:#888;">No se registran datos para los filtros seleccionados.</td></tr>'}
                </tbody>
            </table>

            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div style="text-align:center; width:45%;">
                    <div style="border-top:1px solid #555; width:200px; margin:0 auto; padding-top:6px; font-size:13px;">Firma Coordinador Ambiental</div>
                    <div style="font-size:11px; color:#555;">Ecomeq S.A.</div>
                </div>
                <div style="text-align:center; width:45%;">
                    <div style="border-top:1px solid #555; width:200px; margin:0 auto; padding-top:6px; font-size:13px;">Firma Responsable Área</div>
                    <div style="font-size:11px; color:#555;">Control de Operación</div>
                </div>
            </div>
        `;
    } else {
        // Filtrar registros de incidentes
        const filtered = state.incidents.filter(inc => {
            const matchArea = selectedAreas.includes(inc.area);
            if (!matchArea) return false;
            
            const rDate = new Date(inc.datetime);
            return rDate >= startDate && rDate <= endDate;
        });

        let rowsHtml = '';
        filtered.forEach(inc => {
            rowsHtml += `
                <tr style="border-bottom:1px solid #ccc; font-size:12px;">
                    <td style="padding:8px; white-space:nowrap;">${new Date(inc.datetime).toLocaleDateString('es-ES')}</td>
                    <td style="padding:8px;">${inc.area}</td>
                    <td style="padding:8px; font-weight:700;">${inc.substance}</td>
                    <td style="padding:8px; text-align:right;">${inc.volume} L</td>
                    <td style="padding:8px;">${inc.kitUsed}</td>
                    <td style="padding:8px;">
                        <strong>${inc.desc}</strong><br>
                        <span style="font-size:11px; color:#555;">Mitigación: ${inc.action}</span>
                    </td>
                </tr>
            `;
        });

        printArea.innerHTML = `
            <div style="border-bottom:3px solid #ef4444; padding-bottom:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1 style="margin:0; font-size:24px; color:#ef4444;">ECOMEQ S.A.</h1>
                    <span style="font-size:12px; color:#555;">INFORME HISTÓRICO DE DERRAMES E INCIDENTES</span>
                </div>
                <div style="text-align:right; font-size:12px; color:#555;">
                    Fec. Emisión: ${new Date().toLocaleDateString('es-ES')}<br>
                    Filtro: ${periodLabel}
                </div>
            </div>

            <div style="margin-bottom:20px; background:#fef2f2; padding:15px; border-radius:8px; border:1px solid #fca5a5;">
                <h4 style="margin:0 0 5px 0; color:#991b1b;">Resumen de Incidentes</h4>
                <p style="margin:0; font-size:14px; color:#7f1d1d;">
                    Informe oficial de emergencias y derrames químicos controlados bajo normativa corporativa.<br>
                    <strong>Total Eventos Controlados:</strong> ${filtered.length} en las áreas analizadas.
                </p>
            </div>

            <table style="width:100%; border-collapse:collapse; text-align:left; color:#111;">
                <thead>
                    <tr style="background:#f3f4f6; border-bottom:2px solid #ccc; font-size:13px;">
                        <th style="padding:8px;">Fecha</th>
                        <th style="padding:8px;">Área</th>
                        <th style="padding:8px;">Sustancia</th>
                        <th style="padding:8px; text-align:right;">Volumen</th>
                        <th style="padding:8px;">Kit Usado</th>
                        <th style="padding:8px;">Detalles y Acciones de Control</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.length > 0 ? rowsHtml : '<tr><td colspan="6" style="padding:20px; text-align:center; color:#888;">No se registran incidentes en el período seleccionado.</td></tr>'}
                </tbody>
            </table>

            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div style="text-align:center; width:45%;">
                    <div style="border-top:1px solid #555; width:200px; margin:0 auto; padding-top:6px; font-size:13px;">Firma Coordinador Ambiental</div>
                    <div style="font-size:11px; color:#555;">Ecomeq S.A.</div>
                </div>
                <div style="text-align:center; width:45%;">
                    <div style="border-top:1px solid #555; width:200px; margin:0 auto; padding-top:6px; font-size:13px;">Firma Auditor Interno</div>
                    <div style="font-size:11px; color:#555;">Seguridad y Salud Ocupacional</div>
                </div>
            </div>
        `;
    }

    closeModal("modal-custom-report");
    openModal("modal-report-preview");
}

function crDateFormatted(dateStr) {
    return dateStr;
}

function printCustomReport() {
    document.body.classList.add("printing-report");
    window.print();
    document.body.classList.remove("printing-report");
}

// Global exposures for the new modules
window.openCustomReportModal = openCustomReportModal;
window.triggerCustomCSVExport = triggerCustomCSVExport;
window.openSdsModal = openSdsModal;
window.printSDS = printSDS;
window.printCustomReport = printCustomReport;
window.handleIncidentSubmit = handleIncidentSubmit;
window.handleCustomReportSubmit = handleCustomReportSubmit;

/* ==========================================================================
   USER ACCESS MANAGEMENT PANEL (ADMIN ONLY)
   ========================================================================== */
function renderUsersView() {
    // Poblar campos de configuración de tarifas si existen los elementos
    if (document.getElementById("rate-hydrocarbons")) {
        document.getElementById("rate-hydrocarbons").value = DISPOSAL_RATES['Hidrocarburos'] || 0;
        document.getElementById("rate-acids").value = DISPOSAL_RATES['Ácidos'] || 0;
        document.getElementById("rate-basics").value = DISPOSAL_RATES['Básicos'] || 0;
        document.getElementById("rate-packaging").value = DISPOSAL_RATES['Envases contaminados'] || 0;
        document.getElementById("rate-solids").value = DISPOSAL_RATES['Sólidos impregnados'] || 0;
        document.getElementById("rate-luminaires").value = DISPOSAL_RATES['Luminarias'] || 0;
    }

    const tbody = document.getElementById("users-table-body");
    tbody.innerHTML = '';
    
    const users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
    
    users.forEach(user => {
        const tr = document.createElement("tr");
        const isEditing = state.editingUserEmail === user.email;
        const isSelf = user.email === state.currentUser.email;
        
        let nameCell = `<strong>${user.name}</strong>`;
        let areaCell = `${user.area}`;
        let roleCell = `${user.role}`;
        let actionCell = '';
        
        if (isEditing) {
            nameCell = `<input type="text" id="edit-user-name" value="${user.name}" style="padding: 4px 8px; font-size: 13px; width: 100%; border: 1px solid rgba(255,255,255,0.15);" required>`;
            
            areaCell = `
                <select id="edit-user-area" style="padding: 4px 8px; font-size: 13px; width: auto; display: inline-block;">
                    <option value="Producción" ${user.area === 'Producción' ? 'selected' : ''}>Producción</option>
                    <option value="Mantenimiento" ${user.area === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                    <option value="Laboratorio" ${user.area === 'Laboratorio' ? 'selected' : ''}>Laboratorio</option>
                    <option value="Logística" ${user.area === 'Logística' ? 'selected' : ''}>Logística</option>
                    <option value="Oficinas" ${user.area === 'Oficinas' ? 'selected' : ''}>Oficinas</option>
                    <option value="Medio Ambiente" ${user.area === 'Medio Ambiente' ? 'selected' : ''}>Medio Ambiente (Administración)</option>
                </select>
            `;
            
            roleCell = `
                <select id="edit-user-role" style="padding: 4px 8px; font-size: 13px; width: auto; display: inline-block;">
                    <option value="Jefe de Área" ${user.role === 'Jefe de Área' ? 'selected' : ''}>Jefe de Área (Jefatura)</option>
                    <option value="Coordinador" ${user.role === 'Coordinador' ? 'selected' : ''}>Coordinador (Administrador)</option>
                </select>
            `;
            
            actionCell = `
                <button class="btn-primary btn-xs" onclick="saveUserEdit('${user.email}')" style="margin-right: 4px; padding: 4px 8px;">Guardar</button>
                <button class="btn-secondary btn-xs" onclick="cancelUserEdit()" style="padding: 4px 8px;">Cancelar</button>
            `;
        } else {
            const deleteButton = isSelf ? 
                `<button class="btn-logout btn-xs" style="background:rgba(255,255,255,0.05); color:#888; border-color:transparent; cursor:not-allowed;" title="No puedes eliminar tu propia cuenta" disabled>Eliminar</button>` : 
                `<button class="btn-logout btn-xs" onclick="deleteUser('${user.email}')" title="Eliminar usuario">Eliminar</button>`;
            
            const editButton = `<button class="btn-accent btn-xs" onclick="startUserEdit('${user.email}')" style="margin-right: 4px; padding: 4px 8px;">Editar</button>`;
            
            actionCell = `${editButton} ${deleteButton}`;
        }
        
        tr.innerHTML = `
            <td>${nameCell}</td>
            <td>${user.email}</td>
            <td>${areaCell}</td>
            <td>${roleCell}</td>
            <td><div style="display: flex; align-items: center; gap: 4px;">${actionCell}</div></td>
        `;
        tbody.appendChild(tr);
    });
}

function startUserEdit(email) {
    state.editingUserEmail = email;
    renderUsersView();
}

function cancelUserEdit() {
    state.editingUserEmail = null;
    renderUsersView();
}

function saveUserEdit(email) {
    const newName = document.getElementById("edit-user-name").value.trim();
    const newArea = document.getElementById("edit-user-area").value;
    const newRole = document.getElementById("edit-user-role").value;
    
    if (!newName) {
        alert("El nombre no puede estar vacío.");
        return;
    }
    
    let users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
    
    const isSelf = email === state.currentUser.email;
    if (isSelf && newRole !== 'Coordinador') {
        if (!confirm("⚠️ Estás quitándote tus propios permisos de Coordinador. Si guardas, perderás acceso a este panel inmediatamente. ¿Deseas continuar?")) {
            return;
        }
    }
    
    users = users.map(u => {
        if (u.email === email) {
            u.name = newName;
            u.area = newArea;
            u.role = newRole;
        }
        return u;
    });
    
    localStorage.setItem("ecomeq_users", JSON.stringify(users));
    state.editingUserEmail = null;
    
    if (isSelf) {
        state.currentUser.name = newName;
        state.currentUser.area = newArea;
        state.currentUser.role = newRole;
        localStorage.setItem("ecomeq_session", JSON.stringify(state.currentUser));
        loadUserDataAndState();
    } else {
        renderUsersView();
    }
    
    alert("🎉 Cambios de usuario guardados correctamente.");
}

function handleUserCreateSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById("user-email").value.trim().toLowerCase();
    const name = document.getElementById("user-name").value.trim();
    const password = document.getElementById("user-password").value;
    const role = document.getElementById("user-role-select").value;
    const area = document.getElementById("user-area-select").value;
    
    if (!email || !name || !password || !role || !area) {
        alert("Por favor complete todos los campos.");
        return;
    }
    
    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    
    const users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
    
    // Check email uniqueness
    const emailExists = users.some(u => u.email === email);
    if (emailExists) {
        alert("❌ Este correo electrónico ya está registrado en el sistema.");
        return;
    }
    
    const newUser = { email, password, name, role, area };
    users.push(newUser);
    localStorage.setItem("ecomeq_users", JSON.stringify(users));
    
    // Restablecer formulario
    document.getElementById("user-create-form").reset();
    
    // Render and notify
    renderUsersView();
    alert("🎉 Usuario registrado y acceso asignado correctamente.");
}

function changeUserRole(email, newRole) {
    let users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
    
    const isSelf = email === state.currentUser.email;
    if (isSelf) {
        if (!confirm("⚠️ Estás cambiando tu propio rol. Si te asignas como Jefe de Área, perderás acceso a este panel de administración inmediatamente. ¿Deseas continuar?")) {
            renderUsersView(); // Reset UI selection
            return;
        }
    }
    
    users = users.map(u => {
        if (u.email === email) {
            u.role = newRole;
        }
        return u;
    });
    
    localStorage.setItem("ecomeq_users", JSON.stringify(users));
    
    // If Admin downgraded themselves, reload session to apply permissions
    if (isSelf) {
        state.currentUser.role = newRole;
        localStorage.setItem("ecomeq_session", JSON.stringify(state.currentUser));
        loadUserDataAndState();
    } else {
        renderUsersView();
    }
}

function deleteUser(email) {
    if (email === state.currentUser.email) {
        alert("No puedes eliminar tu propia cuenta.");
        return;
    }
    
    if (confirm(`¿Está seguro de que desea eliminar al usuario ${email} del sistema? Perderá acceso inmediato.`)) {
        let users = JSON.parse(localStorage.getItem("ecomeq_users")) || DEFAULT_USERS;
        users = users.filter(u => u.email !== email);
        localStorage.setItem("ecomeq_users", JSON.stringify(users));
        
        renderUsersView();
    }
}

function handleRatesConfigSubmit(e) {
    e.preventDefault();
    
    DISPOSAL_RATES['Hidrocarburos'] = parseInt(document.getElementById("rate-hydrocarbons").value) || 0;
    DISPOSAL_RATES['Ácidos'] = parseInt(document.getElementById("rate-acids").value) || 0;
    DISPOSAL_RATES['Básicos'] = parseInt(document.getElementById("rate-basics").value) || 0;
    DISPOSAL_RATES['Envases contaminados'] = parseInt(document.getElementById("rate-packaging").value) || 0;
    DISPOSAL_RATES['Sólidos impregnados'] = parseInt(document.getElementById("rate-solids").value) || 0;
    DISPOSAL_RATES['Luminarias'] = parseInt(document.getElementById("rate-luminaires").value) || 0;
    
    localStorage.setItem("ecomeq_disposal_rates", JSON.stringify(DISPOSAL_RATES));
    
    alert("🎉 Tarifas de disposición actualizadas correctamente.");
    
    renderDashboard();
    renderHistoryTable();
    renderAnalyticsView();
}

// Global exposure for the Admin functions
window.changeUserRole = changeUserRole;
window.deleteUser = deleteUser;
window.handleUserCreateSubmit = handleUserCreateSubmit;
window.startUserEdit = startUserEdit;
window.cancelUserEdit = cancelUserEdit;
window.saveUserEdit = saveUserEdit;
window.handleRatesConfigSubmit = handleRatesConfigSubmit;

/* ==========================================================================
   EXPORT CHOICES & PRINTING LOGIC
   ========================================================================== */
function triggerFilterCSVExport() {
    exportFilteredDataToCSV();
    closeModal("modal-export-choice");
}

function printFilteredHistoryPDF() {
    const searchVal = document.getElementById("filter-search").value.toLowerCase();
    const areaVal = document.getElementById("filter-area").value;
    const typeVal = document.getElementById("filter-type").value;
    const statusVal = document.getElementById("filter-status").value;

    const filtered = state.reports
        .sort((a,b) => new Date(b.datetime) - new Date(a.datetime))
        .filter(r => {
            const matchSearch = (r.operator && r.operator.toLowerCase().includes(searchVal)) || 
                                (r.observations && r.observations.toLowerCase().includes(searchVal)) ||
                                (r.manifest && r.manifest.toLowerCase().includes(searchVal));
            const matchArea = areaVal === 'all' || r.area === areaVal;
            const matchType = typeVal === 'all' || r.type === typeVal;
            const matchStatus = statusVal === 'all' || 
                               (statusVal === 'stored' && r.status === 'stored') || 
                               (statusVal === 'collected' && r.status === 'collected');
            return matchSearch && matchArea && matchType && matchStatus;
        });

    if (filtered.length === 0) {
        alert("No hay registros filtrados para previsualizar.");
        return;
    }

    const totalWeight = filtered.reduce((sum, r) => sum + parseFloat(r.weight), 0);
    const totalCost = filtered.reduce((sum, r) => sum + calculateDisposalCost(r.type, r.weight), 0);
    let rowsHtml = '';
    
    filtered.forEach(r => {
        const costStr = formatCurrency(calculateDisposalCost(r.type, r.weight));
        const statusText = r.status === 'collected' ? 'Recolectado' : `Almacenado (${r.bodega})`;
        rowsHtml += `
            <tr style="border-bottom:1px solid #ccc; font-size: 11px;">
                <td style="padding:6px;">${new Date(r.datetime).toLocaleDateString('es-ES')}</td>
                <td style="padding:6px;">${r.bodega}</td>
                <td style="padding:6px;">${r.wasteName}</td>
                <td style="padding:6px; text-align:right; font-weight:700;">${r.weight.toFixed(1)} kg</td>
                <td style="padding:6px;">${r.type}</td>
                <td style="padding:6px;">${r.corriente}</td>
                <td style="padding:6px;">${r.physicalState}</td>
                <td style="padding:6px; text-align:right; font-weight:700; color:#004b9c;">${costStr}</td>
                <td style="padding:6px;">${statusText}</td>
                <td style="padding:6px; font-family:monospace; font-size:10px;">${r.manifest || 'En almacén'}</td>
            </tr>
        `;
    });

    const printArea = document.getElementById("report-print-area");
    printArea.innerHTML = `
        <div style="border-bottom:3px solid #004b9c; padding-bottom:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h1 style="margin:0; font-size:24px; color:#004b9c;">ECOMEQ S.A.</h1>
                <span style="font-size:12px; color:#555;">REPORTE DE HISTORIAL DE MOVIMIENTOS RESPEL (FILTRADO)</span>
            </div>
            <div style="text-align:right; font-size:12px; color:#555;">
                Fecha Impresión: ${new Date().toLocaleDateString('es-ES')}<br>
                Filtros: Área: ${areaVal === 'all' ? 'Todas' : areaVal} | Tipo: ${typeVal === 'all' ? 'Todos' : typeVal}
            </div>
        </div>

        <div style="margin-bottom:20px; background:#f0f7ff; padding:15px; border-radius:8px; border:1px solid #cce3fd;">
            <h4 style="margin:0 0 5px 0; color:#004b9c;">Resumen del Historial</h4>
            <p style="margin:0; font-size:14px; color:#002d62;">
                Este reporte consolidado recopila las entregas que cumplen con los criterios de búsqueda activos.<br>
                <strong>Total Entregas:</strong> ${filtered.length} | <strong>Peso Total:</strong> ${totalWeight.toFixed(1)} kg | <strong>Costo Total Estimado:</strong> ${formatCurrency(totalCost)}.
            </p>
        </div>

        <table style="width:100%; border-collapse:collapse; text-align:left; color:#111; font-size:11px;">
            <thead>
                <tr style="background:#e5e7eb; border-bottom:2px solid #ccc;">
                    <th style="padding:6px;">Fecha</th>
                    <th style="padding:6px;">Bodega</th>
                    <th style="padding:6px;">Nombre del Residuo</th>
                    <th style="padding:6px; text-align:right;">Cantidad</th>
                    <th style="padding:6px;">Tipo</th>
                    <th style="padding:6px;">Corriente</th>
                    <th style="padding:6px;">Estado</th>
                    <th style="padding:6px; text-align:right;">Costo Est.</th>
                    <th style="padding:6px;">Gestión / Estado</th>
                    <th style="padding:6px;">Manifiesto</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div style="margin-top:60px; display:flex; justify-content:space-between;">
            <div style="text-align:center; width:45%;">
                <div style="border-top:1px solid #555; width:200px; margin:0 auto; padding-top:6px; font-size:13px;">Firma Coordinador Ambiental</div>
                <div style="font-size:11px; color:#555;">Ecomeq S.A.</div>
            </div>
            <div style="text-align:center; width:45%;">
                <div style="border-top:1px solid #555; width:200px; margin:0 auto; padding-top:6px; font-size:13px;">Responsable de Auditoría</div>
                <div style="font-size:11px; color:#555;">Seguridad y Control Interno</div>
            </div>
        </div>
    `;

    closeModal("modal-export-choice");
    openModal("modal-report-preview");
}

/* ==========================================================================
   DYNAMIC COURSE CREATION BY ADMINISTRATOR
   ========================================================================== */
function handleCourseCreateSubmit(e) {
    e.preventDefault();

    const title = document.getElementById("new-course-title").value.trim();
    const desc = document.getElementById("new-course-desc").value.trim();
    const category = document.getElementById("new-course-category").value;

    // Diapositivas
    const s1Title = document.getElementById("new-course-s1-title").value.trim();
    const s1Content = document.getElementById("new-course-s1-content").value.trim();
    const s2Title = document.getElementById("new-course-s2-title").value.trim();
    const s2Content = document.getElementById("new-course-s2-content").value.trim();

    // Quiz Questions
    const q1Text = document.getElementById("new-course-q1").value.trim();
    const q1O1 = document.getElementById("new-course-q1-o1").value.trim();
    const q1O2 = document.getElementById("new-course-q1-o2").value.trim();
    const q1O3 = document.getElementById("new-course-q1-o3").value.trim();
    const q1Ans = parseInt(document.getElementById("new-course-q1-ans").value);

    const q2Text = document.getElementById("new-course-q2").value.trim();
    const q2O1 = document.getElementById("new-course-q2-o1").value.trim();
    const q2O2 = document.getElementById("new-course-q2-o2").value.trim();
    const q2O3 = document.getElementById("new-course-q2-o3").value.trim();
    const q2Ans = parseInt(document.getElementById("new-course-q2-ans").value);

    if (!title || !desc || !s1Title || !s1Content || !s2Title || !s2Content || !q1Text || !q2Text) {
        alert("Por favor rellene todos los campos obligatorios.");
        return;
    }

    const fileInput = document.getElementById("new-course-file");
    const file = fileInput ? fileInput.files[0] : null;

    const saveCourse = (attachment) => {
        const newCourse = {
            id: "course-" + Date.now(),
            title: title,
            desc: desc,
            category: category,
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
            slides: [
                { title: s1Title, content: s1Content },
                { title: s2Title, content: s2Content }
            ],
            quiz: [
                {
                    question: q1Text,
                    options: [q1O1, q1O2, q1O3],
                    answer: q1Ans
                },
                {
                    question: q2Text,
                    options: [q2O1, q2O2, q2O3],
                    answer: q2Ans
                }
            ]
        };

        if (attachment) {
            newCourse.attachment = attachment;
        }

        // Save to State and LocalStorage
        state.courses.push(newCourse);
        localStorage.setItem("ecomeq_courses", JSON.stringify(state.courses));

        // Initialize user progress for this course
        const userKey = `trainings_${state.currentUser.email}`;
        state.trainings[newCourse.id] = { status: "pending", score: 0 };
        localStorage.setItem(userKey, JSON.stringify(state.trainings));

        // Restablecer formulario
        document.getElementById("course-create-form").reset();

        // Re-render
        renderDashboard();
        renderCoursesGrid();

        alert("🎉 Capacitación creada y guardada con éxito en el catálogo corporativo.");
    };

    if (file) {
        if (file.size > 800 * 1024) {
            alert("❌ El archivo es demasiado grande (máximo 800 KB para almacenamiento local).");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            saveCourse({
                data: reader.result,
                name: file.name,
                type: file.type
            });
        };
        reader.onerror = () => {
            alert("Error al leer el archivo.");
        };
        reader.readAsDataURL(file);
    } else {
        saveCourse(null);
    }
}

window.printFilteredHistoryPDF = printFilteredHistoryPDF;
window.triggerFilterCSVExport = triggerFilterCSVExport;
window.handleCourseCreateSubmit = handleCourseCreateSubmit;

/* ==========================================================================
   STATUS AND LOCATION TRANSITIONS FOR INDIVIDUAL REPORTS
   ========================================================================== */
function changeReportStatus(id, target) {
    if (target === 'collected') {
        const report = state.reports.find(r => r.id === id);
        if (report && report.status === 'collected') {
            // Ya se encuentra retirado por la empresa gestora
            return;
        }
        
        // Pre-seleccionar únicamente el ID de este reporte en el estado global
        state.selectedReportIds = [id];
        
        // Desmarcar todas las otras filas y marcar este checkbox específico
        const checkboxes = document.querySelectorAll(".row-selector");
        checkboxes.forEach(cb => {
            cb.checked = (cb.getAttribute("data-id") === id);
        });
        
        // Desmarcar el selector general de la cabecera de la tabla
        document.getElementById("select-all-checkbox").checked = false;
        
        // Abrir el asistente de manifiesto de recolección
        openCollectionModal();
    } else {
        // En este caso target representa la bodega destino seleccionada en la tabla
        state.reports = state.reports.map(r => {
            if (r.id === id) {
                r.status = 'stored';
                r.bodega = target;
                // Mapear a la propiedad heredada para mantener compatibilidad
                r.location = (target === 'Shut de RESPEL') ? 'shut' : 'acopio';
                
                // Limpiar manifiestos previos si se vuelve a colocar en bodega
                delete r.collectedBy;
                delete r.manifest;
                delete r.collectedDate;
            }
            return r;
        });
        localStorage.setItem("ecomeq_reports", JSON.stringify(state.reports));
        
        // Re-renderizar dashboard y registros
        renderDashboard();
        renderHistoryTable();
    }
}

window.changeReportStatus = changeReportStatus;

// Mapeo dinámico de corrientes de residuos según tipo (SGA y normativas locales)
const CORRIENTES_MAP = {
    'Hidrocarburos': [
        { value: 'Y8', label: 'Y8 - Aceites minerales usados' },
        { value: 'Y9', label: 'Y9 - Mezclas y emulsiones de desechos de aceite y agua' },
        { value: 'A3020', label: 'A3020 - Aceites usados no conformes' }
    ],
    'Ácidos': [
        { value: 'Y34', label: 'Y34 - Soluciones ácidas o ácidos en forma sólida' },
        { value: 'A4090', label: 'A4090 - Desechos de carácter ácido' }
    ],
    'Básicos': [
        { value: 'Y35', label: 'Y35 - Soluciones básicas o bases en forma sólida' },
        { value: 'A4090', label: 'A4090 - Desechos de carácter alcalino/básico' }
    ],
    'Envases contaminados': [
        { value: 'A4130', label: 'A4130 - Envases contaminados con sustancias peligrosas' },
        { value: 'Y18', label: 'Y18 - Envases de sustancias farmacéuticas/químicas' }
    ],
    'Sólidos impregnados': [
        { value: 'A4130', label: 'A4130 - Sólidos o EPPs impregnados con sustancias peligrosas' },
        { value: 'Y18', label: 'Y18 - Trapos y absorbentes usados' }
    ],
    'Luminarias': [
        { value: 'Y29', label: 'Y29 - Desechos que contengan mercurio (luminarias mercuriales)' },
        { value: 'A1030', label: 'A1030 - Desechos con compuestos de mercurio' }
    ]
};

// Actualizar de forma reactiva las opciones de corrientes al seleccionar tipo
// Actualizar de forma reactiva las opciones de corrientes al seleccionar tipo
function handleReportTypeChange() {
    const type = document.getElementById("report-type").value;
    const corrienteSelect = document.getElementById("report-corriente");
    
    corrienteSelect.innerHTML = '';
    
    if (CORRIENTES_MAP[type]) {
        CORRIENTES_MAP[type].forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.value;
            opt.textContent = c.label;
            corrienteSelect.appendChild(opt);
        });
    } else {
        const opt = document.createElement("option");
        opt.value = "";
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = "Seleccione tipo de residuo primero...";
        corrienteSelect.appendChild(opt);
    }
}

/* ==========================================================================
   MÓDULO DE RECURSOS (ENERGÍA Y AGUA) Y CONSOLIDACIÓN
   ========================================================================== */

// Formatear el mes numérico (YYYY-MM) a texto legible en español (Ej: Octubre 2025)
function formatResourceMonth(monthStr) {
    if (!monthStr) return "--";
    const [y, m] = monthStr.split("-").map(Number);
    const monthsEs = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${monthsEs[m-1]} ${y}`;
}

// Renderizar la vista completa del módulo de recursos (KPIs, semáforos e historial)
function renderResourcesView() {
    // Rellenar valores de configuración de metas en los campos correspondientes
    const goalEnergyInput = document.getElementById("goal-energy-kpi");
    const goalWaterInput = document.getElementById("goal-water-kpi");
    if (goalEnergyInput) goalEnergyInput.value = state.resourceGoals.energy_kpi_goal;
    if (goalWaterInput) goalWaterInput.value = state.resourceGoals.water_kpi_goal;

    // Mostrar las metas configuradas en las sub-etiquetas de las tarjetas de KPI
    const kpiEnergyGoalEl = document.getElementById("res-kpi-energy-goal");
    const kpiWaterGoalEl = document.getElementById("res-kpi-water-goal");
    if (kpiEnergyGoalEl) kpiEnergyGoalEl.textContent = `Meta: ${state.resourceGoals.energy_kpi_goal.toFixed(3)} kWh/u`;
    if (kpiWaterGoalEl) kpiWaterGoalEl.textContent = `Meta: ${state.resourceGoals.water_kpi_goal.toFixed(4)} m³/u`;

    // Ordenar lecturas por fecha descendente para obtener la más reciente primero
    const readings = [...state.resourceReadings].sort((a, b) => b.month.localeCompare(a.month));
    
    // Obtener elementos del semáforo en el DOM
    const energyLight = document.getElementById("semaforo-energy-light");
    const energyLabel = document.getElementById("semaforo-energy-label");
    const energyDetail = document.getElementById("semaforo-energy-detail");
    const waterLight = document.getElementById("semaforo-water-light");
    const waterLabel = document.getElementById("semaforo-water-label");
    const waterDetail = document.getElementById("semaforo-water-detail");

    if (readings.length > 0) {
        // Usar los datos del mes más reciente registrado para los KPIs del encabezado y semáforos
        const r = readings[0];
        const solarPct = r.energy_consumed > 0 ? Math.min(100, (r.energy_generated / r.energy_consumed) * 100) : 0;
        const waterConsumed = r.water_final - r.water_initial;
        const energyKpi = r.energy_consumed / r.production;
        const waterKpi = waterConsumed / r.production;

        // Actualizar tarjetas métricas superiores
        document.getElementById("res-kpi-energy").textContent = `${r.energy_consumed.toFixed(1)} kWh`;
        document.getElementById("res-kpi-solar-pct").textContent = `Uso Solar: ${solarPct.toFixed(1)}%`;
        const solarBar = document.getElementById("res-kpi-solar-bar");
        if (solarBar) {
            solarBar.style.width = `${solarPct.toFixed(1)}%`;
        }
        document.getElementById("res-kpi-water").textContent = `${waterConsumed.toFixed(1)} m³`;
        document.getElementById("res-kpi-energy-rate").textContent = energyKpi.toFixed(3);
        document.getElementById("res-kpi-water-rate").textContent = waterKpi.toFixed(4);

        // Actualizar tarjeta lateral de producción
        document.getElementById("res-production-value").textContent = r.production.toLocaleString();
        document.getElementById("res-production-month").textContent = formatResourceMonth(r.month);

        // Calcular cumplimiento de metas y semáforo de Energía
        const energyRatio = energyKpi / state.resourceGoals.energy_kpi_goal;
        if (energyLight && energyLabel && energyDetail) {
            energyLight.className = "res-semaforo-light";
            if (energyRatio <= 1.0) {
                energyLight.classList.add("semaforo-green");
                energyLabel.textContent = "Cumple Meta (Verde)";
                energyLabel.style.color = "#10b981";
                energyDetail.textContent = `KPI Real: ${energyKpi.toFixed(3)} | Meta: ${state.resourceGoals.energy_kpi_goal.toFixed(3)} kWh/u`;
            } else if (energyRatio <= 1.1) {
                energyLight.classList.add("semaforo-yellow");
                energyLabel.textContent = "Desviación Menor (Amarillo)";
                energyLabel.style.color = "#f59e0b";
                const dev = ((energyRatio - 1) * 100).toFixed(1);
                energyDetail.textContent = `KPI Real: ${energyKpi.toFixed(3)} | Desviación: +${dev}%`;
            } else {
                energyLight.classList.add("semaforo-red");
                energyLabel.textContent = "Desviación Mayor (Rojo)";
                energyLabel.style.color = "#ef4444";
                const dev = ((energyRatio - 1) * 100).toFixed(1);
                energyDetail.textContent = `KPI Real: ${energyKpi.toFixed(3)} | Desviación: +${dev}%`;
            }
        }

        // Calcular cumplimiento de metas y semáforo de Agua
        const waterRatio = waterKpi / state.resourceGoals.water_kpi_goal;
        if (waterLight && waterLabel && waterDetail) {
            waterLight.className = "res-semaforo-light";
            if (waterRatio <= 1.0) {
                waterLight.classList.add("semaforo-green");
                waterLabel.textContent = "Cumple Meta (Verde)";
                waterLabel.style.color = "#10b981";
                waterDetail.textContent = `KPI Real: ${waterKpi.toFixed(4)} | Meta: ${state.resourceGoals.water_kpi_goal.toFixed(4)} m³/u`;
            } else if (waterRatio <= 1.1) {
                waterLight.classList.add("semaforo-yellow");
                waterLabel.textContent = "Desviación Menor (Amarillo)";
                waterLabel.style.color = "#f59e0b";
                const dev = ((waterRatio - 1) * 100).toFixed(1);
                waterDetail.textContent = `KPI Real: ${waterKpi.toFixed(4)} | Desviación: +${dev}%`;
            } else {
                waterLight.classList.add("semaforo-red");
                waterLabel.textContent = "Desviación Mayor (Rojo)";
                waterLabel.style.color = "#ef4444";
                const dev = ((waterRatio - 1) * 100).toFixed(1);
                waterDetail.textContent = `KPI Real: ${waterKpi.toFixed(4)} | Desviación: +${dev}%`;
            }
        }
    } else {
        // En caso de que no existan lecturas previas registradas
        document.getElementById("res-kpi-energy").textContent = "0 kWh";
        document.getElementById("res-kpi-solar-pct").textContent = "Uso Solar: 0%";
        const solarBar = document.getElementById("res-kpi-solar-bar");
        if (solarBar) {
            solarBar.style.width = "0%";
        }
        document.getElementById("res-kpi-water").textContent = "0 m³";
        document.getElementById("res-kpi-energy-rate").textContent = "0.000";
        document.getElementById("res-kpi-water-rate").textContent = "0.0000";
        document.getElementById("res-production-value").textContent = "0";
        document.getElementById("res-production-month").textContent = "--";

        if (energyLight && energyLabel && energyDetail) {
            energyLight.className = "res-semaforo-light semaforo-off";
            energyLabel.textContent = "Sin Datos";
            energyLabel.style.color = "var(--color-text-muted)";
            energyDetail.textContent = "Por favor registre lecturas para el período.";
        }
        if (waterLight && waterLabel && waterDetail) {
            waterLight.className = "res-semaforo-light semaforo-off";
            waterLabel.textContent = "Sin Datos";
            waterLabel.style.color = "var(--color-text-muted)";
            waterDetail.textContent = "Por favor registre lecturas para el período.";
        }
    }

    // Poblar el cuerpo de la tabla histórica
    const tbody = document.getElementById("resource-table-body");
    if (tbody) {
        tbody.innerHTML = "";
        readings.forEach(r => {
            const waterConsumed = r.water_final - r.water_initial;
            const solarPct = r.energy_consumed > 0 ? (r.energy_generated / r.energy_consumed) * 100 : 0;
            const energyKpi = r.energy_consumed / r.production;
            const waterKpi = waterConsumed / r.production;
            
            const energyRatio = energyKpi / state.resourceGoals.energy_kpi_goal;
            const waterRatio = waterKpi / state.resourceGoals.water_kpi_goal;
            
            // Colores correspondientes del semáforo para la tabla
            const energyColor = energyRatio <= 1.0 ? "#10b981" : (energyRatio <= 1.1 ? "#f59e0b" : "#ef4444");
            const waterColor = waterRatio <= 1.0 ? "#10b981" : (waterRatio <= 1.1 ? "#f59e0b" : "#ef4444");
            
            // Cargar visor de fotografía o mostrar texto en caso de no tener
            let photoHtml = "";
            if (r.water_photo) {
                photoHtml = `<img src="${r.water_photo}" class="evidence-thumbnail" onclick="openEvidencePhoto('${r.id}')" alt="Evidencia">`;
            } else {
                photoHtml = `<span style="color: var(--color-text-muted); font-size: 11px;">Sin evidencia</span>`;
            }
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${formatResourceMonth(r.month)}</strong></td>
                <td>${r.production.toLocaleString()}</td>
                <td>${r.energy_consumed.toFixed(1)} kWh</td>
                <td>${r.energy_generated.toFixed(1)} kWh (${solarPct.toFixed(1)}%)</td>
                <td>${r.water_initial.toFixed(2)} / ${r.water_final.toFixed(2)} m³</td>
                <td>${waterConsumed.toFixed(2)} m³</td>
                <td>
                    <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                        <span class="badge" style="background: ${energyColor}; color: #000; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px;" title="Energía Real: ${energyKpi.toFixed(3)} vs Meta: ${state.resourceGoals.energy_kpi_goal.toFixed(3)}">E</span>
                        <span class="badge" style="background: ${waterColor}; color: #000; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px;" title="Agua Real: ${waterKpi.toFixed(4)} vs Meta: ${state.resourceGoals.water_kpi_goal.toFixed(4)}">A</span>
                    </div>
                </td>
                <td>${photoHtml}</td>
                <td class="admin-only-cell"><button class="btn-danger btn-xs" onclick="deleteResourceReading('${r.id}')">Eliminar</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Ajustar visibilidad de celdas administrativas basadas en rol
    if (isJefeDeArea(state.currentUser)) {
        document.querySelectorAll(".admin-only-cell").forEach(cell => cell.style.display = "none");
    } else {
        document.querySelectorAll(".admin-only-cell").forEach(cell => cell.style.display = "");
    }
}

// Controlar el registro de un nuevo consumo mensual de recursos
function handleResourceSubmit(e) {
    e.preventDefault();
    
    const monthVal = document.getElementById("res-month").value;
    const prodVal = parseInt(document.getElementById("res-production").value);
    const energyConsumedVal = parseFloat(document.getElementById("res-energy-consumed").value);
    const energyGeneratedVal = parseFloat(document.getElementById("res-energy-generated").value);
    const waterInitialVal = parseFloat(document.getElementById("res-water-initial").value);
    const waterFinalVal = parseFloat(document.getElementById("res-water-final").value);
    const fileEl = document.getElementById("res-water-photo");

    // Validar diferencia de agua
    if (waterFinalVal < waterInitialVal) {
        alert("La lectura final del contador de agua no puede ser menor que la lectura inicial.");
        return;
    }

    // Validar si existe registro para el mismo mes
    const existingIndex = state.resourceReadings.findIndex(r => r.month === monthVal);
    const existingRecord = existingIndex !== -1 ? state.resourceReadings[existingIndex] : null;

    // Función interna para guardar el registro tras procesar la imagen
    const saveRecord = (photoBase64) => {
        const record = {
            id: existingRecord ? existingRecord.id : "res-" + Date.now(),
            month: monthVal,
            production: prodVal,
            energy_consumed: energyConsumedVal,
            energy_generated: energyGeneratedVal,
            water_initial: waterInitialVal,
            water_final: waterFinalVal,
            water_photo: photoBase64 !== undefined ? photoBase64 : (existingRecord ? existingRecord.water_photo : ""),
            operator: state.currentUser.name
        };

        if (existingIndex !== -1) {
            state.resourceReadings[existingIndex] = record;
        } else {
            state.resourceReadings.push(record);
        }

        localStorage.setItem("ecomeq_resource_readings", JSON.stringify(state.resourceReadings));
        alert(existingRecord ? "Registro mensual actualizado correctamente." : "Nuevo registro mensual guardado con éxito.");
        
        // Resetear el formulario e hidratar de nuevo la vista
        e.target.reset();
        const formSolarCalc = document.getElementById("res-form-solar-calc");
        if (formSolarCalc) {
            formSolarCalc.textContent = "Participación Solar Proyectada: 0.0%";
        }
        renderResourcesView();
    };

    // Si se cargó un archivo, convertirlo a Base64 validando peso
    const file = fileEl.files[0];
    if (file) {
        if (file.size > 800 * 1024) {
            alert("La fotografía de evidencia excede los 800 KB de límite. Por favor reduzca su tamaño.");
            return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            saveRecord(event.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        saveRecord(); // Guardará sin alterar foto existente o vacía
    }
}

// Guardar los objetivos y metas mensuales fijados por el administrador
function handleGoalsSubmit(e) {
    e.preventDefault();
    
    state.resourceGoals.energy_kpi_goal = parseFloat(document.getElementById("goal-energy-kpi").value);
    state.resourceGoals.water_kpi_goal = parseFloat(document.getElementById("goal-water-kpi").value);
    
    localStorage.setItem("ecomeq_resource_goals", JSON.stringify(state.resourceGoals));
    alert("Metas de eficiencia ambiental actualizadas correctamente.");
    
    renderResourcesView();
}

// Eliminar un registro de recursos de forma permanente (Admin)
function deleteResourceReading(id) {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este registro mensual?")) return;
    
    state.resourceReadings = state.resourceReadings.filter(r => r.id !== id);
    localStorage.setItem("ecomeq_resource_readings", JSON.stringify(state.resourceReadings));
    
    renderResourcesView();
}

// Visualizar foto ampliada en el modal visor
function openEvidencePhoto(id) {
    const r = state.resourceReadings.find(x => x.id === id);
    if (r && r.water_photo) {
        document.getElementById("evidence-modal-img").src = r.water_photo;
        document.getElementById("evidence-modal-meta").textContent = `Lectura de agua para el mes de ${formatResourceMonth(r.month)} (Operador: ${r.operator})`;
        openModal("modal-view-photo");
    }
}

// Mostrar u ocultar selectores del generador de reportes según tipo de consolidación
function handleCustomReportTypeChange() {
    const reportType = document.getElementById("cr-report-type").value;
    
    // Ocultar todos los contenedores de filtros específicos
    document.getElementById("cr-section-range").classList.add("hidden");
    document.getElementById("cr-section-month").classList.add("hidden");
    document.getElementById("cr-section-manifest").classList.add("hidden");
    
    // Desactivar campos requeridos para evitar fallos de envío
    document.getElementById("cr-startdate").required = false;
    document.getElementById("cr-enddate").required = false;
    const monthInput = document.getElementById("cr-month");
    if (monthInput) monthInput.required = false;
    const manifestSelect = document.getElementById("cr-manifest-select");
    if (manifestSelect) manifestSelect.required = false;
    
    // Activar y mostrar el campo que corresponde al tipo seleccionado
    if (reportType === "range") {
        document.getElementById("cr-section-range").classList.remove("hidden");
        document.getElementById("cr-startdate").required = true;
        document.getElementById("cr-enddate").required = true;
    } else if (reportType === "month") {
        document.getElementById("cr-section-month").classList.remove("hidden");
        if (monthInput) monthInput.required = true;
    } else if (reportType === "manifest") {
        document.getElementById("cr-section-manifest").classList.remove("hidden");
        if (manifestSelect) manifestSelect.required = true;
        populateManifestSelector();
    }
}

// Poblar selector de manifiestos únicos del generador de reportes
function populateManifestSelector() {
    const manifestSelect = document.getElementById("cr-manifest-select");
    if (!manifestSelect) return;
    
    manifestSelect.innerHTML = "";
    
    // Extraer manifiestos únicos presentes en reportes con estado recolectado
    const manifests = [...new Set(state.reports
        .filter(r => r.status === 'collected' && r.manifest)
        .map(r => r.manifest)
    )].sort();
    
    if (manifests.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = "No hay manifiestos registrados";
        manifestSelect.appendChild(opt);
    } else {
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        defaultOpt.textContent = "Seleccione un manifiesto de salida...";
        manifestSelect.appendChild(defaultOpt);
        
        manifests.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            manifestSelect.appendChild(opt);
        });
    }
}

/* ==========================================================================
   LÓGICA DEL SISTEMA DE NOTIFICACIONES E INTERFAZ DE ALERTAS
   ========================================================================== */
function initNotifications() {
    state.notifications = JSON.parse(localStorage.getItem("ecomeq_notifications")) || [];
    renderNotifications();
}

function addNotification(title, message, targetArea) {
    const notification = {
        id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        title: title,
        message: message,
        date: new Date().toLocaleDateString('es-ES') + ' ' + new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}),
        targetArea: targetArea,
        read: false
    };
    state.notifications.unshift(notification);
    localStorage.setItem("ecomeq_notifications", JSON.stringify(state.notifications));
    renderNotifications();
    
    // Si estamos en el Dashboard, re-renderizar
    if (state.currentView === 'dashboard') {
        renderDashboard();
    }
}

function renderNotifications() {
    const notifCount = document.getElementById("notification-count");
    const notifList = document.getElementById("notification-list");
    if (!notifCount || !notifList) return;

    // Filtrar notificaciones según el rol del usuario
    let visibleNotifs = state.notifications || [];
    if (isJefeDeArea(state.currentUser)) {
        const workerArea = state.currentUser.area || "";
        visibleNotifs = visibleNotifs.filter(n => n.targetArea === "All" || n.targetArea.toLowerCase() === workerArea.toLowerCase());
    }

    const unreadCount = visibleNotifs.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notifCount.textContent = unreadCount;
        notifCount.style.display = "flex";
    } else {
        notifCount.style.display = "none";
    }

    notifList.innerHTML = "";
    if (visibleNotifs.length === 0) {
        notifList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--color-text-muted); font-size: 11.5px;">
                No hay alertas pendientes.
            </div>
        `;
        return;
    }

    visibleNotifs.forEach(n => {
        const item = document.createElement("div");
        item.className = `notification-item ${n.read ? '' : 'unread'}`;
        item.onclick = () => {
            n.read = true;
            localStorage.setItem("ecomeq_notifications", JSON.stringify(state.notifications));
            renderNotifications();
            if (state.currentView === 'dashboard') {
                renderDashboard();
            }
        };

        item.innerHTML = `
            <div class="notification-item-icon">
                <span style="font-size: 14px;">🚨</span>
            </div>
            <div class="notification-item-content">
                <h5>${n.title}</h5>
                <p>${n.message}</p>
                <span class="notification-time">${n.date}</span>
            </div>
        `;
        notifList.appendChild(item);
    });
}

function clearNotifications() {
    if (isJefeDeArea(state.currentUser)) {
        const workerArea = state.currentUser.area || "";
        state.notifications = state.notifications.filter(n => !(n.targetArea === "All" || n.targetArea.toLowerCase() === workerArea.toLowerCase()));
    } else {
        state.notifications = [];
    }
    localStorage.setItem("ecomeq_notifications", JSON.stringify(state.notifications));
    renderNotifications();
    if (state.currentView === 'dashboard') {
        renderDashboard();
    }
}

function registerNotificationEvents() {
    const notifBtn = document.getElementById("notification-btn");
    const notifDropdown = document.getElementById("notification-dropdown");
    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = notifDropdown.style.display === "block";
            notifDropdown.style.display = isOpen ? "none" : "block";
        });
        
        document.addEventListener("click", () => {
            notifDropdown.style.display = "none";
        });
        
        notifDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }
    
    const clearBtn = document.getElementById("clear-notifications-btn");
    if (clearBtn) {
        clearBtn.onclick = clearNotifications;
    }
}

/* ==========================================================================
   LÓGICA DEL FORMULARIO E HISTORIAL DE INSPECCIONES
   ========================================================================== */
function initInspectionFormPrefill() {
    const inspectorField = document.getElementById("inspection-inspector");
    const dateField = document.getElementById("inspection-date");
    if (inspectorField) {
        inspectorField.value = state.currentUser ? `${state.currentUser.name} (${state.currentUser.role})` : "";
    }
    if (dateField && !dateField.value) {
        const now = new Date();
        const tzoffset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
        dateField.value = localISOTime;
    }
    
    // Inicializar checklist por defecto y cargar dropdown de programaciones
    renderInspectionChecklist();
    populateScheduledInspectionsDropdown();
}

function registerInspectionFormEvents() {
    const form = document.getElementById("inspection-create-form");
    if (!form) return;

    // Delegación de eventos para radio buttons del checklist dinámico
    form.addEventListener("change", function(e) {
        if (e.target.type === "radio") {
            checkComplianceState();
        }
    });

    form.addEventListener("submit", handleInspectionSubmit);
    
    const filterArea = document.getElementById("filter-inspection-area");
    if (filterArea) {
        filterArea.addEventListener("change", renderInspectionsTable);
    }
}

function checkComplianceState() {
    const form = document.getElementById("inspection-create-form");
    if (!form) return;
    
    const radios = form.querySelectorAll('input[type="radio"]:checked');
    let hasNonCompliance = false;
    
    radios.forEach(radio => {
        if (radio.value === "no-cumple") {
            hasNonCompliance = true;
        }
    });
    
    const extraFields = document.getElementById("non-compliance-fields");
    const findingText = document.getElementById("inspection-finding");
    const responsibleArea = document.getElementById("inspection-responsible-area");
    
    if (extraFields) {
        if (hasNonCompliance) {
            extraFields.style.display = "block";
            if (findingText) findingText.required = true;
            if (responsibleArea) responsibleArea.required = true;
        } else {
            extraFields.style.display = "none";
            if (findingText) {
                findingText.required = false;
                findingText.value = "";
            }
            if (responsibleArea) {
                responsibleArea.required = false;
                responsibleArea.value = "";
            }
        }
    }
}

function handleInspectionSubmit(e) {
    e.preventDefault();
    
    const area = document.getElementById("inspection-area").value;
    const dateVal = document.getElementById("inspection-date").value;
    const inspector = document.getElementById("inspection-inspector").value;
    const linkedEventId = document.getElementById("inspection-link-event").value;
    
    // Capturar respuestas de forma dinámica
    const answers = {};
    const checklistRows = document.querySelectorAll("#inspection-checklist-questions .checklist-q-row");
    checklistRows.forEach(row => {
        const questionSpan = row.querySelector("span");
        if (questionSpan) {
            // Eliminar número de índice inicial si existe (ej. "1. ")
            const label = questionSpan.textContent.replace(/^\d+\.\s*/, "").trim();
            const radioChecked = row.querySelector('input[type="radio"]:checked');
            answers[label] = radioChecked ? radioChecked.value : "cumple";
        }
    });
    
    const hasNonCompliance = Object.values(answers).includes("no-cumple");
    
    let findingObj = null;
    if (hasNonCompliance) {
        findingObj = {
            id: 'nov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            description: document.getElementById("inspection-finding").value,
            responsibleArea: document.getElementById("inspection-responsible-area").value,
            status: "Pendiente",
            adminComments: "",
            resolutionPhoto: "",
            resolutionComments: "",
            dateResolved: ""
        };
    }
    
    const newInspection = {
        id: 'insp-' + Date.now(),
        area: area,
        date: dateVal,
        inspector: inspector,
        linkedEventId: linkedEventId !== "default" ? linkedEventId : null,
        customChecklist: linkedEventId !== "default",
        answers: answers,
        status: hasNonCompliance ? "Con Incumplimientos" : "Cumplimiento Completo",
        finding: findingObj
    };
    
    const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
    inspections.unshift(newInspection);
    localStorage.setItem("ecomeq_inspections", JSON.stringify(inspections));
    
    // Marcar el evento calendarizado como completado en base de datos central
    if (linkedEventId && linkedEventId !== "default") {
        const events = JSON.parse(localStorage.getItem("ecomeq_calendar_events")) || [];
        const evIndex = events.findIndex(ev => ev.id === linkedEventId);
        if (evIndex !== -1) {
            events[evIndex].completed = true;
            localStorage.setItem("ecomeq_calendar_events", JSON.stringify(events));
        }
    }
    
    // Alerta si hay no cumplimiento
    if (hasNonCompliance) {
        const msg = `Fallas en checklist de área ${area}. Responsable: ${findingObj.responsibleArea}. Hallazgo: ${findingObj.description}`;
        addNotification("Alerta de Incumplimiento", msg, findingObj.responsibleArea);
    }
    
    // Limpiar formulario y recargar pre-llenados
    e.target.reset();
    checkComplianceState();
    initInspectionFormPrefill();
    
    // Re-render
    renderInspectionsTable();
    showSuccessModal("Inspección guardada exitosamente.");
}

function renderInspectionsTable() {
    const tbody = document.getElementById("inspections-table-body");
    const emptyState = document.getElementById("inspections-empty-state");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
    
    const filterArea = document.getElementById("filter-inspection-area").value;
    
    const filtered = inspections.filter(ins => {
        if (filterArea !== "All" && ins.area !== filterArea) return false;
        return true;
    });
    
    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        return;
    }
    
    if (emptyState) emptyState.style.display = "none";
    
    filtered.forEach(ins => {
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        const formattedDate = new Date(ins.date).toLocaleDateString('es-ES') + ' ' + new Date(ins.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
        const statusStyle = ins.status === "Cumplimiento Completo" ? 'color: var(--color-success); font-weight: 600;' : 'color: var(--color-error); font-weight: 600;';
        
        row.innerHTML = `
            <td style="padding: 10px 4px;">${formattedDate}</td>
            <td style="padding: 10px 4px; font-weight: 500;">${ins.area}</td>
            <td style="padding: 10px 4px;">${ins.inspector.split(" (")[0]}</td>
            <td style="padding: 10px 4px; text-align: center; ${statusStyle}">${ins.status}</td>
            <td style="padding: 10px 4px; text-align: center;">
                <button type="button" class="btn-secondary btn-xs" style="padding: 4px 8px;" onclick="openInspectionDetail('${ins.id}')">Ver Detalle</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    renderFindingsTable();
}

function openInspectionDetail(id) {
    const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
    const ins = inspections.find(item => item.id === id);
    if (!ins) return;
    
    const meta = document.getElementById("inspection-detail-meta");
    const checklist = document.getElementById("inspection-detail-checklist");
    const findingsContainer = document.getElementById("inspection-detail-findings-container");
    const findingsText = document.getElementById("inspection-detail-findings");
    
    const formattedDate = new Date(ins.date).toLocaleDateString('es-ES') + ' ' + new Date(ins.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
    
    meta.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div><strong>Área:</strong> ${ins.area}</div>
            <div><strong>Fecha:</strong> ${formattedDate}</div>
            <div style="grid-column: span 2;"><strong>Inspector:</strong> ${ins.inspector}</div>
            <div style="grid-column: span 2;"><strong>Estado:</strong> <span style="${ins.status === 'Cumplimiento Completo' ? 'color: var(--color-success)' : 'color: var(--color-error)'}; font-weight: bold;">${ins.status}</span></div>
        </div>
    `;
    
    const getValText = (val) => val === 'cumple' ? '🟢 CUMPLE' : '🔴 NO CUMPLE';
    
    const LEGACY_LABELS = {
        sga: "Rotulado SGA",
        segregation: "Segregación RESPEL",
        leaks: "Fugas y Fisuras",
        cleanup: "Orden y Limpieza",
        kit: "Kit Antiderrames"
    };

    checklist.innerHTML = "";
    let index = 1;
    for (const question in ins.answers) {
        const label = LEGACY_LABELS[question] || question;
        const row = document.createElement("div");
        row.style = "display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px; font-size: 13px;";
        row.innerHTML = `
            <span>${index}. ${label}:</span>
            <strong>${getValText(ins.answers[question])}</strong>
        `;
        checklist.appendChild(row);
        index++;
    }
    
    if (ins.status === "Con Incumplimientos" && ins.finding) {
        findingsContainer.style.display = "block";
        
        let desc = "";
        let areaResp = "";
        let isResolved = false;
        let resComments = "";
        let resPhoto = "";
        
        if (typeof ins.finding === 'object') {
            desc = ins.finding.description || "";
            areaResp = ins.finding.responsibleArea || "";
            isResolved = ins.finding.status === "Resuelto";
            resComments = ins.finding.resolutionComments || "";
            resPhoto = ins.finding.resolutionPhoto || "";
        } else {
            desc = ins.finding;
            areaResp = ins.responsibleArea || "";
        }
        
        findingsText.innerHTML = `<strong>Área Responsable:</strong> ${areaResp}<br><strong>Descripción del Hallazgo:</strong> ${desc}`;
        
        const resolutionDiv = document.getElementById("inspection-detail-resolution");
        const resolutionCommentsP = document.getElementById("inspection-detail-resolution-comments");
        const resolutionPhotoImg = document.getElementById("inspection-detail-resolution-photo");
        
        if (resolutionDiv) {
            if (isResolved) {
                resolutionDiv.style.display = "block";
                resolutionCommentsP.textContent = resComments || "Sin comentarios de solución.";
                if (resPhoto) {
                    resolutionPhotoImg.src = resPhoto;
                    resolutionPhotoImg.style.display = "block";
                } else {
                    resolutionPhotoImg.style.display = "none";
                }
            } else {
                resolutionDiv.style.display = "none";
            }
        }
    } else {
        findingsContainer.style.display = "none";
    }
    
    openModal("modal-inspection-detail");
}

/* ==========================================================================
   LÓGICA DEL CALENDARIO AMBIENTAL E INTERACTIVO
   ========================================================================== */
const calendarState = {
    currentDate: new Date()
};

const DEFAULT_CALENDAR_EVENTS = [
    { id: 'ev-1', title: 'Día de la Educación Ambiental', date: '2026-01-26', type: 'efemeride', desc: 'Concientización ambiental en procesos productivos.', recurry: true },
    { id: 'ev-2', title: 'Día Mundial del Agua', date: '2026-03-22', type: 'efemeride', desc: 'Uso racional y metas de ahorro del recurso hídrico.', recurry: true },
    { id: 'ev-3', title: 'Día de la Tierra', date: '2026-04-22', type: 'efemeride', desc: 'Promoción del desarrollo sustentable y la ecología.', recurry: true },
    { id: 'ev-4', title: 'Día Mundial del Reciclaje', date: '2026-05-17', type: 'efemeride', desc: 'Segregación correcta y minimización de RESPEL.', recurry: true },
    { id: 'ev-5', title: 'Día Mundial del Medio Ambiente', date: '2026-06-05', type: 'efemeride', desc: 'Refuerzo de buenas prácticas ecológicas corporativas.', recurry: true },
    { id: 'ev-6', title: 'Día contra el Cambio Climático', date: '2026-10-17', type: 'efemeride', desc: 'Medición de huella y metas de eficiencia.', recurry: true },
    { id: 'ev-7', title: 'Día de las Tecnologías Limpias', date: '2026-11-26', type: 'efemeride', desc: 'Revisión técnica de procesos limpios.', recurry: true }
];

function initCalendarEvents() {
    let saved = localStorage.getItem("ecomeq_calendar_events");
    if (!saved) {
        localStorage.setItem("ecomeq_calendar_events", JSON.stringify(DEFAULT_CALENDAR_EVENTS));
    }
}

function renderCalendar() {
    const monthYearTitle = document.getElementById("calendar-month-year");
    const daysGrid = document.getElementById("calendar-days-grid");
    if (!daysGrid || !monthYearTitle) return;

    const date = calendarState.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYearTitle.textContent = `${monthNames[month]} ${year}`;

    // Primer día del mes ajustado (Lunes = 0)
    const firstDay = new Date(year, month, 1);
    let startColumn = firstDay.getDay();
    startColumn = startColumn === 0 ? 6 : startColumn - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    daysGrid.innerHTML = "";
    const events = JSON.parse(localStorage.getItem("ecomeq_calendar_events")) || [];

    // Pre-rellenar días del mes anterior
    for (let i = startColumn - 1; i >= 0; i--) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day other-month";
        dayCell.innerHTML = `<span class="day-number">${prevMonthTotalDays - i}</span>`;
        daysGrid.appendChild(dayCell);
    }

    // Días activos del mes
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day";
        
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        if (isToday) {
            dayCell.classList.add("today");
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const shortDateStr = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayEvents = events.filter(ev => {
            if (ev.date === dateStr) return true;
            if (ev.recurry && ev.date.slice(5) === shortDateStr) return true;
            return false;
        });

        let dotsHtml = "";
        if (dayEvents.length > 0) {
            dotsHtml = `<div class="day-events-dots" style="display: flex; gap: 3px; justify-content: center; margin-top: 4px; flex-wrap: wrap;">`;
            dayEvents.forEach(ev => {
                let icon = "📅";
                if (ev.type === 'efemeride') icon = "🌍";
                else if (ev.type === 'inspeccion') icon = "🕵️‍♂️";
                else if (ev.type === 'recoleccion') icon = "♻️";
                else if (ev.type === 'reunion') icon = "🤝";
                else if (ev.type === 'capacitacion') icon = "📚";
                
                dotsHtml += `<span class="event-icon ${ev.type}" title="${ev.title}" style="font-size: 11px; display: inline-block;">${icon}</span>`;
            });
            dotsHtml += `</div>`;
        }

        dayCell.innerHTML = `
            <span class="day-number">${day}</span>
            ${dotsHtml}
        `;
        
        dayCell.onclick = () => {
            showDayEventsDetails(dayEvents, day, monthNames[month]);
        };

        daysGrid.appendChild(dayCell);
    }

    // Rellenar días del próximo mes
    const currentGridCells = startColumn + totalDays;
    const remainingCells = 42 - currentGridCells;
    for (let i = 1; i <= remainingCells; i++) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day other-month";
        dayCell.innerHTML = `<span class="day-number">${i}</span>`;
        daysGrid.appendChild(dayCell);
    }

    renderMonthlyEventsList(events, month, year);
}

function renderMonthlyEventsList(events, month, year) {
    const listContainer = document.getElementById("calendar-events-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";
    const shortMonthStr = `${String(month + 1).padStart(2, '0')}`;

    const monthlyEvents = events.filter(ev => {
        if (ev.recurry) {
            return ev.date.slice(5, 7) === shortMonthStr;
        }
        const evDate = new Date(ev.date);
        return evDate.getMonth() === month && evDate.getFullYear() === year;
    });

    monthlyEvents.sort((a, b) => {
        const getDay = (dateStr) => parseInt(dateStr.slice(8, 10));
        return getDay(a.date) - getDay(b.date);
    });

    if (monthlyEvents.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--color-text-muted); font-size: 12px;">
                No hay eventos programados para este mes.
            </div>
        `;
        return;
    }

    const typeIcons = {
        'efemeride': '🌍',
        'inspeccion': '🕵️‍♂️',
        'recoleccion': '♻️',
        'reunion': '🤝',
        'capacitacion': '📚'
    };

    const typeNames = {
        'efemeride': 'Efeméride Ambiental',
        'inspeccion': 'Inspección',
        'recoleccion': 'Recolección RESPEL',
        'reunion': 'Reunión / Evento',
        'capacitacion': 'Capacitación'
    };

    monthlyEvents.forEach(ev => {
        const item = document.createElement("div");
        item.className = `calendar-event-item ${ev.type}`;
        
        const evDay = ev.date.slice(8, 10);
        
        item.innerHTML = `
            <div style="font-size: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                ${typeIcons[ev.type] || '📅'}
            </div>
            <div style="flex: 1;">
                <h5>${ev.title}</h5>
                <p>${ev.desc}</p>
                <span class="event-date-tag">${typeNames[ev.type]} — Día ${evDay}</span>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function showDayEventsDetails(dayEvents, day, monthName) {
    if (dayEvents.length === 0) return;
    
    let content = `<div style="display: flex; flex-direction: column; gap: 12px;">`;
    dayEvents.forEach(ev => {
        content += `
            <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border-left: 4px solid var(${
                ev.type === 'efemeride' ? '--color-success' : ev.type === 'inspeccion' ? '--color-error' : ev.type === 'recoleccion' ? '--color-warning' : ev.type === 'capacitacion' ? '--color-primary-light' : '--color-accent'
            });">
                <h5 style="margin: 0 0 4px 0; color: #fff; font-size: 13.5px; font-weight: 600;">${ev.title}</h5>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: var(--color-text-muted);">${ev.desc}</p>
                <span style="font-size: 10px; font-weight: 700; color: var(--color-accent-light); text-transform: uppercase;">
                    ${ev.type.toUpperCase()}
                </span>
            </div>
        `;
    });
    content += `</div>`;

    const modalSuccess = document.getElementById("modal-success");
    if (modalSuccess) {
        document.getElementById("success-message").innerHTML = `
            <h4 style="margin: 0 0 12px 0; font-size: 15px; color: #fff;">Eventos del día ${day} de ${monthName}:</h4>
            ${content}
        `;
        const title = modalSuccess.querySelector(".modal-header h3");
        if (title) title.textContent = "Detalle del Calendario";
        
        openModal("modal-success");
        
        const closeBtn = modalSuccess.querySelector(".modal-footer button") || modalSuccess.querySelector(".btn-close-modal");
        const restore = () => {
            if (title) title.textContent = "Operación Exitosa";
            closeBtn.removeEventListener("click", restore);
        };
        closeBtn.addEventListener("click", restore);
    }
}

function changeCalendarMonth(direction) {
    const date = calendarState.currentDate;
    calendarState.currentDate = new Date(date.getFullYear(), date.getMonth() + direction, 1);
    renderCalendar();
}

function handleCalendarEventSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById("event-title").value;
    const dateVal = document.getElementById("event-date").value;
    const type = document.getElementById("event-type").value;
    const desc = document.getElementById("event-desc").value;
    
    let checklistItems = [];
    if (type === "inspeccion") {
        const checklistText = document.getElementById("event-checklist").value.trim();
        if (checklistText) {
            checklistItems = checklistText.split("\n").map(item => item.trim()).filter(item => item.length > 0);
        }
    }
    
    const newEvent = {
        id: 'ev-' + Date.now(),
        title: title,
        date: dateVal,
        type: type,
        desc: desc,
        recurry: false,
        checklistItems: checklistItems,
        completed: false
    };
    
    const events = JSON.parse(localStorage.getItem("ecomeq_calendar_events")) || [];
    events.push(newEvent);
    localStorage.setItem("ecomeq_calendar_events", JSON.stringify(events));
    
    // Ocultar el campo de checklist si estaba visible
    const eventChecklistGroup = document.getElementById("event-checklist-group");
    if (eventChecklistGroup) {
        eventChecklistGroup.style.display = "none";
    }
    
    e.target.reset();
    renderCalendar();
    renderDashboard();
    
    showSuccessModal("Evento agendado exitosamente.");
}

// Exponer funciones globales a la ventana para eventos inline del DOM
window.renderResourcesView = renderResourcesView;
window.handleResourceSubmit = handleResourceSubmit;
window.handleGoalsSubmit = handleGoalsSubmit;
window.deleteResourceReading = deleteResourceReading;
window.openEvidencePhoto = openEvidencePhoto;
window.handleCustomReportTypeChange = handleCustomReportTypeChange;
window.handleSdsUploadSubmit = handleSdsUploadSubmit;
window.startSdsEdit = startSdsEdit;
window.cancelSdsEdit = cancelSdsEdit;
window.deleteSds = deleteSds;
window.filterCourses = filterCourses;
window.openWorkerTrainingDetail = openWorkerTrainingDetail;
window.openCertificateModal = openCertificateModal;
window.changeCalendarMonth = changeCalendarMonth;
window.clearNotifications = clearNotifications;
window.openInspectionDetail = openInspectionDetail;

/* ==========================================================================
   LÓGICA DE NOVEDADES E INSPECCIONES (RBAC Y RESOLUCIÓN)
   ========================================================================== */

function renderFindingsTable() {
    const tbody = document.getElementById("findings-table-body");
    const emptyState = document.getElementById("findings-empty-state");
    const subtitle = document.getElementById("findings-subtitle");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
    
    let findings = [];
    inspections.forEach(ins => {
        if (ins.status === "Con Incumplimientos" && ins.finding) {
            let findingObj;
            if (typeof ins.finding === 'object') {
                findingObj = { ...ins.finding, inspectionId: ins.id, date: ins.date, inspector: ins.inspector };
            } else {
                findingObj = {
                    id: 'nov-legacy-' + ins.id,
                    inspectionId: ins.id,
                    description: ins.finding,
                    responsibleArea: ins.responsibleArea || ins.area,
                    status: "Pendiente",
                    adminComments: "",
                    resolutionPhoto: "",
                    resolutionComments: "",
                    dateResolved: "",
                    date: ins.date,
                    inspector: ins.inspector
                };
            }
            findings.push(findingObj);
        }
    });

    // Ordenar cronológicamente descendente
    findings.sort((a, b) => new Date(b.date) - new Date(a.date));

    const isJefe = isJefeDeArea(state.currentUser);
    const userArea = state.currentUser ? state.currentUser.area : "";

    if (isJefe) {
        findings = findings.filter(f => f.responsibleArea === userArea);
        if (subtitle) {
            subtitle.textContent = `Listado de novedades y hallazgos registrados para el área de ${userArea}.`;
        }
    } else {
        if (subtitle) {
            subtitle.textContent = "Consolidado de desviaciones detectadas en todas las áreas de la planta.";
        }
    }

    if (findings.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        return;
    }
    
    if (emptyState) emptyState.style.display = "none";

    findings.forEach(f => {
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        const formattedDate = new Date(f.date).toLocaleDateString('es-ES') + ' ' + new Date(f.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
        
        let statusBadge = "";
        if (f.status === "Resuelto") {
            statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; display: inline-block;">✅ Resuelto</span>`;
        } else {
            statusBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: var(--color-error); padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; display: inline-block;">⚠️ Pendiente</span>`;
        }

        let actionBtn = "";
        if (isJefe) {
            if (f.status === "Pendiente") {
                actionBtn = `<button type="button" class="btn-primary btn-xs" style="padding: 4px 8px; font-size: 11px;" onclick="openResolveFindingModal('${f.id}', '${f.inspectionId}')">Subir Solución</button>`;
            } else {
                actionBtn = `<button type="button" class="btn-secondary btn-xs" style="padding: 4px 8px; font-size: 11px;" onclick="openInspectionDetail('${f.inspectionId}')">Ver Evidencia</button>`;
            }
        } else {
            actionBtn = `<button type="button" class="btn-secondary btn-xs" style="padding: 4px 8px; font-size: 11px;" onclick="openAdminFindingModal('${f.id}', '${f.inspectionId}')">Gestionar</button>`;
        }

        row.innerHTML = `
            <td style="padding: 10px 4px;">${formattedDate}</td>
            <td style="padding: 10px 4px; font-weight: 500;">${f.responsibleArea}</td>
            <td style="padding: 10px 4px; line-height: 1.4;">${f.description}</td>
            <td style="padding: 10px 4px; text-align: center;">${statusBadge}</td>
            <td style="padding: 10px 4px; text-align: center;">${actionBtn}</td>
        `;
        tbody.appendChild(row);
    });
}

function openResolveFindingModal(findingId, inspectionId) {
    const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
    const ins = inspections.find(item => item.id === inspectionId);
    if (!ins) return;
    
    let findingDesc = "";
    if (typeof ins.finding === 'object') {
        findingDesc = ins.finding.description;
    } else {
        findingDesc = ins.finding;
    }
    
    document.getElementById("resolve-finding-id").value = inspectionId;
    document.getElementById("resolve-finding-desc").textContent = findingDesc;
    document.getElementById("resolve-finding-comments").value = "";
    document.getElementById("resolve-finding-photo").value = "";
    document.getElementById("resolve-photo-preview-container").style.display = "none";
    
    openModal("modal-resolve-finding");
}

function openAdminFindingModal(findingId, inspectionId) {
    const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
    const ins = inspections.find(item => item.id === inspectionId);
    if (!ins) return;
    
    let findingDesc = "";
    let isResolved = false;
    let resComments = "";
    let resPhoto = "";
    let adminComm = "";
    let status = "Pendiente";
    
    if (typeof ins.finding === 'object') {
        findingDesc = ins.finding.description;
        status = ins.finding.status || "Pendiente";
        adminComm = ins.finding.adminComments || "";
        resComments = ins.finding.resolutionComments || "";
        resPhoto = ins.finding.resolutionPhoto || "";
        isResolved = status === "Resuelto" || !!resPhoto;
    } else {
        findingDesc = ins.finding;
    }
    
    document.getElementById("admin-finding-id").value = inspectionId;
    document.getElementById("admin-finding-desc").textContent = findingDesc;
    document.getElementById("admin-finding-status").value = status;
    document.getElementById("admin-finding-review").value = adminComm;
    
    const evidenceSection = document.getElementById("admin-finding-evidence-section");
    const noEvidenceSection = document.getElementById("admin-finding-no-evidence-section");
    const photoImg = document.getElementById("admin-finding-photo");
    const commentsP = document.getElementById("admin-finding-comments");
    
    if (resPhoto || resComments) {
        evidenceSection.style.display = "block";
        noEvidenceSection.style.display = "none";
        commentsP.textContent = resComments || "Sin comentarios de solución.";
        if (resPhoto) {
            photoImg.src = resPhoto;
            photoImg.style.display = "block";
        } else {
            photoImg.style.display = "none";
        }
    } else {
        evidenceSection.style.display = "none";
        noEvidenceSection.style.display = "block";
    }
    
    openModal("modal-admin-finding");
}

// Configurar elementos del DOM y controladores para fotos y formularios de novedades
document.addEventListener("DOMContentLoaded", () => {
    const photoInput = document.getElementById("resolve-finding-photo");
    const photoPreview = document.getElementById("resolve-photo-preview");
    const previewContainer = document.getElementById("resolve-photo-preview-container");
    
    if (photoInput) {
        photoInput.addEventListener("change", function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreview.src = e.target.result;
                    previewContainer.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.style.display = "none";
            }
        });
    }
    
    const resolveForm = document.getElementById("finding-resolve-form");
    if (resolveForm) {
        resolveForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const inspectionId = document.getElementById("resolve-finding-id").value;
            const comments = document.getElementById("resolve-finding-comments").value;
            const photoSrc = photoPreview.src;
            
            const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
            const index = inspections.findIndex(item => item.id === inspectionId);
            
            if (index !== -1) {
                if (typeof inspections[index].finding !== 'object') {
                    inspections[index].finding = {
                        id: 'nov-' + Date.now(),
                        description: inspections[index].finding,
                        responsibleArea: inspections[index].responsibleArea || inspections[index].area
                    };
                }
                
                inspections[index].finding.resolutionPhoto = photoSrc;
                inspections[index].finding.resolutionComments = comments;
                inspections[index].finding.status = "Pendiente";
                
                localStorage.setItem("ecomeq_inspections", JSON.stringify(inspections));
                
                addNotification("Solución Recibida", `Se subió la solución de novedad en el área ${inspections[index].finding.responsibleArea}.`, "Coordinador");
                
                closeModal("modal-resolve-finding");
                renderInspectionsTable();
                showSuccessModal("Evidencia de solución enviada correctamente para revisión.");
            }
        });
    }
    
    const adminForm = document.getElementById("finding-admin-form");
    if (adminForm) {
        adminForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const inspectionId = document.getElementById("admin-finding-id").value;
            const status = document.getElementById("admin-finding-status").value;
            const reviewComments = document.getElementById("admin-finding-review").value;
            
            const inspections = JSON.parse(localStorage.getItem("ecomeq_inspections")) || [];
            const index = inspections.findIndex(item => item.id === inspectionId);
            
            if (index !== -1) {
                if (typeof inspections[index].finding !== 'object') {
                    inspections[index].finding = {
                        id: 'nov-' + Date.now(),
                        description: inspections[index].finding,
                        responsibleArea: inspections[index].responsibleArea || inspections[index].area
                    };
                }
                
                inspections[index].finding.status = status;
                inspections[index].finding.adminComments = reviewComments;
                if (status === "Resuelto") {
                    inspections[index].finding.dateResolved = new Date().toISOString();
                }
                
                localStorage.setItem("ecomeq_inspections", JSON.stringify(inspections));
                
                closeModal("modal-admin-finding");
                renderInspectionsTable();
                showSuccessModal(`Estado de la novedad actualizado a ${status} con éxito.`);
            }
        });
    }
});

// Exponer funciones globales de novedades
window.openResolveFindingModal = openResolveFindingModal;
window.openAdminFindingModal = openAdminFindingModal;
window.renderFindingsTable = renderFindingsTable;

/* ==========================================================================
   CHECKLIST DINÁMICO Y VINCULACIÓN AL CALENDARIO
   ========================================================================== */

const DEFAULT_CHECKLIST = [
    { name: "check-sga", label: "Rotulado SGA", desc: "Envases químicos/RESPEL debidamente etiquetados." },
    { name: "check-segregation", label: "Segregación RESPEL", desc: "Residuos clasificados por compatibilidad química." },
    { name: "check-leaks", label: "Fugas y Fisuras", desc: "Ausencia de fisuras o derrames en los recipientes." },
    { name: "check-cleanup", label: "Orden y Limpieza", desc: "Área de almacenamiento despejada y libre de obstáculos." },
    { name: "check-kit", label: "Kit Antiderrames", desc: "Kit antiderrame del sector completo y de fácil acceso." }
];

function renderInspectionChecklist(items) {
    const container = document.getElementById("inspection-checklist-questions");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!items || items.length === 0) {
        DEFAULT_CHECKLIST.forEach((item, index) => {
            const row = document.createElement("div");
            row.className = "checklist-q-row";
            row.style = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px;";
            row.innerHTML = `
                <div style="flex: 1; padding-right: 12px;">
                    <span style="font-weight: 500; font-size: 13px; display: block; color: #fff;">${index + 1}. ${item.label}</span>
                    <span style="font-size: 11px; color: var(--color-text-muted);">${item.desc}</span>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    <label class="btn-check-label"><input type="radio" name="${item.name}" value="cumple" checked> C</label>
                    <label class="btn-check-label"><input type="radio" name="${item.name}" value="no-cumple"> NC</label>
                </div>
            `;
            container.appendChild(row);
        });
    } else {
        items.forEach((itemText, index) => {
            const name = `check-custom-${index}`;
            const row = document.createElement("div");
            row.className = "checklist-q-row";
            row.style = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px;";
            row.innerHTML = `
                <div style="flex: 1; padding-right: 12px;">
                    <span style="font-weight: 500; font-size: 13px; display: block; color: #fff;">${index + 1}. ${itemText}</span>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    <label class="btn-check-label"><input type="radio" name="${name}" value="cumple" checked> C</label>
                    <label class="btn-check-label"><input type="radio" name="${name}" value="no-cumple"> NC</label>
                </div>
            `;
            container.appendChild(row);
        });
    }
    
    checkComplianceState();
}

function populateScheduledInspectionsDropdown() {
    const selectEl = document.getElementById("inspection-link-event");
    if (!selectEl) return;
    
    selectEl.innerHTML = '<option value="default">Ninguna (Lista por defecto)</option>';
    
    const events = JSON.parse(localStorage.getItem("ecomeq_calendar_events")) || [];
    const pendingInspections = events.filter(ev => ev.type === "inspeccion" && !ev.completed);
    
    pendingInspections.forEach(ev => {
        const opt = document.createElement("option");
        opt.value = ev.id;
        const formattedDate = new Date(ev.date + 'T00:00:00').toLocaleDateString('es-ES');
        opt.textContent = `${formattedDate} - ${ev.title}`;
        selectEl.appendChild(opt);
    });
}

// Configurar controladores de eventos adicionales para checklists dinámicos
document.addEventListener("DOMContentLoaded", () => {
    const eventTypeSelect = document.getElementById("event-type");
    const eventChecklistGroup = document.getElementById("event-checklist-group");
    if (eventTypeSelect && eventChecklistGroup) {
        eventTypeSelect.addEventListener("change", function() {
            if (this.value === "inspeccion") {
                eventChecklistGroup.style.display = "block";
            } else {
                eventChecklistGroup.style.display = "none";
            }
        });
    }
    
    const linkEventSelect = document.getElementById("inspection-link-event");
    if (linkEventSelect) {
        linkEventSelect.addEventListener("change", function() {
            const eventId = this.value;
            if (eventId === "default") {
                renderInspectionChecklist();
                return;
            }
            
            const events = JSON.parse(localStorage.getItem("ecomeq_calendar_events")) || [];
            const ev = events.find(item => item.id === eventId);
            if (ev) {
                const titleLower = ev.title.toLowerCase();
                const areaField = document.getElementById("inspection-area");
                if (areaField) {
                    if (titleLower.includes("producción")) {
                        areaField.value = "Producción";
                    } else if (titleLower.includes("mantenimiento")) {
                        areaField.value = "Mantenimiento";
                    } else if (titleLower.includes("laboratorio")) {
                        areaField.value = "Laboratorio";
                    } else if (titleLower.includes("logística")) {
                        areaField.value = "Logística";
                    } else if (titleLower.includes("oficinas")) {
                        areaField.value = "Oficinas";
                    }
                }
                
                if (ev.date) {
                    const dateField = document.getElementById("inspection-date");
                    if (dateField) {
                        dateField.value = ev.date + "T10:00";
                    }
                }
                
                renderInspectionChecklist(ev.checklistItems);
            }
        });
    }
});

// Exponer funciones globales
window.renderInspectionChecklist = renderInspectionChecklist;
window.populateScheduledInspectionsDropdown = populateScheduledInspectionsDropdown;



