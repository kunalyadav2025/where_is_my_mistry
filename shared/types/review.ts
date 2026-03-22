export interface Review {
  reviewId: string;
  workerId: string;
  reviewerHash: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateInput {
  workerId: string;
  rating: number;
  comment?: string;
  reviewerMobile: string;
}

export interface ReviewSummary {
  avgRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
