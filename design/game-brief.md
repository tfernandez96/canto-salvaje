# Game Brief: Canto Salvaje *(guessed)*

## In your words
La mecánica de combate es RPG por turnos, con interacciones en los ataques (al estilo Clair Obscure).
Los protagonistas son humanos, que "adiestran" mascotas (evito usar la palabra capturar pues pokemon copyright), estas suben de nivel, evolucionan y aprenden ataques nuevos.

1. Quién pelea: Pelean las mascotas. Un equipo de hasta 4 mascotas.
2. Cómo se suma una mascota: Para hacer algo distinto, se me ocurre que al derrotarlo, le tocas una canción sanadora (minijuego con botones siguiendo el ritmo, cuya longitud varia segun la rareza de la criatura que intentas convencer, respecto a tu nivel)
3. Defensa: Interacción también en la defensa.
4. Mundo y meta: La idea es superar mazmorras, pero por ahora vamos con una mazmorra pequeña y un jefe.
5. Sensación: Ágil con menus rapidos y combates intensos (durante tu turno disfrutas de una pausa para pensar que ataque elegir con cada mascota, y esa decisión tiene que ser importante, pero fuera de ese momento, todo muy dinámico e intenso)
6. Look: Vamos con la dirección usual.
7. Dificultad: Por ahora vamos con lo usual, luego ajustamos cualquier cosa.
8. Trozo o prueba: Arranquemos con un trozo para probar la sesión, luego vamos refinando las mecánicas
After play: MUY Bueno el juego. Para el combate añadiría: - Marcador claro de a qué objetivo estás atacando. - Invertir controles: Izquierda-derecha cambian los ataques, arriba-abajo los objetivos (ya que estos se muestran a la derecha, de arriba hacia abajo) - Mejoras sobre la energía: Que sea compartida, y haya indicadores claros sobre cuanto suman - A la hora de atacar/esquivar, que cada ataque tenga un boton asociado (wasd o barra), y al usar ese ataque, haya que presionar esa tecla en lugar de solo la barra
After play: Ya quedó deployado, está buenisimo. Cambiaría el sistema de teclas. Está buenisimo que cada ataque tenga su "velocidad" o su forma única de cerrar el círculo, me parece excelente eso. Pero es feo que te diga "Apretá W al atacar", esa leyenda la sacaría al 100%, que quede oculto. Y que cada ataque tenga un array interno de botones. Pueden ser siempre el mismo, o pueden variar, dependiendo los ataques. Está completamente roto el sistema de energía: Se están ganando unos 7 de energía por turno. Yo arrancaría con 5 energía el primer turno, y de ahí en mas se ganan 2 de energía por turno. Los ataques que no gastan energía, pasarían a recargar energía adicional. (1, 2 o mas, dependiendo el ataque), forzandote a ser consciente del manejo de la misma.
After play: No sabia que los parrys te daban, eso está buenisimo, quiero quedar esa mecánica. Cuando los parrys perfectos den energía, pone un +1 energía. Y Bajemos la frecuencia, digamos que cada ataque tiene su propio parry_config. Por default es 1 (si es multihit, cada hit va a tener 1/total_hits probabilidad. Pero es importante que los bosses tengan un parry_config mas alto, ya que suele ser 1 solo enemigo.
After play: Corrección gigante: La tecla si tiene que mostrarse al momento que aparece el círculo. No debe mostrarse al momento de elegir el ataque
After play: Ahora que ya está esta mazmorra inicial de tutorial, quiero empezar  planear un poco mas avanzado. - Pantalla de selección de mazmorras (o mundo abierto?) - Qué se conserva entre una mazmorra y otra - Componentes RNG de cada mazmorra - Objetos equipables, bufos - Diario de criaturas (Pokedex)
After play: Estructura: Mapa + campamento · Progreso: Mixto · RNG: Salas barajadas, Criaturas al azar, Modificador por entrada, Salas especiales · Siguiente: Proyecto web real
After play: Continuemos
After play: Si, hace commit. Ahora, podemos hacerlo touch-able con el mouse, y refinar la experiencia para mobile?

**Pitch:** Bajas a una mazmorra con un equipo de hasta 4 mascotas, peleas por turnos con golpes y bloqueos a tiempo, y a cada criatura que derrotas le tocas una canción sanadora para convencerla de unirse a ti.

**Genre:** RPG por turnos de adiestrar mascotas (creature collector + JRPG por turnos)

**Controls:** Flechas/WASD para moverte por la mazmorra. En el campamento, Arriba/Abajo y Enter; en el mapa, Izquierda/Derecha, Enter para entrar y Retroceso para volver. En tu turno: Izquierda/Derecha cambian de ataque, Arriba/Abajo de objetivo (de arriba hacia abajo en pantalla), 1-4 o Enter confirman y Retroceso vuelve. Cada golpe tiene su tecla (W, A, S, D o Espacio), de una secuencia propia de cada ataque: aparece dentro del anillo en cuanto el anillo aparece, nunca al elegir el ataque, y se pulsa cuando el anillo se cierra, al golpear y al bloquear. En la canción: ← ↓ ↑ → siguiendo el ritmo. Con mouse o pantalla táctil: todo lo que se ve se toca; en la mazmorra se mantiene el dedo para caminar hacia él; en tu turno se toca un enemigo para apuntar y un ataque para usarlo; los anillos y la canción muestran botones grandes abajo.

**Question:** ¿Se sostiene una sesión de mazmorra donde la pausa táctica del turno y el timing de golpes, bloqueos y canción se alternan sin cansar?

**Hooks:** La canción sanadora: el ritmo convence a la criatura derrotada, y es más larga cuanto más rara es respecto a tu nivel. También las interacciones a tiempo en cada ataque y cada defensa.

**Intent:** soft or no failure *(provisional)*

## Look and references
- Look: *(provisional)* Sprites 2.5D detallados sobre escenarios con profundidad 3D.
  - **Mood:** aventura viva y musical.
  - **Shapes:** mascotas redondeadas y expresivas, cada especie con su propia silueta. Enemigos más angulosos. El jefe es grande y asimétrico.
  - **Palette:** tu equipo con contorno dorado cálido; amenazas en carmesí y magenta; suelo de piedra musgosa en verdes y grises azulados. El acento son las notas y las ventanas de timing en cian luminoso. Sombras frías, luces cálidas.
  - **Signature:** durante la canción, una cinta de pentagrama luminosa se tiende desde tu equipo hasta la criatura, y las notas viajan por ella.
  - Cada figura está dibujada: sin emoji y sin círculos planos.
- References: Pokémon Black and White 2 (sprites 2.5D detallados sobre campos 3D, la sensación del equipo), Clair Obscur: Expedition 33 (golpes y paradas a tiempo dentro de un combate por turnos).
- View: 2.5D · Camera: mazmorra vista desde arriba, ligeramente inclinada; combate fijo de lado (tu equipo a la izquierda, enemigos a la derecha).

## First minute
Eliges una de tres mascotas iniciales (Brasa, Brote o Marea). Llegas al campamento, abres el mapa y entras a la Mazmorra de la Fuente. En la primera sala y tocas a una criatura salvaje que deambula. En el combate, el tiempo se detiene: eliges un ataque con 1-4 y un anillo se cierra sobre el enemigo. "Espacio cuando el anillo se cierre" y el golpe crítico salta en grande. El enemigo anuncia su ataque y otro anillo te pide bloquear: lo paras. Cae derrotado, la cinta de pentagrama se tiende hacia él y tocas 6 notas cortas. "¡Se une a tu equipo!", con su nombre y un jingle. Ahora tienes 2 mascotas.

## Challenge
Las salas 1 y 2 tienen criaturas sueltas y débiles. La sala 3, hacia el minuto 3-4, trae un grupo de 3 con un tipo que tu inicial no cubre: el primer combate de verdad. El jefe llega hacia el minuto 10-12: anuncia un golpe enorme un turno antes, golpea en varias fases de timing y tiene una segunda fase a media vida. Si pierdes, vuelves a la fuente de la entrada con el equipo curado y sin perder nada. Las salas superadas siguen superadas. Más adelante: criaturas más raras con canciones más largas y rápidas.

## Core loop
- Exploras una sala y tocas a las criaturas para empezar el combate.
- Turno en pausa: eliges el ataque de cada mascota mirando tipos, energía y la intención del enemigo.
- Ejecución dinámica: golpes a tiempo, y luego bloqueos y paradas a tiempo contra los enemigos.
- Al ganar, tocas la canción sanadora a una criatura derrotada para que se una (máximo 4 en el equipo). Después, experiencia, subidas de nivel, ataques nuevos y evolución.
- Siguiente sala, hasta el jefe. Si pierdes, vuelves a la fuente y lo intentas de nuevo.
- Leads: el JRPG lleva el combate (menú, franja de orden de turno, equipo de 4). El creature collector lleva la colección y el progreso (niveles, ataques, evolución), sumando mascotas por canción en vez de captura. Tus palabras llevan el timing en ataque y defensa. Las derrotas siguen el creature collector: vuelta a la fuente sin perder nada.

## Goal & fail state
- Vencer al jefe de la mazmorra.
- Si todo el equipo cae, vuelves a la fuente de entrada, curado y sin perder nada. Una canción fallida deja ir a la criatura.

## Features
- [x] Mazmorra pequeña: 5-6 salas y el jefe
- [x] Combate por turnos con pausa para elegir el ataque de cada mascota y franja de orden de turno
- [x] Golpes a tiempo (crítico) y bloqueo o parada a tiempo (parada perfecta = sin daño + contragolpe)
- [x] Canción sanadora: minijuego de ritmo con 4 botones. Su longitud depende de la rareza y del nivel de la criatura respecto al tuyo
- [x] Equipo de hasta 4 mascotas, empezando por elegir 1 de 3 iniciales
- [x] Tres tipos en ciclo (Brasa > Brote > Marea > Brasa), con aviso de golpe fuerte o débil
- [x] Niveles por experiencia y ataques nuevos al subir de nivel
- [x] Evolución: cada inicial evoluciona una vez a nivel 5 (thin stand-in)
- [x] 4 especies salvajes, cada una atacando distinto, más el jefe con un ataque gordo anunciado
- [x] Números de daño que saltan, barras con estela, y recuento de victoria con fanfarria
- [x] Marcador claro del objetivo: esquinas, anillo y etiqueta (OBJETIVO, TODOS, CURAR, PROTEGER)
- [x] Energía compartida del equipo: 5 al empezar, +2 por turno, los ataques gratis recargan (+1 o +2) y cada parada perfecta puede dar +1 (probabilidad parry_config / golpes del ataque; el jefe vale más); panel con libre, reservada, recarga y coste del ataque elegido
- [x] Cada ataque con una secuencia de teclas, una por golpe (W, A, S, D o Espacio): la tecla aparece en el anillo al aparecer el anillo, nunca al elegir el ataque
- [x] Campamento (fogata, fuente que cura, menú), mapa de mazmorras que se abren al vencer a cada jefe, y guardado en el navegador con Continuar o Nueva partida
- [x] Se juega con mouse o pantalla táctil (botones grandes para los anillos y la canción, pausa y silencio en pantalla) y en el teléfono: sin zoom ni desplazamiento, pantalla completa en horizontal donde el navegador lo permite, aviso para girar el teléfono

## Your systems
- combate por turnos con interacciones a tiempo · in the slice
- equipo de hasta 4 mascotas · in the slice
- canción sanadora para convencer · in the slice
- subir de nivel · in the slice
- aprender ataques nuevos · in the slice
- evolucionar · thin stand-in *(guessed)*
- una mazmorra pequeña con jefe · in the slice
- mapa de mazmorras con campamento (fuente, equipo, diario, equipables); cada jefe desbloquea la siguiente · in the slice
- progreso mixto: mascotas, diario y equipables se conservan; las bendiciones solo duran esa entrada · thin stand-in *(guessed)*
- salas barajadas en cada entrada (hechas a mano, el jefe siempre al final) · later
- criaturas al azar: tabla por mazmorra con especies, niveles y probabilidad de raras · later
- modificador por entrada (Niebla: anillos más rápidos; Luna llena: más raras) · later
- salas especiales al azar: cofres, altares de bendición, segunda fuente · later
- objetos equipables: un amuleto por mascota, permanente · later *(guessed)*
- bufos: bendiciones de altar que duran esa entrada · later *(guessed)*
- diario de criaturas: silueta si no la viste, ficha si la convenciste, con el ritmo de sus anillos · later *(guessed)*

## Keep
- que cada ataque tenga su "velocidad" o su forma única de cerrar el círculo *(you said)* · pins: ring_attack 0.7, ring_defend 0.75
- que los parrys perfectos den energía *(you said)* · pins: en_parry 1, parry_config 1

## Avoid
- La palabra "capturar", y nada de Pokémon: sin bolas de captura, sin sus nombres, criaturas, arte ni interfaz.

## Out of scope
- Árboles de evolución con ramas: grow it
- Una historia en escenas y diálogos: grow it
- Pueblos, tiendas y misiones secundarias: grow it
- Cría: add it as a feature
- Cuidar a las mascotas entre combates: add it as a feature
- Equipo que enseña habilidades: add it as a feature
- Variantes raras: change it after play
- Ataques especiales que se cargan: change it after play
- Intercambios y combates entre jugadores: needs a server
- Salas barajadas, criaturas al azar, modificador por entrada y salas especiales: add it as a feature
- Objetos equipables y bendiciones: add it as a feature
- Diario de criaturas: add it as a feature
- Consumibles: change it after play

## Build order
1. El trozo: elegir inicial, recorrer la mazmorra pequeña, combates por turnos con golpes y bloqueos a tiempo, sumar mascotas con la canción, subir de nivel y aprender ataques, evolucionar la inicial, y vencer al jefe. Si caes, vuelves a la fuente.
2. Ajustar ventanas de timing, longitud de canciones y curva de dificultad tras jugarlo.
3. Convertirlo en proyecto web real (TypeScript, datos en archivos, tests, build).
4. Campamento, mapa de mazmorras y guardado: lo que se conserva entre mazmorras.
5. Diario de criaturas.
6. Segunda mazmorra con azar: salas barajadas, tabla de criaturas, modificador por entrada y salas especiales.
7. Objetos equipables y bendiciones de altar.

---
**Kill condition:** *(guessed)* Si tras dos rondas de ajuste el timing en cada golpe cansa en vez de enganchar.

**Who it's for / what they feel:** *(guessed)* Fans del RPG por turnos que quieren decisiones con peso y manos ocupadas, y un vínculo con mascotas que convencieron ellos mismos.

**Games you love / don't:** Clair Obscur: Expedition 33 (interacciones en los ataques).
