import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  StoryFeed: undefined;
  ChapterList: { storyId: string; storyTitle: string };
  Reader: {
    chapterId: string;
    storyId: string;
    /** Passed down so the reader can prefetch the next chapter without a refetch. */
    chapterNum: number;
  };
};

export type StoryFeedProps = NativeStackScreenProps<RootStackParamList, 'StoryFeed'>;
export type ChapterListProps = NativeStackScreenProps<RootStackParamList, 'ChapterList'>;
export type ReaderProps = NativeStackScreenProps<RootStackParamList, 'Reader'>;
