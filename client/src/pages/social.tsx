import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Image as ImageIcon, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const createPostSchema = z.object({
  content: z.string().min(1, "Post content is required").max(2000, "Post too long"),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

interface SocialPost {
  id: string;
  content: string;
  imageUrl?: string;
  imageName?: string;
  imageSize?: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  authorUsername: string;
  authorRole: string;
  authorProfileImageUrl?: string;
}

interface SocialComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  postId: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  authorUsername: string;
  authorRole: string;
  authorProfileImageUrl?: string;
}

export default function Social() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  // Fetch social posts
  const { data: posts, isLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/social/posts"],
  });

  // Create post form
  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostForm) => apiRequest("POST", "/api/social/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      form.reset();
      toast({
        title: t("social.postCreated", "Post created successfully"),
        description: t("social.postCreatedDesc", "Your post has been shared with the community"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("social.createPostError", "Failed to create post"),
        variant: "destructive",
      });
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: (postId: string) => apiRequest("POST", `/api/social/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => 
      apiRequest("POST", `/api/social/posts/${postId}/comments`, { content }),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", postId, "comments"] });
      setNewComments(prev => ({ ...prev, [postId]: "" }));
    },
  });

  // Fetch comments for expanded posts
  const fetchComments = (postId: string) => {
    return useQuery<SocialComment[]>({
      queryKey: ["/api/social/posts", postId, "comments"],
      enabled: expandedComments.has(postId),
    });
  };

  const onSubmit = (data: CreatePostForm) => {
    createPostMutation.mutate(data);
  };

  const handleToggleLike = (postId: string) => {
    toggleLikeMutation.mutate(postId);
  };

  const handleToggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCreateComment = (postId: string) => {
    const content = newComments[postId];
    if (!content?.trim()) return;

    createCommentMutation.mutate({ postId, content });
  };

  const getRoleBadgeColor = (role: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'trainer': return 'default';
      case 'client': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return t('roles.superadmin', 'SuperAdmin');
      case 'trainer': return t('roles.trainer', 'Trainer');
      case 'client': return t('roles.client', 'Client');
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("social.title", "Social Feed")}
        </h1>

        {/* Create Post Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("social.createPost", "Share something with the community")}</h2>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={t("social.postPlaceholder", "What's on your mind? Share your fitness journey, tips, or achievements...")}
                          className="min-h-[100px] resize-none"
                          {...field}
                          data-testid="input-post-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: t("common.comingSoon", "Coming Soon"),
                        description: t("social.photoUploadSoon", "Photo upload will be available soon"),
                      });
                    }}
                    data-testid="button-add-photo"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {t("social.addPhoto", "Add Photo")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    data-testid="button-create-post"
                  >
                    {createPostMutation.isPending ? t("common.posting", "Posting...") : t("common.post", "Post")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts && posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    {t("social.noPostsTitle", "No posts yet")}
                  </h3>
                  <p>
                    {t("social.noPostsDesc", "Be the first to share something with the community!")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            posts?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleLike={handleToggleLike}
                onToggleComments={handleToggleComments}
                isCommentsExpanded={expandedComments.has(post.id)}
                newComment={newComments[post.id] || ""}
                onNewCommentChange={(value) => 
                  setNewComments(prev => ({ ...prev, [post.id]: value }))
                }
                onCreateComment={handleCreateComment}
                fetchComments={fetchComments}
                getRoleBadgeColor={getRoleBadgeColor}
                getRoleLabel={getRoleLabel}
                createCommentMutation={createCommentMutation}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface PostCardProps {
  post: SocialPost;
  onToggleLike: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  isCommentsExpanded: boolean;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onCreateComment: (postId: string) => void;
  fetchComments: (postId: string) => any;
  getRoleBadgeColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
  createCommentMutation: any;
}

function PostCard({
  post,
  onToggleLike,
  onToggleComments,
  isCommentsExpanded,
  newComment,
  onNewCommentChange,
  onCreateComment,
  fetchComments,
  getRoleBadgeColor,
  getRoleLabel,
  createCommentMutation
}: PostCardProps) {
  const { t } = useTranslation();
  const { data: comments }: { data: SocialComment[] | undefined } = fetchComments(post.id);

  return (
    <Card data-testid={`card-social-post-${post.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.authorProfileImageUrl} />
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm" data-testid={`text-author-${post.id}`}>
                {post.authorFirstName} {post.authorLastName}
              </h3>
              <Badge variant={getRoleBadgeColor(post.authorRole) as any} className="text-xs">
                {getRoleLabel(post.authorRole)}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`text-username-${post.id}`}>
              @{post.authorUsername}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`text-time-${post.id}`}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
            {post.content}
          </p>
          
          {post.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.imageUrl}
                alt={post.imageName || "Post image"}
                className="w-full max-h-96 object-cover"
                data-testid={`img-post-${post.id}`}
              />
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleLike(post.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
                data-testid={`button-like-${post.id}`}
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs">{post.likesCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleComments(post.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                data-testid={`button-comments-${post.id}`}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.commentsCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
                disabled
                data-testid={`button-share-${post.id}`}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs">{t("common.share", "Share")}</span>
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          {isCommentsExpanded && (
            <div className="space-y-4 pt-4 border-t">
              {/* New Comment Input */}
              <div className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Textarea
                    placeholder={t("social.commentPlaceholder", "Write a comment...")}
                    className="min-h-[60px] resize-none flex-1"
                    value={newComment}
                    onChange={(e) => onNewCommentChange(e.target.value)}
                    data-testid={`input-comment-${post.id}`}
                  />
                  <Button
                    size="sm"
                    onClick={() => onCreateComment(post.id)}
                    disabled={!newComment.trim() || createCommentMutation.isPending}
                    data-testid={`button-send-comment-${post.id}`}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments?.map((comment) => (
                  <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.authorProfileImageUrl} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm" data-testid={`text-comment-author-${comment.id}`}>
                            {comment.authorFirstName} {comment.authorLastName}
                          </span>
                          <Badge variant={getRoleBadgeColor(comment.authorRole) as any} className="text-xs">
                            {getRoleLabel(comment.authorRole)}
                          </Badge>
                        </div>
                        <p className="text-sm" data-testid={`text-comment-content-${comment.id}`}>
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" data-testid={`text-comment-time-${comment.id}`}>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}