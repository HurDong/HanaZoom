package com.hanazoom.domain.member.repository;

import com.hanazoom.domain.member.entity.SocialAccount;
import com.hanazoom.domain.member.entity.SocialProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SocialAccountRepository extends JpaRepository<SocialAccount, UUID> {

    Optional<SocialAccount> findByProviderAndProviderUserId(SocialProvider provider, String providerUserId);

    Optional<SocialAccount> findByProviderAndEmail(SocialProvider provider, String email);

    @Query("SELECT sa FROM SocialAccount sa WHERE sa.provider = :provider AND sa.providerUserId = :providerUserId")
    Optional<SocialAccount> findByProviderAndProviderUserIdQuery(
            @Param("provider") SocialProvider provider,
            @Param("providerUserId") String providerUserId);

    boolean existsByProviderAndProviderUserId(SocialProvider provider, String providerUserId);

    @Query("SELECT COUNT(sa) > 0 FROM SocialAccount sa WHERE sa.provider = :provider AND sa.email = :email")
    boolean existsByProviderAndEmail(@Param("provider") SocialProvider provider, @Param("email") String email);
}
