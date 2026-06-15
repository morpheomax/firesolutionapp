export const packagedPumpSystem = {
  id: 'distribution-center-packaged-pump-house',
  title: {
    es: 'Sistema paquetizado de bombeo contra incendio para centro de distribucion',
    en: 'Packaged fire pump system for a distribution center',
  },
  summary: {
    es: 'Modulo educativo base para estudiar una solucion completa con estanque apernado, caseta de bombas, red perimetral y derivacion a rociadores.',
    en: 'Base educational module to study a complete solution with a bolted water tank, pump house, yard loop and sprinkler branch.',
  },
  designBasis: {
    profile: 'generic-realistic',
    fidelityTarget: 'L3-ready',
    ratedFlowGpm: 1500,
    ratedPressurePsi: 120,
    estimatedDurationMinutes: 90,
    tankType: 'bolted-panel water tank',
    pumpHouseType: 'enclosed prefabricated pump house with visible cutaway learning view',
    standards: ['NFPA 13', 'NFPA 20', 'NFPA 22', 'NFPA 24', 'NFPA 25', 'Normativa chilena contra incendio'],
    brands: ['SPP', 'Clarke', 'Tornatech'],
    assumptions: [
      'El sistema se modela como un caso generico realista y no como un proyecto IFC o as-built.',
      'Las proporciones visuales y el layout siguen referencias publicas de fabricantes y criterios NFPA para entrenamiento.',
      'La escena actual es una base L2 alta preparada para crecer a L3 por activo y por subsistema.',
    ],
  },
  learningModes: [
    {
      id: 'explore',
      title: 'Explorar / Explore',
      description: 'Seleccion del componente y lectura de fichas tecnicas bilingues.',
    },
    {
      id: 'hydraulic-path',
      title: 'Circuito hidraulico / Hydraulic path',
      description: 'Lectura del recorrido del agua desde el estanque hasta la red.',
    },
    {
      id: 'guided-tour',
      title: 'Recorrido guiado / Guided tour',
      description: 'Secuencia paso a paso por los componentes clave del sistema completo.',
    },
    {
      id: 'inspection',
      title: 'Inspeccion / Inspection',
      description: 'Base para futuros chequeos operacionales y de mantenimiento segun NFPA 25.',
    },
  ],
  subsystems: [
    {
      id: 'water-storage',
      title: 'Almacenamiento de agua / Water storage',
      description: 'Estanque apernado, toma de succion y elementos de acceso e instrumentacion.',
      componentIds: ['cistern', 'footValve'],
    },
    {
      id: 'pump-house',
      title: 'Caseta de bombeo / Pump house',
      description: 'Bombas, headers, valvulas, instrumentacion y controladores.',
      componentIds: ['suctionHeader', 'mainPump', 'dieselPump', 'jockeyPump', 'dischargeManifold', 'gateValveOS', 'checkValve', 'pressureGauge', 'reliefValve', 'pumpController', 'flowMeter', 'testHeader', 'dieselFuelTank', 'exhaustSystem', 'groovedCouplings', 'pumpHouseLouvers'],
    },
    {
      id: 'distribution',
      title: 'Distribucion / Distribution',
      description: 'Descarga hacia red perimetral privada y derivacion al sistema de rociadores.',
      componentIds: ['dischargePipe', 'yardLoop', 'yardHydrants', 'fireDepartmentConnection', 'sprinklerRiser', 'alarmValveAssembly', 'sprinklerNetwork', 'warehouseEnvelope', 'warehouseRacks', 'loadingDocks'],
    },
  ],
  roadmap: [
    {
      id: 'sprinkler-network',
      title: 'Red de rociadores y bodega / Warehouse sprinkler network',
      status: 'next',
    },
    {
      id: 'fk-clean-agent',
      title: 'FK-5-1-12 / Novec 1230 low pressure system',
      status: 'planned',
    },
    {
      id: 'co2-high-pressure',
      title: 'CO2 high pressure system',
      status: 'planned',
    },
    {
      id: 'fire-detection',
      title: 'Deteccion convencional e inteligente / Conventional and addressable detection',
      status: 'planned',
    },
  ],
};

export const firePumpComponents = {
  cistern: {
    id: 'cistern',
    color: 0x1a5276,
    name: {
      es: 'Estanque apernado de agua contra incendio',
      en: 'Bolted fire water storage tank',
    },
    shortLabel: 'Estanque / Tank',
    category: 'water-storage',
    brandReference: 'Generico NFPA 22',
    nfpa: ['NFPA 22'],
    function: {
      es: 'Almacena el volumen util de agua para cubrir la demanda del sistema cuando la red publica no es suficiente o no es confiable.',
      en: 'Stores the usable fire water volume required to satisfy system demand when the public supply is insufficient or unreliable.',
    },
    description: {
      es: 'Modelo base de estanque apernado exterior conectado en succion positiva a la caseta. En la version educativa se utiliza como punto de partida del recorrido hidraulico y como referencia para discutir capacidad, accesos, supervisiones y mantenimiento.',
      en: 'Base model of an outdoor bolted tank connected to the pump house with positive suction. In the learning module it acts as the starting point for the hydraulic path and for discussing storage capacity, access, supervision and maintenance.',
    },
    specs: [
      'Capacidad de referencia / Reference capacity: 90 min @ 1,500 GPM baseline',
      'Tipo / Type: panelizado apernado / bolted panel tank',
      'Servicio / Duty: almacenamiento exclusivo para incendio / dedicated fire water storage',
      'Conexion / Connection: succion positiva hacia header principal / positive suction to main header',
    ],
  },
  suctionHeader: {
    id: 'suctionHeader',
    color: 0x2471a3,
    name: {
      es: 'Header de succion principal',
      en: 'Main suction header',
    },
    shortLabel: 'Header succion',
    category: 'pump-house',
    brandReference: 'SPP-aligned packaged layout',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Conduce el agua desde el estanque hacia las bombas manteniendo una alimentacion inundada y ordenada dentro de la caseta.',
      en: 'Conveys water from the tank to the pumps while maintaining a flooded and orderly suction arrangement inside the pump house.',
    },
    description: {
      es: 'Se modela como un header de succion de gran diametro con recorrido lo mas limpio posible para explicar la importancia de las perdidas bajas, transiciones correctas y distancias rectas antes de las bombas.',
      en: 'Modeled as a large-diameter suction header with the cleanest practical routing to explain low losses, proper transitions and straight runs before the pumps.',
    },
    specs: [
      'Diametro base modelado / Modeled baseline diameter: 10 in',
      'Configuracion / Configuration: succion inundada / flooded suction',
      'Criterio educativo / Learning focus: reduccion excentrica y tramo recto previo a bomba',
      'Norma / Standard: NFPA 20 suction arrangement principles',
    ],
  },
  footValve: {
    id: 'footValve',
    color: 0xe67e22,
    name: {
      es: 'Valvula de pie con colador',
      en: 'Foot valve with strainer',
    },
    shortLabel: 'Foot valve',
    category: 'water-storage',
    brandReference: 'Generico',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Protege la entrada de succion y ayuda a evitar ingreso de solidos gruesos al sistema.',
      en: 'Protects the suction intake and helps prevent large solids from entering the system.',
    },
    description: {
      es: 'En esta etapa se usa como componente educativo para mostrar la relacion entre el estanque, la toma de agua y la proteccion mecanica de la succion.',
      en: 'At this stage it is used as an educational component to show the relationship between the water tank, the water intake and suction-side mechanical protection.',
    },
    specs: [
      'Tipo / Type: check vertical con colador / vertical check with strainer',
      'Ubicacion / Location: toma inferior de estanque / lower tank intake',
      'Tema educativo / Learning focus: retencion, limpieza y proteccion de succion',
    ],
  },
  mainPump: {
    id: 'mainPump',
    color: 0xc0392b,
    name: {
      es: 'Bomba principal electrica SPP',
      en: 'SPP electric main fire pump',
    },
    shortLabel: 'Bomba electrica',
    category: 'pump-house',
    brandReference: 'SPP',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Entrega el caudal y la presion principal del sistema cuando la demanda de incendio produce una caida de presion.',
      en: 'Provides the main system flow and pressure when fire demand causes a pressure drop.',
    },
    description: {
      es: 'Referencia visual basada en una bomba horizontal split-case para 1,500 GPM con motor electrico. Se utiliza para explicar curva de bomba, eje, acople, carcasa, bridas y relacion con el controlador principal.',
      en: 'Visual reference based on a 1,500 GPM horizontal split-case pump driven by an electric motor. Used to explain the pump curve, shaft, coupling, casing, flanges and its relationship with the main controller.',
    },
    specs: [
      'Marca de referencia / Reference brand: SPP',
      'Capacidad base / Baseline duty: 1,500 GPM @ 120 PSI',
      'Tipo / Type: horizontal split-case',
      'Driver / Driver: electric motor',
      'Certificacion objetivo / Target listing: UL/FM class',
    ],
  },
  dieselPump: {
    id: 'dieselPump',
    color: 0x626567,
    name: {
      es: 'Bomba de respaldo diésel SPP con motor Clarke',
      en: 'SPP diesel backup fire pump with Clarke engine',
    },
    shortLabel: 'Bomba diesel',
    category: 'pump-house',
    brandReference: 'SPP + Clarke',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Asegura la operacion del sistema cuando la fuente electrica principal falla o no esta disponible.',
      en: 'Ensures system operation when the main electrical source fails or is unavailable.',
    },
    description: {
      es: 'La escena muestra una configuracion diesel realista con bomba horizontal, motor Clarke, elementos de combustible y descarga. Sirve para explicar autonomia, arranque automatico, baterias y exhaust.',
      en: 'The scene shows a realistic diesel arrangement with a horizontal pump, Clarke engine, fuel elements and discharge accessories. It supports teaching autonomy, automatic starting, batteries and exhaust routing.',
    },
    specs: [
      'Marca bomba / Pump brand: SPP',
      'Motor de referencia / Reference engine: Clarke inline diesel',
      'Capacidad base / Baseline duty: 1,500 GPM @ 120 PSI',
      'Autonomia educativa / Learning baseline: 8 h fuel autonomy concept',
    ],
  },
  jockeyPump: {
    id: 'jockeyPump',
    color: 0x1e8449,
    name: {
      es: 'Bomba jockey de mantenimiento de presion',
      en: 'Pressure maintenance jockey pump',
    },
    shortLabel: 'Jockey',
    category: 'pump-house',
    brandReference: 'Generico listado',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Mantiene la presion de reposo del sistema y evita arranques innecesarios de las bombas principales.',
      en: 'Maintains system standby pressure and prevents unnecessary starts of the main pumps.',
    },
    description: {
      es: 'Se representa como una bomba de menor escala para diferenciar claramente su funcion frente a las bombas principales.',
      en: 'Represented at a smaller scale to clearly differentiate its function from the main pumps.',
    },
    specs: [
      'Servicio / Duty: mantenimiento de presion / pressure maintenance',
      'Escala / Scale: menor que las bombas principales / smaller than main pumps',
      'Tema educativo / Learning focus: micro fugas, presostatos y secuencia de arranque',
    ],
  },
  dischargeManifold: {
    id: 'dischargeManifold',
    color: 0x7d3c98,
    name: {
      es: 'Manifold de descarga',
      en: 'Discharge manifold',
    },
    shortLabel: 'Manifold',
    category: 'pump-house',
    brandReference: 'Packaged pump house layout',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Concentra y ordena las descargas de las bombas antes del envio hacia medicion, prueba y distribucion.',
      en: 'Collects and organizes pump discharge flows before sending them toward metering, testing and distribution.',
    },
    description: {
      es: 'Es la columna vertebral del skid dentro de la caseta. Permite explicar valvulas de aislamiento, retencion, instrumentacion y rutas de salida.',
      en: 'It is the backbone of the skid inside the pump house. It is ideal for explaining isolation valves, check valves, instrumentation and outlet routing.',
    },
    specs: [
      'Diametro base modelado / Modeled baseline diameter: 8 in',
      'Configuracion / Configuration: descarga comun de bombas principales / common main-pump discharge',
      'Tema educativo / Learning focus: aislamiento, check y ramales de prueba',
    ],
  },
  flowMeter: {
    id: 'flowMeter',
    color: 0x117a65,
    name: {
      es: 'Medidor de flujo',
      en: 'Flow meter',
    },
    shortLabel: 'Flow meter',
    category: 'pump-house',
    brandReference: 'Generico NFPA 20',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Permite comprobar el rendimiento hidraulico del sistema durante pruebas y mantenimiento.',
      en: 'Allows verification of hydraulic performance during testing and maintenance.',
    },
    description: {
      es: 'Se incorpora como pieza clave para hablar de pruebas de aceptacion, verificacion de caudal y relacion con el test header.',
      en: 'Included as a key piece to discuss acceptance tests, flow verification and its relationship with the test header.',
    },
    specs: [
      'Servicio / Duty: pruebas y verificacion de rendimiento / testing and performance verification',
      'Relacion / Relation: aguas arriba del test header o linea de prueba / upstream of test arrangement',
    ],
  },
  gateValveOS: {
    id: 'gateValveOS',
    color: 0xf39c12,
    name: {
      es: 'Valvula OS&Y supervisada',
      en: 'Supervised OS&Y gate valve',
    },
    shortLabel: 'OS&Y',
    category: 'pump-house',
    brandReference: 'Generico listado',
    nfpa: ['NFPA 20', 'NFPA 25'],
    function: {
      es: 'Permite aislar secciones del sistema manteniendo indicacion visible de posicion abierta o cerrada.',
      en: 'Allows isolation of system sections while maintaining visible indication of open or closed position.',
    },
    description: {
      es: 'Elemento esencial para explicar la filosofia de valvulas normalmente abiertas, supervision y mantenimiento en sistemas de incendio.',
      en: 'Essential to explain the philosophy of normally open valves, supervision and maintenance in fire protection systems.',
    },
    specs: [
      'Tipo / Type: OS&Y supervised',
      'Posicion normal / Normal position: open',
      'Tema educativo / Learning focus: supervision y bloqueo operacional',
    ],
  },
  checkValve: {
    id: 'checkValve',
    color: 0x16a085,
    name: {
      es: 'Valvula check de retencion',
      en: 'Check valve',
    },
    shortLabel: 'Check',
    category: 'pump-house',
    brandReference: 'Generico listado',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Evita el flujo inverso hacia las bombas cuando otra fuente impulsa el sistema o cuando una bomba se detiene.',
      en: 'Prevents reverse flow toward the pumps when another source is driving the system or when a pump stops.',
    },
    description: {
      es: 'Ayuda a mostrar el comportamiento hidraulico del colector y la proteccion de equipos contra retorno.',
      en: 'Helps show the hydraulic behavior of the manifold and reverse-flow equipment protection.',
    },
    specs: [
      'Servicio / Duty: retencion unidireccional / one-way flow retention',
      'Ubicacion / Location: descarga individual de bomba / individual pump discharge',
    ],
  },
  reliefValve: {
    id: 'reliefValve',
    color: 0xe74c3c,
    name: {
      es: 'Valvula de alivio',
      en: 'Pressure relief valve',
    },
    shortLabel: 'Relief',
    category: 'pump-house',
    brandReference: 'Generico NFPA 20',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Protege el sistema frente a sobrepresion en escenarios donde la bomba o el driver pueden exceder el limite del sistema.',
      en: 'Protects the system against overpressure in scenarios where the pump or driver can exceed the system limit.',
    },
    description: {
      es: 'Se incluye para introducir el concepto de presion maxima admisible, descarga visible y proteccion complementaria en el tren diesel.',
      en: 'Included to introduce the concept of maximum allowable pressure, visible discharge and complementary protection on the diesel train.',
    },
    specs: [
      'Aplicacion / Application: tren de descarga y proteccion por sobrepresion',
      'Descarga / Discharge: visible drain concept',
    ],
  },
  pressureGauge: {
    id: 'pressureGauge',
    color: 0xbdc3c7,
    name: {
      es: 'Manometros de succion y descarga',
      en: 'Suction and discharge pressure gauges',
    },
    shortLabel: 'Manometros',
    category: 'pump-house',
    brandReference: 'Generico listado',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Permiten comparar condiciones de succion y descarga durante pruebas, mantenimiento y diagnostico del sistema.',
      en: 'Allow comparison of suction and discharge conditions during testing, maintenance and system diagnostics.',
    },
    description: {
      es: 'La escena los usa como recurso educativo para interpretar lectura de presiones, perdida de carga y comportamiento de la bomba.',
      en: 'The scene uses them as an educational aid to interpret pressure readings, pressure loss and pump behavior.',
    },
    specs: [
      'Ubicacion / Location: succion y descarga de bombas',
      'Tema educativo / Learning focus: lectura comparativa y diagnostico',
    ],
  },
  pumpController: {
    id: 'pumpController',
    color: 0x1a252f,
    name: {
      es: 'Controladores Tornatech',
      en: 'Tornatech pump controllers',
    },
    shortLabel: 'Controladores',
    category: 'pump-house',
    brandReference: 'Tornatech',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Gestionan arranque, supervision, eventos y alarmas de las bombas del sistema.',
      en: 'Manage starting, supervision, events and alarms for the system pumps.',
    },
    description: {
      es: 'La referencia de diseño toma como base gabinetes tipo Tornatech para mostrar jerarquia entre controlador electrico, diesel y jockey, incluyendo una interfaz frontal moderna de entrenamiento.',
      en: 'The design reference uses Tornatech-like cabinets to show the hierarchy between electric, diesel and jockey controllers, including a modern training-oriented front interface.',
    },
    specs: [
      'Marca de referencia / Reference brand: Tornatech',
      'Familias esperadas / Expected families: electric, diesel and jockey controllers',
      'Tema educativo / Learning focus: automatic start, manual stop and event logging',
    ],
  },
  testHeader: {
    id: 'testHeader',
    color: 0xd35400,
    name: {
      es: 'Header de prueba',
      en: 'Test header',
    },
    shortLabel: 'Test header',
    category: 'pump-house',
    brandReference: 'Generico NFPA 20',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Permite descargar caudal de prueba para validar desempeno sin comprometer la red protegida.',
      en: 'Allows discharge of test flow to validate performance without compromising the protected network.',
    },
    description: {
      es: 'Es clave para explicar pruebas de aceptacion y mantenimiento en una caseta realista de bomba contra incendio.',
      en: 'It is key for explaining acceptance and maintenance testing in a realistic fire pump house.',
    },
    specs: [
      'Servicio / Duty: prueba hidraulica y mantenimiento / hydraulic testing and maintenance',
      'Relacion / Relation: asociado al flow meter y a descarga controlada',
    ],
  },
  dieselFuelTank: {
    id: 'dieselFuelTank',
    color: 0x7b241c,
    name: {
      es: 'Tanque de combustible diesel',
      en: 'Diesel fuel tank',
    },
    shortLabel: 'Fuel tank',
    category: 'pump-house',
    brandReference: 'Clarke package reference',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Almacena el combustible del driver diesel y sostiene la autonomia requerida para operacion de emergencia.',
      en: 'Stores fuel for the diesel driver and supports the required autonomy for emergency operation.',
    },
    description: {
      es: 'Se modela como un tanque auxiliar visible con linea de alimentacion, venteo y bandeja de contencion para explicar autonomia, seguridad y mantenimiento del conjunto diesel.',
      en: 'Modeled as a visible auxiliary tank with fuel line, vent and containment tray to explain autonomy, safety and maintenance of the diesel package.',
    },
    specs: [
      'Servicio / Duty: autonomia del motor diesel / diesel engine autonomy',
      'Elementos visibles / Visible elements: fill, vent, containment and fuel line',
      'Tema educativo / Learning focus: combustible, supervision and emergency readiness',
    ],
  },
  exhaustSystem: {
    id: 'exhaustSystem',
    color: 0x95a5a6,
    name: {
      es: 'Sistema de escape diesel',
      en: 'Diesel exhaust system',
    },
    shortLabel: 'Exhaust',
    category: 'pump-house',
    brandReference: 'Clarke package reference',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Conduce los gases del motor diesel hacia el exterior de la caseta de forma segura.',
      en: 'Routes diesel engine exhaust gases safely to the exterior of the pump house.',
    },
    description: {
      es: 'Permite mostrar la diferencia entre el tren electrico y el tren diesel, agregando silenciador, chimenea y soportacion del escape.',
      en: 'Shows the difference between the electric and diesel trains by adding a muffler, stack and exhaust supports.',
    },
    specs: [
      'Elementos / Elements: manifold, muffler and roof discharge stack',
      'Tema educativo / Learning focus: ventilacion, descarga y seguridad termica',
    ],
  },
  groovedCouplings: {
    id: 'groovedCouplings',
    color: 0x566573,
    name: {
      es: 'Conexiones ranuradas y acoples',
      en: 'Grooved couplings and fittings',
    },
    shortLabel: 'Ranuradas',
    category: 'pump-house',
    brandReference: 'Generic grooved piping practice',
    nfpa: ['NFPA 13', 'NFPA 20'],
    function: {
      es: 'Unen tramos de tuberia, facilitan montaje y permiten lectura constructiva del sistema real.',
      en: 'Join pipe spools, simplify installation and improve construction-level readability of the real system.',
    },
    description: {
      es: 'Se agregan como detalle visible del piping para acercar la escena a una lectura L2/L3 mas creible del sistema paquetizado.',
      en: 'Added as visible piping detail to push the scene toward a more credible L2/L3 reading of the packaged system.',
    },
    specs: [
      'Uso / Use: uniones mecanicas en headers y spool pieces',
      'Tema educativo / Learning focus: montaje, mantenimiento y lectura de piping real',
    ],
  },
  pumpHouseLouvers: {
    id: 'pumpHouseLouvers',
    color: 0x94a3b8,
    name: {
      es: 'Louvers y ventilacion de caseta',
      en: 'Pump house louvers and ventilation',
    },
    shortLabel: 'Louvers',
    category: 'pump-house',
    brandReference: 'Generic pump house package',
    nfpa: ['NFPA 20'],
    function: {
      es: 'Permiten la renovacion de aire y apoyan la operacion segura del equipo diesel y del recinto de bombeo.',
      en: 'Allow air renewal and support safe operation of the diesel equipment and the pump house enclosure.',
    },
    description: {
      es: 'Se incorporan como detalle arquitectonico funcional de una caseta realista, visibles en muros y asociados al sistema diesel.',
      en: 'Added as a functional architectural detail of a realistic pump house, visible on the walls and associated with the diesel system.',
    },
    specs: [
      'Ubicacion / Location: muros de caseta / pump house walls',
      'Tema educativo / Learning focus: ventilacion del recinto y operacion del driver diesel',
    ],
  },
  dischargePipe: {
    id: 'dischargePipe',
    color: 0x2980b9,
    name: {
      es: 'Salida a red perimetral y ramal de rociadores',
      en: 'Yard main outlet and sprinkler branch',
    },
    shortLabel: 'Distribucion',
    category: 'distribution',
    brandReference: 'Generico NFPA 13/NFPA 24',
    nfpa: ['NFPA 13', 'NFPA 24'],
    function: {
      es: 'Conduce el agua de incendio desde la caseta hacia la red privada exterior y al sistema de rociadores de la bodega.',
      en: 'Conveys fire water from the pump house to the private yard main and the warehouse sprinkler system.',
    },
    description: {
      es: 'La salida de distribucion cierra el recorrido educativo del modulo y conecta el sistema de bombeo con la proteccion del edificio.',
      en: 'The distribution outlet closes the learning path of the module and connects the pump system to the building protection network.',
    },
    specs: [
      'Funcion / Function: enlace entre caseta y red privada exterior',
      'Tema educativo / Learning focus: continuidad del circuito hasta los rociadores',
      'Normas / Standards: NFPA 13 and NFPA 24',
    ],
  },
  yardLoop: {
    id: 'yardLoop',
    color: 0x1f618d,
    name: {
      es: 'Red perimetral privada',
      en: 'Private yard loop',
    },
    shortLabel: 'Yard loop',
    category: 'distribution',
    brandReference: 'Generic NFPA 24 layout',
    nfpa: ['NFPA 24'],
    function: {
      es: 'Distribuye el agua desde la caseta hacia el anillo perimetral que alimenta hidrantes, rociadores y ramales del sitio.',
      en: 'Distributes water from the pump house to the site loop feeding hydrants, sprinklers and yard branches.',
    },
    description: {
      es: 'Se representa como una prolongacion exterior del circuito para enseñar que la caseta no es el fin del sistema, sino su punto de impulsion hacia la red privada.',
      en: 'Represented as an exterior extension of the circuit to teach that the pump house is not the end of the system but its delivery point to the private fire main.',
    },
    specs: [
      'Servicio / Duty: red privada exterior / private underground yard main',
      'Tema educativo / Learning focus: continuidad del circuito aguas abajo de la caseta',
    ],
  },
  yardHydrants: {
    id: 'yardHydrants',
    color: 0xe11d48,
    name: {
      es: 'Hidrantes del anillo perimetral',
      en: 'Yard loop hydrants',
    },
    shortLabel: 'Hidrantes',
    category: 'distribution',
    brandReference: 'Generic NFPA 24 layout',
    nfpa: ['NFPA 24'],
    function: {
      es: 'Permiten extraccion manual de agua desde la red exterior para apoyo operacional y cobertura del sitio.',
      en: 'Allow manual water discharge from the exterior network for operational support and site coverage.',
    },
    description: {
      es: 'Se agregan en la red perimetral para que el usuario entienda que el sistema abastece no solo rociadores, sino tambien puntos exteriores de intervencion.',
      en: 'Added to the yard loop so the user understands the system supplies not only sprinklers but also exterior intervention points.',
    },
    specs: [
      'Servicio / Duty: puntos exteriores de descarga / exterior discharge points',
      'Tema educativo / Learning focus: cobertura exterior y lectura del anillo privado',
    ],
  },
  fireDepartmentConnection: {
    id: 'fireDepartmentConnection',
    color: 0xdc2626,
    name: {
      es: 'Conexion para bomberos',
      en: 'Fire department connection',
    },
    shortLabel: 'FDC',
    category: 'distribution',
    brandReference: 'Generic NFPA 13/NFPA 24 practice',
    nfpa: ['NFPA 13', 'NFPA 24'],
    function: {
      es: 'Permite a bomberos suplementar el sistema con agua desde el exterior cuando el escenario operativo lo requiere.',
      en: 'Allows the fire department to supplement the system with water from the exterior when the operating scenario requires it.',
    },
    description: {
      es: 'Se representa sobre la fachada de la bodega para conectar el sistema de rociadores con la respuesta de emergencia del sitio.',
      en: 'Represented on the warehouse facade to connect the sprinkler system to the site emergency response.',
    },
    specs: [
      'Ubicacion / Location: fachada accesible del edificio / accessible building facade',
      'Tema educativo / Learning focus: respaldo externo y respuesta de emergencia',
    ],
  },
  sprinklerRiser: {
    id: 'sprinklerRiser',
    color: 0xc0392b,
    name: {
      es: 'Riser hacia sistema de rociadores',
      en: 'Sprinkler system riser',
    },
    shortLabel: 'Riser',
    category: 'distribution',
    brandReference: 'Generic NFPA 13 layout',
    nfpa: ['NFPA 13'],
    function: {
      es: 'Eleva el agua desde la distribucion principal hacia la red interior de rociadores de la bodega.',
      en: 'Raises water from the main distribution line to the indoor warehouse sprinkler network.',
    },
    description: {
      es: 'Se agrega un tramo visible de riser y header para conectar visualmente la caseta con la proteccion real del edificio.',
      en: 'A visible riser and header segment is added to visually connect the pump house with the actual building protection network.',
    },
    specs: [
      'Servicio / Duty: alimentacion a red de rociadores / sprinkler supply',
      'Tema educativo / Learning focus: continuidad desde bombas hasta la bodega',
    ],
  },
  alarmValveAssembly: {
    id: 'alarmValveAssembly',
    color: 0xf97316,
    name: {
      es: 'Conjunto de valvula de alarma',
      en: 'Alarm valve assembly',
    },
    shortLabel: 'Alarm valve',
    category: 'distribution',
    brandReference: 'Generic wet system riser assembly',
    nfpa: ['NFPA 13'],
    function: {
      es: 'Monitorea el flujo hacia la red de rociadores y sirve como punto de control del riser humedo.',
      en: 'Monitors flow to the sprinkler network and acts as the control point of the wet riser.',
    },
    description: {
      es: 'Se integra junto al riser para explicar la logica del sistema humedo, supervision y prueba del conjunto antes de entrar a la red de bodega.',
      en: 'Integrated next to the riser to explain wet-pipe logic, supervision and test functions before entering the warehouse network.',
    },
    specs: [
      'Servicio / Duty: control y supervision del riser humedo',
      'Tema educativo / Learning focus: flujo, alarma y prueba del sistema',
    ],
  },
  sprinklerNetwork: {
    id: 'sprinklerNetwork',
    color: 0xef4444,
    name: {
      es: 'Red de rociadores de bodega',
      en: 'Warehouse sprinkler network',
    },
    shortLabel: 'Sprinklers',
    category: 'distribution',
    brandReference: 'Generic NFPA 13 warehouse layout',
    nfpa: ['NFPA 13'],
    function: {
      es: 'Distribuye el agua sobre el techo de la bodega y alimenta los rociadores automaticos del area protegida.',
      en: 'Distributes water across the warehouse roof and feeds the automatic sprinklers of the protected area.',
    },
    description: {
      es: 'La escena incorpora mains, branch lines y drops para que el usuario vea que el recorrido continua dentro del edificio protegido.',
      en: 'The scene includes mains, branch lines and drops so the user can see that the circuit continues inside the protected building.',
    },
    specs: [
      'Servicio / Duty: red interior de rociadores / interior sprinkler network',
      'Tema educativo / Learning focus: recorrido final del agua hasta el punto de descarga',
    ],
  },
  warehouseEnvelope: {
    id: 'warehouseEnvelope',
    color: 0xcbd5e1,
    name: {
      es: 'Envolvente de bodega protegida',
      en: 'Protected warehouse envelope',
    },
    shortLabel: 'Bodega',
    category: 'distribution',
    brandReference: 'Generic distribution center massing',
    nfpa: ['NFPA 13'],
    function: {
      es: 'Representa el volumen del edificio que recibe la proteccion del sistema y contextualiza la red de rociadores.',
      en: 'Represents the building volume protected by the system and provides context for the sprinkler network.',
    },
    description: {
      es: 'Se modela como una bodega semiabierta para mostrar la relacion entre sala de bombas, red privada y proteccion interior del centro de distribucion.',
      en: 'Modeled as a semi-open warehouse to show the relationship between the pump house, private main and the interior protection of the distribution center.',
    },
    specs: [
      'Tipo / Type: volume referencia de centro de distribucion',
      'Tema educativo / Learning focus: contexto de la solucion completa',
    ],
  },
  warehouseRacks: {
    id: 'warehouseRacks',
    color: 0xf59e0b,
    name: {
      es: 'Racks de almacenamiento de bodega',
      en: 'Warehouse storage racks',
    },
    shortLabel: 'Racks',
    category: 'distribution',
    brandReference: 'Generic distribution center layout',
    nfpa: ['NFPA 13'],
    function: {
      es: 'Representan la ocupacion real de la bodega y permiten contextualizar la demanda de proteccion del sistema de rociadores.',
      en: 'Represent the real warehouse occupancy and help contextualize the sprinkler system protection demand.',
    },
    description: {
      es: 'Se incluyen pasillos y bastidores altos para acercar la escena a un centro de distribucion real, familiar para tecnicos y vendedores.',
      en: 'Tall storage racks and aisles are included to bring the scene closer to a real distribution center familiar to technical and sales teams.',
    },
    specs: [
      'Contexto / Context: almacenamiento de gran altura / high-piled storage context',
      'Tema educativo / Learning focus: relacion entre ocupacion y proteccion NFPA 13',
    ],
  },
  loadingDocks: {
    id: 'loadingDocks',
    color: 0x0f172a,
    name: {
      es: 'Andenes de carga y vehiculos',
      en: 'Loading docks and vehicles',
    },
    shortLabel: 'Andenes',
    category: 'distribution',
    brandReference: 'Generic distribution center logistics',
    nfpa: ['NFPA 13', 'NFPA 24'],
    function: {
      es: 'Contextualizan la operacion logistica del centro de distribucion y el area exterior servida por la red privada.',
      en: 'Provide context for the logistics operation of the distribution center and the exterior area served by the private fire main.',
    },
    description: {
      es: 'Se modelan puertas de anden, niveladoras y vehiculos para que la bodega se perciba como una instalacion operativa real.',
      en: 'Dock doors, levelers and vehicles are modeled so the warehouse reads as a real operating facility.',
    },
    specs: [
      'Elementos / Elements: dock doors, aprons and trailers',
      'Tema educativo / Learning focus: contexto operacional del sitio protegido',
    ],
  },
};

export const featuredBrands = [
  {
    name: 'SPP',
    focus: 'Bombas contra incendio y package sets',
  },
  {
    name: 'Clarke',
    focus: 'Motores diesel para fire pump drivers',
  },
  {
    name: 'Tornatech',
    focus: 'Controladores de bomba contra incendio',
  },
  {
    name: 'ANSUL',
    focus: 'Sistemas especiales y agentes limpios para roadmap',
  },
  {
    name: 'Simplex / Notifier',
    focus: 'Deteccion para roadmap',
  },
];

export const semanticMemoryNotes = [
  'El modulo activo es un sistema paquetizado de bombeo para centro de distribucion con base generica realista.',
  'La escena 3D actual ya incluye bodega protegida, red perimetral, hidrantes, FDC y red de rociadores visible.',
  'El visor soporta focus mode, flujo hidraulico animado y recorrido guiado sincronizado con la seleccion.',
  'La informacion educativa es bilingue y vive fuera del visor para evitar duplicidades.',
  'Las siguientes expansiones priorizadas son red de rociadores, FK-5-1-12, CO2 y deteccion.',
];

export const systemCatalog = [
  {
    id: 'distribution-center-packaged-pump-house',
    label: 'Bombeo + Bodega / Pump House + Warehouse',
    status: 'active',
  },
  {
    id: 'fk-5-1-12-datacenter',
    label: 'FK-5-1-12 Datacenter',
    status: 'planned',
  },
  {
    id: 'co2-datacenter',
    label: 'CO2 Datacenter',
    status: 'planned',
  },
  {
    id: 'fire-detection-suite',
    label: 'Deteccion / Fire Detection',
    status: 'planned',
  },
];

export const standardsReference = [
  {
    id: 'nfpa-20',
    label: 'NFPA 20',
    summary: 'Instalacion de bombas estacionarias para proteccion contra incendio.',
  },
  {
    id: 'nfpa-22',
    label: 'NFPA 22',
    summary: 'Estanques de agua para proteccion contra incendio.',
  },
  {
    id: 'nfpa-24',
    label: 'NFPA 24',
    summary: 'Redes privadas exteriores de agua contra incendio.',
  },
  {
    id: 'nfpa-13',
    label: 'NFPA 13',
    summary: 'Diseno e instalacion de sistemas de rociadores automaticos.',
  },
  {
    id: 'nfpa-25',
    label: 'NFPA 25',
    summary: 'Inspeccion, prueba y mantenimiento de sistemas base agua.',
  },
  {
    id: 'cl-regulatory',
    label: 'Referencia Chile',
    summary: 'Base para complementar con normativa y exigencias locales de seguridad contra incendio en Chile.',
  },
];

export const guidedTourSteps = [
  {
    id: 'tour-cistern',
    componentId: 'cistern',
    title: '1. Reserva de agua',
    summary: 'El recorrido comienza en el estanque apernado, que asegura la reserva util del sistema.',
  },
  {
    id: 'tour-suction',
    componentId: 'suctionHeader',
    title: '2. Succion inundada',
    summary: 'La succion positiva lleva el agua a las bombas con un trazado limpio y controlado.',
  },
  {
    id: 'tour-main-pump',
    componentId: 'mainPump',
    title: '3. Bomba principal',
    summary: 'La bomba electrica SPP entrega el caudal y la presion principales del sistema.',
  },
  {
    id: 'tour-diesel',
    componentId: 'dieselPump',
    title: '4. Respaldo diesel',
    summary: 'La bomba diesel con motor Clarke mantiene la capacidad del sistema ante falla electrica.',
  },
  {
    id: 'tour-manifold',
    componentId: 'dischargeManifold',
    title: '5. Colector de descarga',
    summary: 'El manifold organiza las descargas y las dirige a medicion, prueba y distribucion.',
  },
  {
    id: 'tour-test',
    componentId: 'testHeader',
    title: '6. Prueba y medicion',
    summary: 'El medidor de flujo y el test header permiten validar el desempeno del paquete.',
  },
  {
    id: 'tour-yard',
    componentId: 'yardLoop',
    title: '7. Red privada exterior',
    summary: 'Desde la caseta, el sistema alimenta el anillo perimetral e hidrantes exteriores.',
  },
  {
    id: 'tour-riser',
    componentId: 'sprinklerRiser',
    title: '8. Entrada a bodega',
    summary: 'El riser y la valvula de alarma conectan la red privada con la proteccion interior.',
  },
  {
    id: 'tour-sprinklers',
    componentId: 'sprinklerNetwork',
    title: '9. Descarga final',
    summary: 'La red de rociadores completa el recorrido hasta el punto final de proteccion.',
  },
];

export const defaultSelectedComponentId = 'mainPump';

export const componentOrder = [
  'cistern',
  'suctionHeader',
  'mainPump',
  'dieselPump',
  'jockeyPump',
  'dischargeManifold',
  'flowMeter',
  'testHeader',
  'dieselFuelTank',
  'exhaustSystem',
  'groovedCouplings',
  'pumpHouseLouvers',
  'gateValveOS',
  'checkValve',
  'reliefValve',
  'pressureGauge',
  'pumpController',
  'dischargePipe',
  'yardLoop',
  'yardHydrants',
  'fireDepartmentConnection',
  'sprinklerRiser',
  'alarmValveAssembly',
  'sprinklerNetwork',
  'warehouseEnvelope',
  'warehouseRacks',
  'loadingDocks',
  'footValve',
];
