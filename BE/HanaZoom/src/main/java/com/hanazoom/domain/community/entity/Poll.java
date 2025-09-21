package com.hanazoom.domain.community.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "polls")
public class Poll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "question", nullable = false, length = 500)
    private String question;

    @Column(name = "option_up", length = 100)
    private String optionUp = "오를 것 같다 📈";

    @Column(name = "option_down", length = 100)
    private String optionDown = "떨어질 것 같다 📉";

    @Column(name = "vote_up_count")
    private int voteUpCount = 0;

    @Column(name = "vote_down_count")
    private int voteDownCount = 0;

    @Column(name = "total_vote_count")
    private int totalVoteCount = 0;

    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PollOption> pollOptions;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Poll(Post post, String question, LocalDateTime endDate) {
        this.post = post;
        this.question = question;
        this.startDate = LocalDateTime.now();
        this.endDate = endDate;
    }

    public void incrementVoteUpCount() {
        this.voteUpCount++;
    }

    public void incrementVoteDownCount() {
        this.voteDownCount++;
    }

    public void incrementTotalVoteCount() {
        this.totalVoteCount++;
    }

    public void setOptionUp(String optionUp) {
        this.optionUp = optionUp;
    }

    public void setOptionDown(String optionDown) {
        this.optionDown = optionDown;
    }

    public void setPollOptions(List<PollOption> pollOptions) {
        this.pollOptions = pollOptions;
    }
}