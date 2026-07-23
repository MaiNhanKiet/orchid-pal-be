export const EXPERT_BLOG_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  UNPUBLISHED: 'UNPUBLISHED',
} as const;

export type ExpertBlogStatus =
  (typeof EXPERT_BLOG_STATUS)[keyof typeof EXPERT_BLOG_STATUS];
