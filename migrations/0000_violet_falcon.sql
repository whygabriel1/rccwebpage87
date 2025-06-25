CREATE TABLE "admin" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre_usuario" text NOT NULL,
	"clave" text NOT NULL,
	CONSTRAINT "admin_nombre_usuario_unique" UNIQUE("nombre_usuario")
);
--> statement-breakpoint
CREATE TABLE "articulos" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"contenido" text NOT NULL,
	"autor" text NOT NULL,
	"categoria" text NOT NULL,
	"imagen" text,
	"fecha_creacion" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "biblioteca" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre_libro" text NOT NULL,
	"autor" text NOT NULL,
	"portada" text,
	"pdf" text,
	"materia" text NOT NULL,
	"fecha_creacion" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendario" (
	"id" serial PRIMARY KEY NOT NULL,
	"evento" text NOT NULL,
	"fecha" timestamp NOT NULL,
	"categoria" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidatos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"grado" text NOT NULL,
	"tipo_eleccion" text NOT NULL,
	"activo" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "estudiantes" (
	"id" serial PRIMARY KEY NOT NULL,
	"cedula" varchar(20) NOT NULL,
	"nombre" text NOT NULL,
	"apellido" text NOT NULL,
	"anio_seccion" text NOT NULL,
	"direccion" text NOT NULL,
	CONSTRAINT "estudiantes_cedula_unique" UNIQUE("cedula")
);
--> statement-breakpoint
CREATE TABLE "galeria" (
	"id" serial PRIMARY KEY NOT NULL,
	"imagen" text NOT NULL,
	"categoria" text NOT NULL,
	"nombre" text NOT NULL,
	"fecha_creacion" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "votaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"cedula" varchar(20) NOT NULL,
	"nombre" text NOT NULL,
	"apellido" text NOT NULL,
	"rol" text NOT NULL,
	"anio_seccion" text NOT NULL,
	"direccion" text NOT NULL,
	"candidato_votado" text NOT NULL,
	"tipo_eleccion" text NOT NULL,
	"fecha_voto" timestamp DEFAULT now()
);
