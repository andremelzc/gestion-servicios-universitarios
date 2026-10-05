package edu.universidad.servicios.auth.security;

import edu.universidad.servicios.usuario.domain.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UsuarioDetails implements UserDetails {

    private final Usuario usuario;

    public UsuarioDetails(Usuario usuario) {
        this.usuario = usuario;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // En Spring Security, es buena práctica que los roles empiecen con ROLE_
        String rolNombre = usuario.getRol().getNombre();
        if (!rolNombre.startsWith("ROLE_")) {
            rolNombre = "ROLE_" + rolNombre;
        }
        return Collections.singletonList(new SimpleGrantedAuthority(rolNombre));
    }

    @Override
    public String getPassword() {
        return usuario.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return usuario.getCorreo();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // TODO: Validar según US-20 (bloqueo por intentos)
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return usuario.getActivo();
    }

    public Usuario getUsuario() {
        return usuario;
    }
}
