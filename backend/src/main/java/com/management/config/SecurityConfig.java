package com.management.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.management.constant.Constants;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

	private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

	@Autowired
	private JwtFilter jwtFilter;

	@Autowired
	CustomAccessDeniedHandler customAccessDeniedHandler;

	@Autowired
	CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		logger.info("Initializing Security Filter Chain...");
		http.cors(Customizer.withDefaults()) // ✅ REQUIRED for browser CORS to work
				.csrf(csrf -> {
					csrf.disable();
					logger.debug("CSRF protection disabled (Stateless JWT config).");
				}).authorizeHttpRequests(auth -> auth.requestMatchers("/login/**").permitAll() // allow all role logins
						 .requestMatchers("/forgot-password/**").permitAll()
						 .requestMatchers("/reset-password/**").permitAll()
						 // Only SUPER_ADMIN can access this endpoint (example)
						 .requestMatchers("/super-admin/**").hasRole(Constants.ROLE_SUPER_ADMIN)
						 .requestMatchers("/register/**").hasAnyRole(Constants.ROLE_ADMIN, Constants.ROLE_SUPER_ADMIN)
						 .requestMatchers("/getallusernames/**").hasAnyRole(Constants.ROLE_ADMIN, Constants.ROLE_SUPER_ADMIN, Constants.ROLE_STAFF)
							//getallusernames
						 .requestMatchers("/admin/**").hasAnyRole(Constants.ROLE_ADMIN, Constants.ROLE_SUPER_ADMIN)
						.requestMatchers("/staff/**").hasRole(Constants.ROLE_STAFF).requestMatchers("/customer/**")
						.hasRole(Constants.ROLE_CUSTOMER) // customer features secured (future)
						.anyRequest().authenticated())
				.exceptionHandling(ex -> {
					ex.authenticationEntryPoint(customAuthenticationEntryPoint);
					ex.accessDeniedHandler(customAccessDeniedHandler);
					logger.debug("Custom exception handlers registered.");
				})
				.sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

		http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
		logger.debug("JWT filter registered before UsernamePasswordAuthenticationFilter.");
		

		return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		logger.debug("BCryptPasswordEncoder bean created.");
		return new BCryptPasswordEncoder();
	}
}
