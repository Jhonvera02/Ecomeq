const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Asegurar que el directorio de datos existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Configurar límites altos de JSON para permitir carga de PDFs/imágenes Base64 de capacitaciones
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Servir la aplicación web estática
app.use(express.static(path.join(__dirname)));

// --- DATOS SEMILLA POR DEFECTO ---
const DEFAULT_USERS = [
    { email: "admin@ecomeq.com", password: "admin123", name: "Laura Martínez", role: "Coordinador", area: "Medio Ambiente" },
    { email: "operador@ecomeq.com", password: "operador123", name: "Carlos Gómez - Jefe de Producción", role: "Jefe de Área", area: "Producción" }
];

const SEED_REPORTS = [
    { id: "rep-2025-01", datetime: "2025-01-15T08:00", area: "Producción", bodega: "Bodega 1 (Principal)", wasteName: "Aceite de motor usado", weight: 95.0, type: "Hidrocarburos", corriente: "Y8", physicalState: "Líquido", operator: "Carlos Gómez", observations: "Lotes anuales de mantenimiento.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0012", collectedDate: "2025-01-20T14:00" },
    { id: "rep-2025-02", datetime: "2025-02-18T09:30", area: "Laboratorio", bodega: "Bodega 2 (Auxiliar)", wasteName: "Descarte de ácido nítrico", weight: 42.0, type: "Ácidos", corriente: "Y34", physicalState: "Líquido", operator: "Doris Quiroga", observations: "Limpieza semestral.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0028", collectedDate: "2025-02-22T10:00" },
    { id: "rep-2025-03", datetime: "2025-03-24T14:00", area: "Mantenimiento", bodega: "Centro de acopio", wasteName: "EPPs impregnados con grasa", weight: 35.5, type: "Sólidos impregnados", corriente: "A4130", physicalState: "Sólido", operator: "Juan Pérez", observations: "Trapos de mantenimiento general.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0044", collectedDate: "2025-03-28T16:00" },
    { id: "rep-2025-04", datetime: "2025-05-10T11:00", area: "Logística", bodega: "Shut de RESPEL", wasteName: "Envases de reactivos vacíos", weight: 58.0, type: "Envases contaminados", corriente: "A4130", physicalState: "Sólido", operator: "Marcos Sierra", observations: "Tambores plásticos.", status: "collected", collectedBy: "Veolia", manifest: "MAN-2025-0078", collectedDate: "2025-05-15T11:00" },
    { id: "rep-2025-05", datetime: "2025-08-12T10:00", area: "Producción", bodega: "Bodega 1 (Principal)", wasteName: "Lodos aceitosos", weight: 120.0, type: "Hidrocarburos", corriente: "Y9", physicalState: "Lodo", operator: "Carlos Gómez", observations: "Aceites usados.", status: "collected", collectedBy: "Ecológica", manifest: "MAN-2025-0134", collectedDate: "2025-08-16T09:00" },
    { id: "rep-2025-06", datetime: "2025-10-05T09:00", area: "Laboratorio", bodega: "Bodega 2 (Auxiliar)", wasteName: "Soda cáustica gastada", weight: 28.0, type: "Básicos", corriente: "Y35", physicalState: "Líquido", operator: "Doris Quiroga", observations: "Desechos alcalinos.", status: "collected", collectedBy: "Ecológica", manifest: "MAN-2025-0189", collectedDate: "2025-10-10T12:00" },
    { id: "rep-2025-07", datetime: "2025-12-19T15:30", area: "Oficinas", bodega: "Shut de RESPEL", wasteName: "Tubos de luz mercuriales", weight: 18.0, type: "Luminarias", corriente: "Y29", physicalState: "Sólido", operator: "Sofía Castro", observations: "Recambio de fin de año.", status: "collected", collectedBy: "Ecológica", manifest: "MAN-2025-0230", collectedDate: "2025-12-23T11:00" },
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

const SEED_INCIDENTS = [
    { id: "inc-1", datetime: "2026-04-12T09:15", area: "Mantenimiento", substance: "Hidrocarburos", volume: 15.0, kitUsed: "Sí", status: "Controlado", operator: "Juan Pérez", desc: "Rotura de manguera de trasvase de aceite hidráulico usado.", action: "Se colocaron salchichas absorbentes del kit y arena. El aceite fue absorbido con hojas absorbentes y depositado en bolsa de RESPEL." },
    { id: "inc-2", datetime: "2026-05-02T11:00", area: "Laboratorio", substance: "Ácidos", volume: 3.5, kitUsed: "Sí", status: "Controlado", operator: "Doris Quiroga", desc: "Caída de frasco de ácido nítrico concentrado en mesón.", action: "Se aplicó neutralizante en polvo para ácidos (cambió de color indicando neutralización) y se limpió con estopa húmeda." },
    { id: "inc-3", datetime: "2026-05-20T16:30", area: "Producción", substance: "Básicos", volume: 8.0, kitUsed: "Sí", status: "Controlado", operator: "Carlos Gómez", desc: "Derrame menor de soda cáustica líquida por rebose de tanque de lavado.", action: "Se acordonó el área, se aplicó neutralizante básico y absorbente universal." }
];

const COURSES_DATA = [
    {
        id: "course-1",
        category: "Presentación",
        title: "Clasificación de RESPEL: Hidrocarburos, Ácidos y Básicos (SGA)",
        desc: "Aprenda a identificar y segregar correctamente los residuos de acuerdo a su naturaleza de inflamabilidad o corrosividad siguiendo el Sistema Globalmente Armonizado.",
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        slides: [
            { title: "Introducción a los Residuos Peligrosos", content: `<p>Un residuo peligroso (<strong>RESPEL</strong>) es aquel que, por sus características corrosivas, reactivas, explosivas, tóxicas, inflamables o biológico-infecciosas, puede causar daño a la salud humana o al medio ambiente.</p><p>En nuestra empresa, la clasificación básica obligatoria divide las corrientes líquidas y químicas principalmente en tres grupos:</p><ul><li><strong>Hidrocarburos:</strong> Aceites usados, grasas, combustibles y solventes orgánicos.</li><li><strong>Ácidos:</strong> Residuos líquidos con un pH menor a 2 (ácido clorhídrico, sulfúrico, nítrico).</li><li><strong>Básicos:</strong> Residuos líquidos con un pH mayor a 12 (hidróxido de sodio, potasa cáustica).</li></ul>` },
            { title: "Identificación según SGA", content: `<p>El Sistema Globalmente Armonizado (SGA) exige etiquetar cada recipiente contenedor de RESPEL con sus pictogramas correspondientes:</p><ul><li><strong>Llamas (Inflamables):</strong> Aplica a Hidrocarburos. Mantener lejos de chispas y calor excesivo.</li><li><strong>Corrosión (Corrosivos):</strong> Aplica a Ácidos y Básicos. Causa quemaduras graves en piel y ojos.</li><li><strong>Signo de Exclamación / Calavera:</strong> Tóxicos por inhalación o contacto.</li></ul><div class="slide-highlight-card"><p>⚠️ IMPORTANTE: Nunca mezcle ácidos con básicos. La reacción es violenta (neutralización exotérmica) liberando gases tóxicos y altas temperaturas.</p></div>` },
            { title: "Normas de Segregación en Ecomeq", content: `<p>Al hacer entrega de residuos en el centro de almacenamiento:</p><ul><li>Los <strong>Hidrocarburos</strong> se almacenan en el dique de contención verde, en bidones plásticos.</li><li>Los <strong>Ácidos</strong> se ubican sobre estibas antiderrame independientes etiquetadas con color rojo.</li><li>Los <strong>Básicos</strong> se colocan en estibas antiderrame independientes con etiqueta azul.</li></ul><p>Cada entrega debe pesarse de manera exacta y ser reportada a través del sistema inmediatamente.</p>` }
        ],
        quiz: [
            { question: "¿Cuál es el riesgo principal de mezclar residuos Ácidos con Básicos?", options: ["No ocurre nada, se neutralizan pacíficamente.", "Se genera una reacción exotérmica violenta con posible emisión de vapores tóxicos.", "Los residuos se evaporan por completo."], answer: 1 },
            { question: "¿Qué pictograma del SGA corresponde típicamente a los Hidrocarburos?", options: ["Calavera y tibias cruzadas", "Signo de exclamación de peligro genérico", "Llama de sustancia inflamable"], answer: 2 },
            { question: "¿Cuál es el pH característico de un residuo químico Básico o Alcalino?", options: ["pH menor a 2", "pH neutral (exactamente 7)", "pH mayor a 12"], answer: 2 }
        ]
    },
    {
        id: "course-2",
        category: "Sensibilización",
        title: "Manejo Seguro de Sustancias Químicas Corrosivas e Inflamables",
        desc: "Protocolos operativos estándar para la manipulación, trasvase y almacenamiento temporal de ácidos, bases e hidrocarburos.",
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><circle cx="12" cy="17" r="1"></circle></svg>',
        slides: [
            { title: "Riesgos de Corrosivos e Inflamables", content: `<p>Las sustancias químicas peligrosas con las que trabajamos a diario requieren medidas de protección específicas:</p><ul><li><strong>Sustancias Corrosivas (Ácidos y Bases):</strong> Tienen el potencial de destruir tejidos vivos o materiales metálicos. Sus vapores pueden lesionar las vías respiratorias.</li><li><strong>Sustancias Inflamables (Hidrocarburos):</strong> Tienen un punto de inflamación bajo y pueden arder con facilidad. Los vapores acumulados en espacios cerrados representan riesgo de explosión.</li></ul>` }
        ],
        quiz: [
            { question: "¿Qué EPP es indispensable al trasvasar ácidos concentrados?", options: ["Guantes de tela y gafas comunes.", "Careta facial completa, guantes de nitrilo/neopreno y delantal de PVC.", "Solo mascarilla antipolvo."], answer: 1 }
        ]
    }
];

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

const DEFAULT_RESOURCE_GOALS = {
    energy_kpi_goal: 1.5,
    water_kpi_goal: 0.05
};

const DEFAULT_DISPOSAL_RATES = {
    'Hidrocarburos': 1200,
    'Ácidos': 3500,
    'Básicos': 3000,
    'Envases contaminados': 1800,
    'Sólidos impregnados': 2200,
    'Luminarias': 4500
};

const SEED_CALENDAR_EVENTS = [
    { title: "Día Mundial del Agua", date: "2026-03-22", type: "efemeride", desc: "Celebración y concientización sobre el recurso hídrico.", recurry: true },
    { title: "Día de la Tierra", date: "2026-04-22", type: "efemeride", desc: "Fecha internacional para promover la conservación del planeta.", recurry: true },
    { title: "Día Mundial del Medio Ambiente", date: "2026-06-05", type: "efemeride", desc: "Principal fecha de la ONU para fomentar la acción ambiental.", recurry: true },
    { title: "Inspección General del Centro de Acopio", date: "2026-07-10", type: "inspeccion", desc: "Revisión trimestral obligatoria de diques de contención y rotulado SGA." },
    { title: "Despacho Semanal de Hidrocarburos", date: "2026-07-12", type: "recoleccion", desc: "Entrega programada al gestor autorizado." },
    { title: "Capacitación en Manejo de Derrames", date: "2026-07-18", type: "capacitacion", desc: "Taller práctico obligatorio para brigadistas y operadores de área." },
    { title: "Comité Ambiental Mensual", date: "2026-07-25", type: "reunion", desc: "Reunión de seguimiento a KPIs de consumo de recursos." }
];

// --- UTILIDADES DE PERSISTENCIA ---
function getFilePath(key) {
    return path.join(DATA_DIR, `${key}.json`);
}

function loadData(key, defaultValue) {
    const file = getFilePath(key);
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultValue, null, 4));
        return defaultValue;
    }
    try {
        const content = fs.readFileSync(file, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        console.error(`Error leyendo archivo ${key}.json:`, e);
        return defaultValue;
    }
}

function saveData(key, data) {
    const file = getFilePath(key);
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

// --- ENDPOINTS DE CARGA Y GUARDADO GLOBAL (MÉTODO KEY-VALUE) ---
app.get('/api/load', (req, res) => {
    const db = {
        users: loadData('users', DEFAULT_USERS),
        reports: loadData('reports', SEED_REPORTS),
        incidents: loadData('incidents', SEED_INCIDENTS),
        inspections: loadData('inspections', []),
        notifications: loadData('notifications', []),
        courses: loadData('courses', COURSES_DATA),
        resources: loadData('resources', SEED_RESOURCES),
        goals: loadData('goals', DEFAULT_RESOURCE_GOALS),
        rates: loadData('rates', DEFAULT_DISPOSAL_RATES),
        calendar: loadData('calendar', SEED_CALENDAR_EVENTS),
        customSds: loadData('custom_sds', [])
    };
    
    // Cargar también entrenamientos de trabajadores
    const trainingsFile = getFilePath('trainings');
    db.trainings = fs.existsSync(trainingsFile) ? JSON.parse(fs.readFileSync(trainingsFile, 'utf-8')) : {};

    res.json(db);
});

app.post('/api/save', (req, res) => {
    const { key, data } = req.body;
    if (!key) {
        return res.status(400).json({ error: "Falta la clave 'key' de almacenamiento." });
    }
    
    const mappedKey = key.replace('ecomeq_', ''); // Remover prefijo local
    
    if (mappedKey === 'trainings') {
        saveData('trainings', data);
    } else if (mappedKey === 'customSds' || mappedKey === 'custom_sds') {
        saveData('custom_sds', data);
    } else if (mappedKey === 'calendar_events' || mappedKey === 'calendar') {
        saveData('calendar', data);
    } else {
        saveData(mappedKey, data);
    }
    
    res.json({ success: true });
});

// Levantar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor local Express corriendo en http://localhost:${PORT}`);
});
