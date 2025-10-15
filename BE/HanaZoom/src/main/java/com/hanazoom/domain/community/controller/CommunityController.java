package com.hanazoom.domain.community.controller;

import com.hanazoom.domain.community.dto.*;
import com.hanazoom.domain.community.entity.Comment;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.entity.Poll;
import com.hanazoom.domain.community.repository.PollRepository;
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
    private final PollRepository pollRepository;


    @PostMapping("/stocks/{symbol}/posts")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @PathVariable String symbol,
            @RequestBody PostRequest request,
            @AuthenticationPrincipal Member member) {

        

        Stock stock = stockService.getStockBySymbol(symbol);
        Post post;

        if (request.isHasVote()) {

            
            PostWithPollResponse result = postService.createPostWithVoteAndPoll(member, stock, request.getTitle(),
                    request.getContent(), request.getImageUrl(), request.getPostType(),
                    request.getSentiment(), request.getVoteQuestion(), request.getVoteOptions());

            

            PostResponse response = PostResponse.from(result.getPost(), false, result.getPoll(), null);
            

            return ResponseEntity
                    .ok(ApiResponse.success(response));
        } else {

            post = postService.createPost(member, stock, request.getTitle(),
                    request.getContent(), request.getImageUrl(), request.getPostType(), request.getSentiment());
            return ResponseEntity.ok(ApiResponse.success(PostResponse.from(post, false)));
        }
    }


    @PutMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long postId,
            @RequestBody PostRequest request,
            @AuthenticationPrincipal Member member) {

        Post post = postService.updatePost(postId, member, request.getTitle(),
                request.getContent(), request.getImageUrl(), request.getSentiment());
        return ResponseEntity
                .ok(ApiResponse.success(PostResponse.from(post, postService.isLikedByMember(postId, member))));
    }


    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        postService.deletePost(postId, member);
        return ResponseEntity.ok(ApiResponse.success("게시글이 삭제되었습니다."));
    }


    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        postService.likePost(postId, member);
        return ResponseEntity.ok(ApiResponse.success("게시글을 좋아요했습니다."));
    }


    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        postService.unlikePost(postId, member);
        return ResponseEntity.ok(ApiResponse.success("게시글 좋아요를 취소했습니다."));
    }


    @GetMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        Post post = postService.getPost(postId);
        boolean isLiked = member != null && postService.isLikedByMember(postId, member);

        Poll poll = pollRepository.findByPostId(postId).orElse(null);
        return ResponseEntity.ok(ApiResponse.success(PostResponse.from(post, isLiked, poll, null)));
    }


    @GetMapping("/stocks/{symbol}/posts")
    public ResponseEntity<ApiResponse<PostListResponse>> getPostsByStock(
            @PathVariable String symbol,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal Member member) {

        
        Stock stock = stockService.getStockBySymbol(symbol);
        Page<Post> posts = postService.getPostsByStock(stock, pageable);
        
        
        Page<PostResponse> postResponses = posts.map(post -> {
            boolean isLiked = member != null && postService.isLikedByMember(post.getId(), member);
            

            Poll poll = pollRepository.findByPostId(post.getId()).orElse(null);
            PostResponse response = PostResponse.from(post, isLiked, poll, null);
            
            
            return response;
        });
        
        return ResponseEntity.ok(ApiResponse.success(PostListResponse.from(postResponses)));
    }


    @GetMapping("/stocks/{symbol}/posts/top")
    public ResponseEntity<ApiResponse<PostListResponse>> getTopPostsByStock(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "5") int limit,
            @AuthenticationPrincipal Member member) {

        Stock stock = stockService.getStockBySymbol(symbol);
        Page<Post> posts = postService.getTopPostsByStock(stock, PageRequest.of(0, limit));
        Page<PostResponse> postResponses = posts.map(post -> {
            boolean isLiked = member != null && postService.isLikedByMember(post.getId(), member);

            Poll poll = pollRepository.findByPostId(post.getId()).orElse(null);
            return PostResponse.from(post, isLiked, poll, null);
        });
        return ResponseEntity.ok(ApiResponse.success(PostListResponse.from(postResponses)));
    }


    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable Long postId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal Member member) {

        Post post = postService.getPost(postId);
        Comment comment = commentService.createComment(post, member, request.getContent());
        boolean isLiked = commentService.isLikedByMember(comment.getId(), member);
        return ResponseEntity.ok(ApiResponse.success(CommentResponse.from(comment, isLiked)));
    }


    @PostMapping("/comments/{parentCommentId}/replies")
    public ResponseEntity<ApiResponse<CommentResponse>> createReply(
            @PathVariable Long parentCommentId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal Member member) {

        Comment reply = commentService.createReply(parentCommentId, member, request.getContent());
        boolean isLiked = commentService.isLikedByMember(reply.getId(), member);
        return ResponseEntity.ok(ApiResponse.success(CommentResponse.from(reply, isLiked)));
    }


    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<ApiResponse<java.util.List<CommentResponse>>> getRepliesByComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {

        java.util.List<Comment> replies = commentService.getRepliesByParentComment(commentId);
        java.util.List<CommentResponse> replyResponses = replies.stream()
                .map(reply -> {
                    boolean isLiked = member != null && commentService.isLikedByMember(reply.getId(), member);
                    return CommentResponse.from(reply, isLiked);
                })
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(replyResponses));
    }


    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal Member member) {

        Comment comment = commentService.updateComment(commentId, member, request.getContent());
        return ResponseEntity.ok(
                ApiResponse.success(CommentResponse.from(comment, commentService.isLikedByMember(commentId, member))));
    }


    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {

        commentService.deleteComment(commentId, member);
        return ResponseEntity.ok(ApiResponse.success("댓글이 삭제되었습니다."));
    }


    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> likeComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {

        commentService.likeComment(commentId, member);
        return ResponseEntity.ok(ApiResponse.success("댓글을 좋아요했습니다."));
    }


    @DeleteMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Member member) {

        commentService.unlikeComment(commentId, member);
        return ResponseEntity.ok(ApiResponse.success("댓글 좋아요를 취소했습니다."));
    }


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


    @PostMapping("/posts/{postId}/vote")
    public ResponseEntity<ApiResponse<Void>> voteOnPost(
            @PathVariable Long postId,
            @RequestBody VoteRequest request,
            @AuthenticationPrincipal Member member) {

        postService.voteOnPost(postId, member, request.getOptionId());
        return ResponseEntity.ok(ApiResponse.success("투표가 완료되었습니다."));
    }


    @GetMapping("/posts/{postId}/vote-results")
    public ResponseEntity<ApiResponse<VoteResultsResponse>> getVoteResults(
            @PathVariable Long postId,
            @AuthenticationPrincipal Member member) {

        VoteResultsResponse results = postService.getVoteResults(postId, member);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}