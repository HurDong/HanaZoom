package com.hanazoom.domain.community.service;

import com.hanazoom.domain.community.dto.VoteResultsResponse;
import com.hanazoom.domain.community.dto.VoteOptionResponse;
import com.hanazoom.domain.community.dto.PostWithPollResponse;
import com.hanazoom.domain.community.entity.Like;
import com.hanazoom.domain.community.entity.LikeTargetType;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.entity.PostSentiment;
import com.hanazoom.domain.community.entity.PostType;
import com.hanazoom.domain.community.entity.Poll;
import com.hanazoom.domain.community.entity.PollOption;
import com.hanazoom.domain.community.entity.PollResponse;
import com.hanazoom.domain.community.entity.VoteOption;
import com.hanazoom.domain.community.repository.LikeRepository;
import com.hanazoom.domain.community.repository.PostRepository;
import com.hanazoom.domain.community.repository.PollRepository;
import com.hanazoom.domain.community.repository.PollResponseRepository;
import com.hanazoom.domain.community.repository.PollOptionRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final PollRepository pollRepository;
    private final PollResponseRepository pollResponseRepository;
    private final PollOptionRepository pollOptionRepository;

    @Override
    @Transactional
    public Post createPost(Member member, Stock stock, String title, String content, String imageUrl,
            PostType postType, PostSentiment sentiment) {
        System.out.println("🔍 PostService.createPost - imageUrl 길이: " + (imageUrl != null ? imageUrl.length() : "null"));
        System.out.println("🔍 PostService.createPost - imageUrl 미리보기: " + (imageUrl != null ? imageUrl.substring(0, Math.min(100, imageUrl.length())) + "..." : "null"));
        
        Post post = Post.builder()
                .member(member)
                .stock(stock)
                .title(title)
                .content(content)
                .imageUrl(imageUrl)
                .postType(postType)
                .sentiment(sentiment)
                .build();
        
        System.out.println("🔍 Post 엔티티 생성 완료 - imageUrl 길이: " + (post.getImageUrl() != null ? post.getImageUrl().length() : "null"));
        
        Post savedPost = postRepository.save(post);
        System.out.println("🔍 Post 저장 완료 - ID: " + savedPost.getId() + ", imageUrl 길이: " + (savedPost.getImageUrl() != null ? savedPost.getImageUrl().length() : "null"));
        
        return savedPost;
    }

    @Override
    @Transactional
    public Post createPostWithVote(Member member, Stock stock, String title, String content, String imageUrl,
            PostType postType, PostSentiment sentiment, String voteQuestion, java.util.List<String> voteOptions) {
        Post post = Post.builder()
                .member(member)
                .stock(stock)
                .title(title)
                .content(content)
                .imageUrl(imageUrl)
                .postType(postType)
                .sentiment(sentiment)
                .build();

        Post savedPost = postRepository.save(post);


        if (voteQuestion != null && !voteQuestion.trim().isEmpty() && voteOptions != null && !voteOptions.isEmpty()) {

            String optionUp = voteOptions.size() > 0 ? voteOptions.get(0) : "오를 것 같다 📈";
            String optionDown = voteOptions.size() > 1 ? voteOptions.get(1) : "떨어질 것 같다 📉";

            Poll poll = Poll.builder()
                    .post(savedPost)
                    .question(voteQuestion)
                    .build();


            poll.setOptionUp(optionUp);
            poll.setOptionDown(optionDown);

            pollRepository.save(poll);
        }

        return savedPost;
    }

    @Override
    @Transactional
    public PostWithPollResponse createPostWithVoteAndPoll(Member member, Stock stock, String title, String content,
            String imageUrl,
            PostType postType, PostSentiment sentiment, String voteQuestion, java.util.List<String> voteOptions) {
        Post post = Post.builder()
                .member(member)
                .stock(stock)
                .title(title)
                .content(content)
                .imageUrl(imageUrl)
                .postType(postType)
                .sentiment(sentiment)
                .build();

        Post savedPost = postRepository.save(post);
        Poll poll = null;


        if (voteQuestion != null && !voteQuestion.trim().isEmpty() && voteOptions != null && !voteOptions.isEmpty()) {

            String optionUp = voteOptions.size() > 0 ? voteOptions.get(0) : "오를 것 같다 📈";
            String optionDown = voteOptions.size() > 1 ? voteOptions.get(1) : "떨어질 것 같다 📉";

            poll = Poll.builder()
                    .post(savedPost)
                    .question(voteQuestion)
                    .build();


            poll.setOptionUp(optionUp);
            poll.setOptionDown(optionDown);

            poll = pollRepository.save(poll);
        }

        return PostWithPollResponse.builder()
                .post(savedPost)
                .poll(poll)
                .build();
    }

    @Override
    @Transactional
    public Post updatePost(Long postId, Member member, String title, String content, String imageUrl,
            PostSentiment sentiment) {
        Post post = getPostWithMemberCheck(postId, member);
        post.update(title, content, imageUrl, sentiment);
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
        System.out.println("👍 좋아요 요청 - postId: " + postId + ", memberId: " + member.getId());
        
        if (isLikedByMember(postId, member)) {
            System.out.println("❌ 이미 좋아요한 게시글 - postId: " + postId + ", memberId: " + member.getId());
            throw new IllegalArgumentException("이미 좋아요한 게시글입니다.");
        }
        
        Post post = getPost(postId);
        post.incrementLikeCount();
        likeRepository.save(Like.builder()
                .member(member)
                .targetType(LikeTargetType.POST)
                .targetId(postId)
                .build());
        
        System.out.println("✅ 좋아요 완료 - postId: " + postId + ", memberId: " + member.getId() + ", 새로운 좋아요 수: " + post.getLikeCount());
    }

    @Override
    @Transactional
    public void unlikePost(Long postId, Member member) {
        System.out.println("👎 좋아요 취소 요청 - postId: " + postId + ", memberId: " + member.getId());
        
        if (!isLikedByMember(postId, member)) {
            System.out.println("❌ 좋아요하지 않은 게시글 - postId: " + postId + ", memberId: " + member.getId());
            throw new IllegalArgumentException("좋아요하지 않은 게시글입니다.");
        }
        
        Post post = getPost(postId);
        post.decrementLikeCount();
        likeRepository.deleteByMemberAndTargetTypeAndTargetId(member, LikeTargetType.POST, postId);
        
        System.out.println("✅ 좋아요 취소 완료 - postId: " + postId + ", memberId: " + member.getId() + ", 새로운 좋아요 수: " + post.getLikeCount());
    }

    @Override
    public boolean isLikedByMember(Long postId, Member member) {
        if (member == null) {
            System.out.println("🔍 isLikedByMember - member가 null입니다. postId: " + postId);
            return false;
        }
        boolean exists = likeRepository.existsByMemberAndTargetTypeAndTargetId(member, LikeTargetType.POST, postId);
        System.out.println("🔍 isLikedByMember - postId: " + postId + ", memberId: " + member.getId() + ", exists: " + exists);
        return exists;
    }

    @Override
    @Transactional
    public void voteOnPost(Long postId, Member member, String optionId) {
        Post post = getPost(postId);


        VoteOption voteOption;
        try {
            voteOption = VoteOption.valueOf(optionId.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 투표 옵션입니다.");
        }


        Poll poll = pollRepository.findByPost(post)
                .orElseGet(() -> pollRepository.save(Poll.builder()
                        .post(post)
                        .question("이 종목이 오를까요?")
                        .build()));


        if (pollResponseRepository.existsByPollAndMember(poll, member)) {
            throw new IllegalArgumentException("이미 투표했습니다.");
        }


        PollResponse pollResponse = PollResponse.builder()
                .poll(poll)
                .member(member)
                .voteOption(voteOption)
                .build();
        pollResponseRepository.save(pollResponse);


        if (voteOption == VoteOption.UP) {
            poll.incrementVoteUpCount();
        } else {
            poll.incrementVoteDownCount();
        }
        poll.incrementTotalVoteCount();
    }

    @Override
    public VoteResultsResponse getVoteResults(Long postId, Member member) {
        Post post = getPost(postId);
        Poll poll = pollRepository.findByPost(post).orElse(null);

        if (poll == null) {

            return VoteResultsResponse.builder()
                    .voteOptions(List.of())
                    .totalVotes(0)
                    .userVote(null)
                    .build();
        }


        String userVote = null;
        if (member != null) {
            Optional<PollResponse> userResponse = pollResponseRepository.findByPollAndMember(poll, member);
            if (userResponse.isPresent()) {
                userVote = userResponse.get().getVoteOption().name();
            }
        }


        List<VoteOptionResponse> voteOptions = List.of(
                VoteOptionResponse.builder()
                        .id("UP")
                        .text("오를 것 같다 📈")
                        .voteCount(poll.getVoteUpCount())
                        .percentage(poll.getTotalVoteCount() > 0
                                ? (double) poll.getVoteUpCount() / poll.getTotalVoteCount() * 100
                                : 0)
                        .build(),
                VoteOptionResponse.builder()
                        .id("DOWN")
                        .text("떨어질 것 같다 📉")
                        .voteCount(poll.getVoteDownCount())
                        .percentage(poll.getTotalVoteCount() > 0
                                ? (double) poll.getVoteDownCount() / poll.getTotalVoteCount() * 100
                                : 0)
                        .build());

        return VoteResultsResponse.builder()
                .voteOptions(voteOptions)
                .totalVotes(poll.getTotalVoteCount())
                .userVote(userVote)
                .build();
    }

    private Post getPostWithMemberCheck(Long postId, Member member) {
        Post post = getPost(postId);
        if (!post.getMember().getId().equals(member.getId())) {
            System.out.println("🔍 권한 체크 실패 - Post 작성자 ID: " + post.getMember().getId() + ", 요청자 ID: " + member.getId());
            throw new IllegalArgumentException("게시글 작성자만 수정/삭제할 수 있습니다.");
        }
        System.out.println("✅ 권한 체크 성공 - Post 작성자 ID: " + post.getMember().getId() + ", 요청자 ID: " + member.getId());
        return post;
    }
}