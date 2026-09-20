package com.management.config;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class CustomUserDetails implements UserDetails {

    private final String email;
    private final Integer adminId;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(String email, Integer adminId, String role, Collection<? extends GrantedAuthority> authorities) {
        this.email = email;
        this.adminId = adminId;
        this.role = role;
        this.authorities = authorities;
    }

    public Integer getAdminId() {
        return adminId;
    }

    public String getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null; // Not used for JWT-based auth
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
