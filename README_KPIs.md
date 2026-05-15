# Cómo se calculan los KPIs — Explicación técnica
**IA Aplicada · Grupo 3 · Uandes 2026**

---

## Cómo detecta los patrones el sistema

El sistema no usa OCR ni modelos de lenguaje. Toda la lógica corre en el browser con JavaScript puro. Lo que hace que "parezca inteligente" es que los datos ya vienen estructurados desde el sistema académico: el Excel tiene columnas limpias con categorías y NRCs, por lo que el código no necesita entender lenguaje natural — solo hace matemáticas y comparaciones de strings sobre esos campos.

---

## Módulo 1 — Clasificación por reglas

**Técnica: lookup de strings**

Para cada fila, el sistema lee la columna `Error Categoría` y la compara contra dos listas fijas. No hay inferencia, no hay modelo.

```
fila del Excel → leer "Error Categoría" → comparar contra lista → asignar clasificación
```

### Por qué cada categoría va a cada bucket

| Categoría | Clasificación | Razón |
|-----------|---------------|-------|
| `Tope de Horario` | Rechazo Sugerido | Choque físico de horario — dos ramos a la misma hora. Es objetivamente imposible. No hay nada que revisar |
| `Curso Ligado` | Rechazo Sugerido | Dependencia de malla que el sistema ya validó. No hay excepción posible |
| `Sección Cerrada` | Revisión Manual | La sección puede abrirse, puede haber cupo extra, el jefe de carrera puede autorizar |
| `Creditos` | Revisión Manual | Puede haber sobrecarga académica autorizada o casos especiales |
| `Restricción Carrera` | Revisión Manual | Puede haber doble carrera, intercambio, o autorización especial |

### KPI 1 — Tasa de Detección de Rechazos

Solo aplica cuando el Excel incluye columna `Estado` (la coordinadora ya procesó esas solicitudes).

```
KPI 1 = C / M × 100

M = solicitudes marcadas como "Rechazo Sugerido" por el sistema
C = cuántas de esas M la coordinadora también rechazó (Estado contiene "rechaz")
```

**Objetivo:** ≥ 90% — indica que el sistema es confiable como primer filtro.

---

## Módulo 2 — Detección de pares recurrentes (Topes de Horario)

**Técnica: regex + conteo de co-ocurrencias por período**

### Paso a paso

**1. Extracción del NRC con regex**

El campo `Error` del Excel tiene formato `NRC 12345 - NOMBRE DEL CURSO`. El sistema extrae el NRC con:

```
/NRC\s+(\d+)/i
```

**2. Construcción de pares canonicalizados**

Cada tope genera un par ordenado para que `(A, B)` y `(B, A)` sean el mismo par:

```
[nrcSolicitado, nrcConflicto].sort().join('||')
→ "1234||5678"  (siempre el mismo, sin importar el orden)
```

**3. Conteo de períodos por par**

Por cada par se lleva un Set de períodos en que apareció. Un par es **recurrente** si ese Set tiene 2 o más elementos — significa que el choque ocurrió en más de un semestre.

### KPI 2 — Pares de Ramos Recurrentes

```
KPI 2 = cantidad de pares únicos que aparecen en 2 o más períodos distintos
```

**Objetivo:** ≥ 15 pares — refleja conflictos estructurales de horario, no accidentales.

---

## Módulo 3 — Proyección estadística de sobrecupos

**Técnica: media + desviación estándar para detectar outliers**

### Paso a paso

**1. Filtrado y agrupación**

Se filtran solo las filas con `Error Categoría = "Sección Cerrada"` y se cuenta cuántas solicitudes tuvo cada curso en cada período histórico.

**2. Cálculo del umbral estadístico**

```
media    = promedio de solicitudes por período (historial completo)
desv_est = desviación estándar entre períodos
umbral   = media + desv_est
```

El umbral equivale a "una desviación por encima del promedio histórico". Si la demanda del último período supera ese umbral, el curso tiene demanda anómala.

**3. Criterio mínimo de confiabilidad**

Para que el cálculo estadístico sea válido, el curso debe cumplir:
- Al menos **5 solicitudes** en total a lo largo del historial
- Aparecer en al menos **2 períodos** distintos

**4. Confirmación de alta demanda**

```
tieneAltaDemanda = ultimaDemanda >= (media + desv_est)
```

### KPI 3 — Sobrecupos Anticipados

```
KPI 3 = cantidad de cursos sugeridos que confirman alta demanda en el período más reciente
```

**Objetivo:** ≥ 6 ramos — indica que el modelo estadístico captura señales reales, no ruido.

---

## Resumen comparativo de los tres módulos

| Módulo | Técnica | Input clave del Excel | Output KPI |
|--------|---------|----------------------|------------|
| 1 | Lookup en lista fija (if/else) | Columna `Error Categoría` | % de rechazos sugeridos que coinciden con decisión real |
| 2 | Regex + agrupación por pares + Set de períodos | Columna `Error` (string con NRC) | N° de pares de ramos que chocan en ≥2 períodos |
| 3 | Media + desviación estándar sobre historial por curso | Columna `Nombre del Curso` + `Catalogo` | N° de cursos con demanda anómala en el último período |
