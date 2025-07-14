package com.hanazoom.domain.community.entity;

import com.hanazoom.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "poll_responses", uniqueConstraints = {
        @UniqueConstraint(name = "uk_poll_member", columnNames = { "poll_id", "member_id" })
})
public class PollResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_option", nullable = false)
    private VoteOption voteOption;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public PollResponse(Poll poll, Member member, VoteOption voteOption) {
        this.poll = poll;
        this.member = member;
        this.voteOption = voteOption;
    }
}