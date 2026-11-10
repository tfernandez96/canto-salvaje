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

**Pitch:** Bajas a una mazmorra con un equipo de hasta 4 mascotas, peleas por turnos con golpes y bloqueos a tiempo, y a cada criatura que derrotas le tocas una canción sanadora para convencerla de unirse a ti.

**Genre:** RPG por turnos de adiestrar mascotas (creature collector + JRPG por turnos)

**Controls:** Flechas/WASD para moverte por la mazmorra. En tu turno: Izquierda/Derecha cambian de ataque, Arriba/Abajo de objetivo (de arriba hacia abajo en pantalla), 1-4 o Enter confirman y Retroceso vuelve. Cada ataque tiene su tecla (W, A, S, D o Espacio): se pulsa esa tecla cuando su anillo se cierra, tanto al golpear como al bloquear. En la canción: ← ↓ ↑ → siguiendo el ritmo.

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
Eliges una de tres mascotas iniciales (Brasa, Brote o Marea). Entras a la primera sala y tocas a una criatura salvaje que deambula. En el combate, el tiempo se detiene: eliges un ataque con 1-4 y un anillo se cierra sobre el enemigo. "Espacio cuando el anillo se cierre" y el golpe crítico salta en grande. El enemigo anuncia su ataque y otro anillo te pide bloquear: lo paras. Cae derrotado, la cinta de pentagrama se tiende hacia él y tocas 6 notas cortas. "¡Se une a tu equipo!", con su nombre y un jingle. Ahora tienes 2 mascotas.

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
- [x] Energía compartida del equipo, con panel de libre, reservada, coste del ataque elegido y lo que suma cada turno
- [x] Cada ataque con su tecla (W, A, S, D o Espacio), mostrada en la carta, el anillo y la intención enemiga

## Your systems
- combate por turnos con interacciones a tiempo · in the slice
- equipo de hasta 4 mascotas · in the slice
- canción sanadora para convencer · in the slice
- subir de nivel · in the slice
- aprender ataques nuevos · in the slice
- evolucionar · thin stand-in *(guessed)*
- una mazmorra pequeña con jefe · in the slice
- varias mazmorras · later *(guessed)*

## Keep
-

## Avoid
- La palabra "capturar", y nada de Pokémon: sin bolas de captura, sin sus nombres, criaturas, arte ni interfaz.

## Out of scope
- Varias mazmorras: grow it
- Árboles de evolución con ramas: grow it
- Una historia en escenas y diálogos: grow it
- Pueblos, tiendas y misiones secundarias: grow it
- Cría: add it as a feature
- Cuidar a las mascotas entre combates: add it as a feature
- Equipo que enseña habilidades: add it as a feature
- Objetos: change it after play
- Variantes raras: change it after play
- Ataques especiales que se cargan: change it after play
- Intercambios y combates entre jugadores: needs a server

## Build order
1. El trozo: elegir inicial, recorrer la mazmorra pequeña, combates por turnos con golpes y bloqueos a tiempo, sumar mascotas con la canción, subir de nivel y aprender ataques, evolucionar la inicial, y vencer al jefe. Si caes, vuelves a la fuente.
2. Ajustar ventanas de timing, longitud de canciones y curva de dificultad tras jugarlo.
3. Una segunda mazmorra con criaturas más raras.

---
**Kill condition:** *(guessed)* Si tras dos rondas de ajuste el timing en cada golpe cansa en vez de enganchar.

**Who it's for / what they feel:** *(guessed)* Fans del RPG por turnos que quieren decisiones con peso y manos ocupadas, y un vínculo con mascotas que convencieron ellos mismos.

**Games you love / don't:** Clair Obscur: Expedition 33 (interacciones en los ataques).
