package com.hanazoom.domain.community.entity;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "posts", indexes = {
    @Index(name = "idx_posts_stock_deleted_created", columnList = "stock_id, is_deleted, created_at"),
    @Index(name = "idx_posts_member_created", columnList = "member_id, created_at"),
    @Index(name = "idx_posts_created", columnList = "created_at"),
    @Index(name = "idx_posts_deleted", columnList = "is_deleted"),
    @Index(name = "idx_posts_view_count", columnList = "view_count"),
    @Index(name = "idx_posts_like_count", columnList = "like_count"),
    @Index(name = "idx_posts_comment_count", columnList = "comment_count")
})
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    @Lob
    private String content;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    @Lob
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false)
    private PostType postType = PostType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(name = "sentiment")
    private PostSentiment sentiment;

    @Column(name = "view_count")
    private int viewCount = 0;

    @Column(name = "like_count")
    private int likeCount = 0;

    @Column(name = "comment_count")
    private int commentCount = 0;

    @Column(name = "is_deleted")
    private boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Post(Member member, Stock stock, String title, String content, String imageUrl,
            PostType postType, PostSentiment sentiment) {
        this.member = member;
        this.stock = stock;
        this.title = title;
        this.content = content;
        this.imageUrl = imageUrl;
        this.postType = postType;
        this.sentiment = sentiment;
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementLikeCount() {
        this.likeCount++;
    }

    public void decrementLikeCount() {
        this.likeCount = Math.max(0, this.likeCount - 1);
    }

    public void incrementCommentCount() {
        this.commentCount++;
    }

    public void decrementCommentCount() {
        this.commentCount = Math.max(0, this.commentCount - 1);
    }

    public void delete() {
        this.isDeleted = true;
    }

    public void update(String title, String content, String imageUrl, PostSentiment sentiment) {
        this.title = title;
        this.content = content;
        this.imageUrl = imageUrl;
        this.sentiment = sentiment;
    }
}