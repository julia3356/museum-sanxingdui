// Generated from ../release/wechat-miniprogram/data/content.js by scripts/sync-release-content.mjs.
import releaseContent from './release-content.json';

export type GuideTheme = {
  title: string;
  goal: string;
  entrySegments: number[];
};

export type OfficialLink = {
  label: string;
  url: string;
};

export type GuideTip = {
  label: string;
  text: string;
};

export type Segment = {
  id: number;
  title: string;
  timecode: string;
  order: number;
  thumbnail: string;
  videoFile: string;
  artifacts: string[];
  artifactsText?: string;
  description: string;
  guideScript: string;
  viewingGuide?: string;
  appUse: string;
  cacheKey: string;
  hasExtensionReading: boolean;
  remoteUrl?: string;
  guideTips?: GuideTip[];
};

export type Source = {
  id: string;
  label: string;
  url: string;
};

export type ExtensionReading = {
  id: number;
  readerTitle: string;
  readerLead: string;
  storyParagraphs: string[];
  mythCandy: string;
  readerPrompt: string;
  carefulNote: string;
  sourceIds: string[];
};

export type ReleaseContent = {
  app: {
    name: string;
    shortName: string;
    version: string;
    contentDate: string;
    positioning: string;
  };
  guide: {
    exhibition: string;
    venue: string;
    curatorialGoal: string;
    officialLinks: OfficialLink[];
    prologueThemes: GuideTheme[];
  };
  cachePolicy: {
    networkWarning: string;
    storageWarning: string;
  };
  browseIndex: Segment[];
  extensionReadings: ExtensionReading[];
  sources: Source[];
  copyrightNotice: string;
};

export const content = releaseContent as ReleaseContent;
