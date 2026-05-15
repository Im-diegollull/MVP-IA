# Sistema de Soporte a la Decisión — Solicitudes Especiales
**IA Aplicada · Grupo 3 ·**

---

## Qué hace el sistema

El sistema recibe el Excel histórico de solicitudes especiales de inscripción y produce tres análisis automáticos, uno por módulo. No requiere configuración: solo arrastrar el archivo.

---

## Módulo 1 — Filtrado Automatizado

### Qué hace
Clasifica cada solicitud en una de tres categorías usando reglas fijas basadas en la columna **Error Categoría**:

| Clasificación | Categorías que la activan |
|---|---|
| **Rechazo Sugerido** | Tope de Horario, Curso Ligado |
| **Revisión Manual** | Sección Cerrada, Creditos, Restricción Carrera |
| **Sin Clasificar** | Cualquier otra categoría |

La lógica es determinista: si el error es objetivamente irresolvible (tope de horario, curso ligado por malla), el sistema sugiere rechazo directo. Si el error depende de contexto o cupos disponibles, la manda a revisión manual.

### KPI 1 — Tasa de Detección de Rechazos
**Solo aplica cuando el Excel incluye una columna "Estado"** (es decir, cuando la coordinadora ya procesó esas solicitudes y registró su decisión).

**Fórmula:**
```
KPI 1 = C / M × 100

M = total de solicitudes que el sistema marcó como "Rechazo Sugerido"
C = cuántas de esas M la coordinadora también rechazó (Estado contiene "rechaz")
```

**Ejemplo:** Si el sistema sugirió rechazar 80 solicitudes y la coordinadora rechazó 74 de esas 80, KPI 1 = 74/80 = **92.5%**.

**Sin columna Estado:** el KPI no se calcula porque no hay verdad de referencia con qué comparar.

**Objetivo declarado:** ≥ 90% — indica que el sistema es confiable como primer filtro y la coordinadora no necesita revisar manualmente lo que ya fue sugerido como rechazo.

---

## Módulo 2 — Descubrimiento de Patrones (Topes de Horario)

### Qué hace
Analiza únicamente las solicitudes con **Error Categoría = "Tope de Horario"** y encuentra qué pares de ramos se topan de manera recurrente a lo largo de los períodos académicos. El objetivo es identificar conflictos estructurales de horario que se repiten semestre a semestre.

### Cómo funciona paso a paso

**1. Extracción del NRC en conflicto**
El campo "Error" en el Excel tiene un formato como `NRC 12345 - NOMBRE DEL CURSO`. El sistema extrae el NRC numérico con una expresión regular y el nombre del curso del texto que sigue al guión.

**Resolución de nombres sin nombre:** Si el string del error no trae el nombre (aparece vacío o dice "SYSDEL"), el sistema busca el NRC en dos fuentes adicionales en orden de prioridad:
1. Todas las filas del mismo Excel de solicitudes — si ese NRC aparece en otra fila, usa su "Nombre del Curso".
2. El archivo **Catálogo_PE_2026.xlsx** (opcional, se puede arrastrar en la pantalla de carga) — busca el NRC en la columna CURSO del catálogo.

**2. Construcción de pares**
Cada tope genera un par ordenado: `(NRC solicitado, NRC en conflicto)`. El par se ordena alfabéticamente para que `(A, B)` y `(B, A)` sean el mismo par. Así se acumula cuántas veces aparece ese par en total y en cuántos períodos distintos.

**3. Filtro de pares recurrentes**
Un par es **recurrente** si aparece en 2 o más períodos académicos distintos. Estos son los conflictos estructurales, no accidentales.

**4. Análisis de co-ocurrencia (Apriori-like)**
Adicionalmente, por cada estudiante y período, se construye una "transacción" con todos los cursos que ese estudiante intentó inscribir y le generaron tope. Luego se cuentan qué pares de cursos aparecen juntos en las transacciones de al menos 2 estudiantes distintos. Esto complementa el análisis por NRC con una vista por nombre de curso.

### KPI 2 — Pares de Ramos Recurrentes
```
KPI 2 = cantidad de pares únicos que aparecen en 2 o más períodos distintos
```

**Ejemplo:** Si el par (Cálculo I, Física I) aparece con topes en 2024-1, 2024-2 y 2025-1, cuenta como 1 par recurrente.

**Objetivo declarado:** ≥ 15 pares — refleja que hay suficiente masa crítica de conflictos estructurales para justificar una revisión de la malla o de los horarios asignados.

---

## Módulo 3 — Proyección de Sobrecupos

### Qué hace
Analiza las solicitudes con **Error Categoría = "Sección Cerrada"** para identificar qué cursos tienen demanda sistemáticamente alta y podrían necesitar un sobrecupo anticipado antes de que se abra la inscripción.

### Cómo funciona paso a paso

**1. Agrupación por curso y período**
Se cuenta cuántas solicitudes de "Sección Cerrada" tuvo cada curso en cada período académico.

**2. Estadísticas históricas por curso**
Para cada curso se calcula:
- **Media histórica:** promedio de solicitudes por período.
- **Desviación estándar:** variabilidad entre períodos.
- **Umbral:** media + desviación estándar. Si la demanda del último período supera este umbral, el curso tiene "alta demanda confirmada".

**3. Criterio de sugerencia**
Un curso es **sugerido para sobrecupo** si cumple ambas condiciones:
- Al menos 5 solicitudes en total a lo largo del historial.
- Aparece en al menos 2 períodos distintos.

**4. Confirmación de alta demanda**
De los cursos sugeridos, se marcan como **confirmados** aquellos cuya demanda en el período más reciente supera el umbral (media + DE). Estos son los candidatos más urgentes.

### KPI 3 — Sobrecupos Anticipados
```
KPI 3 = cantidad de cursos sugeridos que confirman alta demanda en el período más reciente
```

**Ejemplo:** Si el sistema sugiere 20 cursos para sobrecupo y 8 de ellos tuvieron más solicitudes que su umbral histórico en el último período, KPI 3 = 8.

**Objetivo declarado:** ≥ 6 ramos — indica que el modelo estadístico está capturando señales reales de demanda y no solo ruido.

---

## Archivos que acepta el sistema

| Archivo | Obligatorio | Descripción |
|---|---|---|
| Excel de solicitudes | Sí | Listado histórico de solicitudes especiales. Puede tener o no columna "Estado". |
| Catálogo_PE_2026.xlsx | No | Catálogo del período actual. Mejora la resolución de nombres de NRC en topes de horario. |

El sistema detecta automáticamente la fila de encabezados, anonimiza los RUTs y funciona con distintos formatos de columnas (acepta variaciones de mayúsculas/minúsculas y tildes).

---

## Stack técnico

- **Frontend:** React + Vite + Tailwind CSS
- **Parsing Excel:** SheetJS (xlsx)
- **Gráficos:** Recharts
- **Lógica de análisis:** JavaScript puro (sin backend, todo corre en el browser)
