# ms_notifications
## Información General
- **Integrantes**:
	- Julián Alejandro Gabriel Isidro.
	- Cecilia Alejandra Castañeda Cuevas.
- **Entorno de Desarrollo:** Arch Linux o Fedora Workstation 43.
- **Objetivo del Proyecto:**
	- **Meta Principal:** Desarrollar una "Billetera Digital" basada en microservicios para la clase de Sistemas Distribuidos.
	- **Requisitos Clave:** El sistema debe cumplir con la implementación de tecnologías específicas de comunicación y algoritmos de consenso.
## Arquitectura de Microservicios
- **Framework Base:** El ecosistema está construido sobre Django y Django REST Framework (DRF).
- **Estructura:** El sistema se divide en 3 proyectos que operan de manera independiente.
- **Identidad (`ms_users`):** Se encarga del registro y login de usuarios.
- **Seguridad (`ms_users`):** Emplea estándares JWT y OIDC.
- **Roles de Acceso (`ms_users`):** Se designará el rol "staff" en lugar de "admin" para los usuarios con privilegios administrativos.
- **Transacciones (`ms_wallet`):** Gestiona los saldos de los usuarios y coordina los envíos de dinero.
- **Lógica de Datos (`ms_wallet`):** Implementa transacciones atómicas propias de Django para mantener la consistencia.
- **Teorema CAP (`ms_wallet`):** La arquitectura prioriza la Disponibilidad y la Tolerancia a Particiones.
- **Notificaciones (`ms_notifications`):** Un servicio orientado a eventos (Event-Driven) para el manejo de auditoría y alertas.
- **Operatividad (`ms_notifications`):** Trabaja exclusivamente escuchando eventos asíncronos y no necesita exponer endpoints REST.
## Stack Tecnológico
- **Lenguaje de Programación:** Python.
- **Comunicación Externa:** Expuesta mediante RESTful APIs.
- **Comunicación Interna Síncrona:** Realizada mediante contratos gRPC.
- **Comunicación Interna Asíncrona:** Gestionada a través de RabbitMQ o Apache Kafka.
- **Bases de Datos:** Se utiliza PostgreSQL, asignando estrictamente una instancia por cada microservicio.
- **Consenso Distribuido:** Aplicación de algoritmos como Paxos/Raft o Bully para coordinar la elección de un nodo líder.
- **Despliegue y Orquestación:** Uso de Docker y Docker Compose para el desarrollo local, apuntando a Kubernetes para el despliegue final.