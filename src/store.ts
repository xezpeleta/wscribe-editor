import { writable, get, type Writable } from "svelte/store";
import {
  subTitleTrackFromSegmentData,
  segmentToNodeData,
  sanitizeContent,
  SubtitleTrack,
  SubtitleNode,
  getUrlParams,
  fetchFileFromUrl,
  getFileNameFromUrl,
  fileParseFn,
} from "./utils";
import type { TranscribedData } from "./types";
import sampletranscriptdata from "./assets/wscribe_editor_into.json";
import { nanoid } from "nanoid";

function createErrorStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    set,
    addToList: (error: string) => {
      update((i) => [...i, error]);
    },
  };
}

function createSubtitleTrackStore(track: SubtitleTrack) {
  const { subscribe, update, set } = writable(track);
  return {
    subscribe,
    set,
    appendAfterSegment: (node: SubtitleNode) => {
      resetNodeNextPrev(node);
      update((t) => {
        let s: TranscribedData = {
          score: 1,
          start: node.data.end,
          end: node.maxOffset(),
          text: "placeholder text added after",
          words: [],
        };
        let nd = segmentToNodeData(s);
        t.appendAfterNode(nd, node);
        return t;
      });
    },
    appendBeforeSegment: (node: SubtitleNode) => {
      resetNodeNextPrev(node);
      update((t) => {
        let s: TranscribedData = {
          score: 1,
          start: node.minOffset(),
          end: node.data.start,
          text: "placeholder text added before",
          words: [],
        };
        let nd = segmentToNodeData(s);
        t.appendBeforeNode(nd, node);
        return t;
      });
    },
    removeSegment: (node: SubtitleNode) => {
      node.data.uuid = nanoid();
      if (node.prev) {
        node.prev.data.uuid = nanoid();
      }
      if (node.next) {
        node.next.data.uuid = nanoid();
      }
      update((t) => {
        if (!node.prev) {
          // head
          t.removeFromFront();
        } else if (!node.next) {
          // tail
          t.removeFromBack();
        } else {
          node.yeetSelf();
          t.size--;
        }
        return t;
      });
    },
    toggleEditModeForSegment: (node: SubtitleNode) => {
      node.data.offsetEditMode = !node.data.offsetEditMode;
      resetNodeNextPrev(node, true);
      update((t) => t);
    },
    updateTsForSegment: (
      node: SubtitleNode,
      ts: { start: number; end: number },
    ) => {
      node.data.start = ts.start;
      node.data.end = ts.end;
      resetNodeNextPrev(node);
      update((t) => t);
    },
    resetTrack: (node?: SubtitleNode) => {
      if (node) {
        resetNodeNextPrev(node);
      }
      update((t) => t);
    },
  };
}

// why?
// TODO: Come back to this later and convert into a github issue
// - contenteditable on lage number causes slowness if span inside div, normal text worked fine
// - works on chrome not on ff
// - anyway with immutable=false (default), svelte will render all of the list, not ideal
// - we cannot keep the key just the hash of the content because we want linked
//   nodes to be updated as well when we update current node
// - so we update current, prev and next uuid so that each re-renders only those
//   as that's used as the key
const resetNodeNextPrev = (
  node: SubtitleNode,
  currentNodeOnly: boolean = false,
) => {
  node.data.uuid = nanoid();
  if (!currentNodeOnly) {
    if (node.prev) {
      node.prev.data.uuid = nanoid();
    }
    if (node.next) {
      node.next.data.uuid = nanoid();
    }
  }
};

const rawTranscriptDataStore = writable({});
const errListStore = createErrorStore();
const currentPlaybackTime = writable(0);
const wordLevelData = writable(true);
const scoreView = writable(false);
let subtitleTrackStore: ReturnType<typeof createSubtitleTrackStore>;
let transcriptTrackStore: ReturnType<typeof createSubtitleTrackStore>;
const waveStore = writable(null);
const mediaStoreURL = writable("/wscribe_editor_intro.mp3");
const isPlayable = writable(false);
const fileInfo = writable({
  mediaFileName: null,
  transcriptFileName: null,
});

// Initialize with URL parameters or default files
async function initializeStores() {
  const urlParams = getUrlParams();
  
  try {
    // Handle subtitle file from URL or use default
    if (urlParams.subtitleUrl) {
      try {
        const subtitleContent = await fetchFileFromUrl(urlParams.subtitleUrl);
        const fileName = getFileNameFromUrl(urlParams.subtitleUrl);
        const parseFn = fileParseFn(fileName);
        const parsedData = sanitizeContent(parseFn(subtitleContent));
        rawTranscriptDataStore.set(parsedData);
        wordLevelData.set("words" in parsedData[0]);
        fileInfo.update((e) => ({
          ...e,
          transcriptFileName: fileName,
        }));
      } catch (e) {
        console.error("Failed to load subtitle from URL:", e);
        errListStore.addToList(`Failed to load subtitle file from URL: ${e.message}`);
        // Fallback to default subtitle data
        rawTranscriptDataStore.set(sanitizeContent(sampletranscriptdata));
        fileInfo.update((e) => ({
          ...e,
          transcriptFileName: "wscribe_editor_intro.json",
        }));
      }
    } else {
      // Use default sample data
      rawTranscriptDataStore.set(sanitizeContent(sampletranscriptdata));
      fileInfo.update((e) => ({
        ...e,
        transcriptFileName: "wscribe_editor_intro.json",
      }));
    }

    // Handle media file from URL or use default
    if (urlParams.mediaUrl) {
      try {
        // Validate URL format
        new URL(urlParams.mediaUrl);
        mediaStoreURL.set(urlParams.mediaUrl);
        const fileName = getFileNameFromUrl(urlParams.mediaUrl);
        fileInfo.update((e) => ({
          ...e,
          mediaFileName: fileName,
        }));
      } catch (e) {
        console.error("Invalid media URL:", e);
        errListStore.addToList(`Invalid media URL: ${e.message}`);
        // Keep default media file
        fileInfo.update((e) => ({
          ...e,
          mediaFileName: "wscribe_editor_intro.mp3",
        }));
      }
    } else {
      fileInfo.update((e) => ({
        ...e,
        mediaFileName: "wscribe_editor_intro.mp3",
      }));
    }

    // Initialize subtitle tracks
    let strack: SubtitleTrack, ttrack: SubtitleTrack;
    [strack, ttrack] = subTitleTrackFromSegmentData(
      get(rawTranscriptDataStore) as TranscribedData[],
    );
    subtitleTrackStore = createSubtitleTrackStore(strack);
    transcriptTrackStore = createSubtitleTrackStore(ttrack);
  } catch (e) {
    console.error("Store initialization error:", e);
    errListStore.addToList(`Initialization error: ${e.message}`);
    // Fallback to default data on error
    rawTranscriptDataStore.set(sanitizeContent(sampletranscriptdata));
    let strack: SubtitleTrack, ttrack: SubtitleTrack;
    [strack, ttrack] = subTitleTrackFromSegmentData(
      get(rawTranscriptDataStore) as TranscribedData[],
    );
    subtitleTrackStore = createSubtitleTrackStore(strack);
    transcriptTrackStore = createSubtitleTrackStore(ttrack);
  }
}

// Initialize stores
initializeStores();

export {
  errListStore,
  subtitleTrackStore,
  transcriptTrackStore,
  currentPlaybackTime,
  rawTranscriptDataStore,
  wordLevelData,
  scoreView,
  waveStore,
  mediaStoreURL,
  isPlayable,
  fileInfo,
};
