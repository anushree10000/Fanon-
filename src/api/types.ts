/**
 * Hand-mapped from the companion backend's /openapi.json.
 * Kept 1:1 with the schema on purpose -- resist the urge to "improve" field
 * names here, it just makes diffing against the contract harder later.
 */

export interface StorySummary {
  storyId: string;
  thumbnailUrl: string;
  title: string;
  views: string;
  creators: string[];
  tags: string[];
  lastUpdated: string;
  chapterCount: number;
}

export interface StoryDetail extends StorySummary {
  description: string;
  status: 'ONGOING' | 'HIATUS' | 'COMPLETED';
}

export interface StoryList {
  page: StorySummary[];
  hasMore: boolean;
  continueCursor: string | null;
}

export type ChapterType = 'A' | 'B';

export interface ChapterSummary {
  chapterId: string;
  chapterNum: number;
  thumbnailUrl: string;
  description: string;
  views: string;
  type: ChapterType;
  pageCount: number;
}

export interface ChapterList {
  page: ChapterSummary[];
  hasMore: boolean;
  continueCursor: string | null;
}

export interface Page {
  pageNum: number;
  pageUrl: string;
  altText: string;
  /** [width, height] in px, as delivered by the source image. */
  resolution: [number, number];
}

export interface CreatorNote {
  note: string;
  creator: string;
}

export interface ChapterDetail {
  chapterNum: number;
  chapterPages: Page[];
  creatorsNotes: CreatorNote[];
  views: string;
}

export interface ErrorDetail {
  code:
    | 'INVALID_LIMIT'
    | 'INVALID_CURSOR'
    | 'MISSING_PARAMETER'
    | 'NOT_FOUND'
    | 'METHOD_NOT_ALLOWED'
    | 'INTERNAL';
  message: string;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

export class ApiError extends Error {
  code: ErrorDetail['code'];
  status: number;

  constructor(status: number, detail: ErrorDetail) {
    super(detail.message);
    this.name = 'ApiError';
    this.code = detail.code;
    this.status = status;
  }
}
