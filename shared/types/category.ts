export interface Category {
  categoryId: string;
  name: string;
  nameHindi: string;
  icon: string;
  order: number;
  isActive: boolean;
  workerCount: number;
}

export interface CategoryCreateInput {
  name: string;
  nameHindi: string;
  icon: string;
  order: number;
}
