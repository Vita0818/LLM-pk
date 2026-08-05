import publicLeaderboardSnapshot from '../src/data/publicLeaderboardSnapshot.json';
import type {
  PublicLeaderboardScore,
  PublicLeaderboardSnapshot,
} from '../src/types/publicLeaderboard';
import {
  buildPlayModeQueue,
  getPlayModeRouteGroupKey,
} from '../src/utils/playModeQueue';

const snapshot = publicLeaderboardSnapshot as unknown as PublicLeaderboardSnapshot;
const queue = buildPlayModeQueue(snapshot.scores);

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

assert(snapshot.scores.length === 62, 'Fixture should contain 62 route rows.');
assert(queue.length === 38, `Expected 38 playback items, received ${queue.length}.`);
assert(
  new Set(queue.map(getPlayModeRouteGroupKey)).size === queue.length,
  'Playback queue must contain one representative per identical radar route group.',
);
assert(
  snapshot.scores.length - queue.length === 24,
  'Playback queue should collapse exactly 24 duplicate route rows.',
);

snapshot.scores.forEach((candidate) => {
  const representative = queue.find(
    (item) => getPlayModeRouteGroupKey(item) === getPlayModeRouteGroupKey(candidate),
  );
  const candidateScore = candidate.practicalBreakdown.practicalScore
    ?? Number.NEGATIVE_INFINITY;
  const representativeScore = representative?.practicalBreakdown.practicalScore
    ?? Number.NEGATIVE_INFINITY;

  assert(
    representativeScore >= candidateScore,
    `Route group did not retain its highest practical score: ${candidate.config.name}`,
  );
});

const expectedRepresentatives = [
  'DeepSeek V4 Flash 0731 Max | Chat | DeepSeek API',
  'Claude Fable 5 Max | Claude Code | Claude Max 20×',
  'Claude Haiku 4.5 Max | Chat | Claude Pro',
  'Claude Opus 5 Max | Claude Code | Claude Max 20×',
  'Claude Sonnet 4.6 Max | Claude Code | Claude Pro',
  'Claude Sonnet 5 Max | Arena Agent Mode | Claude Pro',
  'GPT-5.6 Luna Max | Codex CLI | ChatGPT Plus',
  'GPT-5.6 Sol Max | Codex CLI | ChatGPT Pro 20×',
  'GPT-5.6 Terra Max | Codex CLI | ChatGPT Plus',
  'Gemini 3.1 Flash Lite Preview Max | Chat | Google AI Ultra 20×',
  'Gemini 3.1 Pro High | Gemini CLI | Google AI Ultra 20×',
  'Gemini 3.5 Flash High | Arena Agent Mode | Google AI Ultra 20×',
  'Gemini 3.5 Flash-Lite High | Chat | Google AI Ultra 20×',
  'Gemini 3.6 Flash High | Chat | Google AI Ultra 20×',
  'Grok 4.3 High | Chat | SuperGrok',
  'Grok 4.5 High | Grok Build | SuperGrok',
  'Grok Build 0.1 Max | Arena Agent Mode | SuperGrok',
];

const queueNames = new Set(queue.map((item) => item.config.name));
expectedRepresentatives.forEach((name) => {
  assert(queueNames.has(name), `Missing expected representative route: ${name}`);
});

for (let index = 1; index < queue.length; index += 1) {
  const previous = queue[index - 1] as PublicLeaderboardScore;
  const current = queue[index] as PublicLeaderboardScore;
  const previousScore = previous.practicalBreakdown.practicalScore
    ?? Number.NEGATIVE_INFINITY;
  const currentScore = current.practicalBreakdown.practicalScore
    ?? Number.NEGATIVE_INFINITY;

  assert(
    previousScore >= currentScore,
    `Playback queue is not sorted by practical score at index ${index}.`,
  );
}

console.log('Play mode queue keeps 38 best-route radar profiles in rank order: PASS');
