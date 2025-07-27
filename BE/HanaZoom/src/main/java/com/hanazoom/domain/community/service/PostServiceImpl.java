package com.hanazoom.domain.community.service;

import com.hanazoom.domain.community.entity.Like;
import com.hanazoom.domain.community.entity.LikeTargetType;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.entity.PostSentiment;
import com.hanazoom.domain.community.entity.PostType;
import com.hanazoom.domain.community.repository.LikeRepository;
import com.hanazoom.domain.community.repository.PostRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;

    @Override
    @Transactional
    public Post createPost(Member member, Stock stock, String title, String content,
            PostType postType, PostSentiment sentiment) {
        Post post = Post.builder()
                .member(member)
                .stock(stock)
                .title(title)
                .content(content)
                .postType(postType)
                .sentiment(sentiment)
                .build();
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public Post updatePost(Long postId, Member member, String title, String content,
            PostSentiment sentiment) {
        Post post = getPostWithMemberCheck(postId, member);
        post.update(title, content, sentiment);
        return post;
    }

    @Override
    @Transactional
    public void deletePost(Long postId, Member member) {
        Post post = getPostWithMemberCheck(postId, member);
        post.delete();
    }

    @Override
    public Post getPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        post.incrementViewCount();
        return post;
    }

    @Override
    public Page<Post> getPostsByStock(Stock stock, Pageable pageable) {
        return postRepository.findByStockAndIsDeletedFalseOrderByCreatedAtDesc(stock, pageable);
    }

    @Override
    public Page<Post> getTopPostsByStock(Stock stock, Pageable pageable) {
        return postRepository.findTopPostsByStock(stock, pageable);
    }

    @Override
    @Transactional
    public void likePost(Long postId, Member member) {
        if (isLikedByMember(postId, member)) {
            throw new IllegalArgumentException("이미 좋아요한 게시글입니다.");
        }
        Post post = getPost(postId);
        post.incrementLikeCount();
        likeRepository.save(Like.builder()
                .member(member)
                .targetType(LikeTargetType.POST)
                .targetId(postId)
                .build());
    }

    @Override
    @Transactional
    public void unlikePost(Long postId, Member member) {
        if (!isLikedByMember(postId, member)) {
            throw new IllegalArgumentException("좋아요하지 않은 게시글입니다.");
        }
        Post post = getPost(postId);
        post.decrementLikeCount();
        likeRepository.deleteByMemberAndTargetTypeAndTargetId(member, LikeTargetType.POST, postId);
    }

    @Override
    public boolean isLikedByMember(Long postId, Member member) {
        if (member == null)
            return false;
        return likeRepository.existsByMemberAndTargetTypeAndTargetId(member, LikeTargetType.POST, postId);
    }

    private Post getPostWithMemberCheck(Long postId, Member member) {
        Post post = getPost(postId);
        if (!post.getMember().equals(member)) {
            throw new IllegalArgumentException("게시글 작성자만 수정/삭제할 수 있습니다.");
        }
        return post;
    }
}