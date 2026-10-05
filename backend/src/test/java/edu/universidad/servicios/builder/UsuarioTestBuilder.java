package edu.universidad.servicios.builder;

import edu.universidad.servicios.usuario.domain.Area;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;

import java.time.LocalDateTime;

public class UsuarioTestBuilder {

    private Long id;
    private String codigoInstitucional = "20260001";
    private String nombre = "Usuario";
    private String apellido = "Prueba";
    private String correo = "usuario.prueba@universidad.edu";
    // BCrypt(12) hash correspondiente a "Password123!"
    private String passwordHash = "$2a$12$e8YkZ7kRkKxSjR2F1H8wUeq0tL7N3P4m9vK2J5H1Q6wR3T4Y7u8iO";
    private String telefono = "999888777";
    private Rol rol;
    private Area area;
    private Boolean activo = true;
    private LocalDateTime ultimoAcceso;

    public UsuarioTestBuilder() {
        this.rol = crearRol(4, "ESTUDIANTE");
    }

    public static UsuarioTestBuilder unUsuario() {
        return new UsuarioTestBuilder();
    }

    public UsuarioTestBuilder conId(Long id) {
        this.id = id;
        return this;
    }

    public UsuarioTestBuilder conCodigoInstitucional(String codigo) {
        this.codigoInstitucional = codigo;
        return this;
    }

    public UsuarioTestBuilder conNombre(String nombre) {
        this.nombre = nombre;
        return this;
    }

    public UsuarioTestBuilder conApellido(String apellido) {
        this.apellido = apellido;
        return this;
    }

    public UsuarioTestBuilder conCorreo(String correo) {
        this.correo = correo;
        return this;
    }

    public UsuarioTestBuilder conPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
        return this;
    }

    public UsuarioTestBuilder conTelefono(String telefono) {
        this.telefono = telefono;
        return this;
    }

    public UsuarioTestBuilder conRol(Rol rol) {
        this.rol = rol;
        return this;
    }

    public UsuarioTestBuilder conRol(Integer id, String nombreRol) {
        this.rol = crearRol(id, nombreRol);
        return this;
    }

    public UsuarioTestBuilder conArea(Area area) {
        this.area = area;
        return this;
    }

    public UsuarioTestBuilder activo(boolean activo) {
        this.activo = activo;
        return this;
    }

    public UsuarioTestBuilder inactivo() {
        this.activo = false;
        return this;
    }

    public UsuarioTestBuilder comoAdmin() {
        this.rol = crearRol(1, "ADMIN");
        this.correo = "admin.prueba@universidad.edu";
        this.codigoInstitucional = "ADM-001";
        return this;
    }

    public UsuarioTestBuilder comoSupervisor() {
        this.rol = crearRol(2, "SUPERVISOR");
        this.correo = "supervisor.prueba@universidad.edu";
        this.codigoInstitucional = "SUP-001";
        return this;
    }

    public UsuarioTestBuilder comoTecnico() {
        this.rol = crearRol(3, "TECNICO");
        this.correo = "tecnico.prueba@universidad.edu";
        this.codigoInstitucional = "TEC-001";
        return this;
    }

    public UsuarioTestBuilder comoEstudiante() {
        this.rol = crearRol(4, "ESTUDIANTE");
        this.correo = "estudiante.prueba@universidad.edu";
        this.codigoInstitucional = "EST-001";
        return this;
    }

    public Usuario build() {
        Usuario usuario = new Usuario();
        usuario.setId(this.id);
        usuario.setCodigoInstitucional(this.codigoInstitucional);
        usuario.setNombre(this.nombre);
        usuario.setApellido(this.apellido);
        usuario.setCorreo(this.correo);
        usuario.setPasswordHash(this.passwordHash);
        usuario.setTelefono(this.telefono);
        usuario.setRol(this.rol);
        usuario.setArea(this.area);
        usuario.setActivo(this.activo);
        usuario.setUltimoAcceso(this.ultimoAcceso);
        return usuario;
    }

    private Rol crearRol(Integer id, String nombre) {
        Rol r = new Rol();
        r.setId(id);
        r.setNombre(nombre);
        r.setDescripcion("Rol de " + nombre);
        return r;
    }
}
