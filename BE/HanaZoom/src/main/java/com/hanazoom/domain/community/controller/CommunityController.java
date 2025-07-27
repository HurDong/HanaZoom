package com.hanazoom.domain.community.controller;

import com.hanazoom.domain.community.dto.*;
import com.hanazoom.domain.community.entity.Comment;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.service.CommentService;
import com.hanazoom.domain.community.service.PostService;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final PostService postService;
    private final CommentService commentService;
    private final StockService stockService;

    // 게시글 작성
    @PostMapping("/stocks/{symbol}/posts")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @PathVariable String symbol,
            @RequestBody PostRequest request,
            @AuthenticationPrincipal Member member) {

        Stock stock = stockService.getStockBySymbol(symbol);
        Post post = postService.createPost(member, stock, request.getTitle(),
                request.getContent(), request.getPostType(), request.getSentiment());
        return ResponseEntity.ok(ApiResponse.success(PostResponse.from(post, false)));
    }

    // 게시글 수정
    @PutMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long postId,
            @RequestBody PostRequest request,
            @AuthenticationPrincipal Member member) {

        Post post = postService.updatePost(postId, member, request.getTitle(),
                request.getContent(), request.getSentiment());
        return ResponseEntity
                .ok(ApiResponse.success(PostResponse.from(post, postService.isLikedByMember(postId, member))));
    }

    // 게시글 삭제
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        postService.deletePost(postId, member);
        return ResponseEntity.ok(ApiResponse.success("게시글이 삭제되었습니다."));
    }

    // 게시글 좋아요
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        postService.likePost(postId, member);
        return ResponseEntity.ok(ApiResponse.success("게시글을 좋아요했습니다."));
    }

    // 게시글 좋아요 취소
    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        postService.unlikePost(postId, member);
        return ResponseEntity.ok(ApiResponse.success("게시글 좋아요를 취소했습니다."));
    }

    // 게시글 상세 조회
    @GetMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        Post post = postService.getPost(postId);
        boolean isLiked = member != null && postService.isLikedByMember(postId, member);
        return ResponseEntity.ok(ApiResponse.success(PostResponse.from(post, isLiked)));
    }

    // 종목별 게시글 목록 조회
    @GetMapping("/stocks/{symbol}/posts")
    public ResponseEntity<ApiResponse<PostListResponse>> getPostsByStock(
            @PathVariable String symbol,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal Member member) {

        Stock stock = stockService.getStockBySymbol(symbol);
        Page<Post> posts = postService.getPostsByStock(stock, pageable);
        Page<PostResponse> postResponses = posts.map(post -> {
            boolean isLiked = member != null && postService.isLikedByMember(post.getId(), member);
            return PostResponse.from(post, isLiked);
        });
        return ResponseEntity.ok(ApiResponse.success(PostListResponse.from(postResponses)));
    }

    // 종목별 인기 게시글 조회
    @GetMapping("/stocks/{symbol}/posts/top")
    public ResponseEntity<ApiResponse<PostListResponse>> getTopPostsByStock(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "5") int limit,
            @AuthenticationPrincipal Member member) {

        Stock stock = stockService.getStockBySymbol(symbol);
        Page<Post> posts = postService.getTopPostsByStock(stock, PageRequest.of(0, limit));
        Page<PostResponse> postResponses = posts.map(post -> {
            boolean isLiked = member != null && postService.isLikedByMember(post.getId(), member);
            return PostResponse.from(post, isLiked);
        });
        return ResponseEntity.ok(ApiResponse.success(PostListResponse.from(postResponses)));
    }

    // 댓글 작성
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable Long postId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal Member member) {

        Post post = postService.getPost(postId);
        Comment comment = commentService.createComment(post, member, request.getContent());
        return ResponseEntity.ok(ApiResponse.success(CommentResponse.from(comment, false)));
    }

    // 댓글 수정
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal Member member) {

        Comment comment = commentService.updateComment(commentId, member, request.getContent());
        return ResponseEntity.ok(
                ApiResponse.success(CommentResponse.from(comment, commentService.isLikedByMember(commentId, member))));
    }

    // 댓글 삭제
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {

        commentService.deleteComment(commentId, member);
        return ResponseEntity.ok(ApiResponse.success("댓글이 삭제되었습니다."));
    }

    // 댓글 좋아요
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> likeComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {

        commentService.likeComment(commentId, member);
        return ResponseEntity.ok(ApiResponse.success("댓글을 좋아요했습니다."));
    }

    // 댓글 좋아요 취소
    @DeleteMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {

        commentService.unlikeComment(commentId, member);
        return ResponseEntity.ok(ApiResponse.success("댓글 좋아요를 취소했습니다."));
    }

    // 게시글별 댓글 목록 조회
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentListResponse>> getCommentsByPost(
            @PathVariable Long postId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal Member member) {

        Post post = postService.getPost(postId);
        Page<Comment> comments = commentService.getCommentsByPost(post, pageable);
        Page<CommentResponse> commentResponses = comments.map(comment -> {
            boolean isLiked = member != null && commentService.isLikedByMember(comment.getId(), member);
            return CommentResponse.from(comment, isLiked);
        });
        return ResponseEntity.ok(ApiResponse.success(CommentListResponse.from(commentResponses)));
    }
}