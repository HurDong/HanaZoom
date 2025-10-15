package com.hanazoom.domain.member.repository;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.entity.PbStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.QueryHint;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID> {

    @QueryHints(value = {
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "100"),
        @QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    Optional<Member> findByEmail(String email);

    @QueryHints(value = {
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    boolean existsByEmail(String email);


    List<Member> findByIsPbTrueAndPbStatus(PbStatus pbStatus);

    Page<Member> findByIsPbTrueAndPbStatus(PbStatus pbStatus, Pageable pageable);

    List<Member> findByIsPbTrueAndPbStatusAndRegionId(PbStatus pbStatus, Long regionId);

    List<Member> findByIsPbTrueAndPbStatusOrderByPbRatingDesc(PbStatus pbStatus, Pageable pageable);

    @Query("SELECT m FROM Member m WHERE m.isPb = true AND m.pbStatus = :status AND " +
           "(:region IS NULL OR m.pbRegion = :region) AND " +
           "(:specialty IS NULL OR m.pbSpecialties LIKE %:specialty%)")
    Page<Member> findActivePbWithFilters(@Param("status") PbStatus status,
                                        @Param("region") String region,
                                        @Param("specialty") String specialty,
                                        Pageable pageable);

    @Query("SELECT m FROM Member m WHERE m.isPb = true AND m.pbStatus = :status " +
           "ORDER BY m.pbRating DESC, m.pbTotalConsultations DESC")
    List<Member> findTopRatedPb(@Param("status") PbStatus status, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Member m WHERE m.isPb = true AND m.pbStatus = :status")
    long countActivePb(@Param("status") PbStatus status);

    @Query("SELECT AVG(m.pbRating) FROM Member m WHERE m.isPb = true AND m.pbStatus = :status AND m.pbRating > 0")
    Double getAveragePbRating(@Param("status") PbStatus status);
}