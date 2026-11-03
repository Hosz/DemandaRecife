package com.uninassau.demandarecife.auth.repository;

import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TokenAtualizacaoRepository extends JpaRepository<TokenAtualizacao, UUID> {

    Optional<TokenAtualizacao> findByToken(String token);

    void deleteByUsuarioId(UUID userId);
}
