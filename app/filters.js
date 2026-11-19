// Filtering for the trophy list: by kind, grade, earned state and search text.
// Kinds shown as buttons: story, missable (a flag, not a kind), collectibles,
// activities, and online — the game has 0 online trophies, so that filter is
// deliberately empty and the app says so instead of looking broken.
export const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
  side: 'Character quests',
  world: 'World & money',
  platinum: 'Platinum',
};

export function filterTrophies(trophies, state) {
  const query = state.search.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (state.kind === 'story' && trophy.kind !== 'story') return false;
    if (state.kind === 'missable' && !trophy.missable) return false;
    if (state.kind === 'collectibles' && trophy.kind !== 'collectibles') return false;
    if (state.kind === 'activities' && trophy.kind !== 'activities') return false;
    if (state.kind === 'online') return false;
    if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
    const earned = state.earned.has(trophy.id);
    if (state.earnedFilter === 'earned' && !earned) return false;
    if (state.earnedFilter === 'remaining' && earned) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function spoilerHides(trophy, spoilerOn, earned) {
  if (!spoilerOn) return false;
  if (earned.has(trophy.id)) return false;
  return trophy.kind === 'story' || trophy.hidden === true;
}
