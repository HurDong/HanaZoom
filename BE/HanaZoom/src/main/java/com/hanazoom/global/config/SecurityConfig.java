package com.hanazoom.global.config;

import com.hanazoom.global.filter.JwtAuthenticationFilter;
import com.hanazoom.global.util.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;

    public SecurityConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000", "http://localhost:3001"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept",
                "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtUtil);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/members/login",
                                "/api/members/signup",
                                "/api/members/refresh",
                                "/api/members/forgot-password/**",
                                "/api/v1/members/**",
                                "/api/health")
                        .permitAll()
                        .requestMatchers("/api/regions/**").permitAll()
                        .requestMatchers("/api/stocks/**").permitAll()
                        .requestMatchers("/api/v1/stocks/**").permitAll()
                        .requestMatchers("/api/charts/**").permitAll()
                        .requestMatchers("/api/v1/charts/**").permitAll()
                        .requestMatchers("/api/websocket/**").permitAll()
                        .requestMatchers("/api/v1/websocket/**").permitAll()
                        .requestMatchers("/api/stocks/chart/**").permitAll()
                        .requestMatchers("/api/stock-minute-prices/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/stocks/*/posts").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/community/posts/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/community/posts/*/comments").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/community/comments/*/replies").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/community/posts/*/vote-results").authenticated()
                        .requestMatchers("/api/pb/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/pb-rooms/join-info").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/pb-rooms/*/join").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/pb-rooms/user/join").permitAll()
                        .requestMatchers("/api/v1/calendar/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/portfolio/client/*/summary").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/portfolio/client/*/stocks").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/portfolio/client/*/trades").authenticated()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/favicon.ico").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}