package com.uninassau.demandarecife.push;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "push_subscriptions")
@Getter @Setter @NoArgsConstructor
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    @Column(nullable = false, length = 255)
    private String p256dh;

    @Column(nullable = false, length = 255)
    private String auth;

    @Column(name = "criado_em", insertable = false, updatable = false)
    private LocalDateTime criadoEm;
}