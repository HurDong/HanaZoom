package com.hanazoom.domain.community.service;

import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.entity.PostSentiment;
import com.hanazoom.domain.community.entity.PostType;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.hanazoom.domain.community.dto.VoteResultsResponse;
import com.hanazoom.domain.community.dto.PostWithPollResponse;

public interface PostService {
        Post createPost(Member member, Stock stock, String title, String content, String imageUrl, PostType postType,
                        PostSentiment sentiment);

        Post createPostWithVote(Member member, Stock stock, String title, String content, String imageUrl,
                        PostType postType, PostSentiment sentiment, String voteQuestion,
                        java.util.List<String> voteOptions);


        PostWithPollResponse createPostWithVoteAndPoll(Member member, Stock stock, String title, String content,
                        String imageUrl,
                        PostType postType, PostSentiment sentiment, String voteQuestion,
                        java.util.List<String> voteOptions);

        Post updatePost(Long postId, Member member, String title, String content, String imageUrl,
                        PostSentiment sentiment);

        void deletePost(Long postId, Member member);

        Post getPost(Long postId);

        Page<Post> getPostsByStock(Stock stock, Pageable pageable);

        Page<Post> getTopPostsByStock(Stock stock, Pageable pageable);

        void likePost(Long postId, Member member);

        void unlikePost(Long postId, Member member);

        boolean isLikedByMember(Long postId, Member member);


        void voteOnPost(Long postId, Member member, String optionId);

        VoteResultsResponse getVoteResults(Long postId, Member member);
}